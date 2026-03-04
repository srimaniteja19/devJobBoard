/* global extractLinkedIn, extractIndeed, extractGreenhouse, extractLever, extractWorkday, extractAshby, extractGeneric */

// ─── LinkedIn (jobs view + jobs/search right panel) ────────

function extractLinkedIn() {
  const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';
  const getAllText = (sel) => {
    const el = document.querySelector(sel);
    return el ? el.innerText.trim() : '';
  };

  // Job detail panel (same on /jobs/view/ and /jobs/search/ right rail)
  const title = getText('.job-details-jobs-unified-top-card__job-title') ||
    getText('.jobs-unified-top-card__job-title') ||
    getText('.t-24.job-details-jobs-unified-top-card__job-title') ||
    getText('h1.topcard__title') ||
    getText('.job-details-jobs-unified-top-card__content-container h1') ||
    getText('.jobs-search__job-details h1') ||
    getText('h1');

  const company = getText('.job-details-jobs-unified-top-card__company-name') ||
    getText('.jobs-unified-top-card__company-name') ||
    getText('.topcard__org-name-link') ||
    getText('a[data-tracking-control-name="public_jobs_topcard-org-name"]') ||
    getText('.job-details-jobs-unified-top-card__content-container a[href*="/company/"]') ||
    getText('.jobs-search__job-details a[href*="/company/"]');

  const location = getText('.job-details-jobs-unified-top-card__bullet') ||
    getText('.jobs-unified-top-card__bullet') ||
    getText('.topcard__flavor--bullet') ||
    getText('.job-details-jobs-unified-top-card__primary-description-container span') ||
    getAllText('.jobs-unified-top-card__primary-description');

  const salary = getText('.compensation__salary-range') ||
    getText('.salary-main-rail__data-body') ||
    getText('[data-testid="job-details-salary"]') ||
    (() => {
      const m = document.body.innerText.match(/\$[\d,]+(?:\.\d{2})?(?:\/yr|\/hr)?\s*[-–]\s*\$[\d,]+(?:\.\d{2})?(?:\/yr|\/hr)?/);
      return m ? m[0] : '';
    })() || '';

  let jobType = 'REMOTE';
  const workplaceText = (
    getText('.job-details-jobs-unified-top-card__workplace-type') ||
    getText('.jobs-unified-top-card__workplace-type') ||
    getAllText('.job-details-jobs-unified-top-card__primary-description') ||
    document.body.innerText.substring(0, 5000)
  ).toLowerCase();

  if (workplaceText.includes('on-site') || workplaceText.includes('onsite') || workplaceText.includes('on site')) {
    jobType = 'ONSITE';
  } else if (workplaceText.includes('hybrid')) {
    jobType = 'HYBRID';
  }

  const description = getText('.jobs-description__content') ||
    getText('.jobs-description-content__text') ||
    getText('.description__text') ||
    getText('.jobs-description-details') ||
    getText('.jobs-search__job-details .jobs-description') || '';

  // Fallback: parse document.title ("Company hiring Title in Location | LinkedIn")
  let finalTitle = title;
  let finalCompany = company;
  let finalLocation = location;
  const pageTitle = document.title || '';
  if (!finalTitle || !finalCompany) {
    const withLoc = pageTitle.match(/^(.+?)\s+hiring\s+(.+?)\s+in\s+(.+?)\s*\|/i);
    const noLoc = pageTitle.match(/^(.+?)\s+hiring\s+(.+?)\s*\|/i);
    if (withLoc) {
      if (!finalCompany) finalCompany = withLoc[1].trim();
      if (!finalTitle) finalTitle = withLoc[2].trim();
      if (!finalLocation) finalLocation = withLoc[3].trim();
    } else if (noLoc) {
      if (!finalCompany) finalCompany = noLoc[1].trim();
      if (!finalTitle) finalTitle = noLoc[2].trim();
    } else if (!finalTitle && pageTitle) {
      finalTitle = pageTitle.replace(/\s*\|\s*LinkedIn.*$/i, '').trim();
    }
  }

  const confidence = (finalTitle && finalCompany) ? 95 : (finalTitle ? 50 : 10);

  return {
    title: finalTitle || title,
    company: finalCompany || company,
    location: finalLocation || location,
    salary, jobType, description,
    applyUrl: window.location.href,
    source: 'LinkedIn',
    confidence
  };
}

// ─── Indeed (/viewjob*) ─────────────────────────────────────

function extractIndeed() {
  const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';

  const title = getText('[data-testid="jobsearch-JobInfoHeader-title"]') ||
    getText('.jobsearch-JobInfoHeader-title') ||
    getText('h1');

  const company = getText('[data-testid="inlineHeader-companyName"]') ||
    getText('.jobsearch-InlineCompanyRating-companyHeader') ||
    getText('[data-company-name]');

  const location = getText('[data-testid="job-location"]') ||
    getText('[data-testid="inlineHeader-companyLocation"]') ||
    getText('.jobsearch-JobInfoHeader-subtitle > div:last-child');

  const salary = getText('[data-testid="attribute_snippet_testid"]') ||
    getText('.jobsearch-JobMetadataHeader-item') || '';

  const description = getText('#jobDescriptionText') ||
    getText('.jobsearch-jobDescriptionText') || '';

  let jobType = 'ONSITE';
  const pageText = (location + ' ' + description.substring(0, 2000)).toLowerCase();
  if (pageText.includes('remote')) jobType = 'REMOTE';
  else if (pageText.includes('hybrid')) jobType = 'HYBRID';

  const confidence = (title && company) ? 90 : (title ? 45 : 10);

  return {
    title, company, location, salary, jobType, description,
    applyUrl: window.location.href,
    source: 'Indeed',
    confidence
  };
}

// ─── Greenhouse (boards.greenhouse.io) ──────────────────────

function extractGreenhouse() {
  const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';

  const title = getText('.app-title') || getText('h1') || '';

  let company = getText('.company-name');
  if (!company) {
    const pageTitle = document.title || '';
    const match = pageTitle.match(/at\s+(.+?)(?:\s*[-–|]|$)/i);
    if (match) company = match[1].trim();
  }

  const location = getText('.location') || getText('.body--metadata');
  const description = getText('#content') || getText('.content') || '';

  let jobType = 'ONSITE';
  const pageText = (location + ' ' + description.substring(0, 2000)).toLowerCase();
  if (pageText.includes('remote')) jobType = 'REMOTE';
  else if (pageText.includes('hybrid')) jobType = 'HYBRID';

  const confidence = (title && company) ? 95 : (title ? 55 : 10);

  return {
    title, company, location, salary: '', jobType, description,
    applyUrl: window.location.href,
    source: 'Greenhouse',
    confidence
  };
}

// ─── Lever (jobs.lever.co) ──────────────────────────────────

function extractLever() {
  const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';

  const title = getText('.posting-headline h2') || getText('h2') || '';

  let company = '';
  const urlMatch = window.location.pathname.match(/^\/([^/]+)/);
  if (urlMatch) {
    company = urlMatch[1].replace(/-/g, ' ')
      .replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const location = getText('.sort-by-time') || getText('.posting-categories .location') || '';
  const description = getText('.section-wrapper') || getText('.content') || '';

  let jobType = 'ONSITE';
  const pageText = (location + ' ' + description.substring(0, 2000)).toLowerCase();
  if (pageText.includes('remote')) jobType = 'REMOTE';
  else if (pageText.includes('hybrid')) jobType = 'HYBRID';

  const confidence = (title && company) ? 90 : (title ? 50 : 10);

  return {
    title, company, location, salary: '', jobType, description,
    applyUrl: window.location.href,
    source: 'Lever',
    confidence
  };
}

// ─── Workday (*.myworkdayjobs.com) ──────────────────────────

function extractWorkday() {
  const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';

  const title = getText('[data-automation-id="jobPostingHeader"]') ||
    getText('h2[data-automation-id="jobPostingHeader"]') ||
    getText('h1') || '';

  let company = '';
  const titleTag = document.title || '';
  const titleMatch = titleTag.match(/[-–|]\s*(.+?)$/);
  if (titleMatch) company = titleMatch[1].trim();
  if (!company) {
    const subdomain = window.location.hostname.split('.')[0];
    company = subdomain.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
  }

  const location = getText('[data-automation-id="locations"]') ||
    getText('[data-automation-id="jobPostingLocation"]') || '';

  const description = getText('[data-automation-id="jobPostingDescription"]') || '';

  let jobType = 'ONSITE';
  const pageText = (location + ' ' + description.substring(0, 2000)).toLowerCase();
  if (pageText.includes('remote')) jobType = 'REMOTE';
  else if (pageText.includes('hybrid')) jobType = 'HYBRID';

  const confidence = (title && company) ? 85 : (title ? 45 : 10);

  return {
    title, company, location, salary: '', jobType, description,
    applyUrl: window.location.href,
    source: 'Workday',
    confidence
  };
}

// ─── Ashby (ashbyhq.com) ────────────────────────────────────

function extractAshby() {
  const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';

  const title = getText('h1') || '';
  const company = getText('.ashby-job-posting-brief-company') || '';
  const location = getText('.ashby-job-posting-brief-location') || '';
  const description = getText('.ashby-job-posting-description') ||
    getText('[data-testid="description"]') || '';

  let jobType = 'ONSITE';
  const pageText = (location + ' ' + description.substring(0, 2000)).toLowerCase();
  if (pageText.includes('remote')) jobType = 'REMOTE';
  else if (pageText.includes('hybrid')) jobType = 'HYBRID';

  const confidence = (title && company) ? 90 : (title ? 50 : 10);

  return {
    title, company, location, salary: '', jobType, description,
    applyUrl: window.location.href,
    source: 'Ashby',
    confidence
  };
}

// ─── Generic Fallback ───────────────────────────────────────

function extractGeneric() {
  const getText = (sel) => document.querySelector(sel)?.innerText?.trim() || '';

  // Try JSON-LD first (most reliable)
  const jsonLd = _extractJsonLd();
  if (jsonLd && jsonLd.confidence >= 80) return jsonLd;

  // Heuristic title detection
  const JOB_KEYWORDS = /engineer|developer|designer|manager|analyst|scientist|coordinator|director|lead|architect|consultant|specialist|associate|intern|admin|recruiter|product|marketing|sales|devops|sre|qa|frontend|backend|fullstack|full.stack/i;

  let title = '';
  const h1 = getText('h1');
  if (h1 && JOB_KEYWORDS.test(h1)) {
    title = h1;
  } else {
    const ogTitle = document.querySelector('meta[property="og:title"]')?.content || '';
    if (ogTitle && JOB_KEYWORDS.test(ogTitle)) {
      title = ogTitle;
    } else if (JOB_KEYWORDS.test(document.title)) {
      title = document.title.replace(/\s*[-–|].+$/, '').trim();
    }
  }

  // Company detection
  let company = '';
  const ogSiteName = document.querySelector('meta[property="og:site_name"]')?.content || '';
  if (ogSiteName) {
    company = ogSiteName;
  } else {
    const companyEl = document.querySelector('[class*="company"]');
    if (companyEl) company = companyEl.innerText.trim();
  }

  // Location
  const locationEl = document.querySelector('[class*="location"]');
  const location = locationEl?.innerText?.trim() || '';

  // Salary via regex
  let salary = '';
  const bodySnippet = document.body.innerText.substring(0, 10000);
  const salaryMatch = bodySnippet.match(/\$[\d,]+(?:k)?\s*[-–]\s*\$[\d,]+(?:k)?/i);
  if (salaryMatch) salary = salaryMatch[0];

  // Description: largest text block with job keywords
  let description = '';
  const descKeywords = /responsibilit|requirement|qualification|experience|about the role|what you|who you/i;
  const blocks = document.querySelectorAll('div, section, article');
  let maxLen = 0;
  blocks.forEach((el) => {
    const text = el.innerText || '';
    if (text.length > 200 && text.length > maxLen && descKeywords.test(text)) {
      description = text;
      maxLen = text.length;
    }
  });

  // Job type
  let jobType = 'ONSITE';
  const pageText = (location + ' ' + description.substring(0, 2000)).toLowerCase();
  if (pageText.includes('remote')) jobType = 'REMOTE';
  else if (pageText.includes('hybrid')) jobType = 'HYBRID';

  let confidence = 0;
  if (title && description) confidence = 60;
  else if (title) confidence = 20;

  // Merge with partial JSON-LD data if available
  if (jsonLd) {
    if (!title && jsonLd.title) title = jsonLd.title;
    if (!company && jsonLd.company) company = jsonLd.company;
    if (!location && jsonLd.location) { /* location already assigned via heuristics */ }
    if (!salary && jsonLd.salary) salary = jsonLd.salary;
    if (!description && jsonLd.description) description = jsonLd.description;
    confidence = Math.max(confidence, jsonLd.confidence);
  }

  return {
    title, company, location, salary, jobType, description,
    applyUrl: window.location.href,
    source: 'Web',
    confidence
  };
}

// ─── JSON-LD Helper ─────────────────────────────────────────

function _extractJsonLd() {
  const scripts = document.querySelectorAll('script[type="application/ld+json"]');
  for (const script of scripts) {
    try {
      let data = JSON.parse(script.textContent);
      if (Array.isArray(data)) data = data.find((d) => d['@type'] === 'JobPosting');
      if (data?.['@type'] !== 'JobPosting') continue;

      const title = data.title || '';
      const company = data.hiringOrganization?.name || '';
      const location = data.jobLocation?.address?.addressLocality ||
        data.jobLocation?.name || '';
      let salary = '';
      if (data.baseSalary) {
        const bs = data.baseSalary;
        if (bs.value?.minValue && bs.value?.maxValue) {
          salary = `$${bs.value.minValue.toLocaleString()} - $${bs.value.maxValue.toLocaleString()}`;
        } else if (typeof bs.value === 'number') {
          salary = `$${bs.value.toLocaleString()}`;
        }
      }
      const description = data.description?.replace(/<[^>]+>/g, ' ').trim() || '';

      let jobType = 'ONSITE';
      const locType = (data.jobLocationType || '').toLowerCase();
      if (locType.includes('remote') || locType === 'telecommute') jobType = 'REMOTE';
      const empType = (data.employmentType || '').toString().toLowerCase();
      if (empType.includes('remote')) jobType = 'REMOTE';

      return {
        title, company, location, salary, jobType, description,
        applyUrl: window.location.href,
        source: 'Web',
        confidence: (title && company) ? 90 : 60
      };
    } catch { /* ignore parse errors */ }
  }
  return null;
}
