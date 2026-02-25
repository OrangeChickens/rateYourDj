# Design Style Guide

RateYourDJ follows a **Brutalism-inspired design aesthetic** modeled after [NTS Radio](https://www.nts.live), emphasizing functionality, clarity, and bold typography.

## Core Principles

1. **Functionality Over Decoration** - Every design element serves a purpose
2. **Bold Typography** - Heavy font weights and uppercase text for hierarchy
3. **Strict Grid System** - Consistent spacing using multiples of 16rpx (32, 48, 64)
4. **Maximum Contrast** - Black on white, no gradients or subtle colors
5. **Zero Decoration** - No rounded corners, no shadows, no ornamental elements

## Design Rules

### Colors

**MANDATORY COLOR PALETTE:**
```css
/* Primary colors - ONLY use these */
#000000  /* Pure black - borders, text, buttons */
#FFFFFF  /* Pure white - backgrounds, inverted text */
#666666  /* Dark gray - secondary text */
#CCCCCC  /* Light gray - disabled states, empty stars */
#E0E0E0  /* Very light gray - subtle borders only */

/* NEVER USE: */
/* #FFD700 (gold/yellow) - removed */
/* #52C41A (green) - removed */
/* #FF4D4F (red) - removed */
/* Any gradients, shadows, or semi-transparent colors */
```

### Typography

```css
/* All text should be bold and uppercase for emphasis */
.text-primary {
  color: #000000;
  font-weight: 700;  /* Always 600-700, never below 500 */
  text-transform: uppercase;  /* All titles and labels */
  letter-spacing: 0.5rpx;  /* Increase readability */
}

/* Font sizes - larger than typical apps */
.title-large {
  font-size: 48rpx;  /* Major headings */
  font-weight: 700;
  letter-spacing: 0.5rpx;
}

.title-medium {
  font-size: 32rpx;  /* Section headers */
  font-weight: 700;
  letter-spacing: 0.5rpx;
}

.text-body {
  font-size: 26rpx;  /* Body text */
  font-weight: 500;
}

.text-small {
  font-size: 20-22rpx;  /* Captions, labels */
  font-weight: 600;
}
```

### Spacing

```css
/* Use multiples of 16rpx for ALL spacing */
/* Small spacing: 16rpx, 24rpx */
/* Medium spacing: 32rpx, 48rpx */
/* Large spacing: 64rpx, 80rpx */

.container {
  padding: 48rpx 32rpx;  /* Standard page padding */
}

.card {
  padding: 48rpx;  /* Card internal padding */
  margin-bottom: 32rpx;  /* Card separation */
  gap: 32rpx;  /* Elements inside card */
}

.section-header {
  margin-bottom: 48rpx;  /* After headers */
  padding-bottom: 24rpx;  /* Before border */
}
```

### Borders & Corners

```css
/* ALWAYS use sharp corners and bold borders */
.card,
.button,
.input,
.tag {
  border-radius: 0;  /* NEVER use rounded corners */
  border: 2rpx solid #000;  /* Standard border */
}

.section-divider {
  border-bottom: 3rpx solid #000;  /* Emphasis borders */
}

.subtle-border {
  border-bottom: 2rpx solid #E0E0E0;  /* Only for internal divisions */
}
```

### Buttons

```css
/* Primary button - black background */
.btn-primary {
  padding: 32rpx;
  background-color: #000;
  color: #FFF;
  font-size: 28rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

/* Secondary button - white background */
.btn-secondary {
  padding: 32rpx;
  background-color: #FFF;
  color: #000;
  font-size: 28rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

/* Disabled button */
.btn-disabled {
  background-color: #E0E0E0;
  color: #666;
  border-color: #E0E0E0;
}
```

### Tags

```css
.tag {
  padding: 12rpx 24rpx;
  background-color: #FFF;
  color: #000;
  font-size: 20rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.tag.selected {
  background-color: #000;
  color: #FFF;
}
```

### Cards

```css
.dj-card,
.review-card {
  background-color: #FFF;
  border: 2rpx solid #000;
  border-radius: 0;
  padding: 48rpx;
  gap: 32rpx;
}

/* NO shadows, NO gradients, NO rounded corners */
```

### Images

```css
.avatar,
.dj-photo {
  border-radius: 0;  /* Square, not circular */
  border: 2rpx solid #000;
  background-color: #F0F0F0;
}
```

### Icons & Emoji

**CRITICAL RULE: NO EMOJI (except thumbs-up for "like" actions and stars for ratings)**

```css
/* Replace emoji with uppercase text labels */
/* BAD: search emoji  -> GOOD: "SEARCH" */
/* BAD: pin emoji     -> GOOD: Remove or use "CITY" */
/* BAD: music emoji   -> GOOD: "HOME" */
/* BAD: heart emoji   -> GOOD: "FAV" */
/* BAD: warning emoji -> GOOD: "!" */

/* Allowed symbols only: */
/* Stars (rating stars) */
/* Thumbs-up (like action) */
/* Chevron, triangle (UI indicators) */
/* X (close/clear) */
```

### Rating Display

```css
/* Ratings should be large, bold, and black */
.rating-number {
  font-size: 64rpx;
  font-weight: 700;
  color: #000;  /* NO colored backgrounds */
  letter-spacing: -1rpx;
}

.rating-stars .star {
  color: #000;  /* Black, not gold */
}

.rating-stars .star.empty {
  color: #CCCCCC;
}
```

## WXSS Implementation Template

```css
/* Complete page example following all rules */
.container {
  min-height: 100vh;
  background-color: #FFFFFF;
  padding: 48rpx 32rpx;
}

.page-header {
  padding: 64rpx 48rpx;
  border-bottom: 3rpx solid #000;
}

.page-title {
  font-size: 48rpx;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
  margin-bottom: 24rpx;
}

.section {
  margin-bottom: 64rpx;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 48rpx;
  padding-bottom: 24rpx;
  border-bottom: 3rpx solid #000;
}

.section-title {
  font-size: 32rpx;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.card-list {
  display: flex;
  flex-direction: column;
  gap: 32rpx;
}

.card {
  background: #FFF;
  border: 2rpx solid #000;
  border-radius: 0;
  padding: 48rpx;
}

.card-title {
  font-size: 36rpx;
  font-weight: 700;
  color: #000;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
  margin-bottom: 24rpx;
}

.card-content {
  display: flex;
  flex-direction: column;
  gap: 24rpx;
}

.label {
  font-size: 22rpx;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.value {
  font-size: 26rpx;
  font-weight: 500;
  color: #000;
}

.button {
  padding: 32rpx;
  background-color: #000;
  color: #FFF;
  font-size: 28rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-align: center;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.tag-list {
  display: flex;
  flex-wrap: wrap;
  gap: 16rpx;
}

.tag {
  padding: 12rpx 24rpx;
  background-color: #FFF;
  color: #000;
  font-size: 20rpx;
  font-weight: 700;
  border: 2rpx solid #000;
  border-radius: 0;
  text-transform: uppercase;
  letter-spacing: 0.5rpx;
}

.tag.active {
  background-color: #000;
  color: #FFF;
}

/* Loading and empty states */
.loading,
.empty-state {
  text-align: center;
  padding: 160rpx 0;
}

.loading-text,
.empty-text {
  font-size: 26rpx;
  font-weight: 700;
  color: #666;
  text-transform: uppercase;
  letter-spacing: 1rpx;
}
```

## Before & After Examples

### OLD STYLE (Do NOT use)
```css
.button {
  background-color: #FFD700;  /* Gold color */
  color: #000;
  border-radius: 12rpx;  /* Rounded corners */
  font-size: 28rpx;
  font-weight: 600;
  padding: 24rpx;
  box-shadow: 0 2rpx 8rpx rgba(0,0,0,0.1);  /* Shadow */
}

.card {
  border-radius: 16rpx;  /* Rounded */
  padding: 30rpx;  /* Non-standard spacing */
}

.icon {
  content: 'search-emoji';  /* Emoji */
}
```

### NEW STYLE (Correct)
```css
.button {
  background-color: #000;  /* Pure black */
  color: #FFF;
  border: 2rpx solid #000;
  border-radius: 0;  /* Sharp corners */
  font-size: 28rpx;
  font-weight: 700;  /* Bolder */
  padding: 32rpx;  /* Multiple of 16 */
  text-transform: uppercase;
  letter-spacing: 1rpx;
}

.card {
  border: 2rpx solid #000;
  border-radius: 0;
  padding: 48rpx;  /* Multiple of 16 */
}

.icon {
  content: 'SEARCH';  /* Text label */
  font-size: 20rpx;
  font-weight: 700;
  text-transform: uppercase;
}
```

## Common Mistakes to Avoid

1. Using `border-radius: 12rpx` -> Always use `border-radius: 0`
2. Using colored ratings (green/yellow/red) -> Use black only
3. Using emoji icons -> Use text labels "SEARCH" "CITY"
4. Using font-weight: 400-500 -> Use 600-700 minimum
5. Using padding: 20rpx -> Use multiples of 16 (32rpx, 48rpx)
6. Using box-shadow -> Use solid borders only
7. Lowercase labels -> Use uppercase with letter-spacing
8. #FFD700 gold color -> Use #000 black

## Design Philosophy

> "Design should be like a DJ set - stripped down to essentials, with maximum impact through rhythm and contrast, not decoration."

This aesthetic prioritizes:
- **Legibility** over prettiness
- **Boldness** over subtlety
- **Function** over form
- **Contrast** over harmony
- **Directness** over decoration
