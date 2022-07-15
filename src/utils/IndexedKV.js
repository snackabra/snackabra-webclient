Object.defineProperty(window, 'indexedDB', {
  value: window.indexedDB || window.mozIndexedDB || window.webkitIndexedDB || window.msIndexedDB
});

window.IDBTransaction = window.IDBTransaction || window.webkitIDBTransaction || window.msIDBTransaction || { READ_WRITE: "readwrite" }; // This line should only be needed if it is needed to support the object's constants for older browsers
window.IDBKeyRange = window.IDBKeyRange || window.webkitIDBKeyRange || window.msIDBKeyRange;

class IndexedKV {
  indexedDB;
  db;
  options = {
    db: 'MyDB',
    table: 'default'
  }

  constructor(options) {
    const evt = new Event("localKvReady", { "ready": true });
    this.options = Object.assign(this.options, options)

    if (!window.indexedDB) {
      console.log("Your browser doesn't support a stable version of IndexedDB. Such and such feature will not be available.");
    } else {
      this.indexedDB = window.indexedDB;
    }

    const openReq = this.indexedDB.open(this.options.db);

    openReq.onerror = event => {
      console.error(event);
    };

    openReq.onsuccess = event => {
      this.db = event.target.result;
      document.dispatchEvent(evt);
    };

    this.indexedDB.onerror = event => {

      console.error("Database error: " + event.target.errorCode);
    };

    openReq.onupgradeneeded = event => {
      this.db = event.target.result;
      this.db.createObjectStore(this.options.table, { keyPath: "key" });
      this.useDatabase();
      document.dispatchEvent(evt);
    };
  }

  useDatabase = () => {

    this.db.onversionchange = event => {
      this.db.close();
      console.log("A new version of this page is ready. Please reload or close this tab!");
    };

  }

  setItem = (key, value) => {
    return new Promise((resolve, reject)=> {
      const objectStore = this.db.transaction([this.options.table], "readwrite").objectStore(this.options.table);
      const request = objectStore.get(key);
      request.onerror = event => {
        reject(event)
      };
      request.onsuccess = event => {
        const data = event?.target?.result;

        if (data?.value) {
          data.value = value;
          const requestUpdate = objectStore.put(data);
          requestUpdate.onerror = event => {
            reject(event)
          };
          requestUpdate.onsuccess = event => {
            const data = event.target.result;
            resolve(data.value)
          };
        } else {

          const requestAdd = objectStore.add({ key: key, value: value });
          requestAdd.onsuccess = event => {
            resolve(event.target.result)

          };

          requestAdd.onerror = event => {
            reject(event)
          };
        }

      };
    })

  }

  getItem = (key) => {
    return new Promise((resolve, reject)=>{
      const transaction = this.db.transaction([this.options.table]);
      const objectStore = transaction.objectStore(this.options.table);
      const request = objectStore.get(key);

      request.onerror = event => {
        reject(event)
      };

      request.onsuccess = (event) => {
        const data = event?.target?.result;
        if (data?.value) {
          resolve(data.value)
        } else {
          resolve(null)
        }

      };
    })
  }

  removeItem = (key) => {
    return new Promise((resolve, reject)=> {
      const request = this.db.transaction([this.options.table], "readwrite")
        .objectStore(this.options.table)
        .delete(key);
      request.onsuccess = event => {
        resolve()
      };

      request.onerror = event => {
        reject(event)
      };
    });
  }

}

export default IndexedKV;
