import { makeAutoObservable, makeObservable, onBecomeUnobserved, configure, toJS, observable, computed, action, autorun } from "mobx";
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
  readyResolver;
  SnackabraStoreReadyFlag = new Promise((resolve) => {
    this.readyResolver = resolve;
  });
  config = {};
  _channels = {};
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
          console.log(x, this.channels[x])
          if (x) {
            channels[x] = { id: x }
          }
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

          let contacts = await cacheDb.getItem('sb_data_contacts') || {};
          for (let x in channels) {
            if (channels[x]) {
              const channel = await cacheDb.getItem('sb_data_' + channels[x].id)
              if (channel) {
                console.warn('Migrating channel', channel)
                contacts = Object.assign(contacts, channel.contacts)
                const id = channel.id || channel._id;
                const newChannel = new ChannelStore(this.SB, this.config, id);
                console.warn(newChannel, id, x)
                this._channels[x] = new ChannelStore(this.SB, this.config, id)
                console.warn(this._channels[x], id, x)
                let alias = channel.name || channel.alias
                this._channels[x].alias = alias
                this._channels[x].key = channel.key
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
    return {_id: key.x + ' ' + key.y , name: this.contacts[key?.x + ' ' + key?.y]}
  }

  createContact = (alias, key) => {
    if (!key || !alias) {
      throw new Error('createContact requires a key and alias')
    }
    this._contacts[key.x + ' ' + key.y] = alias
    this[save]()
  }

  get channels() {
    return this._channels
  }

  set channels(channels) {
    this._channels = channels
  }

  set contacts(contacts) {
    this._contacts = Object.assign(this._contacts, contacts)
  }
  get contacts() {
    return toJS(this._contacts)
  }

  join = (channelId) => {
    alert('join')
    try {
      const channel = new ChannelStore(this.SB, this.config, channelId);
      this._channels[channel.id] = channel;
      this[save]();
      return this.channels[channel.id];
    } catch (e) {
      console.error(e)
      return false;
    }
  }


  create = async (secret) => {
    try {
      const channel = new ChannelStore(this.SB, this.config);
      await channel.create(secret);
      this.channels[channel.id] = channel;
      this[save]();
      return this.channels[channel.id];
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
  _id;
  _alias;
  _status = 'CLOSED'
  _key;
  _socket;
  _messages = [];
  readyResolver;
  ChannelStoreReadyFlag = new Promise((resolve) => {
    this.readyResolver = resolve;
  });
  lastSeenMessage = 0;
  SB;
  config;

  constructor(SB, config, channelId = null) {
    this.SB = SB;
    this.config = config;

    this[save] = async () => {
      // await this.ChannelStoreReadyFlag
      try {
        if (this.id) {
          const save = {
            id: this.id,
            alias: this.alias,
            messages: this.messages,
            key: this.key,
            lastSeenMessage: toJS(this.lastSeenMessage)
          }
          await cacheDb.setItem('sb_data_' + this.id, save)
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
      this.messages = await this[mergeMessages](this.messages, [m]);
      if (typeof messageCallback === 'function') {
        messageCallback(m);
      }
    };

    this[getChannel] = (channel) => {
      return new Promise((resolve) => {
        cacheDb.getItem('sb_data_' + channel).then(async (data) => {
          this.id = data.id;
          this.alias = data.alias;
          this.messages = await this[mergeMessages](this.messages, data.messages);;
          this.key = data.key;
          this.lastSeenMessage = data.lastSeenMessage;
          resolve(data)
        })
      })
    }

    makeAutoObservable(this, {
      id: computed,
      key: computed,
      alias: computed,
      socket: computed,
      capacity: computed,
      motd: computed,
      status: computed,
      messages: computed,
      getOldMessages: action,
      downloadData: action,
      getContacts: action,
      replyEncryptionKey: action,
      newMessage: action,
      lock: action,
      create: action,
      connect: action,
    });

    onBecomeUnobserved(this, "messages", this[save]);

    autorun(() => {
      if (this.socket?.status && this.socket?.status !== this.status) {
        console.warn('socket status', this.socket.status)
        this.status = this.socket.status
      }

    })

    if (channelId) {
      this.id = channelId;
      this[getChannel](this.id);
    }
  }

  get id() {
    return toJS(this._id);
  }

  set id(id) {
    if (!id) {
      console.error('no id set for channel')
      return
    }
    this._id = id;
    this[save]();
  }

  set key(key) {
    if (!key) {
      return
    }
    this._key = key;
    this[save]();
  }

  get key() {
    return toJS(this._key);
  }

  get messages() {
    return toJS(this._messages);
  }

  set messages(messages) {
    if (!messages) {
      console.trace()
      return
    }
    this._messages = messages;
    this[save]();
  }

  set alias(alias) {
    if (!alias) {
      // console.trace()
      return
    }
    this._alias = alias;
    this[save]();
  }

  get alias() {
    return this._alias;
  }

  get socket() {
    return this._socket;
  }

  set socket(socket) {
    if (!socket) {
      console.trace()
      return
    }
    this._socket = socket;
    this[save]();
  }

  getContacts = async () => {
    return await cacheDb.getItem('sb_data_contacts')
  }

  getOldMessages = (length) => {
    return new Promise(async (resolve) => {
      this._socket.api.getOldMessages(length).then(async (r_messages) => {
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
    return Crypto.deriveKey(this._socket.keys.privateKey, await Crypto.importKey("jwk", JSON.parse(recipientPubkey), "ECDH", true, []), "AES", false, ["encrypt", "decrypt"])
  }

  newMessage = (message) => {
    return new SB.SBMessage(this._socket, message);
  };

  get capacity() {
    return this._socket.api.getCapacity();
  }
  set capacity(capacity) {
    this._socket.api.updateCapacity(capacity);
  };
  get motd() {
    return this._socket.motd;
  }
  set motd(motd) {
    this._socket.api.setMOTD(motd);
  }

  get status() {
    return this._socket?.status || 'CLOSED';
  }

  set status(status) {
    this._status = status;
  }

  // This isnt in the the jslib atm
  // PSM: it is now but needs testing
  lock = () => {
    return new Promise((resolve, reject) => {
      try {
        this._socket.api.lock().then((locked) => {
          console.log(locked)
        })
      } catch (e) {
        reject(e)
      }
    })
  };

  downloadData = async () => {
    try {
      let data = await this._socket.api.downloadData()
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
      const c = await this.SB.create(this.config, secret);
      console.log("==== created channel:"); console.log(c);
      this.id = c.channelId
      this.key = c.key
      return this;
    } catch (e) {
      console.error(e)
      return false;
    }

  };

  connect = async (messageCallback) => {
    if (this._socket) {
      console.log("==== already connected to channel:" + this.id)
      console.log(this._socket)
      return true
    }
    try {
      if (!this.id) {
        throw new Error("no channel id")
      }
      console.log(this)
      console.log("==== connecting to channel:" + this.id)
      console.log("==== with key:" + this.key)
      const c = await this.SB.connect(
        m => { this.receiveMessage(m, messageCallback); },
        this.key,
        this.id
      );
      console.log("==== connected to channel:"); console.log(c);
      if (c) {
        console.log("==== connected to channel:")
        console.log(c)
        this.key = this.key || c.exportable_privateKey
        this.socket = c;
        console.log(this.key)
        this.readyResolver();
        await this[save]();
        return true
      } else {
        return false
      }
    } catch (e) {
      throw e
    }

  };

  getChannelCache = () => {
    return {
      id: this.id,
      alias: toJS(this.alias),
      messages: this.messages,
      key: toJS(this.key),
      lastSeenMessage: toJS(this.lastSeenMessage)
    }
  }

}

export default SnackabraStore;