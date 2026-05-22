# Agoobi Post Styling Design Contract

## Purpose

This styling pack is the remote rendering layer for generated SEO articles embedded in WordPress posts. It must feel native to Agoobi, not like a separate publication theme.

The implementation entrypoints are:

- CSS CDN: `https://wwenrr.github.io/post-styling/cvv-seo.css`
- JS CDN: `https://wwenrr.github.io/post-styling/cvv-toc.js`
- Local source: `external/post-styling/cvv-seo.css` and `external/post-styling/cvv-toc.js`

## Visual Direction

Agoobi is an AI agents and automation brand for business operators. The article UI should be clean, structured, and operationally trustworthy.

Use an enterprise editorial style:

- White canvas and pale teal surfaces.
- Deep navy headings.
- Teal accent only for navigational or high-signal emphasis.
- Thin borders instead of heavy decoration.
- Soft depth only where it improves separation.
- No orange/gold Mistral palette.
- No decorative glow/orb-heavy aesthetic.
- No hover lift animations.

## Design Tokens

### Colors

- Primary navy: `#0A2540`
- Primary navy hover: `#123556`
- Ink: `#111827`
- Muted ink: `#4B5563`
- Subtle ink: `#6B7280`
- Canvas: `#FFFFFF`
- Surface 1: `#F4FBFA`
- Surface 2: `#EAF7F5`
- Hairline: `#DDF1EE`
- Accent teal: `#00C2A8`
- Code background: `#F4FBFA`
- Code border: `#DDF1EE`

### Typography

The WordPress site uses Plus Jakarta Sans. Generated Vietnamese SEO content should use a compatible stack:

```css
"Be Vietnam Pro", "Plus Jakarta Sans", "Inter", "SF Pro Text", "Segoe UI", Roboto, "Helvetica Neue", Arial, sans-serif
```

Article type should be readable and stable:

- Article body: `18px`, `line-height: 1.78`
- Paragraph max width: readable editorial measure, about `760px`
- H2: strong navy, `32px-40px`, line-height around `1.22`
- H3: strong navy, `24px-28px`, line-height around `1.32`
- Metadata/TOC text: `13px-15px`
- Do not use negative letter spacing in compact UI.

## Component Rules

### Article Shell

`.cvv-article` is the root generated article container.

- It should not create a competing page frame inside the WordPress post.
- It may define typography and spacing, but avoid large outer backgrounds that fight the theme.
- Internal sections should be separated by whitespace and subtle borders, not colorful blocks.

### Headings

Generated headings use `.cvv-heading`, `.cvv-heading-2`, and `.cvv-heading-3`.

- H2 should read like main operational sections.
- H3 should be compact and scannable.
- Long Vietnamese titles must wrap naturally.
- Avoid forced uppercase on article headings.

### Rich Inline Content

The renderer may emit:

- `<strong>` for bold
- `<em>` for italic
- `<u>` for underline
- `<s>` for strike
- `<code>` for inline code

These marks should remain visually distinct without changing the paragraph rhythm.

### Table of Contents

The JS builds and enhances the article table of contents.

- The TOC should feel like a lightweight navigation rail.
- Use white or pale teal background.
- Use thin border and compact spacing.
- Active/hover states use teal and navy only.
- Nested items need clear indentation.

### Lists

Lists are common in generated SEO content.

- Bullets and numbers may use teal marker color.
- Keep vertical spacing moderate.
- Do not turn every list item into a card.

### Tables

Tables should support comparison content.

- Header row: pale teal background, navy text.
- Cells: thin hairline borders.
- Horizontal scrolling on mobile.
- Avoid dense shadows.

### FAQ

FAQ content is generated near the end of articles.

- FAQ questions should be easy to scan.
- Use a simple bordered list or accordion-like visual.
- Do not hide answers behind JS-only interactions; content must remain readable without JavaScript.

### CTA

CTA buttons/blocks must align with Agoobi:

- Primary background: navy.
- Accent affordance: teal border or text.
- Border radius: `8px` or less unless inherited by the site.
- No warm orange gradients.

## JavaScript Behavior

`cvv-toc.js` should progressively enhance article content:

- Generate TOC anchors deterministically from headings.
- Avoid duplicate stylesheet injection when the CSS is already present.
- Preserve readable content when JS fails.
- Do not rely on WordPress admin context.
- Do not require external JS dependencies.

## Compatibility

The CSS and JS must work when inserted into WordPress post content by the backend renderer:

```html
<link rel="stylesheet" href="https://wwenrr.github.io/post-styling/cvv-seo.css">
<article class="cvv-article" data-cvv-css="https://wwenrr.github.io/post-styling/cvv-seo.css">
  ...
</article>
<script src="https://wwenrr.github.io/post-styling/cvv-toc.js" defer></script>
```

Avoid selectors that depend on a specific WordPress block theme wrapper. The pack may include small compatibility selectors for common WordPress title/featured-image classes, but the generated article classes remain the primary contract.

## Verification Checklist

- CDN CSS URL returns `200`.
- CDN JS URL returns `200`.
- Rendered HTML includes the CDN CSS and JS exactly once.
- A generated post remains readable when JS is disabled.
- H2/H3/paragraph/list/table/FAQ/CTA blocks match Agoobi navy-teal visual language.
- Inline bold, italic, underline, and strike render correctly inside headings, paragraphs, list items, and table cells.
