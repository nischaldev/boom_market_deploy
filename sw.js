// Open (or create) an IndexedDB database
function openDB(dbName, storeName) {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(dbName, 1);

    request.onupgradeneeded = (event) => {
      const db = event.target.result;
      if (!db.objectStoreNames.contains(storeName)) {
        db.createObjectStore(storeName);
      }
    };

    request.onsuccess = (event) => {
      resolve(event.target.result);
    };

    request.onerror = (event) => {
      reject(event.target.error);
    };
  });
}

// Save data to the store
function saveToDB(db, storeName, key, value) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readwrite");
    const store = tx.objectStore(storeName);
    const request = store.put(value, key);

    request.onsuccess = () => resolve(true);
    request.onerror = (e) => reject(e.target.error);
  });
}

// Read data from the store (optional)
function getFromDB(db, storeName, key) {
  return new Promise((resolve, reject) => {
    const tx = db.transaction(storeName, "readonly");
    const store = tx.objectStore(storeName);
    const request = store.get(key);

    request.onsuccess = (e) => resolve(e.target.result);
    request.onerror = (e) => reject(e.target.error);
  });
}

// serviceworker.js
self.addEventListener("fetch", (event) => {
  if (
    event.request.method === "POST" &&
    event.request.url.endsWith("/captures")
  ) {
    event.respondWith(
      (async () => {
        const formData = await event.request.formData();

        const title = formData.get("title");
        const text = formData.get("text");
        const url = formData.get("url");
        const files = formData.getAll("media");

        const sharedData = { title, text, url, files };
        console.log("sharedData -->", sharedData);

        try {
          const db = await openDB("MyPwaDB", "SharedStore");
          await saveToDB(db, "SharedStore", "_bsd", sharedData);
        } catch (err) {
          console.error("❌ Error saving to IndexedDB:", err);
        }

        // Redirect back to confirmation page
        return Response.redirect("/captures", 303);
      })()
    );
  }
});
