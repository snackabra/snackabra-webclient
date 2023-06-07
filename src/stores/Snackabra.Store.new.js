import { makeAutoObservable, configure, toJS } from "mobx";
import IndexedKV from "../utils/IndexedKV";

console.log("=========== mobx-snackabra-store loading ===========")
let SB = require(process.env.NODE_ENV === 'development' ? 'snackabra/dist/snackabra' : 'snackabra')

// console.log("mobx-snackabra-store loading SB Version: ")
// console.log(SB.version)

let cacheDb;
let Crypto = new SB.SBCrypto();

configure({
  useProxies: "always",
  enforceActions: "observed",
  computedRequiresReaction: false,
  reactionRequiresObservable: false,
  observableRequiresReaction: false,
  disableErrorBoundaries: false
});

class SnackabraStore {
  config = {};
  channels = {};
  SB = {};
  ready = new Promise((resolve) => {
    this.readyResolver = resolve
  })

  constructor(sbConfig) {
    if (!sbConfig) {
      throw new Error("SnackabraStore requires a config object")
    }
    this.config = sbConfig
    this.SB = new SB.Snackabra(this.config);

    makeAutoObservable(this)
    // onBecomeUnobserved(this, "rooms", this.suspend);
    this.init()
  }

  suspend = () => {
    // This will be used later to offload the state of the room to a local store
    this.save();
  };

  async getAllChannels() {
    const channels = await cacheDb.getItem('sb_data_channels');
    let channelData = {}
    if (channels) {
      for (let x in channels) {
        const channel = await cacheDb.getItem('sb_data_' + channels[x]._id)
        if (channel) {
          channelData[channel.id] = channel
        }
      }

    }
    return channelData

  }

  init = async () => {
      try {
        cacheDb = new IndexedKV({
          db: 'sb_data',
          table: 'cache'
        });

        const sb_data = JSON.parse(await cacheDb.getItem('sb_data'));
        const migrated = await cacheDb.getItem('sb_data_migrated');
        const channels = await cacheDb.getItem('sb_data_channels');
        if (migrated?.version === 2) {
          if (channels) {
            this.channels = channels
          }
        }
        let channelList = []
        if (sb_data && migrated?.version !== 2) {
          Object.keys(sb_data.rooms).forEach((roomId) => {
            for (let x in sb_data.rooms[roomId]) {
              if (!this.rooms[roomId]) {
                this.rooms[roomId] = {}
              }
              channelList.push({ _id: roomId, name: sb_data.rooms[roomId].name })
              this.rooms[roomId][x] = sb_data.rooms[roomId][x];
            }
            cacheDb.setItem('sb_data_' + roomId, toJS(this.rooms[roomId])).then(() => {
              delete this.rooms[roomId];
            })
          })
        }
        cacheDb.setItem('sb_data_migrated', {
          timestamp: Date.now(),
          version: 2
        }).then(() => {
          this.readyResolver()
        })


      } catch (e) {
        console.error(e);
      }
  };

  save = () => {
    if (this.rooms[this.activeroom]?.id) {
      cacheDb.setItem('sb_data_' + this.activeroom, toJS(this.rooms[this.activeroom])).then(() => {
        const channels = this.channels
        channels[this.activeroom] = { _id: this.rooms[this.activeroom].id, name: this.rooms[this.activeroom].name }
        this.channels = channels;
        cacheDb.setItem('sb_data_channels', this.channels)
      })
    }
  };

  get status() {
    if (this.channel) {
      return toJS(this.socket.status);
    } else {
      return 'CLOSED'
    }
  }


  updateChannelName = ({ name, channelId }) => {
    return new Promise((resolve, reject) => {
      try {
        this.getChannel(channelId).then((data) => {
          this.rooms[channelId] = data
          this.rooms[channelId].name = name
          this.channels[channelId].name = name
          this.save();
          resolve('success')
        })
      } catch (e) {
        reject(e)
      }

    })
  }

  get user() {
    return this.socket ? {
      _id: JSON.stringify(this.socket.exportable_pubKey),
      name: this.socket.userName
    } : {
      _id: '',
      name: ''
    };
  }
  set username(userName) {
    if (this.rooms[this.activeRoom]) {
      this.rooms[this.activeRoom].userName = userName;
      const user_pubKey = this.user._id;
      this.rooms[this.activeRoom].contacts[user_pubKey.x + ' ' + user_pubKey.y] = userName;
      this.userName = userName;
      this.save();
    }
  }
  set contacts(contacts) {
    if (this.rooms[this.activeRoom]) {
      this.rooms[this.activeRoom].contacts = contacts;
      this.save();
    }
  }
  get contacts() {
    if (this.rooms[this.activeRoom]) {
      return this.rooms[this.activeRoom].contacts ? toJS(this.rooms[this.activeRoom].contacts) : {};
    }
    return {};
  }
  get messages() {
    if (this.rooms[this.activeRoom]) {
      return this.rooms[this.activeRoom].messages ? toJS(this.rooms[this.activeRoom].messages) : [];
    }
    return [];
  }

  set messages(messages) {
    if (this.rooms[this.activeRoom]) {
      this.rooms[this.activeRoom].messages = messages;
      this.rooms[this.activeRoom].lastMessageTimeStamp = messages[messages.length - 1] !== undefined ? messages[messages.length - 1].timestampPrefix : 0
      this.rooms[this.activeRoom].lastSeenMessage = messages[messages.length - 1] !== undefined ? messages[messages.length - 1]._id : ""
      this.save();
    }
  }

  // set sharedKey(key) {
  //   this.rooms[this.activeroom].sharedKey = key;
  // }

  // get sharedKey() {
  //   return toJS(this.rooms[this.activeroom].sharedKey);
  // }

  async replyEncryptionKey(recipientPubkey) {
    return Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", JSON.parse(recipientPubkey), "ECDH", true, []), "AES", false, ["encrypt", "decrypt"])
  }

  newMessage = (message) => {
    // SBMessage = message => {
    return new SB.SBMessage(this.socket, message);
  };

  receiveMessage = async (m, messageCallback) => {
    const user_pubKey = m.user._id;
    m.user._id = JSON.stringify(m.user._id);
    if (this.contacts[user_pubKey.x + ' ' + user_pubKey.y] === undefined) {
      const contacts = this.contacts;
      contacts[user_pubKey.x + ' ' + user_pubKey.y] = m.user.name
      this.contacts = contacts
    }
    m.user.name = this.contacts[user_pubKey.x + ' ' + user_pubKey.y]
    m.sender_username = m.user.name;
    m.createdAt = new Date(parseInt(m.timestampPrefix, 2));
    // For whispers
    if (m.whispered === true) {
      m.text = "(whispered)"
      try {
        if (m.whisper && this.socket.owner && !m.reply_to) {
          const shared_key = await Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", m.sender_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
          m.contents = await Crypto.unwrap(shared_key, m.whisper, 'string')
          m.text = m.contents
        }
        if (m.whisper && Crypto.compareKeys(m.sender_pubKey, this.socket.exportable_pubKey) && !m.reply_to) {
          const shared_key = await Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", this.socket.exportable_owner_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
          m.contents = await Crypto.unwrap(shared_key, m.whisper, 'string')
          m.text = m.contents
        }
        if (m.reply_to && this.socket.owner) {
          const shared_key = await Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", m.reply_to, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
          m.contents = await Crypto.unwrap(shared_key, m.whisper, 'string')
          m.text = m.contents
        }
        if (m.reply_to && Crypto.compareKeys(m.reply_to, this.socket.exportable_pubKey)) {
          const shared_key = await Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", this.socket.exportable_owner_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
          m.contents = await Crypto.unwrap(shared_key, m.whisper, 'string')
          m.text = m.contents
        }

      } catch (e) {
        console.warn(e)
      }

    }
    this.rooms[this.activeRoom].lastMessageTime = m.timestampPrefix;
    this.rooms[this.activeRoom].lastSeenMessage = m._id
    this.rooms[this.activeRoom].messages = [...toJS(this.rooms[this.activeRoom].messages), m];
    this.save();
    messageCallback(m);
  };
  mergeMessages = (existing, received) => {
    let merged = [];
    for (let i = 0; i < existing.length + received.length; i++) {
      if (received.find(itmInner => itmInner._id === existing[i]?._id)) {
        merged.push({
          ...existing[i],
          ...received.find(itmInner => itmInner._id === existing[i]?._id)
        });
      } else {
        if (received[i]) {
          const user_pubKey = received[i].user._id;
          if (this.contacts[user_pubKey.x + ' ' + user_pubKey.y] === undefined) {
            const contacts = this.contacts;
            contacts[user_pubKey.x + ' ' + user_pubKey.y] = received[i].user.name
            this.contacts = contacts
          }
          merged.push(received[i]);
        }
      }
    }
    return merged.sort((a, b) => a._id > b._id ? 1 : -1);
  };


  createRoom = secret => {
    return new Promise((resolve, reject) => {
      // create a new channel (room), returns (owner) key and channel name:
      try {
        this.SB.create(this.config, secret).then(handle => {
          console.log(`you can (probably) connect here: localhost:3000/rooms/${handle.channelId}`);
          // connect to the websocket with our handle info:
          this.SB.connect(
            // PSM: UGH should not connect here, that shouldn't be needed
            // must have a message handler:
            m => {
              this.receiveMessage(m, console.log);
            }, handle.key,
            // if we omit then we're connecting anonymously (and not as owner)
            handle.channelId // since we're owner this is optional
          ).then(c => { // removed then(c => c.ready).
            console.warn('connected (through CREATRE)');
            if (c) {
              this.socket = c;
              this.activeroom = handle.channelId;
              this.socket.userName = 'Me';
              try {
                this.roomCapacity = c.getCapacity() // PSM: api call here for actual capacity
              } catch (e) {
                console.warn(e)
              }

              this.rooms[handle.channelId] = {
                name: 'Room ' + Math.floor(Object.keys(this.channels).length + 1),
                id: handle.channelId,
                key: handle.key,
                userName: 'Me',
                // PSM sharedKey: false,
                lastSeenMessage: 0,
                contacts: {},
                messages: []
              };
              this.save();
            }
            resolve(handle.channelId);
            // say hello to everybody! upon success it will return "success"
            // (new SBMessage(c, "Hello from TestBot!")).send().then((c) => { console.log(`test message sent! (${c})`) })
          }).catch(e => {
            reject(e);
          });
        }).catch(e => {
          reject(e);
        });
      } catch (e) {
        reject(e)
      }
    });

  };

  importKeys = roomData => {
    return new Promise((resolve, reject) => {
      let connectPromises = [];
      Object.keys(roomData.roomData).forEach((room) => {
        const options = {
          roomId: room,
          messageCallback: (m) => { console.log(m) },
          key: roomData.roomData[room].key,
          name: roomData.roomMetadata[room].name,
          contacts: roomData.contacts
        }
        this.rooms[room] = {}
        this.rooms[room].id = room
        this.rooms[room].name = roomData.roomMetadata[room].name
        this.rooms[room].lastMessageTime = roomData.roomMetadata[room].lastMessageTime
        this.rooms[room].contacts = roomData.contacts;
        console.log(roomData.contacts)
        connectPromises.push(this.connect(options, true))
      })
      Promise.all(connectPromises).then(() => {

      }).catch((e) => {
        reject(e)
      }).finally(() => {
        this.save()
        resolve()
      })
    })

  };

  importRoom = async roomData => {
    const channelId = roomData.roomId;
    const key = JSON.parse(roomData.ownerKey);
    try {
      this.SB.connect(console.log, key, channelId).then(c => { // removed then(c => c.ready).
        if (c) {
          this.socket = c;
          this.activeroom = channelId;
          try {
            this.roomCapacity = c.getCapacity() // PSM: api call here for actual capacity
          } catch (e) {
            console.warn(e)
          }
          const roomData = this.rooms[channelId] ? this.rooms[channelId] : {
            name: 'Room ' + Math.floor(Object.keys(this.rooms).length + 1),
            id: channelId,
            key: typeof key !== 'undefined' ? key : c.exportable_privateKey,
            userName: 'Me',
            contacts: {},
            lastSeenMessage: 0,
            // sharedKey: 
            messages: []
          };
          this.setRoom(channelId, roomData);
          this.key = typeof key !== 'undefined' ? key : c.exportable_privateKey;
          this.socket.userName = 'Me';
          this.save();
          window.location.reload();
        }
      }).catch(e => {
        console.error(e);
      });
    } catch (e) {
      console.error(e);
    }
  };
  get capacity() {
    // return this.socket ? this.socket.adminData.capacity : 20;
    return this.roomCapacity
  }
  setRoomCapacity = capacity => {
    // this.socket.adminData.capacity = capacity;  // don't assume you're allowed to
    return this.socket.api.updateCapacity(capacity);
  };
  get motd() {
    return this.socket ? this.socket.motd : '';
  }
  set motd(motd) {
    console.log(motd);
  }
  setMOTD = motd => {
    return this.socket.api.setMOTD(motd);
  };

  // This isnt in the the jslib atm
  // PSM: it is now but needs testing
  lockRoom = () => {
    return new Promise((resolve, reject) => {
      try {
        this.socket.api.lock().then((locked) => {
          console.log(locked)
        })
      } catch (e) {
        reject(e)
      }
    })
  };
  getExistingRoom = channelId => {
    throw new Error('getExistingRoom is deprecated')
  };
  setMessages = (channelId, messages) => {
    return this.rooms[channelId].messages = messages;
  };
  getMessages = channelId => {
    if (this.rooms[channelId]) {
      return toJS(this.rooms[channelId].messages);
    } else {
      return [];
    }
  };
  setRoom = (channelId, roomData) => {
    return new Promise((resolve, reject) => {
      try {
        this.rooms[channelId] = roomData;
        this.rooms[channelId].admin = this.socket?.owner;
        this.activeroom = channelId;
        resolve()
      } catch (e) {
        reject(e)
      }
    })

  };
  connect = async ({
    roomId,
    username,
    messageCallback,
    key,
    secret,
    name,
    contacts
  }, overwrite) => {
    console.log("==== Calling 'connect' for ", roomId, " =====")
    console.log("key:"); console.log(key);
    console.log("secret:"); console.log(secret);

    if (!this.SB) {
      console.log("==== Creating new SB instance =====")
      this.SB = new SB.Snackabra(this.config);
    }
    let channel, channelId;
    key = key ? key : channel?.key;
    channelId = roomId ? roomId : channel?.channelId;
    const c = await this.SB.connect(
      // must have a message handler:
      m => { this.receiveMessage(m, messageCallback); },
      // if we omit then we're connecting anonymously (and not as owner):
      key ? key : null,
      channelId // if we are owner then this is optional
    );
    console.log("==== connected to channel:"); console.log(c);
    if (c) {
      this.socket = c;
      console.log("==== connected to channel:")
      console.log(c)
      this.activeroom = channelId;
      const channel = await this.getChannel(channelId);
      try {
        this.roomCapacity = c.getCapacity() // PSM: api call here for actual capacity
      } catch (e) {
        console.warn(e)
      }
      const roomData = channel && !overwrite ? channel : {
        name: overwrite && name ? name : 'Room ' + Math.floor(Object.keys(this.channels).length + 1),
        id: channelId,
        key: typeof key !== 'undefined' ? key : c.exportable_privateKey,
        userName: username !== '' && typeof username !== 'undefined' ? username : '',
        lastSeenMessage: 0,
        // PSM sharedKey: this.socket.owner ? false : await Crypto.deriveKey(this.socket.keys.privateKey, this.socket.keys.ownerKey, "AES", false, ["encrypt", "decrypt"]),
        contacts: contacts ? contacts : {},
        messages: []
      };

      this.setRoom(channelId, roomData).then(async () => {
        this.key = typeof key !== 'undefined' ? key : c.exportable_privateKey;
        this.socket.userName = roomData.userName;
        // PSM this.sharedKey = this.socket.owner ? false : await Crypto.deriveKey(this.socket.keys.privateKey, this.socket.keys.ownerKey, "AES", false, ["encrypt", "decrypt"])
        this.save();
      })
      return c
    } else {
      return false
    }
  };

  getChannel = (channel) => {
    return new Promise((resolve) => {
      cacheDb.getItem('sb_data_' + channel).then((data) => {
        resolve(data)
      })
    })
  }

  downloadRoomData = (roomId, roomKeys) => {
    return new Promise((resolve, reject) => {
      try {
        console.log(roomKeys)
        this.connect({
          roomId: roomId,
          messageCallback: (m) => { console.log(m) },
          key: roomKeys
        }).then(() => {
          this.socket.api.downloadData().then((data) => {
            data.storage.target = window.location.host
            resolve(data)
          })
        }).catch(reject)

      } catch (e) {
        console.log(e)
        reject(e)
      }

    })
  };
}

class ChannelStore {
  id = null;
  name = null;
  messages = [];
  key = null;
  lastSeenMessage = 0;
  admin = false;

  constructor(){
    makeAutoObservable(this)
  }

  getOldMessages = (length) => {
    return new Promise(resolve => {
      this.socket.getOldMessages(length).then(async (r_messages) => {
        console.log("==== got these old messages:")
        console.log(r_messages)
        for (let x in r_messages) {
          let m = r_messages[x]
          // For whispers
          if (m.whispered === true) {
            m.text = "(whispered)"
            try {
              if (m.whisper && this.socket.owner && !m.reply_to) {
                const shared_key = await Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", m.sender_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
                m.contents = await Crypto.unwrap(shared_key, m.whisper, 'string')
                m.text = m.contents
              }
              if (m.whisper && Crypto.compareKeys(m.sender_pubKey, this.socket.exportable_pubKey) && !m.reply_to) {
                const shared_key = await Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", this.socket.exportable_owner_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
                m.contents = await Crypto.unwrap(shared_key, m.whisper, 'string')
                m.text = m.contents
              }
              if (m.reply_to && this.socket.owner) {
                const shared_key = await Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", m.reply_to, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
                m.contents = await Crypto.unwrap(shared_key, m.whisper, 'string')
                m.text = m.contents
              }
              if (m.reply_to && Crypto.compareKeys(m.reply_to, this.socket.exportable_pubKey)) {
                const shared_key = await Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", this.socket.exportable_owner_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
                m.contents = await Crypto.unwrap(shared_key, m.whisper, 'string')
                m.text = m.contents
              }

            } catch (e) {
              console.warn(e)
            }

          }
          r_messages[x] = m
        }
        this.rooms[this.activeRoom].messages = this.mergeMessages(toJS(this.rooms[this.activeRoom].messages), r_messages);
        this.save();
        resolve(r_messages);
      });
    });
  };

}

export default SnackabraStore;