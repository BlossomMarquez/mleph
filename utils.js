export const SANITIZE_OPTS = {
  ALLOWED_TAGS: ["b", "i", "em", "strong", "u", "br"],
  ALLOWED_ATTR: ["target"],
};

export function sanitize(str) {
  return typeof DOMPurify !== "undefined"
    ? DOMPurify.sanitize(String(str || ""), SANITIZE_OPTS)
    : String(str || "");
}

export function truncate(text, max = 50) {
  const s = String(text || "");
  return s.length > max ? s.slice(0, max) + "..." : s;
}

export function escapeAttr(str) {
  return String(str || "").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}
