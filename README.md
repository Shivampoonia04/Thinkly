# Thinkly Labs — Secure Code Companion

This is a topic-focused chatbot for **Cybersecurity for Developers**.
It uses a lightweight, local **BM25 retrieval** over an in-app knowledge base (OWASP + secure coding patterns),
then asks an LLM to answer using the retrieved references.

## What I built (and why)

When building secure software, developers need:
- fast, practical guidance (what to do)
- clear scope (what not to do)
- references (why the answer is trustworthy)

The UI is centered around that: every answer includes **“Sources”** drawn from the knowledge base chunks.

## Key "Frontend Thinking" Features

I focused on creating a professional, purpose-built experience rather than a generic chat wrapper:

- **Professional "Security Advisor" UI**: A high-fidelity dark theme with glassmorphism, Lucide icons, and terminal-style accents to reflect the cybersecurity topic.
- **Rich Markdown Rendering**: Full support for lists, bold text, and syntax-highlighted code blocks for clear technical guidance.
- **Loading & Skeleton States**: Instead of a simple spinner, the bot uses animated skeletons and a "Thinking..." status to maintain a smooth, responsive feel.
- **Empty State "Audit Dashboard"**: A structured entry screen with categorized suggestion cards to help users initialize a security audit immediately.
- **Copy-to-Clipboard**: Every code block has a copy button, making it easy for developers to grab secure patterns.
- **Verified Sources**: The UI explicitly shows which parts of the knowledge base were used to generate the answer, building trust.
- **Resilient Mock Mode**: If the OpenAI quota is reached, the bot automatically switches to a high-quality "Mock Mode" to ensure the demo remains functional.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Configure environment:

```bash
cp .env.example .env.local
```

Set:
- `OPENAI_API_KEY`

3. Run locally:

```bash
npm run dev
```

Open `http://localhost:3000` (or the port indicated in the terminal).

## How retrieval works

Server-side:
- The knowledge base is stored in `src/lib/kb.js`.
- At runtime, the server builds chunks and computes BM25 scores.
- For a user query, it selects the top matching chunks and includes them in the prompt.

## Files of interest

- `src/lib/kb.js`: the topic knowledge base + chunking
- `src/app/api/chat/route.js`: retrieval + OpenAI call + **Mock Fallback**
- `src/components/ChatClient.js`: the enhanced, themed chat UI

## Loom Walkthrough Checklist

When recording, show these details:
1. **Initialize Audit**: Show the suggestion cards in the empty state.
2. **Thinking State**: Ask a question and point out the skeleton loading.
3. **Rich Content**: Show the Markdown rendering and task lists in the response.
4. **Copy Code**: Demonstrate the copy-to-clipboard feature on a secure code block.
5. **Sources**: Point out the "Verified Sources" section at the bottom of the response.
6. **Error Resilience**: Mention that the bot has a mock fallback if API limits are hit.
