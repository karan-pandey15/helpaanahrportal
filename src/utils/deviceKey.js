// ---------------------------------------------------------------------------
// Device key + DPoP proof signing.
//
// On first use we generate a NON-EXTRACTABLE ECDSA P-256 key pair via WebCrypto
// and persist it in IndexedDB. JavaScript can sign with the private key but can
// NEVER read or export it — not via localStorage, not via DevTools, not via an
// injected script. So even though the access/refresh tokens live in localStorage
// (and are copyable), the proof of possession required on every request can only
// be produced on THIS browser. Copy the tokens elsewhere and they're inert.
//
// Each request gets a fresh one-time "DPoP proof" JWT (RFC 9449) signed by this
// key, carrying the method (htm), URL (htu), a timestamp (iat) and a nonce (jti).
// ---------------------------------------------------------------------------

const DB_NAME = "hr_auth";
const STORE = "keys";
const KEY_ID = "device-keypair";

export const isDpopSupported = () =>
  typeof crypto !== "undefined" &&
  !!crypto.subtle &&
  typeof indexedDB !== "undefined";

// Minimal IndexedDB get/put (one object store, one record).
const idb = (mode, run) =>
  new Promise((resolve, reject) => {
    const open = indexedDB.open(DB_NAME, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const db = open.result;
      const tx = db.transaction(STORE, mode);
      const req = run(tx.objectStore(STORE));
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
      tx.oncomplete = () => db.close();
    };
  });

const loadOrCreate = async () => {
  const existing = await idb("readonly", (s) => s.get(KEY_ID));
  if (existing?.privateKey && existing?.publicJwk) return existing;

  const pair = await crypto.subtle.generateKey(
    { name: "ECDSA", namedCurve: "P-256" },
    false, // <- private key is non-extractable
    ["sign", "verify"],
  );
  const jwk = await crypto.subtle.exportKey("jwk", pair.publicKey);
  // Keep only the members the server uses for the thumbprint (RFC 7638).
  const publicJwk = { kty: jwk.kty, crv: jwk.crv, x: jwk.x, y: jwk.y };
  const record = { privateKey: pair.privateKey, publicJwk };
  await idb("readwrite", (s) => s.put(record, KEY_ID));
  return record;
};

// Memoize so concurrent requests on first load share one key-generation.
let recordPromise = null;
const getRecord = () => {
  if (!recordPromise) recordPromise = loadOrCreate();
  return recordPromise;
};

const b64url = (bytes) => {
  const arr = new Uint8Array(bytes);
  let bin = "";
  for (let i = 0; i < arr.length; i++) bin += String.fromCharCode(arr[i]);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const b64urlText = (str) => b64url(new TextEncoder().encode(str));

const randomJti = () => {
  const a = new Uint8Array(16);
  crypto.getRandomValues(a);
  return Array.from(a, (b) => b.toString(16).padStart(2, "0")).join("");
};

// Build a one-time DPoP proof JWT bound to this (method, url).
export const createDpopProof = async (method, url) => {
  const { privateKey, publicJwk } = await getRecord();
  const header = { typ: "dpop+jwt", alg: "ES256", jwk: publicJwk };
  const payload = {
    htm: String(method || "GET").toUpperCase(),
    htu: url,
    iat: Math.floor(Date.now() / 1000),
    jti: randomJti(),
  };
  const signingInput = `${b64urlText(JSON.stringify(header))}.${b64urlText(
    JSON.stringify(payload),
  )}`;
  // WebCrypto ECDSA returns the raw r||s signature (64 bytes for P-256), which
  // is exactly the JOSE ES256 encoding the server verifies (ieee-p1363).
  const sig = await crypto.subtle.sign(
    { name: "ECDSA", hash: "SHA-256" },
    privateKey,
    new TextEncoder().encode(signingInput),
  );
  return `${signingInput}.${b64url(sig)}`;
};

// Drop the device key (e.g. on a hard logout). Best-effort.
export const clearDeviceKey = async () => {
  recordPromise = null;
  try {
    await idb("readwrite", (s) => s.delete(KEY_ID));
  } catch {
    /* ignore */
  }
};
