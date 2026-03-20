import { BM25 } from './bm25';

// Topic knowledge base (stored inline for a zero-dependency demo).
// Each "note" is chunked at runtime; BM25 ranks relevant chunks for retrieval.
const NOTES = [
  {
    id: 'owasp-top10',
    title: 'OWASP Top 10: practical developer view',
    text: `
OWASP Top 10 is a list of common web application risks. For developers, the goal is to connect each risk to a prevention pattern you can implement today.

Start with these mapping ideas:
- Injection (SQL/NoSQL/Command): parameterize queries, use allow-lists, avoid string-built queries.
- Broken Access Control: enforce authorization on the server for every request; never rely on UI hiding.
- Cryptographic Failures: encrypt data in transit (TLS) and at rest; rotate keys; do not invent crypto.
- Insecure Design: threat model first; define trust boundaries; review assumptions.
- Security Misconfiguration: secure defaults, least privilege, disable debug in prod, consistent headers.
- Vulnerable Components: keep dependencies updated; monitor advisories; use lockfiles.
- Identification & Authentication Failures: strong password hashing, correct session handling, MFA where appropriate.
- Software & Data Integrity Failures: verify build provenance, protect CI/CD secrets.
- SSRF: restrict outbound destinations, validate URLs, block link-local/internal ranges.
- XSS: contextual output encoding, safe templating, avoid dangerouslySetInnerHTML unless sanitized.

If you are unsure, ask: "What is the trust boundary?" and "Where does attacker-controlled input flow?"
`.trim()
  },
  {
    id: 'threat-modeling',
    title: 'Threat Modeling in 20 minutes',
    text: `
Threat modeling is about reducing surprises. A fast, repeatable approach:

1) Define assets: what must be protected (accounts, sessions, user data, payments).
2) Define boundaries: browser vs server vs third-party services vs databases.
3) Enumerate entry points: forms, APIs, OAuth callbacks, webhooks, file uploads, admin tools.
4) Identify attacker goals: steal data, bypass auth, alter data, disrupt service.
5) For each threat, choose mitigations:
   - Prevent: input validation, safe-by-default configs, least privilege
   - Detect: audit logs, monitoring, rate limiting, alerts
   - Respond: incident plan, revocation, key rotation
6) Document assumptions (so future changes don't reintroduce risk).

During implementation, validate mitigations with tests:
- unit tests for authorization rules
- integration tests for auth boundaries
- security tests for injection / XSS / CSRF / SSRF patterns
`.trim()
  },
  {
    id: 'xss',
    title: 'XSS: what to do in practice',
    text: `
Cross-Site Scripting happens when untrusted data is rendered in a way the browser executes as code.

Developer checklist:
- Prefer templating that escapes output by default.
- For rich HTML, sanitize with a proven sanitizer and strict allow-lists.
- Avoid "dangerous" APIs unless absolutely necessary and sanitized.
- Validate input length and character sets for high-risk fields.
- Use a Content Security Policy (CSP) to reduce impact.

In React/Next:
- React escapes string content automatically.
- If you must render HTML, sanitize first.
- For user-generated URLs, validate scheme/host before linking.
`.trim()
  },
  {
    id: 'csrf',
    title: 'CSRF: how it works and mitigations',
    text: `
CSRF is possible when browsers automatically attach cookies to requests.

Typical mitigations:
- Use SameSite cookies (Lax/Strict) for session cookies.
- Use CSRF tokens for state-changing requests (POST/PUT/PATCH/DELETE).
- For APIs: require an anti-CSRF header (double submit pattern) and verify token server-side.

Avoid relying only on CORS:
- CORS controls where JS can read responses.
- CSRF is about whether the browser sends cookies; you must protect the request itself.
`.trim()
  },
  {
    id: 'auth-sessions',
    title: 'Auth & sessions: secure patterns',
    text: `
Secure authentication is more than "log the user in".

Core patterns:
- Store passwords with a strong one-way hash (bcrypt/argon2) and unique salts.
- Use short-lived access tokens and rotate refresh tokens.
- Set session cookies with:
  - HttpOnly (blocks JS access)
  - Secure (HTTPS only)
  - SameSite (reduces CSRF)
- Implement logout as server-side session invalidation where possible.

Authorization:
- Enforce authorization on every request (server-side checks per endpoint).
- Use role/permission checks in a single, auditable place.
- Fail closed (deny by default).
`.trim()
  },
  {
    id: 'rate-limiting',
    title: 'Rate limiting & brute force protection',
    text: `
Rate limiting reduces the impact of brute force, credential stuffing, and DoS.

Practical strategies:
- Apply limits per IP and per account identifier (username/email).
- Add exponential backoff for authentication endpoints.
- Add CAPTCHA for suspicious activity (with caution and monitoring).
- Log rate-limit events with correlation IDs for investigation.

Be careful:
- Ensure limits apply server-side regardless of UI.
- Avoid leaking whether a user exists (use consistent error messages).
`.trim()
  },
  {
    id: 'ssrf',
    title: 'SSRF: prevention guide',
    text: `
SSRF occurs when an application makes outbound requests using attacker-influenced URLs/hosts.

Mitigations:
- Do not allow arbitrary outbound destinations.
- Validate and restrict allowed hosts/protocols with allow-lists.
- Block internal/private ranges (169.254.169.254, 127.0.0.0/8, RFC1918, localhost).
- Resolve DNS and validate the resolved IP (DNS rebinding defense).
- Consider using a proxy with fixed routing and strict egress controls.
`.trim()
  },
  {
    id: 'secure-headers',
    title: 'Secure HTTP headers (high impact)',
    text: `
Security headers reduce risk and help browser-based attacks.

Recommended starting set:
- Content-Security-Policy (CSP): restrict script/style sources.
- Strict-Transport-Security (HSTS): enforce HTTPS.
- X-Content-Type-Options: nosniff
- Referrer-Policy: reduce data leakage.
- Permissions-Policy: disable unneeded browser features.
- X-Frame-Options or frame-ancestors in CSP: mitigate clickjacking.

Note: headers should be tuned to your app. Start strict, then relax carefully with reports enabled.
`.trim()
  },
  {
    id: 'secrets',
    title: 'Secrets management for developers',
    text: `
Secrets are the keys to your kingdom.

Rules:
- Never commit secrets to git.
- Use environment variables / secret managers for runtime values.
- Rotate keys regularly and immediately after suspected leakage.
- Limit secret permissions (principle of least privilege).
- In CI/CD:
  - store secrets securely
  - restrict who can view/trigger sensitive workflows
  - protect build logs (avoid printing tokens)
`.trim()
  },
  {
    id: 'secure-coding',
    title: 'Secure coding patterns (JS/Node mindset)',
    text: `
General secure coding patterns:
- Validate inputs with allow-lists where possible.
- Use parameterized queries (no string concatenation for SQL/NoSQL).
- Encode output in the correct context:
  - HTML context -> HTML escaping
  - attribute context -> attribute escaping
  - URL context -> validate/encode safely
- Handle authz consistently: authorization checks should be centralized.
- Treat logs as sensitive: avoid logging secrets or personal data unnecessarily.
- Keep dependencies updated and use a lockfile.
`.trim()
  },
  {
    id: 'secure-build',
    title: 'Software & data integrity (CI/CD hygiene)',
    text: `
Integrity failures happen when the software pipeline or runtime data can be tampered with.

Developer actions:
- Use trusted build steps and pin dependencies.
- Protect CI/CD secrets and limit access.
- Prefer reproducible builds where feasible.
- Monitor for dependency changes and supply chain alerts.
- Ensure your hosting environment has least-privileged service identities.
`.trim()
  },
  {
    id: 'xss-examples',
    title: 'XSS: Secure vs Insecure Examples',
    text: `
Insecure (Vulnerable to XSS):
\`\`\`javascript
// Directly injecting user input into the DOM
const search = new URLSearchParams(window.location.search).get('q');
document.getElementById('results').innerHTML = \`You searched for: \${search}\`;
\`\`\`

Secure (XSS Protected):
\`\`\`javascript
// Using textContent instead of innerHTML
const search = new URLSearchParams(window.location.search).get('q');
document.getElementById('results').textContent = \`You searched for: \${search}\`;

// In React:
return <div>{userContent}</div>; // React escapes this automatically
\`\`\`
`.trim()
  },
  {
    id: 'sql-injection-examples',
    title: 'SQL Injection: Secure vs Insecure',
    text: `
Insecure (Vulnerable to SQLi):
\`\`\`javascript
const query = "SELECT * FROM users WHERE id = '" + req.body.id + "'";
db.execute(query);
\`\`\`

Secure (Parameterized Query):
\`\`\`javascript
const query = "SELECT * FROM users WHERE id = ?";
db.execute(query, [req.body.id]);
\`\`\`
`.trim()
  },
  {
    id: 'auth-examples',
    title: 'Auth: Secure Cookie Patterns',
    text: `
Secure Cookie Configuration for Sessions:
\`\`\`javascript
res.cookie('session_id', token, {
  httpOnly: true, // Prevents JS access (mitigates XSS-based session theft)
  secure: true,   // Requires HTTPS
  sameSite: 'lax', // CSRF protection
  path: '/',
  maxAge: 3600000 // 1 hour
});
\`\`\`
`.trim()
  },
  {
    id: 'incident-response',
    title: 'Incident response basics (so you can recover)',
    text: `
If something goes wrong, you need a plan.

Baseline steps:
- Contain: disable compromised access, rotate tokens/keys, restrict egress if needed.
- Eradicate: patch the vulnerability or remove the affected component.
- Recover: redeploy safely with verified changes.
- Learn: write a post-mortem; update threat models, tests, and monitoring.

For developer teams: prepare a short runbook for:
- authentication/session compromise
- secrets exposure
- suspicious traffic spike / data exfiltration indicators
`.trim()
  }
];

function cleanText(s) {
  return String(s || '')
    .replace(/\r/g, '')
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

function chunkText(text, maxChars = 900, overlapChars = 160) {
  const t = cleanText(text);
  const chunks = [];
  let start = 0;

  while (start < t.length) {
    let end = Math.min(start + maxChars, t.length);

    // Try to end at a boundary near the end to keep chunks coherent.
    const slice = t.slice(start, end);
    const lastPara = slice.lastIndexOf('\n\n');
    const lastPeriod = slice.lastIndexOf('.');
    const lastNewline = slice.lastIndexOf('\n');
    const best = Math.max(lastPara, lastPeriod, lastNewline);
    if (best > Math.floor(slice.length * 0.55)) {
      end = start + best + 2;
      end = Math.min(end, t.length);
    }

    const chunk = t.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end >= t.length) break;

    start = Math.max(0, end - overlapChars);
    if (chunks.length > 120) break; // safety guard
  }

  return chunks;
}

function excerpt(text, limit = 220) {
  const cleaned = cleanText(text);
  if (cleaned.length <= limit) return cleaned;
  return cleaned.slice(0, limit).trimEnd() + '…';
}

// Build BM25 docs eagerly (small KB => fast).
const DOCS = [];
for (const note of NOTES) {
  const chunks = chunkText(note.text);
  chunks.forEach((c, idx) => {
    DOCS.push({
      id: `${note.id}::chunk-${idx + 1}`,
      noteId: note.id,
      title: note.title,
      text: c
    });
  });
}

const bm25 = new BM25(DOCS, { k1: 1.5, b: 0.75 });

export function retrieveChunks(query, topK = 6) {
  const results = bm25.search(query, topK);
  return results.map((r) => ({
    id: r.id,
    noteId: r.noteId,
    title: r.title,
    text: r.text,
    excerpt: excerpt(r.text, 230),
    score: r.score
  }));
}

export function kbSummary() {
  return {
    notes: NOTES.length,
    chunks: DOCS.length
  };
}

