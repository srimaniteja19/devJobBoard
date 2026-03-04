/* global StorageHelper */

const JobTrackerAPI = {
  async _baseUrl() {
    return await StorageHelper.getApiUrl();
  },

  async _fetch(path, options = {}) {
    const base = await this._baseUrl();
    const url = `${base}${path}`;
    const res = await fetch(url, {
      credentials: 'include',
      headers: { 'Content-Type': 'application/json', ...options.headers },
      ...options,
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      throw new Error(body.error || `Request failed: ${res.status}`);
    }
    return res.json();
  },

  async checkAuth() {
    try {
      const data = await this._fetch('/api/extension/check-auth');
      return data;
    } catch {
      return null;
    }
  },

  async saveJob(jobData) {
    return this._fetch('/api/extension/save-job', {
      method: 'POST',
      body: JSON.stringify(jobData),
    });
  },

  async getRecent(limit = 20) {
    return this._fetch(`/api/extension/recent?limit=${limit}`);
  },

  async checkDuplicate(company, role) {
    const params = new URLSearchParams({ company, role });
    return this._fetch(`/api/extension/check-duplicate?${params}`);
  },
};
