const DEFAULTS = {
  jobTrackerUrl: 'http://localhost:3000',
  defaultStatus: 'APPLIED',
  autoExtract: true,
  showNotifications: true,
  quickSave: false,
};

const StorageHelper = {
  async get(key) {
    const result = await chrome.storage.local.get(key);
    return result[key] ?? DEFAULTS[key] ?? null;
  },

  async getAll() {
    const keys = Object.keys(DEFAULTS);
    const result = await chrome.storage.local.get(keys);
    return { ...DEFAULTS, ...result };
  },

  async set(key, value) {
    await chrome.storage.local.set({ [key]: value });
  },

  async setMultiple(obj) {
    await chrome.storage.local.set(obj);
  },

  async getApiUrl() {
    const url = await this.get('jobTrackerUrl');
    return (url || DEFAULTS.jobTrackerUrl).replace(/\/+$/, '');
  },

  async clear() {
    await chrome.storage.local.clear();
  },
};
