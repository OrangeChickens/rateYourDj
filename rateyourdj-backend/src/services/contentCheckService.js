/**
 * Content moderation service.
 * Checks text against keyword blacklist with whitelist protection.
 * Returns { safe: boolean, matched: string[], category: string }
 */

const { whitelist, blacklist } = require('../config/keywords');

// Normalize text: lowercase, strip separators between characters
function normalize(text) {
  if (!text) return '';
  let s = text.toLowerCase();
  // Remove common separators used to bypass filters: spaces, dots, *, _, -, etc. between chars
  // But keep spaces between normal words for readability
  // Strategy: remove single separator chars between non-space chars
  s = s.replace(/([a-z\u4e00-\u9fff])[\s.*_\-~·•,，。.!！?？]+([a-z\u4e00-\u9fff])/gi, '$1$2');
  return s;
}

// Check content against keyword lists
// Returns { safe, matched, category } where matched is the first triggered keyword
function checkContent(text) {
  if (!text || text.trim().length === 0) {
    return { safe: true, matched: [], category: null };
  }

  const normalized = normalize(text);

  // Mask whitelisted terms to prevent false positives
  let masked = normalized;
  for (const safe of whitelist) {
    const safeLower = safe.toLowerCase();
    // Replace all occurrences with placeholder of same length
    while (masked.includes(safeLower)) {
      masked = masked.replace(safeLower, '□'.repeat(safeLower.length));
    }
  }

  // Check each blacklist category
  const matched = [];
  let category = null;

  for (const [cat, keywords] of Object.entries(blacklist)) {
    for (const keyword of keywords) {
      const kw = keyword.toLowerCase();
      if (masked.includes(kw)) {
        matched.push(keyword);
        if (!category) category = cat;
        break; // One match per category is enough
      }
    }
    if (matched.length > 0 && category) break; // Stop at first category hit
  }

  return {
    safe: matched.length === 0,
    matched,
    category
  };
}

module.exports = { checkContent, normalize };
