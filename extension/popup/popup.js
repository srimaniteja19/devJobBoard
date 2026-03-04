/* global StorageHelper, JobTrackerAPI, TextParser */

// ─── DOM References ─────────────────────────────────────────

const $ = (sel) => document.querySelector(sel);
const states = {
  loading: $('#state-loading'),
  auth: $('#state-auth'),
  empty: $('#state-empty'),
  form: $('#state-form'),
  success: $('#state-success'),
  settings: $('#state-settings'),
};

let currentJobData = null;
let selectedStatus = 'APPLIED';
let selectedJobType = 'REMOTE';
let savedAppId = null;
let previousState = 'form';

// ─── State Management ───────────────────────────────────────

function showState(name) {
  Object.values(states).forEach((el) => el.classList.remove('active'));
  states[name].classList.add('active');
}

// ─── Initialization ─────────────────────────────────────────

document.addEventListener('DOMContentLoaded', init);

async function init() {
  showState('loading');
  bindEvents();

  const settings = await StorageHelper.getAll();
  const apiUrl = settings.jobTrackerUrl;

  // Check auth
  const authData = await new Promise((resolve) => {
    chrome.runtime.sendMessage({ type: 'CHECK_AUTH' }, (res) => {
      resolve(res?.ok ? res.data : null);
    });
  });

  if (!authData?.user) {
    $('#input-api-url').value = apiUrl || '';
    showState('auth');
    return;
  }

  // Set user badge
  const userName = authData.user.name || authData.user.email || '';
  const initials = userName.split(' ').map((w) => w[0]).join('').substring(0, 2).toUpperCase();
  $('#user-badge').textContent = initials;
  $('#user-badge').title = userName;

  selectedStatus = settings.defaultStatus || 'APPLIED';

  // Get job data from content script
  const tab = await getCurrentTab();
  if (!tab?.id) {
    showState('empty');
    return;
  }

  try {
    const jobData = await new Promise((resolve) => {
      chrome.tabs.sendMessage(tab.id, { type: 'GET_JOB_DATA' }, (res) => {
        if (chrome.runtime.lastError) resolve(null);
        else resolve(res);
      });
    });

    if (jobData && jobData.confidence > 20) {
      currentJobData = jobData;
      populateForm(jobData);
      await checkForDuplicate(jobData);
      showState('form');
    } else {
      $('#field-url').value = tab.url || '';
      showState('empty');
    }
  } catch {
    showState('empty');
  }
}

async function getCurrentTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  return tab;
}

// ─── Form Population ────────────────────────────────────────

function populateForm(data) {
  $('#field-title').value = data.title || '';
  $('#field-company').value = data.company || '';
  $('#field-location').value = data.location || '';
  $('#field-salary').value = data.salary || '';
  $('#field-url').value = data.applyUrl || '';
  $('#source-badge').textContent = data.source || 'Web';

  selectedJobType = data.jobType || 'REMOTE';
  updatePillGroup('job-type-pills', selectedJobType);
  updatePillGroup('status-pills', selectedStatus);

  if (data.description) {
    $('#jd-text').textContent = TextParser.truncate(data.description, 300);
  } else {
    $('.jd-preview').classList.add('hidden');
  }

  if (data.confidence < 80) {
    $('#confidence-banner').classList.remove('hidden');
  }
}

function updatePillGroup(groupId, activeValue) {
  const group = $(`#${groupId}`);
  group.querySelectorAll('.pill').forEach((pill) => {
    pill.classList.toggle('active', pill.dataset.value === activeValue);
  });
}

// ─── Duplicate Check ────────────────────────────────────────

async function checkForDuplicate(data) {
  if (!data.company || !data.title) return;
  try {
    const res = await new Promise((resolve) => {
      chrome.runtime.sendMessage(
        { type: 'CHECK_DUPLICATE', company: data.company, role: data.title },
        (r) => resolve(r)
      );
    });

    if (res?.ok && res.data?.exists) {
      const dup = res.data;
      $('#duplicate-banner').classList.remove('hidden');
      $('#link-view-existing').onclick = async (e) => {
        e.preventDefault();
        const apiUrl = await StorageHelper.getApiUrl();
        chrome.tabs.create({ url: `${apiUrl}/applications/${dup.id}` });
      };
    }
  } catch { /* ignore */ }
}

// ─── Event Binding ──────────────────────────────────────────

function bindEvents() {
  // Auth state
  $('#btn-open-tracker').addEventListener('click', openTracker);
  $('#btn-save-url').addEventListener('click', async () => {
    const url = $('#input-api-url').value.trim();
    if (url) {
      await StorageHelper.set('jobTrackerUrl', url);
      init();
    }
  });

  // Empty state
  $('#btn-manual-add').addEventListener('click', async () => {
    const tab = await getCurrentTab();
    $('#field-url').value = tab?.url || '';
    updatePillGroup('status-pills', selectedStatus);
    updatePillGroup('job-type-pills', selectedJobType);
    showState('form');
  });
  $('#link-open-tracker-empty').addEventListener('click', (e) => {
    e.preventDefault();
    openTracker();
  });

  // Form state — pill groups
  $('#job-type-pills').addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    selectedJobType = pill.dataset.value;
    updatePillGroup('job-type-pills', selectedJobType);
  });

  $('#status-pills').addEventListener('click', (e) => {
    const pill = e.target.closest('.pill');
    if (!pill) return;
    selectedStatus = pill.dataset.value;
    updatePillGroup('status-pills', selectedStatus);
  });

  // JD toggle
  $('#toggle-jd').addEventListener('click', () => {
    const content = $('#jd-content');
    const isHidden = content.classList.toggle('hidden');
    $('#toggle-jd').textContent = isHidden ? 'View extracted JD ▾' : 'Hide JD ▴';
  });

  // Notes toggle
  $('#toggle-notes').addEventListener('click', () => {
    const textarea = $('#field-notes');
    const isHidden = textarea.classList.toggle('hidden');
    $('#toggle-notes').textContent = isHidden ? 'Add notes +' : 'Hide notes −';
    if (!isHidden) textarea.focus();
  });

  // Save
  $('#btn-save').addEventListener('click', handleSave);
  $('#btn-save-anyway').addEventListener('click', () => {
    $('#duplicate-banner').classList.add('hidden');
    handleSave();
  });

  // Open tracker links
  $('#link-open-tracker-form').addEventListener('click', (e) => {
    e.preventDefault();
    openTracker();
  });

  // Settings
  $('#btn-settings-empty').addEventListener('click', () => openSettings('empty'));
  $('#btn-settings-form').addEventListener('click', () => openSettings('form'));
  $('#btn-back-settings').addEventListener('click', closeSettings);
  $('#btn-clear-data').addEventListener('click', async () => {
    await StorageHelper.clear();
    init();
  });

  // Success actions
  $('#btn-view-in-tracker').addEventListener('click', async () => {
    if (!savedAppId) return;
    const apiUrl = await StorageHelper.getApiUrl();
    chrome.tabs.create({ url: `${apiUrl}/applications/${savedAppId}` });
  });
  $('#btn-open-prep').addEventListener('click', async () => {
    if (!savedAppId) return;
    const apiUrl = await StorageHelper.getApiUrl();
    chrome.tabs.create({ url: `${apiUrl}/applications/${savedAppId}` });
  });
}

// ─── Save Handler ───────────────────────────────────────────

async function handleSave() {
  const btn = $('#btn-save');
  const title = $('#field-title').value.trim();
  const company = $('#field-company').value.trim();

  if (!title || !company) {
    btn.textContent = 'Title & Company required';
    btn.style.background = '#ff4444';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = 'Save to JobTracker';
      btn.style.background = '';
      btn.style.color = '';
    }, 2000);
    return;
  }

  btn.disabled = true;
  btn.classList.add('loading');
  btn.textContent = 'Saving…';

  const payload = {
    role: title,
    company,
    jobUrl: $('#field-url').value.trim() || undefined,
    location: $('#field-location').value.trim() || undefined,
    salary: $('#field-salary').value.trim() || undefined,
    type: selectedJobType,
    status: selectedStatus,
    notes: $('#field-notes').value.trim() || undefined,
    source: 'extension',
  };

  try {
    const res = await new Promise((resolve, reject) => {
      chrome.runtime.sendMessage({ type: 'SAVE_JOB', data: payload }, (r) => {
        if (r?.ok) resolve(r.data);
        else reject(new Error(r?.error || 'Failed to save'));
      });
    });

    savedAppId = res.id;
    showSuccess(title, company);
  } catch (err) {
    btn.disabled = false;
    btn.classList.remove('loading');
    btn.textContent = err.message || 'Error — try again';
    btn.style.background = '#ff4444';
    btn.style.color = '#fff';
    setTimeout(() => {
      btn.textContent = 'Save to JobTracker';
      btn.style.background = '';
      btn.style.color = '';
    }, 3000);
  }
}

// ─── Success ────────────────────────────────────────────────

function showSuccess(role, company) {
  $('#success-detail').textContent = `${role} at ${company}`;

  const badge = $('#success-status-badge');
  const colors = {
    WISHLIST: '#dee2ff',
    APPLIED: '#e8ff47',
    SCREENING: '#cbc0d3',
    INTERVIEW: '#fb923c',
  };
  const c = colors[selectedStatus] || '#e8ff47';
  badge.textContent = selectedStatus;
  badge.style.border = `1px solid ${c}`;
  badge.style.color = c;
  badge.style.background = `${c}14`;

  showState('success');

  setTimeout(() => window.close(), 4000);
}

// ─── Settings ───────────────────────────────────────────────

async function openSettings(from) {
  previousState = from;
  const settings = await StorageHelper.getAll();
  $('#settings-url').value = settings.jobTrackerUrl || '';
  $('#settings-default-status').value = settings.defaultStatus || 'APPLIED';
  $('#settings-auto-extract').checked = settings.autoExtract !== false;
  $('#settings-notifications').checked = settings.showNotifications !== false;
  showState('settings');
}

async function closeSettings() {
  const url = $('#settings-url').value.trim();
  if (url) await StorageHelper.set('jobTrackerUrl', url);
  await StorageHelper.set('defaultStatus', $('#settings-default-status').value);
  await StorageHelper.set('autoExtract', $('#settings-auto-extract').checked);
  await StorageHelper.set('showNotifications', $('#settings-notifications').checked);

  selectedStatus = $('#settings-default-status').value;
  showState(previousState);
}

// ─── Helpers ────────────────────────────────────────────────

async function openTracker() {
  const apiUrl = await StorageHelper.getApiUrl();
  chrome.tabs.create({ url: apiUrl });
}
