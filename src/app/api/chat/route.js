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
You are the "Secure Code Companion", an elite cybersecurity advisor for software engineers at Thinkly Labs.
Your mission is to provide high-fidelity, actionable, and defensive engineering guidance.

IDENTITY & TONE:
- Professional, concise, and technical.
- Focus on "Security by Design" and "Zero Trust" principles.
- Use developer-centric language (mentioning frameworks like Next.js, React, Node.js).

KNOWLEDGE CONSTRAINTS:
- Use ONLY the provided Reference Notes as your primary source of truth.
- If the notes are insufficient, state what information is missing (e.g., "I need to know your specific auth provider to give a precise answer").
- Never make up security standards.

RESPONSE STRUCTURE:
1. **Summary**: A 1-2 sentence direct answer.
2. **Implementation Checklist**: 5-7 concrete, technical steps. Use Markdown task lists [ ] if appropriate.
3. **Code Example**: If relevant, provide a "Secure vs. Insecure" code comparison using Markdown code blocks.
4. **Common Pitfalls**: 2-3 bullets on what developers often get wrong.
5. **Verified Sources**: Reference the source titles provided in the context.

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

  // Fallback to Mock Response if Quota is exceeded (allows for a successful demo/walkthrough)
  if (isMocked || !reply) {
    reply = `
**[SYSTEM: MOCK MODE ACTIVE due to Quota Limit]**

I've analyzed your query regarding security. Based on the **Secure Code Companion** knowledge base, here is the expert guidance:

### Summary
To secure this flow, you must implement a multi-layered defense focusing on input validation and secure output handling.

### Implementation Checklist
- [ ] **Parameterize all inputs**: Never concatenate strings into queries or commands.
- [ ] **Enforce SameSite Cookies**: Set \`SameSite=Lax\` or \`Strict\` to mitigate CSRF risks.
- [ ] **Contextual Encoding**: Encode data specifically for the context it's being rendered in (HTML, JS, etc.).
- [ ] **Centralize AuthZ**: Perform all authorization checks on the server-side, never trusting the client.

### Secure vs. Insecure Pattern
\`\`\`javascript
// SECURE: Parameterized Query
const user = await db.query('SELECT * FROM users WHERE id = $1', [userId]);

// INSECURE: String Concatenation (Vulnerable to SQLi)
const user = await db.query(\`SELECT * FROM users WHERE id = '\${userId}'\`);
\`\`\`

### Common Pitfalls
- Relying on client-side validation as the only line of defense.
- Storing secrets or sensitive session data in \`localStorage\` where it's accessible via XSS.
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

