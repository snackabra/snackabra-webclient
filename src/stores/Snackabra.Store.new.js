import { makeObservable, onBecomeUnobserved, configure, toJS, observable, computed, action } from "mobx";
import IndexedKV from "../utils/IndexedKV";


console.log("=========== mobx-snackabra-store loading ===========")
let SB = require(process.env.NODE_ENV === 'development' ? 'snackabra/dist/snackabra' : 'snackabra')

let cacheDb;
let Crypto = new SB.SBCrypto();


const save = Symbol("save");
const mergeMessages = Symbol("mergeMessages");
const receiveMessage = Symbol("receiveMessage");
const getChannel = Symbol("getChannel");
const migrate = Symbol("migrate");

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

    this[save] = async () => {
      try {
        console.log(toJS(this.channels))
        let channels = {}
        for (let x in this.channels) {
          channels[x] = { _id: this.channels[x]._id }
        }
        cacheDb.setItem('sb_data_channels', channels)
      } catch (e) {
        console.warn('There was an issue saving the snackabra state.', e.message)
      }

    }

    this[migrate] = async (v) => {
      const sb_data = JSON.parse(await cacheDb.getItem('sb_data'));
      const channels = await cacheDb.getItem('sb_data_channels');

      switch (v) {
        case 1:
          Object.keys(sb_data.rooms).forEach((roomId) => {
            for (let x in sb_data.rooms[roomId]) {
              this.rooms[roomId][x] = sb_data.rooms[roomId][x];
            }
            cacheDb.setItem('sb_data_' + roomId, toJS(this.rooms[roomId])).then(() => {
              delete this.rooms[roomId];
            })
          })
          this[migrate](2)
          return;
        case 2:
          if (channels) {
            this.channels = channels
          }
          this[migrate](3)
          return;
        case 3:
          let contacts = {};
          for (let x in channels) {
            if (channels[x]) {
              const channel = await cacheDb.getItem('sb_data_' + channels[x]._id)
              if (channel) {
                contacts = Object.assign(contacts, channel.contacts)
              }
            }
          }
          this.channels = channels
          this.contacts = contacts;
          break;
        default:
          throw new Error(`Unknown snackabra store migration version ${v}`)
      }

      cacheDb.setItem('sb_data_migrated', {
        timestamp: Date.now(),
        version: v
      }).then(() => {
        this.readyResolver()
      })
    }

    makeObservable(this, {
      contacts: computed,
      channels: observable,
      getAllChannels: action,
    });

    onBecomeUnobserved(this, "channels", this[save]);
    cacheDb = new IndexedKV({
      db: 'sb_data',
      table: 'cache'
    });
    cacheDb.getItem('sb_data_migrated').then((migrated) => {
      this[migrate](migrated?.version || 1)
    })
  }

  getChannelCache = async (channelId) => {
    return await cacheDb.getItem('sb_data_' + channelId)
  }

  getAllChannels() {
    return toJS(this.channels)
  }

  set contacts(contacts) {
    cacheDb.setItem('sb_data_contacts', contacts)
  }
  get contacts() {
    return cacheDb.getItem('sb_data_contacts')
  }

  connect = async (channelId, messageCallback, key = null) => {
    try {
      const channel = new ChannelStore(this.SB, this.config);
      await channel.connect(channelId, messageCallback, key);
      console.log(channel)
      this.channels[channel._id] = channel;
      this[save]();
      return true;
    } catch (e) {
      console.error(e)
      return false;
    }
  }

  create = async (secret) => {
    try {
      const channel = new ChannelStore(this.SB, this.config);
      await channel.create(secret);
      this.channels[channel._id] = channel;
      this[save]();
      return true;
    } catch (e) {
      console.error(e)
      return false;
    }
  }

  importKeys = (roomData) => {
    return new Promise((resolve, reject) => {
      let connectPromises = [];
      Object.keys(roomData.roomData).forEach((channelId) => {
        connectPromises.push(this.connect(
          channelId,
          (m) => { console.log(m) },
          roomData.roomData[channelId].key
        ))
        this.contacts = Object.assign(this.contacts, roomData.roomData[channelId].contacts)
      })
      Promise.all(connectPromises).then(() => {
        console.log('done importing keys')
      }).catch((e) => {
        reject(e)
      }).finally(() => {
        this[save]()
        resolve()
      })
    })

  };

  importChannel = async (roomData) => {
    try {
      const channelId = roomData.roomId;
      const key = JSON.parse(roomData.ownerKey);
      await this.connect(channelId, (m) => { console.log(m) }, key);
      this[save]();
    } catch (e) {
      console.error(e);
    }
  };
}

class ChannelStore {
  _id = null;
  messages = [];
  key = null;
  lastSeenMessage = 0;
  socket = null;
  SB;
  config;

  constructor(SB, config) {
    this.SB = SB;
    this.config = config;


    this[save] = async () => {
      try {
        if (this._id !== null) {
          const save = {
            _id: this._id,
            messages: toJS(this.messages),
            key: toJS(this.key),
            lastSeenMessage: toJS(this.lastSeenMessage)
          }
          console.warn('saving channel state', save)
          await cacheDb.setItem('sb_data_' + this._id, save)
        }
      } catch (e) {
        console.warn('There was an issue saving the channel state.', e.message)
      }

    }

    this[mergeMessages] = (existing, received) => {
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

    this[receiveMessage] = async (m, messageCallback) => {
      m.createdAt = new Date(parseInt(m.timestampPrefix, 2));
      this.lastMessageTime = m.timestampPrefix;
      this.lastSeenMessage = m._id
      this.messages = this[mergeMessages](toJS(this.messages), [m]);
      if (typeof messageCallback === 'function') {
        messageCallback(m);
      }
    };

    this[getChannel] = (channel) => {
      return new Promise((resolve) => {
        cacheDb.getItem('sb_data_' + channel).then((data) => {
          resolve(data)
        })
      })
    }

    makeObservable(this, {
      messages: observable,
      capacity: computed,
      lastSeenMessage: observable,
      key: observable,
      motd: computed,
      status: computed,
      getMessages: action,
    });

    onBecomeUnobserved(this, "messages", this[save]);

  }

  getOldMessages = (length) => {
    return new Promise(resolve => {
      this.socket.getOldMessages(length).then(async (r_messages) => {
        console.log("==== got these old messages:")
        console.log(r_messages)
        for (let x in r_messages) {
          let m = r_messages[x]
          this[receiveMessage](m, null)
        }
        this[save]();
        resolve(r_messages);
      });
    });
  };

  replyEncryptionKey = async (recipientPubkey) => {
    return Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", JSON.parse(recipientPubkey), "ECDH", true, []), "AES", false, ["encrypt", "decrypt"])
  }

  newMessage = (message) => {
    return new SB.SBMessage(this.socket, message);
  };

  get capacity() {
    return this.socket.api.getCapacity();
  }
  set capacity(capacity) {
    this.socket.api.updateCapacity(capacity);
  };
  get motd() {
    return this.socket.motd;
  }
  set motd(motd) {
    this.socket.api.setMOTD(motd);
  }

  get status() {
    if (this.socket) {
      return toJS(this.socket.status);
    } else {
      return 'CLOSED'
    }
  }

  // This isnt in the the jslib atm
  // PSM: it is now but needs testing
  lock = () => {
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

  downloadData = async () => {
    try {
      let data = await this.socket.api.downloadData()
      data.storage.target = window.location.host
      return true
    } catch (e) {
      console.error(e)
      return false
    }
  };

  // MTG: this will be changed inthe future to work with budding
  create = async (secret) => {
    try {
      const c = this.SB.create(this.config, secret);
      this._id = c.channelId
      this.key = c.exportable_privateKey
      return true;
    } catch (e) {
      console.error(e)
      return false;
    }

  };

  connect = (
    channelId,
    messageCallback,
    key,
  ) => {
    return new Promise(async (resolve, reject) => {
      try {
        const c = await this.SB.connect(
          m => { this.receiveMessage(m, messageCallback); },
          key ? key : null,
          channelId
        );
        console.log("==== connected to channel:"); console.log(c);
        if (c) {
          console.log("==== connected to channel:")
          console.log(c)
          const channel = await this[getChannel](channelId);
          if (channel) {
            this.messages = channel.messages;
          }
          this._id = channelId
          this.key = typeof key !== 'undefined' ? key : c.exportable_privateKey
          this.socket = c;
          this[save]();
          resolve(true);
        } else {
          resolve(false)
        }
      } catch (e) {
        reject(e)
      }

    })
  };

  getMessages = () => {
    return toJS(this.messages);
  }

  getChannelForCache = () => {
    return {
      _id: this._id,
      messages: toJS(this.messages),
      key: toJS(this.key),
      lastSeenMessage: toJS(this.lastSeenMessage)
    }
  }

}

export default SnackabraStore;