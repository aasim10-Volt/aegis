/** Open-redirect guard (CWE-601).
 *
 * Returns a safe SAME-ORIGIN relative path, or `fallback` if `raw` is unsafe.
 * Only paths rooted at a single "/" pass. Rejected: protocol-relative ("//host"),
 * backslash tricks (browsers may treat "\" as "/", so "/\\host" etc.), control
 * characters, and empty/missing values. Anything starting with "/" cannot carry a
 * scheme ("https:", "javascript:"), so the rooted-path check covers those too.
 *
 * Validate the `redirect` query param with this before handing it to router.push
 * so a crafted URL can't bounce a logged-in user off-site.
 */
export function safeRedirect(raw: string | null | undefined, fallback = "/dashboard"): string {
  if (!raw || !raw.startsWith("/")) return fallback; // must be a rooted relative path
  if (raw.startsWith("//")) return fallback; // protocol-relative ("//evil.com")
  if (raw.includes("\\")) return fallback; // backslash bypass ("/\\evil", "\\\\evil")
  for (let i = 0; i < raw.length; i++) {
    if (raw.charCodeAt(i) < 0x20) return fallback; // control characters
  }
  return raw;
}
