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

/**
 * Review quality check (silent — low quality → pending, not rejected).
 * Rules:
 *  - Chinese: min 10 chars, min 7 unique chars
 *  - English: min 20 chars, min 7 unique words
 *  - Emoji/symbol ratio max 50%
 * Returns { quality: 'ok' | 'low', reason: string }
 */
function checkQuality(text) {
  if (!text || text.trim().length === 0) {
    return { quality: 'low', reason: 'empty' };
  }

  const trimmed = text.trim();

  // Count emoji/symbol ratio (using non-whitespace chars as denominator)
  const emojiRegex = /[\u{1F600}-\u{1F64F}\u{1F300}-\u{1F5FF}\u{1F680}-\u{1F6FF}\u{1F1E0}-\u{1F1FF}\u{2600}-\u{26FF}\u{2700}-\u{27BF}\u{FE00}-\u{FE0F}\u{1F900}-\u{1F9FF}\u{1FA00}-\u{1FA6F}\u{1FA70}-\u{1FAFF}\u{200D}\u{20E3}\u{E0020}-\u{E007F}]/gu;
  const symbolRegex = /[^\w\s\u4e00-\u9fff\u3400-\u4dbf\uF900-\uFAFF]/g;
  const emojiCount = (trimmed.match(emojiRegex) || []).length;
  const rawSymbolCount = (trimmed.match(symbolRegex) || []).length;
  const symbolCount = Math.max(0, rawSymbolCount - emojiCount); // avoid double-counting emoji
  const allChars = [...trimmed];
  const totalChars = allChars.filter(c => /\S/.test(c)).length; // exclude whitespace

  if (totalChars > 0 && (emojiCount + symbolCount) / totalChars > 0.5) {
    return { quality: 'low', reason: 'too_many_emoji' };
  }

  // Detect language: if >30% Chinese characters → Chinese, else English
  const chineseChars = trimmed.match(/[\u4e00-\u9fff\u3400-\u4dbf]/g) || [];
  const isChinese = chineseChars.length / totalChars > 0.3;

  if (isChinese) {
    // Chinese rules: min 10 chars, min 7 unique chars
    if (totalChars < 10) {
      return { quality: 'low', reason: 'too_short_zh' };
    }
    const uniqueChars = new Set(allChars.filter(c => /[\u4e00-\u9fff\u3400-\u4dbf\w]/.test(c)));
    if (uniqueChars.size < 7) {
      return { quality: 'low', reason: 'not_enough_unique_zh' };
    }
  } else {
    // English rules: min 20 chars, min 7 unique words
    if (totalChars < 20) {
      return { quality: 'low', reason: 'too_short_en' };
    }
    const words = trimmed.toLowerCase().split(/\s+/).filter(w => w.length > 0);
    const uniqueWords = new Set(words);
    if (uniqueWords.size < 7) {
      return { quality: 'low', reason: 'not_enough_unique_en' };
    }
  }

  return { quality: 'ok', reason: null };
}

module.exports = { checkContent, normalize, checkQuality };
