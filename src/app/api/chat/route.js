import { retrieveChunks, kbSummary } from '../../../lib/kb';

function takeLastUserQuery(history) {
  for (let i = history.length - 1; i >= 0; i--) {
    if (history[i].role === 'user' && String(history[i].content || '').trim()) {
      return history[i].content;
    }
  }
  return '';
}

function formatReferences(refs) {
  return refs
    .map((r, idx) => {
      const label = `[${idx + 1}] ${r.title}`;
      return `${label}\n${r.text}`;
    })
    .join('\n\n');
}

export async function POST(req) {
  let payload;
  try {
    payload = await req.json();
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body.' }), { status: 400 });
  }

  const history = Array.isArray(payload?.messages) ? payload.messages : [];
  const topic = payload?.topic || 'cybersecurity';
  const query = takeLastUserQuery(history);

  if (!query) {
    return new Response(JSON.stringify({ error: 'Missing user query.' }), { status: 400 });
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'Missing OPENAI_API_KEY. Set it in your environment (or Vercel Project Settings).'
      }),
      { status: 500 }
    );
  }

  // Retrieval: select topic-relevant knowledge base chunks.
  const refs = retrieveChunks(query, 6);
  const referencesBlock = formatReferences(refs);

  // Keep prompt bounded: only the last few turns + retrieved references.
  const filteredHistory = history
    .filter((m) => m && m.role && String(m.content || '').trim())
    .slice(-10)
    .map((m) => ({ role: m.role === 'assistant' ? 'assistant' : 'user', content: String(m.content) }));

  const systemPrompt = `
You are a Secure Code Companion. Answer security questions technically and directly.
Focus on practical mitigations and use the provided notes.

Topic: ${topic}

Reference Notes:
${referencesBlock}
`.trim();

  const promptMessages = [
    { role: 'system', content: systemPrompt },
    ...filteredHistory
  ];

  // OpenAI Chat Completions API (no extra npm dependencies).
  const openaiBaseUrl = process.env.OPENAI_BASE_URL || 'https://api.openai.com/v1';
  const model = process.env.OPENAI_MODEL || 'gpt-4o-mini';
  const temperature =
    typeof process.env.OPENAI_TEMPERATURE === 'string' ? Number(process.env.OPENAI_TEMPERATURE) : 0.25;
  const maxTokens =
    typeof process.env.OPENAI_MAX_TOKENS === 'string' ? Number(process.env.OPENAI_MAX_TOKENS) : 650;

  let reply = '';
  let isMocked = false;

  try {
    const resp = await fetch(`${openaiBaseUrl.replace(/\/$/, '')}/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model,
        messages: promptMessages,
        temperature: Number.isFinite(temperature) ? temperature : 0.25,
        max_tokens: Number.isFinite(maxTokens) ? maxTokens : 650
      })
    });

    if (!resp.ok) {
      const errorData = await resp.json().catch(() => ({}));
      if (errorData?.error?.code === 'insufficient_quota') {
        isMocked = true;
      } else {
        return new Response(
          JSON.stringify({ error: `OpenAI request failed (${resp.status}). ${JSON.stringify(errorData)}` }),
          { status: 500 }
        );
      }
    } else {
      const data = await resp.json();
      reply = data?.choices?.[0]?.message?.content || '';
    }
  } catch (err) {
    return new Response(JSON.stringify({ error: `Fetch error: ${err.message}` }), { status: 500 });
  }

  // Fallback to a static response if the API key has no balance
  if (isMocked || !reply) {
    reply = `
I can't reach the OpenAI API right now (it might be a quota limit). 
But based on our local security knowledge, here's how to handle that:

### Secure Implementation
1. **Always parameterize** your database queries.
2. **Set HttpOnly** flags on all session cookies.
3. **Validate** user input on the server, not just the UI.

\`\`\`javascript
// Secure approach:
db.execute("SELECT * FROM users WHERE id = ?", [userId]);
\`\`\`
`.trim();
  }

  return new Response(
    JSON.stringify({
      reply: reply.trim(),
      sources: refs.map((r) => ({
        id: r.id,
        noteId: r.noteId,
        title: r.title,
        excerpt: r.excerpt
      })),
      kb: kbSummary()
    }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
}

