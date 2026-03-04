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

// Initial extraction, with extra delay for JS-heavy sites
const hostname = window.location.hostname;
const delay = (hostname.includes('workday.com') || hostname.includes('myworkdayjobs.com'))
  ? 1500
  : 500;

setTimeout(detectAndExtract, delay);

// SPA navigation detection
let lastUrl = location.href;
new MutationObserver(() => {
  if (location.href !== lastUrl) {
    lastUrl = location.href;
    _cachedJobData = null;
    setTimeout(detectAndExtract, 1500);
  }
}).observe(document.documentElement, { subtree: true, childList: true });

// Listen for popup requesting data
chrome.runtime.onMessage.addListener((msg, _sender, sendResponse) => {
  if (msg.type === 'GET_JOB_DATA') {
    if (_cachedJobData) {
      sendResponse(_cachedJobData);
    } else {
      const fresh = detectAndExtract();
      sendResponse(fresh);
    }
    return true;
  }
});
