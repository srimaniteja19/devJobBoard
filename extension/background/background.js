const DEFAULT_API_URL = 'http://localhost:3000';

async function getApiUrl() {
  const result = await chrome.storage.local.get('jobTrackerUrl');
  return (result.jobTrackerUrl || DEFAULT_API_URL).replace(/\/+$/, '');
}

// ─── Badge Updates ──────────────────────────────────────────

function updateBadge(tabId, confidence) {
  if (confidence > 70) {
    chrome.action.setBadgeText({ text: '✓', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#e8ff47', tabId });
  } else if (confidence >= 40) {
    chrome.action.setBadgeText({ text: '?', tabId });
    chrome.action.setBadgeBackgroundColor({ color: '#fb923c', tabId });
  } else {
    chrome.action.setBadgeText({ text: '', tabId });
  }
}

// ─── API Helpers ────────────────────────────────────────────

async function apiRequest(path, options = {}) {
  const base = await getApiUrl();
  const res = await fetch(`${base}${path}`, {
    credentials: 'include',
    headers: { 'Content-Type': 'application/json', ...options.headers },
    ...options,
  });
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    throw new Error(body.error || `HTTP ${res.status}`);
  }
  return res.json();
}

async function checkAuth() {
  try {
    return await apiRequest('/api/extension/check-auth');
  } catch {
    return null;
  }
}

async function saveJob(jobData) {
  return apiRequest('/api/extension/save-job', {
    method: 'POST',
    body: JSON.stringify(jobData),
  });
}

async function getRecent(limit = 20) {
  return apiRequest(`/api/extension/recent?limit=${limit}`);
}

async function checkDuplicate(company, role) {
  const params = new URLSearchParams({ company, role });
  return apiRequest(`/api/extension/check-duplicate?${params}`);
}

// ─── Message Handler ────────────────────────────────────────

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  const tabId = sender.tab?.id;

  switch (msg.type) {
    case 'JOB_DETECTED':
      if (tabId) updateBadge(tabId, msg.data?.confidence || 0);
      sendResponse({ ok: true });
      break;

    case 'SAVE_JOB':
      saveJob(msg.data)
        .then((result) => sendResponse({ ok: true, data: result }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    case 'CHECK_AUTH':
      checkAuth()
        .then((data) => sendResponse({ ok: true, data }))
        .catch(() => sendResponse({ ok: false, data: null }));
      return true;

    case 'GET_RECENT':
      getRecent(msg.limit || 20)
        .then((data) => sendResponse({ ok: true, data }))
        .catch((err) => sendResponse({ ok: false, error: err.message }));
      return true;

    case 'CHECK_DUPLICATE':
      checkDuplicate(msg.company, msg.role)
        .then((data) => sendResponse({ ok: true, data }))
        .catch(() => sendResponse({ ok: false, data: null }));
      return true;

    default:
      sendResponse({ ok: false, error: 'Unknown message type' });
  }
});

// ─── Context Menu (Quick Save) ──────────────────────────────

chrome.runtime.onInstalled.addListener(() => {
  chrome.contextMenus.create({
    id: 'save-to-jobtracker',
    title: 'Save job to JobTracker',
    contexts: ['page'],
  });
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
  if (info.menuItemId !== 'save-to-jobtracker') return;

  const settings = await chrome.storage.local.get(['quickSave', 'defaultStatus', 'showNotifications']);
  const defaultStatus = settings.defaultStatus || 'APPLIED';

  try {
    const [response] = await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        // Re-run extraction in the page context
        if (typeof detectAndExtract === 'function') {
          return detectAndExtract();
        }
        return null;
      },
    });

    const jobData = response?.result;
    if (!jobData || jobData.confidence < 30) {
      if (settings.showNotifications !== false) {
        chrome.notifications.create({
          type: 'basic',
          iconUrl: 'icons/icon128.png',
          title: 'JobTracker',
          message: 'No job posting detected on this page.',
        });
      }
      return;
    }

    const result = await saveJob({
      company: jobData.company,
      role: jobData.title,
      jobUrl: jobData.applyUrl,
      salary: jobData.salary || undefined,
      location: jobData.location || undefined,
      type: jobData.jobType || 'REMOTE',
      status: defaultStatus,
      notes: jobData.description ? jobData.description.substring(0, 500) : undefined,
      source: 'extension',
    });

    if (settings.showNotifications !== false) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'Saved to JobTracker ✓',
        message: `${jobData.title} at ${jobData.company} → ${defaultStatus}`,
      });
    }
  } catch (err) {
    if (settings.showNotifications !== false) {
      chrome.notifications.create({
        type: 'basic',
        iconUrl: 'icons/icon128.png',
        title: 'JobTracker Error',
        message: err.message || 'Failed to save job.',
      });
    }
  }
});
