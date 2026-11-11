// Where uploaded document files live in the browser: IndexedDB, keyed by the file's SHA-256. localStorage is too small
// for files. If the browser refuses IndexedDB, files are kept in memory until the page closes, and the page says so.

const DB = 'cris-workspace-documents';
const STORE = 'files';

function req(r) {
  return new Promise((resolve, reject) => {
    r.onsuccess = () => resolve(r.result);
    r.onerror = () => reject(r.error);
  });
}

export async function openBlobs() {
  try {
    const open = indexedDB.open(DB, 1);
    open.onupgradeneeded = () => open.result.createObjectStore(STORE);
    const db = await req(open);
    const tx = (mode) => db.transaction(STORE, mode).objectStore(STORE);
    return {
      persistent: true,
      put: (k, bytes) => req(tx('readwrite').put(bytes, k)).then(() => undefined),
      get: async (k) => {
        const v = await req(tx('readonly').get(k));
        return v ? new Uint8Array(v) : null;
      },
      clear: () => req(tx('readwrite').clear()).then(() => undefined),
    };
  } catch {
    const m = new Map();
    return { persistent: false, put: async (k, b) => void m.set(k, new Uint8Array(b)), get: async (k) => (m.has(k) ? new Uint8Array(m.get(k)) : null), clear: async () => m.clear() };
  }
}
