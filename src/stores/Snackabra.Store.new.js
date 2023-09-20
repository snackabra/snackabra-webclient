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
        return true;
      } catch (e) {
        console.warn('There was an issue saving the snackabra state.', e.message)
        return false;
      }

    }

    const getChannelsCache = async () => {
      let channels = await cacheDb.getItem('sb_data_channels');
      console.log(channels)
      if (channels && Object.keys(channels).length > 0) {
        this.channels = channels;
      } else {
        let _channels = await cacheDb.openCursor(/^sb_data_[A-Za-z0-9]{64}$/);
        console.log(_channels)
        channels = {};
        for (let x in _channels) {
          channels[_channels[x].value.id] = _channels[x].value
        }
        this.channels = channels;
      }
      return channels;
    }

    this[migrate] = async (v) => {
      const sb_data = JSON.parse(await cacheDb.getItem('sb_data'));
      let channels = await getChannelsCache();

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
      const name = typeof this.contacts[keyOrPubIdentifier] !== 'undefined' ? this.contacts[keyOrPubIdentifier] : 'Unamed';
      return { _id: keyOrPubIdentifier, name: name }
    } else {
      const key = keyOrPubIdentifier;
      const name = typeof this.contacts[key?.x + ' ' + key?.y] !== 'undefined' ? this.contacts[key?.x + ' ' + key?.y] : 'Unamed';
      return { _id: key.x + ' ' + key.y, name: name }
    }

  }

  createContact = (alias, keyOrPubIdentifier) => {
    if (!keyOrPubIdentifier || !alias) {
      throw new Error('createContact requires a key and alias')
    }

    if (typeof keyOrPubIdentifier === 'string') {
      this._contacts[keyOrPubIdentifier] = alias
      this[save]()
      return this._contacts[keyOrPubIdentifier]
    }
    const key = keyOrPubIdentifier;
    this._contacts[key.x + ' ' + key.y] = alias
    this[save]()
    return this._contacts[key.x + ' ' + key.y]
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
    return new Promise(async (resolve, reject) => {
      try {
        let channel = new ChannelStore(this.SB, this.config, channelId);
        channel = await channel.connect(console.log)
        this._channels[channel.id] = channel;
        await this[save]();
        resolve(channel);
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  }


  create = (secret, alias) => {
    return new Promise(async (resolve, reject) => {
      try {
        const channel = new ChannelStore(this.SB, this.config);
        await channel.create(secret);
        this.channels[channel.id] = channel;
        this.channels[channel.id].alias = alias;
        this[save]();
        resolve(this.channels[channel.id]);
      } catch (e) {
        console.error(e)
        reject(e)
      }
    });
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
  _owner = false;
  _capacity = 20;
  _motd = '';
  _messageCallback;
  _savingTimout = null;
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
      if (this._savingTimout) {
        clearTimeout(this._savingTimout)
      }
      this._savingTimout = setTimeout(async () => {
        try {
          if (this.id) {
            const save = {
              id: toJS(this._id),
              alias: toJS(this._alias),
              messages: toJS(this._messages),
              owner: toJS(this._owner),
              key: toJS(this._key),
              motd: toJS(this._motd),
              capacity: toJS(this._capacity),
              lastSeenMessage: toJS(this.lastSeenMessage)
            }
            console.warn('saving channel state', save)
            await cacheDb.setItem('sb_data_' + this.id, save)
          }
        } catch (e) {
          console.warn('There was an issue saving the channel state.', e.message)
        }
      }, 250)

    }


    this[getChannel] = (channel) => {
      return new Promise((resolve) => {
        cacheDb.getItem('sb_data_' + channel).then(async (data) => {
          console.log('got channel data', data)
          if (data) {
            this.id = data.id;
            this.alias = data.alias;
            this.messages = data.messages;
            this.key = data.key;
            this.lastSeenMessage = data.lastSeenMessage;
            this.motd = data.motd;
            this.capacity = data.capacity;
            resolve(data)
          } else {
            resolve(false)
          }
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
      owner: computed,
      status: computed,
      messages: computed,
      getOldMessages: action,
      downloadData: action,
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

  get key() {
    return toJS(this._key);
  }

  set key(key) {
    if (!key) {
      console.warn('no key set for channel')
      return
    }
    this._key = key;
    this[save]();
  }

  get messages() {
    return this._messages;
  }

  set messages(messages) {
    if (!messages) {
      console.trace()
      return
    }
    if (messages instanceof Map) {
      this._messages = messages;
    } else {
      for (let i in messages) {
        this._messages.set(messages[i]._id, messages[i]);
      }
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

  get capacity() {
    return this._capacity;
  }

  set capacity(capacity) {
    this._capacity = capacity;
    if (this.owner && this._socket) {
      this._socket.api.updateCapacity(capacity);
    }
    this[save]();
  };

  get motd() {
    return this._motd;
  }

  set motd(motd) {
    if (this.owner && this._socket) {
      this._socket.api.setMOTD(motd);
    }
    this._motd = motd;
    this[save]();
  }

  get status() {
    return this._status;
  }

  set status(status) {
    this._status = status;
  }

  get owner() {
    return this._owner
  }

  set owner(owner) {
    this._owner = owner
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
  create = (secret) => {
    return new Promise(async (resolve, reject) => {
      try {
        const c = await this.SB.create(this.config, secret);
        console.log("==== created channel:"); console.log(c);
        this.id = c.channelId
        this.key = c.key
        resolve(this);
      } catch (e) {
        console.error(e)
        reject(e)
      }
    })
  };

  connect = async (messageCallback) => {
    this._messageCallback = messageCallback
    if (this._socket) {
      console.log("==== already connected to channel:" + this.id)
      console.log(this._socket)
      return true
    }
    if (!this.id) {
      throw new Error("no channel id")
    }
    try {
      console.log(this)
      console.log("==== connecting to channel:" + this.id)
      console.log("==== with key:" + this.key)
      const c = await this.SB.connect(
        m => { this.receiveMessage(m); },
        this.key,
        this.id
      );
      console.log("==== connected to channel:"); console.log(c);
      if (c) {
        await c.channelSocketReady;
        this.key = c.exportable_privateKey
        this.socket = c;
        this.owner = c.owner
        const r = await c.api.getCapacity();
        this.capacity = r.capacity;
        this.motd = c.motd;
        this.readyResolver();
        await this[save]();
        return this
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

  receiveMessage = (m) => {
    m.createdAt = getDateTimeFromTimestampPrefix(m.timestampPrefix);
    this.lastMessageTime = m.timestampPrefix;
    this.lastSeenMessage = m._id
    this.messages = this.mergeMessages(this.messages, [m]);
    if (typeof this._messageCallback === 'function') {
      this._messageCallback(m);
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