const TextParser = {
  cleanText(text) {
    if (!text) return '';
    return text
      .replace(/\s+/g, ' ')
      .replace(/\n{3,}/g, '\n\n')
      .trim();
  },

  truncate(text, maxLen = 300) {
    if (!text || text.length <= maxLen) return text || '';
    return text.substring(0, maxLen).replace(/\s+\S*$/, '') + '…';
  },

  cleanTitle(title) {
    if (!title) return '';
    return title
      .replace(/\s*[-–|].+$/, '')
      .replace(/^\s*job:\s*/i, '')
      .replace(/\s+/g, ' ')
      .trim();
  },

  extractSalaryFromText(text) {
    if (!text) return '';
    const patterns = [
      /\$[\d,]+(?:\.\d{2})?(?:k)?\s*[-–]\s*\$[\d,]+(?:\.\d{2})?(?:k)?(?:\s*(?:per|\/)\s*(?:year|yr|annum|hour|hr))?/i,
      /(?:USD|CAD|GBP|EUR)\s*[\d,]+\s*[-–]\s*[\d,]+/i,
      /[\d,]+k\s*[-–]\s*[\d,]+k/i,
    ];
    for (const pattern of patterns) {
      const match = text.match(pattern);
      if (match) return match[0];
    }
    return '';
  },

  isJobRelatedPage(text) {
    const keywords = [
      'apply', 'job description', 'responsibilities',
      'requirements', 'qualifications', 'experience',
      'about the role', 'what you', 'who you',
    ];
    const lower = (text || '').toLowerCase();
    return keywords.filter((kw) => lower.includes(kw)).length >= 2;
  },

  normalizeCompany(name) {
    if (!name) return '';
    return name
      .replace(/,?\s*(inc\.?|llc\.?|ltd\.?|corp\.?|co\.?)$/i, '')
      .trim();
  },
};
