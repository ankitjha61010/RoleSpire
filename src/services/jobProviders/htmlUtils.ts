/**
 * Strips HTML tags and decodes entities from job descriptions returned by
 * external providers, which typically ship rich-text (and sometimes
 * double-encoded, e.g. "&amp;lt;p&amp;gt;") HTML.
 */
function decodeEntities(text: string): string {
  const textarea = document.createElement('textarea');
  textarea.innerHTML = text;
  return textarea.value;
}

export function cleanHtmlDescription(html: string): string {
  if (!html) return '';
  let decoded = html;
  // Decode repeatedly in case the source double-encoded entities
  for (let i = 0; i < 3; i++) {
    const next = decodeEntities(decoded);
    if (next === decoded) break;
    decoded = next;
  }
  return decoded.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim();
}
