// Tiny API client — wraps fetch + JSON.
const API = {
  async refdata() { return fetch('/api/refdata').then(r => r.json()); },
  async examples() { return fetch('/api/examples').then(r => r.json()); },
  async health() { return fetch('/api/health').then(r => r.json()); },
  async session() { return fetch('/api/session').then(r => r.json()); },
  async sessionReset() { return fetch('/api/session/reset', { method: 'POST' }).then(r => r.json()); },
  async analyze(input) {
    return fetch('/api/analyze', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(input),
    }).then(async r => {
      if (!r.ok) throw new Error((await r.json()).error || 'Analyze failed');
      return r.json();
    });
  },
  async generateStory(payload) {
    return fetch('/api/generate-story', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    }).then(async r => {
      if (!r.ok) throw new Error((await r.json()).error || 'Story generation failed');
      return r.json();
    });
  },
  exportUrl() { return '/api/export'; },
};
