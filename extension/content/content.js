/* global extractLinkedIn, extractIndeed, extractGreenhouse, extractLever, extractWorkday, extractAshby, extractGeneric */

const EXTRACTORS = {
  'linkedin.com': extractLinkedIn,
  'indeed.com': extractIndeed,
  'greenhouse.io': extractGreenhouse,
  'lever.co': extractLever,
  'myworkdayjobs.com': extractWorkday,
  'workday.com': extractWorkday,
  'ashbyhq.com': extractAshby,
};

let _cachedJobData = null;
let _linkedInRetryTimeouts = [];

function detectAndExtract() {
  const hostname = window.location.hostname;
  const matchedKey = Object.keys(EXTRACTORS).find((k) => hostname.includes(k));
  const result = matchedKey ? EXTRACTORS[matchedKey]() : extractGeneric();

  result.applyUrl = window.location.href;
  _cachedJobData = result;

  try {
    chrome.runtime.sendMessage({ type: 'JOB_DETECTED', data: result });
  } catch { /* extension context invalidated */ }

  return result;
}

function scheduleLinkedInRetries() {
  _linkedInRetryTimeouts.forEach((t) => clearTimeout(t));
  _linkedInRetryTimeouts = [];
  _cachedJobData = null;

  const run = () => {
    const result = detectAndExtract();
    try {
      chrome.runtime.sendMessage({ type: 'JOB_DETECTED', data: result });
    } catch {}
  };

  _linkedInRetryTimeouts.push(setTimeout(run, 600));
  _linkedInRetryTimeouts.push(setTimeout(run, 1500));
  _linkedInRetryTimeouts.push(setTimeout(run, 2800));
  _linkedInRetryTimeouts.push(setTimeout(run, 4500));
}

function runInitialExtraction() {
  const hostname = window.location.hostname;
  const path = window.location.pathname || '';
  const isLinkedInJobs = hostname.includes('linkedin.com') &&
    (path.includes('/jobs/view/') || path.includes('/jobs/search') || (path.includes('/jobs/') && window.location.search.includes('currentJobId')));

  if (isLinkedInJobs) {
    scheduleLinkedInRetries();
    return;
  }

  const delay = (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com'))
    ? 1500
    : 500;

  setTimeout(detectAndExtract, delay);
}

runInitialExtraction();

// SPA navigation detection (e.g. switching jobs on LinkedIn search)
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    const hostname = window.location.hostname;
    const isLinkedInJobs = hostname.includes('linkedin.com') && (window.location.pathname || '').includes('/jobs');

    if (isLinkedInJobs) {
      scheduleLinkedInRetries();
    } else {
      _cachedJobData = null;
      setTimeout(detectAndExtract, 1500);
    }
  }
}).observe(document.documentElement, { subtree: true, childList: true });

// Listen for popup requesting data (always re-run on LinkedIn so we catch late-loaded panel)
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_JOB_DATA') {
    const isLinkedIn = window.location.hostname.includes('linkedin.com');
    const fresh = isLinkedIn ? detectAndExtract() : (_cachedJobData || detectAndExtract());
    sendResponse(fresh);
    return true;
  }
});
