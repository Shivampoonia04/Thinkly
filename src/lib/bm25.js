function tokenize(text) {
  return String(text || '')
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length >= 3);
}

export class BM25 {
  constructor(docs, opts = {}) {
    this.k1 = typeof opts.k1 === 'number' ? opts.k1 : 1.5;
    this.b = typeof opts.b === 'number' ? opts.b : 0.75;
    this.docs = docs;

    this.docTokens = [];
    this.docFreq = new Map(); // term -> docs containing term
    this.termFreqs = []; // array of Map term -> freq
    this.docLen = [];

    for (const d of docs) {
      const tokens = tokenize(d.text);
      const tf = new Map();
      for (const t of tokens) tf.set(t, (tf.get(t) || 0) + 1);

      this.docTokens.push(tokens);
      this.termFreqs.push(tf);
      this.docLen.push(tokens.length);

      // document frequency
      for (const t of tf.keys()) {
        this.docFreq.set(t, (this.docFreq.get(t) || 0) + 1);
      }
    }

    this.N = docs.length;
    this.avgdl = this.docLen.reduce((a, b) => a + b, 0) / Math.max(1, this.N);

    // IDF with a common BM25 smoothing
    this.idf = new Map();
    for (const [term, df] of this.docFreq.entries()) {
      const value = Math.log(1 + (this.N - df + 0.5) / (df + 0.5));
      this.idf.set(term, value);
    }
  }

  scoreDoc(queryTokens, docIndex) {
    const tf = this.termFreqs[docIndex];
    const dl = this.docLen[docIndex] || 0;

    let score = 0;
    for (const term of queryTokens) {
      const idf = this.idf.get(term);
      if (!idf) continue;

      const f = tf.get(term) || 0;
      if (f === 0) continue;

      // BM25 core formula
      const denom = f + this.k1 * (1 - this.b + (this.b * dl) / Math.max(1e-6, this.avgdl));
      score += idf * ((f * (this.k1 + 1)) / denom);
    }
    return score;
  }

  search(query, topK = 6) {
    const queryTokens = tokenize(query);
    if (queryTokens.length === 0) {
      return this.docs.slice(0, topK).map((d) => ({ ...d, score: 0 }));
    }

    const scored = [];
    for (let i = 0; i < this.docs.length; i++) {
      scored.push({ i, score: this.scoreDoc(queryTokens, i) });
    }

    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, topK).map(({ i, score }) => ({ ...this.docs[i], score }));
  }
}

