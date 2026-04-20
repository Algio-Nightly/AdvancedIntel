const DB_NAME = 'AdvancedIntelDB';
const DB_VERSION = 1;
const STORE_NAME = 'pdf_blobs';

let dbInstance = null;

// Initialize IndexedDB securely
const initDB = () => {
  return new Promise((resolve, reject) => {
    if (dbInstance) {
      resolve(dbInstance);
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onerror = (event) => {
      console.error("IndexedDB blocked or failed to load.", event);
      reject("Browser storage is blocked.");
    };

    request.onsuccess = (event) => {
      dbInstance = event.target.result;
      resolve(dbInstance);
    };

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

// Save a raw File Blob to the database using the unique Firebase ID
export const saveBlobToLocal = async (id, blob) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.put(blob, id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = (err) => reject(err);
  });
};

// Retrieve a File Blob by ID
export const getBlobFromLocal = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.get(id);
    
    request.onsuccess = (event) => resolve(event.target.result);
    request.onerror = (err) => reject(err);
  });
};

// Delete a local file instance
export const deleteBlobFromLocal = async (id) => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    
    const request = store.delete(id);
    
    request.onsuccess = () => resolve(true);
    request.onerror = (err) => reject(err);
  });
};

// Calculate total storage usage (Size and Count)
export const getStorageStats = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readonly');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();
    const countRequest = store.count();

    request.onsuccess = (event) => {
      const blobs = event.target.result;
      let totalSize = 0;
      blobs.forEach(blob => {
        if (blob instanceof Blob) totalSize += blob.size;
      });
      
      countRequest.onsuccess = () => {
        resolve({
          bytes: totalSize,
          formatted: (totalSize / (1024 * 1024)).toFixed(2) + ' MB',
          count: countRequest.result
        });
      };
    };
    request.onerror = (err) => reject(err);
  });
};

// Wipe all local blobs
export const clearAllBlobs = async () => {
  const db = await initDB();
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([STORE_NAME], 'readwrite');
    const store = transaction.objectStore(STORE_NAME);
    const request = store.clear();
    
    request.onsuccess = () => resolve(true);
    request.onerror = (err) => reject(err);
  });
};
