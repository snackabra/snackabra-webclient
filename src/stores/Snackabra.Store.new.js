import { makeAutoObservable, makeObservable, onBecomeUnobserved, configure, toJS, observable, computed, action, autorun } from "mobx";
import IndexedKV from "../utils/IndexedKV";


console.log("=========== mobx-snackabra-store loading ===========")
let SB = require(process.env.NODE_ENV === 'development' ? 'snackabra/dist/snackabra' : 'snackabra')
console.log(SB.version)
let cacheDb;
let Crypto = new SB.SBCrypto();


const save = Symbol("save");
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

function getDateTimeFromTimestampPrefix(prefix) {


  const binaryTimestamp = prefix;
  const decimalTimestamp = parseInt(binaryTimestamp, 2);

  const datetime = new Date(decimalTimestamp);
  const year = datetime.getFullYear();
  const month = datetime.getMonth() + 1; // Adding 1 because months are zero-based (January is 0)
  const day = datetime.getDate();
  const hours = datetime.getHours();
  const minutes = datetime.getMinutes();
  const seconds = datetime.getSeconds();
  const millisecondsOutput = datetime.getMilliseconds();

  // Format the datetime components into a string
  return `${year}-${month.toString().padStart(2, '0')}-${day.toString().padStart(2, '0')} ${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}.${millisecondsOutput.toString().padStart(3, '0')}`;

}

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

  getContact = (keyOrPubIdentifier) => {
    if (typeof keyOrPubIdentifier === 'string') {
      return { _id: keyOrPubIdentifier, name: this.contacts[keyOrPubIdentifier] }
    } else {
      const key = keyOrPubIdentifier;
      return { _id: key.x + ' ' + key.y, name: this.contacts[key?.x + ' ' + key?.y] }
    }

  }

  createContact = (alias, keyOrPubIdentifier) => {
    if (!keyOrPubIdentifier || !alias) {
      throw new Error('createContact requires a key and alias')
    }

    if (typeof keyOrPubIdentifier === 'string') {
      this._contacts[keyOrPubIdentifier] = alias
      this[save]()
      return
    }
    const key = keyOrPubIdentifier;
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


  create = async (secret, alias) => {
    try {
      const channel = new ChannelStore(this.SB, this.config);
      await channel.create(secret);
      this.channels[channel.id] = channel;
      this.channels[channel.id].alias = alias;
      this[save]();
      return this.channels[channel.id];
    } catch (e) {
      console.error(e)
      return false;
    }
  }

  importKeys = (importedData) => {
    return new Promise((resolve, reject) => {
      try {
        console.log('importing keys')
        console.log(importedData)
        Object.keys(importedData.roomData).forEach((id) => {
          const importedChannel = importedData.roomData[id]
          this._channels[id] = new ChannelStore(this.SB, this.config, id)
          this._channels[id].alias = importedChannel.alias ? importedChannel.alias : importedChannel.name || `Room ${Object.keys(this._channels).length}`
          this._channels[id].key = importedChannel.key
        })
        this.contacts = Object.assign(this.contacts, importedData.contacts)
        this[save]()
        resolve(true)
      } catch (e) {
        console.error(e)
        reject(e)
      }

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
  _messages = new Map();
  _ready = false;
  readyResolver;
  ChannelStoreReadyFlag = new Promise((resolve) => {
    this._ready = true;
    this.readyResolver = resolve;
  });
  lastSeenMessage = 0;
  SB;
  config;

  constructor(SB, config, channelId = null) {
    this.SB = SB;
    this.config = config;

    this[save] = async () => {
      await this.ChannelStoreReadyFlag
      try {
        if (this.id) {
          const save = {
            id: this.id,
            alias: this.alias,
            messages: this.messages,
            key: this.key,
            lastSeenMessage: toJS(this.lastSeenMessage)
          }
          console.warn('saving channel state', save)
          await cacheDb.setItem('sb_data_' + this.id, save)
        }
      } catch (e) {
        console.warn('There was an issue saving the channel state.', e.message)
      }

    }


    this[getChannel] = (channel) => {
      return new Promise((resolve) => {
        cacheDb.getItem('sb_data_' + channel).then(async (data) => {
          if (data) {
            this.id = data.id;
            this.alias = data.alias;
            this.messages = this.mergeMessages(this.messages, data.messages);
            this.key = data.key;
            this.lastSeenMessage = data.lastSeenMessage;
            resolve(data)
          } else {
            resolve(false)
          }
        })
      })
    }

    makeObservable(this, {
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
    return [...this._messages.values()];
  }

  set messages(messages) {
    if (!messages) {
      console.trace()
      return
    }
    for(let i in messages) {
      this._messages.set(messages[i]._id, messages[i]);
    }
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

  getOldMessages = (length, messageCallback) => {
    return new Promise((resolve, reject) => {
      try {
        this._socket.api.getOldMessages(length).then((r_messages) => {
          console.log("==== got these old messages:")
          this.messages = r_messages
          for (let x in r_messages) {
            let m = r_messages[x]
            this.receiveMessage(m, messageCallback)
          }
          this[save]();
          resolve(r_messages);
        });
      } catch (e) {
        reject(e)
      }

    });
  };

  replyEncryptionKey = async (recipientPubkey) => {
    return Crypto.deriveKey(this._socket.keys.privateKey, await Crypto.importKey("jwk", JSON.parse(recipientPubkey), "ECDH", true, []), "AES", false, ["encrypt", "decrypt"])
  }

  newMessage = (message) => {
    console.log("==== sending this message:")
    console.log(message)
    return new SB.SBMessage(this._socket, message);
  };

  sendMessage = (SBM) => {
    if (SBM instanceof SB.SBMessage) {
      return this._socket.send(SBM);
    } else {
      throw new Error("sendMessage expects an SBMessage")
    }
  }

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
    return this._status;
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

  // MTG: error in jslib here, needs to be fixed but waiting on commits from PSM
  downloadData = async () => {
    try {
      let data = await this._socket.api.downloadData()
      delete data.channel.SERVER_SECRET
      data.storage.target = window.location.host
      return data
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

  checkSocketStatus = () => {
    if (!this._socket) {
      return 'CLOSED'
    }
    return this._socket.status
  }

  receiveMessage = (m, messageCallback) => {
    m.createdAt = getDateTimeFromTimestampPrefix(m.timestampPrefix);
    this.lastMessageTime = m.timestampPrefix;
    this.lastSeenMessage = m._id
    this.messages = this.mergeMessages(this.messages, [m]);
    if (typeof messageCallback === 'function') {
      messageCallback(m);
    }
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
          merged.push(received[i]);
        }
      }
    }
    return merged.sort((a, b) => a._id > b._id ? 1 : -1);
  };

}

export default SnackabraStore;