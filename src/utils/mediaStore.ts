/**
 * CinePlay Pro IndexedDB Media Storage Service
 * Persists uploaded user video files across browser restarts, page refreshes (F5), and new tabs.
 */

const DB_NAME = 'CinePlayMediaStoreDB';
const DB_VERSION = 1;
const STORE_NAME = 'video_blobs';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };

    request.onsuccess = (event) => {
      resolve((event.target as IDBOpenDBRequest).result);
    };

    request.onerror = (event) => {
      reject((event.target as IDBOpenDBRequest).error);
    };
  });
}

/**
 * Save an uploaded video File / Blob persistently in IndexedDB.
 */
export async function storeVideoBlob(assetId: string, blob: Blob): Promise<void> {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(STORE_NAME, 'readwrite');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.put(blob, assetId);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  } catch (err) {
    console.error('Failed to store video blob in IndexedDB:', err);
  }
}

/**
 * Retrieve a stored video Blob from IndexedDB and return a fresh, playable Object URL for the current session.
 */
export async function getStoredVideoUrl(assetId: string): Promise<string | null> {
  try {
    const db = await openDB();
    return new Promise((resolve) => {
      const transaction = db.transaction(STORE_NAME, 'readonly');
      const store = transaction.objectStore(STORE_NAME);
      const request = store.get(assetId);

      request.onsuccess = () => {
        const blob = request.result as Blob;
        if (blob) {
          const freshUrl = URL.createObjectURL(blob);
          resolve(freshUrl);
        } else {
          resolve(null);
        }
      };

      request.onerror = () => resolve(null);
    });
  } catch (err) {
    console.error('Failed to retrieve video blob from IndexedDB:', err);
    return null;
  }
}
