class IndexedKV {
  indexedDB;
  db;
  ready = new Promise((resolve) => {
    this.readyResolver = resolve
  })
  options = {
    db: 'MyDB',
    table: 'default',
    onReady: null
  }

  constructor(options) {
    this.options = Object.assign(this.options, options)
    if (!window.indexedDB) {
      console.log("Your browser doesn't support a stable version of IndexedDB.");
    } else {
      this.indexedDB = window.indexedDB;
    }

    const openReq = this.indexedDB.open(this.options.db);


    openReq.onerror = event => {
      console.error("Database error: " + event);
      console.error(event);
    };

    openReq.onsuccess = event => {
      this.db = event.target.result;
      this.readyResolver()
    };

    this.indexedDB.onerror = event => {

      console.error("Database error: " + event.target.errorCode);
    };

    openReq.onupgradeneeded = event => {
      this.db = event.target.result;
      this.db.createObjectStore(this.options.table, { keyPath: "key" });
      this.useDatabase();
    };
  }

  openCursor = (regex, callback) => {
    return new Promise((resolve, reject) => {
      this.ready.then(() => {
        const transaction = this.db.transaction([this.options.table], "readonly");
        const objectStore = transaction.objectStore(this.options.table);
        const request = objectStore.openCursor(null, 'next');
        let returnArray = [];
        request.onsuccess = function (event) {
          const cursor = event.target.result;

          if (cursor) {

            if (cursor.key.match(regex)) {
              returnArray.push({ value: cursor.value.value, key: cursor.value.key })
            }
            cursor.continue();
          } else {
            if (callback) {
              callback(returnArray)
            }
            resolve(returnArray);
          }
        };
        // request.onerror = function (event) {
        //   reject(event)
        // };
      });
    })
  }

  useDatabase = () => {
    const newReq = this.indexedDB.open(this.options.db);
    newReq.onsuccess = event => {
      console.log(event.target.result)
      console.log(this.ready)
      this.db = event.target.result;
      this.readyResolver()
      console.log(this.ready)
    };
    newReq.onerror = event => {
      console.error(event);
    };

    this.indexedDB.onerror = event => {

      console.error("Database error: " + event.target.errorCode);
    };

    newReq.onupgradeneeded = event => {
      this.db = event.target.result;
      console.error('cyclic')
    };
  }

  // Set item will insert or replace
  setItem = (key, value) => {
    return new Promise((resolve, reject) => {
      this.ready.then(() => {
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
              console.error(event)
              reject(event)
            };
          }

        };
      });
    })

  }

  //Add item but not replace
  add = (key, value) => {
    return new Promise((resolve, reject) => {
      this.ready.then(() => {
        const objectStore = this.db.transaction([this.options.table], "readwrite").objectStore(this.options.table);
        const request = objectStore.get(key);
        request.onerror = event => {
          reject(event)
        };
        request.onsuccess = event => {
          const data = event?.target?.result;

          if (data?.value) {
            resolve(data.value)
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
      });
    })
  }

  getItem = (key) => {
    return new Promise((resolve, reject) => {
      this.ready.then(() => {
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
      });
    })
  }

  getAll = () => {
    return new Promise((resolve, reject) => {
      this.ready.then(() => {
        const transaction = this.db.transaction([this.options.table]);
        const objectStore = transaction.objectStore(this.options.table);
        const request = objectStore.getAll();

        request.onerror = event => {
          reject(event)
        };

        request.onsuccess = (event) => {
          const data = event?.target?.result;
          if (data) {
            resolve(data)
          } else {
            resolve(null)
          }

        };
      });
    })
  }

  removeItem = (key) => {
    return new Promise((resolve, reject) => {
      this.ready.then(() => {
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
    });
  }

}

export default IndexedKV;
