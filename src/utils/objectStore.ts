const DB_NAME = "recordings";

export function getObjectStore() {
    return new Promise<IDBObjectStore>((resolve, reject) => {
        const request = window.indexedDB.open(DB_NAME);

        request.onupgradeneeded = (event: any) => {
            const db = event.target.result;
            if (!db.objectStoreNames.contains(DB_NAME)) {
                db.createObjectStore(DB_NAME);
            }
        }

        request.onsuccess = () => {
            const db = request.result;
            const transaction = db.transaction([DB_NAME], "readwrite");
            resolve(transaction.objectStore(DB_NAME));
        }

        request.onerror = (e) => {
            reject(e);
        }
    })
}