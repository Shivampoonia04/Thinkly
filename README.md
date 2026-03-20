# Thinkly Labs — Secure Code Companion

This is a chatbot I built for the **Cybersecurity for Developers** topic. 
It uses **BM25 retrieval** to look through a small knowledge base of OWASP security patterns and then answers questions using an LLM (OpenAI).

## Submission Links

- **Deployed URL**: [https://thinkly-secure-code.vercel.app](https://thinkly-secure-code.vercel.app) *(Placeholder - please replace after deployment)*
- **GitHub Repository**: [https://github.com/Shivampoonia04/Thinkly](https://github.com/Shivampoonia04/Thinkly)

## Why I built this

I wanted to make a tool that helps developers quickly check secure coding practices. 
Instead of just a generic chat, I built this to focus specifically on security mitigations and practical checklists.

The UI shows the **Sources** used for each answer, so you know where the information is coming from.

## Features

- **Themed UI**: A dark, modern interface that fits the "security" theme.
- **RAG Implementation**: Uses a local BM25 search to find relevant security notes before answering.
- **Developer Tools**: I added things like code-block copying and Markdown support to make the answers easier to read and use.
- **Reliable UI**: Added loading states (skeletons) and handled errors gracefully.
- **Fallback Mode**: If the API key runs out of credits, it still shows a sample security response so the UI doesn't just break.

## Setup

1. Install everything:
```bash
npm install
```

2. Environment:
Create a `.env.local` file and add:
```bash
OPENAI_API_KEY=your_key_here
```

3. Run it:
```bash
npm run dev
```

## How it works

The server takes the user's question and searches through `src/lib/kb.js` using the BM25 algorithm. 
It then sends the most relevant chunks to OpenAI to generate a grounded, technical response.

## Tech Stack
- Next.js (App Router)
- OpenAI API
- Lucide React (Icons)
- React Markdown
