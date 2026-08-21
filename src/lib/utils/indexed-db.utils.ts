import { IndexedDBStore } from "@/lib/interfaces";

export function openIndexedDB(
  name: string,
  version: number,
  stores: IndexedDBStore[]
): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(name, version);

    request.onupgradeneeded = () => {
      const db = request.result;

      stores.forEach((store) => {
        if (!db.objectStoreNames.contains(store.name)) {
          db.createObjectStore(store.name, {
            keyPath: store.keyPath,
          });
        }
      });
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export function setIndexedDBValue<T>(
  db: IDBDatabase,
  storeName: string,
  value: T
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    store.put(value);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.onabort = () => {
      reject(transaction.error);
    };
  });
}

export function getIndexedDBValue<T>(
  db: IDBDatabase,
  storeName: string,
  key: IDBValidKey
): Promise<T | undefined> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const store = transaction.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = () => {
      resolve(request.result as T | undefined);
    };

    request.onerror = () => {
      reject(request.error);
    };
  });
}

export function deleteIndexedDBValue(
  db: IDBDatabase,
  storeName: string,
  key: IDBValidKey
): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const store = transaction.objectStore(storeName);

    store.delete(key);

    transaction.oncomplete = () => {
      resolve();
    };

    transaction.onerror = () => {
      reject(transaction.error);
    };

    transaction.onabort = () => {
      reject(transaction.error);
    };
  });
}