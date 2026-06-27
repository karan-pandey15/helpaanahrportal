// Decode a base64url JWT segment to UTF-8 text (handles non-ASCII names etc).
const decodeSegment = (seg) => {
  const b64 = seg.replace(/-/g, "+").replace(/_/g, "/");
  const bytes = Uint8Array.from(atob(b64), (c) => c.charCodeAt(0));
  return new TextDecoder().decode(bytes);
};

// Returns the token's expiry as epoch milliseconds, or null if unreadable.
// Used to refresh proactively (just before expiry) instead of waiting for a 401.
export const getTokenExpiryMs = (token) => {
  try {
    const payload = JSON.parse(decodeSegment(token.split(".")[1]));
    return typeof payload.exp === "number" ? payload.exp * 1000 : null;
  } catch {
    return null;
  }
};
