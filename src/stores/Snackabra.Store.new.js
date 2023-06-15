import { makeAutoObservable, onBecomeUnobserved, configure, toJS, observable, computed, action, autorun } from "mobx";
import IndexedKV from "../utils/IndexedKV";

var __decorate = (this && this.__decorate) || function (decorators, target, key, desc) {
  var c = arguments.length, r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc, d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);
  else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};
const Ready = (...args) => {
  let target = args[0];
  let descriptor = args[2];
  const originalMethod = descriptor;
  if (!descriptor?.get && !descriptor?.set) {
    descriptor.value = async function () {
      const obj = target.constructor.name;
      const prop = `${obj}ReadyFlag`;
      if (prop in this) {
        await this[prop];
      }
      return originalMethod.value.apply(this, arguments);
    };
  } else {
    descriptor.get = async function () {
      const obj = target.constructor.name;
      const prop = `${obj}ReadyFlag`;
      if (prop in this) {
        await this[prop];
      }
      return originalMethod.get.apply(this, arguments);
    };
    descriptor.set = async function () {
      const obj = target.constructor.name;
      const prop = `${obj}ReadyFlag`;
      if (prop in this) {
        await this[prop];
      }
      return originalMethod.set.apply(this, arguments);
    };
  }

};


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
  readyResolver;
  SnackabraStoreReadyFlag = new Promise((resolve) => {
    this.readyResolver = resolve;
  });
  config = {};
  channelList = {};
  _contacts = {};
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
          if (sb_data) {
            Object.keys(sb_data.rooms).forEach((roomId) => {
              for (let x in sb_data.rooms[roomId]) {
                this.channels[roomId][x] = sb_data.rooms[roomId][x];
              }
              cacheDb.setItem('sb_data_' + roomId, toJS(this.rooms[roomId])).then(() => {
                delete this.channels[roomId];
              })
            })
          }
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
                this.channels[x] = new ChannelStore(this.SB, this.config, channels[x]._id)
                let alias = channels[x].name || channels[x].alias
                this.channels[x].alias = alias
              }
            }
          }
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

    makeAutoObservable(this);

    onBecomeUnobserved(this, "channels", this[save]);
    cacheDb = new IndexedKV({
      db: 'sb_data',
      table: 'cache'
    });
    cacheDb.getItem('sb_data_migrated').then((migrated) => {
      this[migrate](migrated?.version || 1)
    })
    autorun(() => {
      if (Object.keys(this._contacts).length > 0) {
        cacheDb.setItem('sb_data_contacts', toJS(this._contacts))
      }
    })
  }

  getContact = (key) => {
    return this._contacts[key.x + ' ' + key.y]
  }

  createContact = (key, alias) => {
    this._contacts[key.x + ' ' + key.y] = alias
    this[save]()
  }


  getAllChannels() {
    return toJS(this.channels)
  }
  get channels() {
    return this.channelList
  }

  set channels(channels) {
    this.channelList = channels
  }

  set contacts(contacts) {
    this._contacts = Object.assign(this._contacts, contacts)
  }
  get contacts() {
    return this._contacts
  }

  create = async (secret) => {
    try {
      const channel = new ChannelStore(this.SB, this.config);
      await channel.create(secret);
      this.channels[channel._id] = channel;
      this[save]();
      return this.channels[channel._id];
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
  readyResolver;
  ChannelStoreReadyFlag = new Promise((resolve) => {
    this.readyResolver = resolve;
  });
  _alias = null;
  _status = 'CLOSED'
  messages = [];
  _key = null;
  lastSeenMessage = 0;
  socket = null;
  SB;
  config;

  constructor(SB, config, channelId = null) {
    this.SB = SB;
    this.config = config;

    this[save] = async () => {
      try {
        if (this._id !== null) {
          const save = {
            _id: this._id,
            alias: toJS(this._alias),
            messages: toJS(this.messages),
            key: toJS(this.key),
            lastSeenMessage: toJS(this.lastSeenMessage)
          }
          await cacheDb.setItem('sb_data_' + this._id, save)
        }
      } catch (e) {
        console.warn('There was an issue saving the channel state.', e.message)
      }

    }

    this[mergeMessages] = async (existing, received) => {
      let merged = [];
      for (let i = 0; i < existing.length + received.length; i++) {
        if (received.find(itmInner => itmInner._id === existing[i]?._id)) {
          merged.push({
            ...existing[i],
            ...received.find(itmInner => itmInner._id === existing[i]?._id)
          });
        } else {
          if (received[i]) {
            const contacts = await this.getContacts(received[i].user._id)
            const user_pubKey = received[i].user._id;
            if (contacts[user_pubKey.x + ' ' + user_pubKey.y] === undefined) {
              contacts[user_pubKey.x + ' ' + user_pubKey.y] = received[i].user.name
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
      this.messages = await this[mergeMessages](toJS(this.messages), [m]);
      if (typeof messageCallback === 'function') {
        messageCallback(m);
      }
    };

    this[getChannel] = (channel) => {
      return new Promise((resolve) => {
        cacheDb.getItem('sb_data_' + channel).then(async (data) => {
          this._id = data._id;
          this.alias = data.alias;
          this.messages = await this[mergeMessages](toJS(this.messages), data.messages);;
          this.key = data.key;
          this.lastSeenMessage = data.lastSeenMessage;
          resolve(data)
        })
      })
    }

    makeAutoObservable(this);

    onBecomeUnobserved(this, "messages", this[save]);

    autorun(() => {
      if(this.socket?.status && this.socket?.status !== this.status){
        console.warn('socket status', this.socket.status)
        this.status = this.socket.status
      }

    })

    if (channelId) {
      this._id = channelId;
      this[getChannel](this._id);
    }
  }

  set key(key) {
    this._key = key;
    this[save]();
  }

  get key() {
    return this._key;
  }

  set alias(alias) {
    this._alias = alias;
    this[save]();
  }

  get alias() {
    return this._alias;
  }

  async getContacts() {
    return await cacheDb.getItem('sb_data_contacts')
  }

  getOldMessages(length) {
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

  async replyEncryptionKey(recipientPubkey) {
    return Crypto.deriveKey(this.socket.keys.privateKey, await Crypto.importKey("jwk", JSON.parse(recipientPubkey), "ECDH", true, []), "AES", false, ["encrypt", "decrypt"])
  }

  newMessage(message) {
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
    return this._status;
  }

  set status(status) {
    this._status = status;
  }

  // This isnt in the the jslib atm
  // PSM: it is now but needs testing
  lock() {
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

  async downloadData() {
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
  async create(secret) {
    try {
      const c = await this.SB.create(this.config, secret);
      console.log("==== created channel:"); console.log(c);
      this._id = c.channelId
      this.key = c.key
      return this;
    } catch (e) {
      console.error(e)
      return false;
    }

  };

  connect(channelId = this._id, messageCallback = console.log, key = this.key) {
    return new Promise(async (resolve, reject) => {
      try {
        console.log("==== connecting to channel:" + channelId)
        console.log("==== with key:" + key)
        const c = await this.SB.connect(
          m => { this.receiveMessage(m, messageCallback); },
          key,
          channelId
        );
        console.log("==== connected to channel:"); console.log(c);
        if (c) {
          console.log("==== connected to channel:")
          console.log(c)
          this._id = channelId
          this.key = typeof key !== 'undefined' ? key : c.exportable_privateKey
          this.socket = c;
          this.readyResolver();
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

  getMessages() {
    return toJS(this.messages);
  }

  getChannelCache() {
    return {
      _id: this._id,
      alias: toJS(this._alias),
      messages: toJS(this.messages),
      key: toJS(this.key),
      lastSeenMessage: toJS(this.lastSeenMessage)
    }
  }

}


__decorate([
  Ready
], ChannelStore.prototype, "getContacts", null);
__decorate([
  Ready
], ChannelStore.prototype, "getOldMessages", null);
__decorate([
  Ready
], ChannelStore.prototype, "replyEncryptionKey", null);
__decorate([
  Ready
], ChannelStore.prototype, "newMessage", null);
__decorate([
  Ready
], ChannelStore.prototype, "capacity", null);
__decorate([
  Ready
], ChannelStore.prototype, "motd", null);

__decorate([
  Ready
], ChannelStore.prototype, "lock", null);
__decorate([
  Ready
], ChannelStore.prototype, "downloadData", null);
// __decorate([
//   Ready
// ], ChannelStore.prototype, "create", null);
// __decorate([
//   Ready
// ], ChannelStore.prototype, "connect", null);
__decorate([
  Ready
], ChannelStore.prototype, "getMessages", null);

export default SnackabraStore;