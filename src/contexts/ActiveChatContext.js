import * as React from "react"
import config from "../config";
import { areKeysSame, deriveKey, encrypt, extractPubKey, generateKeys, importKey, sign, verify } from "../utils/crypto";
import { decrypt, onlyUnique } from "../utils/utils";
import RoomContext from "./RoomContext";
import NotificationContext from "./NotificationContext";
import { getFileData, restrictPhoto, saveImage } from "../utils/ImageProcessor";
import { uniqBy, remove } from "lodash";

const ActiveChatContext = React.createContext(undefined);
let currentWebSocket, roomId, keys = {}, roomReady = false;

export const ActiveRoomProvider = ({ children }) => {
  const roomContext = React.useContext(RoomContext);
  const Notifications = React.useContext(NotificationContext);

  const [messages, setMessages] = React.useState([]);
  const [controlMessages, setControlMessages] = React.useState([]);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [moreMessages, setMoreMessages] = React.useState(true);
  const [changeUsername, setChangeUsername] = React.useState({ _id: '', name: '' });
  const [roomOwner, setRoomOwner] = React.useState(false);
  const [roomAdmin, setRoomAdmin] = React.useState(false);
  const [isVerifiedGuest, setIsVerifiedGuest] = React.useState(false);
  const [locked, setLocked] = React.useState(false);
  const [adminError, setAdminError] = React.useState(false);
  const [motd, setMotd] = React.useState('');
  const [roomCapacity, setRoomCapacity] = React.useState(2);
  const [joinRequests, setJoinRequests] = React.useState([]);
  const [error, setError] = React.useState(null);
  const [replyTo, setReplyTo] = React.useState(null);
  const [replyEncryptionKey, setReplyEncryptionKey] = React.useState({});
  const [username, setUsername] = React.useState({});
  const [files, setFiles] = React.useState([]);
  const [imgUrl, setImgUrl] = React.useState(null)
  const [ownerRotation, setOwnerRotation] = React.useState(null)

  const setKeys = (newKeys) => {
    keys = Object.assign(keys, newKeys);
  }

  const getKeys = () => {
    return keys;
  }

  const changeRoomId = (newRoom) => {
    roomId = newRoom;
  }

  const loadRoom = async (data = null) => {
    console.time('load-room')
    if (!roomReady) {
      let _keys = data.keys;
      await loadRoomKeys(_keys);
      setMotd(data.motd);
      setLocked(data.roomLocked)
      setOwnerRotation(data.ownerRotation)
      if (data.motd !== '') {
        sendSystemInfo('Message of the Day: ' + data.motd);
      } else {
        sendSystemMessage('Connected');
      }
      roomReady = true;
    }
    console.timeEnd('load-room')
  }

  // ##############################  FUNCTIONS TO GET ALL RELEVANT KEYS FROM KV/DO  ###############################

  const loadPersonalKeys = async (loadRoom) => {
    try {
      let _exportable_pubKey = null;
      let _exportable_privateKey = null;
      let _privateKey = null;
      if (localStorage.getItem(loadRoom) == null) {
        const keyPair = await generateKeys();
        _exportable_pubKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        _exportable_privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
        _privateKey = keyPair.privateKey;
        localStorage.setItem(loadRoom, JSON.stringify(_exportable_privateKey));
        setKeys({ exportable_pubKey: _exportable_pubKey, privateKey: _privateKey })
      } else {
        try {
          _exportable_privateKey = JSON.parse(localStorage.getItem(loadRoom));
          _exportable_pubKey = extractPubKey(_exportable_privateKey);
          _privateKey = await importKey("jwk", _exportable_privateKey, "ECDH", true, ["deriveKey"]);
          setKeys({ exportable_pubKey: _exportable_pubKey, privateKey: _privateKey })
        } catch {
          setError("The " + loadRoom + " key in the localstorage is corrupted. Please try importing it again. If you still find this error, you will need to delete the key for this room from the localStorage and the app will generate a new identity for you.")

        }
      }
    } catch (e) {
      console.error(e)
    }
  }


  const loadRoomKeys = async (_keys) => {
    try {
      console.log("Loading room keys...")
      if (_keys.ownerKey === null) {
        return { error: "Room does not exist" }
      }
      let _exportable_owner_pubKey = JSON.parse(_keys.ownerKey || JSON.stringify({}));
      if (_exportable_owner_pubKey.hasOwnProperty('key')) {
        _exportable_owner_pubKey = typeof _exportable_owner_pubKey.key === 'object' ? _exportable_owner_pubKey.key : JSON.parse(_exportable_owner_pubKey.key)
      }
      try {
        _exportable_owner_pubKey.key_ops = [];
      } catch (error) {
        console.error("Error in getKeys(): ")
        console.error(error);
      }
      const _exportable_room_signKey = JSON.parse(_keys.signKey);
      const _exportable_encryption_key = JSON.parse(_keys.encryptionKey);
      let _exportable_verifiedGuest_pubKey = JSON.parse(_keys.guestKey || null);
      const _exportable_pubKey = keys.exportable_pubKey;
      const _privateKey = keys.privateKey;
      let isVerifiedGuest = false;
      const _owner_pubKey = await importKey("jwk", _exportable_owner_pubKey, "ECDH", false, []);
      if (_owner_pubKey.error) {
        console.error(_owner_pubKey.error);
      }
      let isOwner = areKeysSame(_exportable_pubKey, _exportable_owner_pubKey);
      let isAdmin = (document.cookie.split('; ').find(row => row.startsWith('token_' + roomId)) !== undefined) || (process.env.REACT_APP_ROOM_SERVER !== 's_socket.privacy.app' && isOwner);

      if (!isOwner && !isAdmin) {
        if (_exportable_verifiedGuest_pubKey === null) {
          fetch(config.ROOM_SERVER + roomId + "/postPubKey?type=guestKey", {
            method: "POST",
            body: JSON.stringify(_exportable_pubKey),
            headers: {
              "Content-Type": "application/json"
            }
          });
          _exportable_verifiedGuest_pubKey = { ..._exportable_pubKey };
        }
        if (areKeysSame(_exportable_verifiedGuest_pubKey, _exportable_pubKey)) {
          isVerifiedGuest = true;
        }
      }

      const _encryption_key = await importKey("jwk", _exportable_encryption_key, "AES", false, ["encrypt", "decrypt"]);

      const _room_privateSignKey = await importKey("jwk", _exportable_room_signKey, "ECDH", true, ['deriveKey']);
      const _exportable_room_signPubKey = extractPubKey(_exportable_room_signKey);
      const _room_signPubKey = await importKey("jwk", _exportable_room_signPubKey, "ECDH", true, []);
      const _personal_signKey = await deriveKey(_privateKey, _room_signPubKey, "HMAC", false, ["sign", "verify"])


      let _shared_key = null;
      if (!isOwner) {
        _shared_key = await deriveKey(_privateKey, _owner_pubKey, "AES", false, ["encrypt", "decrypt"]);
      }

      let _locked_key = null;
      let _exportable_locked_key = localStorage.getItem(roomId + '_lockedKey');
      if (_exportable_locked_key !== null) {
        _locked_key = await importKey("jwk", JSON.parse(_exportable_locked_key), "AES", false, ["encrypt", "decrypt"]);
      } else if (keys.locked_key) {
        const _string_locked_key = (await decrypt(isOwner ? await deriveKey(keys.privateKey, await importKey("jwk", keys.exportable_pubKey, "ECDH", true, []), "AES", false, ["decrypt"]) : _shared_key, JSON.parse(keys.locked_key), "string")).plaintext;
        _exportable_locked_key = JSON.parse(_string_locked_key);
        _locked_key = await importKey("jwk", JSON.parse(_exportable_locked_key), "AES", false, ["encrypt", "decrypt"]);
      }

      setKeys({
        ...keys,
        shared_key: _shared_key,
        exportable_owner_pubKey: _exportable_owner_pubKey,
        exportable_verifiedGuest_pubKey: _exportable_verifiedGuest_pubKey,
        personal_signKey: _personal_signKey,
        room_privateSignKey: _room_privateSignKey,
        encryptionKey: _encryption_key,
        locked_key: _locked_key,
        exportable_locked_key: _exportable_locked_key
      })
      setRoomOwner(isOwner)
      setRoomAdmin(isAdmin)
      setIsVerifiedGuest(isVerifiedGuest)
      if (currentWebSocket) {
        currentWebSocket.send(JSON.stringify({ ready: true }));

      } else {
        setTimeout(() => {
          console.log('Websocket was not opened, retrying')
          currentWebSocket.send(JSON.stringify({ ready: true }));
        }, 5000)
      }

      console.log('Room keys loaded!');
      if (isAdmin) {

        await getAdminData()
        roomContext.setShowAdminTab(true);
        console.log('AdminDialog features loaded!');
      }
    } catch (e) {
      console.error(e);
      setError('Failure loading room keys. Please try joining the room again...')
    }
  }


  // ############################   FUNCTIONS TO HANDLE MESSAGES  ############################################


  const sendSystemInfo = (msg_string) => {
    setMessages(
      [...messages, {
        _id: messages.length,
        text: msg_string,
        user: { _id: 'system', name: 'System Message' },
        whispered: false,
        verified: true,
        info: true
      }]
    );
  }


  const sendSystemMessage = (message) => {
    setMessages(
      [...messages, {
        _id: messages.length,
        text: message,
        system: true
      }]);
  }

  const unwrapMessages = async (new_messages) => {

    let unwrapped_messages = {}
    for (let id in new_messages) {
      if (new_messages[id].hasOwnProperty("encrypted_contents")) {
        try {
          const decryption_key = keys.encryptionKey
          let msg = await decrypt(decryption_key, new_messages[id].encrypted_contents)
          if (msg.error) {
            msg = await decrypt(keys.locked_key, new_messages[id].encrypted_contents)
          }
          // console.log(msg)
          const _json_msg = JSON.parse(msg.plaintext);
          if (!_json_msg.hasOwnProperty('control')) {
            unwrapped_messages[id] = _json_msg;
          } else {
            // console.log(_json_msg);
            setControlMessages([...controlMessages, _json_msg])
          }
        } catch (e) {
          // console.error(e);
          // Skip the message if decryption fails - its probably due to the user not having <roomId>_lockedKey.
        }
      } else {
        unwrapped_messages[id] = new_messages[id];
      }
      localStorage.setItem(roomId + "_lastSeenMessage", id.slice(roomId.length));
    }
    return unwrapped_messages;
  }


  const wrapMessage = async (contents) => {
    let enc_key;
    if (locked && keys.locked_key != null) {
      enc_key = keys.locked_key;
      // console.log(enc_key)
    } else if (contents.encrypted || !locked) {
      enc_key = keys.encryptionKey;
    }
    let msg;
    try {
      msg = { encrypted_contents: await encrypt(JSON.stringify(contents), enc_key, "string") }
    } catch {
      return { error: 'Could not send message. The encryption key seems to be corrupted.' }
    }
    return msg;

  }

  const getWhisperToText = () => {
    let contacts = roomContext.contacts;
    return contacts[JSON.parse(replyTo._id).x + ' ' + JSON.parse(replyTo._id).y]
  }


  const addChatMessage = async (new_messages, old_messages = false) => {
    let _messages = [];
    let _text_verified = true;
    let _image_verified = true;
    let _imageMetadata_verified = true;
    let contacts = roomContext.contacts;
    for (let id in new_messages) {
      try {
        if (new_messages[id].hasOwnProperty('contents')) {
          if (new_messages[id].encrypted === true) {
            let shared_key = keys.shared_key
            if (!areKeysSame(keys.exportable_pubKey, new_messages[id].sender_pubKey)) {
              shared_key = await deriveKey(
                keys.privateKey,
                await importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
            }
            if (new_messages[id].recipient && roomOwner) {
              shared_key = await deriveKey(keys.privateKey, await importKey("jwk", new_messages[id].recipient, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
            }
            let decrypted_message = await decrypt(shared_key, new_messages[id].contents)
            if (decrypted_message.error && roomOwner) {
              shared_key = await deriveKey(keys.room_privateKey, await importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
              decrypted_message = await decrypt(shared_key, new_messages[id].contents)
            }
            if (new_messages[id].image != null) {
              const decrypted_image = await decrypt(shared_key, new_messages[id].image, "arrayBuffer");
              new_messages[id].image = decrypted_image.error ? '' : await getFileData(new File([decrypted_image.plaintext], "img", { type: "image/jpeg" }), "url")
              const decrypted_imageMetadata = await decrypt(shared_key, new_messages[id].imageMetaData)
              new_messages[id].imageMetaData = decrypted_imageMetadata.error ? {} : JSON.parse(decrypted_imageMetadata.plaintext);
            }
            new_messages[id].contents = decrypted_message.plaintext
            if (decrypted_message.error) {
              new_messages[id].whispered = true;
            }
          } else {
            const sign = new_messages[id].sign;
            const _image_sign = new_messages[id].image_sign
            const _imageMetadata_sign = new_messages[id].imageMetadata_sign;
            if (!sign || !_image_sign || !_imageMetadata_sign) {
              _text_verified = false
            } else {
              const sender_pubKey = await importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []);
              const verificationKey = await deriveKey(keys.room_privateSignKey, sender_pubKey, "HMAC", false, ["sign", "verify"])
              _text_verified = await verify(verificationKey, sign, new_messages[id].contents)
              _image_verified = await verify(verificationKey, _image_sign, new_messages[id].image)
              _imageMetadata_verified = await verify(verificationKey, _imageMetadata_sign, typeof new_messages[id].imageMetaData === "object" ? JSON.stringify(new_messages[id].imageMetaData) : new_messages[id].imageMetaData)
            }
          }
          let user_key = new_messages[id].sender_pubKey.x + " " + new_messages[id].sender_pubKey.y;
          let username = "";
          let user_id = JSON.stringify(new_messages[id].sender_pubKey);
          const unnamed = ['Anonymous', 'No Name', 'Nameless', 'Incognito', 'Voldemort', 'Uomo Senza Nome', 'The Kid', 'Gunslinger', 'IT ', 'Person in Black', 'बेनाम', 'βλέμμυες', '混沌'];
          const local_username = contacts.hasOwnProperty(user_key) && contacts[user_key].split(' ')[0] !== 'User' && !unnamed.includes(contacts[user_key].trim()) ? contacts[user_key] : 'Unnamed';
          contacts[user_key] = local_username;
          const alias = new_messages[id].hasOwnProperty('sender_username') ? new_messages[id].sender_username : '';
          if (user_key === (keys.exportable_pubKey.x + " " + keys.exportable_pubKey.y) || local_username === 'Me') {
            contacts[user_key] = 'Me';
            username = 'Me';
            user_id = JSON.stringify(keys.exportable_pubKey);
          } else {
            if (alias !== '') {
              username = (local_username === alias || local_username === 'Unnamed') ? alias : alias + '  (' + local_username + ')';
            } else {
              username = '(' + local_username + ')';
            }
            if (areKeysSame(new_messages[id].sender_pubKey, keys.exportable_verifiedGuest_pubKey)) {
              username += "  (Verified)"
            } else if (areKeysSame(new_messages[id].sender_pubKey, keys.exportable_owner_pubKey)) {
              username += "  (Owner)"
            }
          }
          let new_message = {
            _id: id,
            text: new_messages[id].contents,
            user: { _id: user_id, name: username },
            whispered: new_messages[id].encrypted,
            createdAt: parseInt(id.slice(-42), 2),
            verified: _text_verified && _image_verified && _imageMetadata_verified,
            image: new_messages[id].image,
            imageMetaData: typeof new_messages[id].imageMetaData === "object" ? new_messages[id].imageMetaData : JSON.parse(new_messages[id].imageMetaData)
          };

          if (!messages.some((message) => new_message._id === message._id && new_message.id !== 'system')) {
            _messages.push(new_message);
          }
        }
      } catch (e) {
        console.error(e);
      }

    }
    roomContext.updateContacts(contacts);
    if (old_messages) {
      const moreMessages = _messages.length !== 0;
      if (!moreMessages) {
        _messages.push({ _id: "no_old_message", text: "No older messages", system: true })
      }
      setMessages(uniqBy([..._messages, ...messages], '_id'))
      setMoreMessages(moreMessages)
    } else {
      setMessages(uniqBy([...messages, ..._messages], '_id'))
    }
  }


  const getOldMessages = async () => {
    try {
      setLoadingMore(false)
      const currentMessagesLength = messages.length;
      const fetch_resp = await fetch(config.ROOM_SERVER + roomId + "/oldMessages?currentMessagesLength=" + currentMessagesLength)
      let old_messages = await unwrapMessages(await fetch_resp.json());
      // console.log(old_messages)
      addChatMessage(old_messages, true);
      setLoadingMore(false)
    } catch (e) {
      console.error(e)
      sendSystemInfo('Could not fetch older messages');
    }
  }

  async function cleanQueue(message_id) {
    const cachedQueue = await document.cacheDb.getItem(`${roomId}_msg_queue`);
    if (cachedQueue === null) {
      return;
    }
    const queue = remove(cachedQueue, function (n) {
      return n._id !== message_id;
    });
    await document.cacheDb.setItem(`${roomId}_msg_queue`, queue);
  }

  const queueMessage = async (message, whisper) => {
    let queue = [];
    const cachedQueue = await document.cacheDb.getItem(`${roomId}_msg_queue`);
    if (cachedQueue) {
      queue = cachedQueue
    }
    queue.push({ ...message[0], whisper, files })
    await document.cacheDb.setItem(`${roomId}_msg_queue`, uniqBy(queue, '_id'));
  }

  const processMessageQueue = async (queue) => {
    await document.cacheDb.setItem(`${roomId}_msg_queue`, []);
    for (let i in queue) {
      if (queue[i].files.length > 0) {
        console.log(queue[i].files)
        setFiles(queue[i].files)
      }
      if (queue[i]?._id) {
        sendMessage([{ ...queue[i] }], queue[i].whisper)
      }
    }
  }


  const sendMessage = async (message, whisper = false) => {
    let file;
    queueMessage(message, whisper);

    try {
      // If room has not been initalized, set system message
      if (error) {
        sendSystemInfo(error)
        setMoreMessages(false)
        return;
      }

      if (!whisper && keys.locked_key == null && locked) {

        sendSystemInfo('This room is restricted. A request to the Owner has already been sent. Until you are accepted you cannot chat in the room. You can still whisper the owner by pressing the user icon in the top right corner.')
        return;
      }
      let encrypted = (whisper && keys.shared_key != null) || replyTo;

      let contents = {}
      let msg = {}
      let shared_key = keys.shared_key;
      if (files !== null && files.length > 0) {
        file = await getFileData(await restrictPhoto(files[0], 15, "image/jpeg", 0.92), encrypted ? 'arrayBuffer' : 'url');
      }

      let imgId = '', previewId = '', imgKey = '', previewKey = '', fullStorePromise = '', previewStorePromise = '';

      if (file != null) {
        let image_data = await saveImage(files[0], roomId, sendSystemMessage);
        if (typeof image_data !== 'string') {
          imgId = image_data.full;
          imgKey = image_data.fullKey;
          previewId = image_data.preview;
          previewKey = image_data.previewKey;
          fullStorePromise = image_data.fullStorePromise;
          previewStorePromise = image_data.previewStorePromise;
        } else {
          await document.cacheDb.setItem(`${image_data}_msg`, message);
        }

      } else if (message[0].text === '') {
        cleanQueue(message[0]._id);
        return;
      }

      // If room owner wants to reply with an encrypted message to a particular user (or message sender), use a shared AES key between the user and that message sender
      if (replyTo) {
        shared_key = replyEncryptionKey;
        contents.recipient = JSON.parse(replyTo._id);
      }
      // Encrypt message with shared key between room owner and verified guest if the "Whisper" checkbox is selected or if the room owner wants to reply to a particular message with an encrypted message
      if (encrypted) {

        const _content = await encrypt(message[0].text, shared_key, "string");
        const encrypted_img = await encrypt(file, shared_key, "string");
        // const encrypted_imageMetadata = await encrypt(JSON.stringify({ imageId: imgId, imageKey: imgKey, previewId: previewId, previewKey: previewKey }), shared_key, "string");
        const encrypted_imageMetadata = await encrypt(JSON.stringify({
          imageId: imgId,
          previewId: previewId,
          imageKey: imgKey,
          previewKey: previewKey
        }), shared_key, "string");

        contents = {
          ...contents,
          encrypted: true,
          contents: _content,
          sender_pubKey: keys.exportable_pubKey,
          image: encrypted_img,
          imageMetaData: encrypted_imageMetadata
        };
      } else {
        const _sign = await sign(keys.personal_signKey, message[0].text);
        const _image_sign = await sign(keys.personal_signKey, file);
        const _imageMetadata = { imageId: imgId, previewId: previewId, imageKey: imgKey, previewKey: previewKey }
        const _imageMetadata_string = JSON.stringify(_imageMetadata);
        const _imageMetadata_sign = await sign(keys.personal_signKey, _imageMetadata_string)
        contents = {
          encrypted: false,
          contents: message[0].text,
          sender_pubKey: keys.exportable_pubKey,
          sign: _sign,
          image: file,
          image_sign: _image_sign,
          imageMetaData: _imageMetadata_string,
          imageMetadata_sign: _imageMetadata_sign
        };
      }
      contents.sender_username = username;
      msg = await wrapMessage(contents);
      if (msg.error) {
        sendSystemInfo(msg.error);
        return;
      }
      if (currentWebSocket) {
        currentWebSocket.send(JSON.stringify(msg));
        if (typeof fullStorePromise === 'object') {
          fullStorePromise.then(async (controlData) => {
            let control_msg = await wrapMessage({ ...controlData, control: true });
            setControlMessages([...controlMessages, control_msg].filter(onlyUnique))
            currentWebSocket.send(JSON.stringify(control_msg));
          });
        }
        if (typeof previewStorePromise === 'object') {
          previewStorePromise.then(async (controlData) => {
            let control_msg = await wrapMessage({ ...controlData, control: true });
            setControlMessages([...controlMessages, control_msg].filter(onlyUnique))
            currentWebSocket.send(JSON.stringify(control_msg));
          });
        }
        cleanQueue(message[0]._id);
      } else {
        console.log(msg)
        sendSystemMessage("Your client is offline. Your message will send once connectivity is restored.")
      }

    } catch (e) {
      console.error(e);
      sendSystemInfo('Could not send message');
      Notifications.setMessage('Sending message failed, error from server: ' + e.message);
      Notifications.setSeverity('error');
      Notifications.setOpen(true)
    }

    // Reset the 'reply_to' data once message is sent
    try {
      setReplyTo(null)
      setReplyEncryptionKey(null)
      removeInputFiles();
    } catch {
      // we ignore problems
    }
  }

  // ############################   Load the entire room from cache   ##########################################
  const loadFromCache = () => {
    return new Promise(async (resolve, reject) => {
      try {
        const loadRoomData = await document.cacheDb.getItem(`${roomId}_data`)
        if (loadRoomData !== null) {
          await loadRoom(loadRoomData);
        }

        const messageData = await document.cacheDb.getItem(`${roomId}_messages`)

        const _messages = await unwrapMessages(messageData);
        await addChatMessage(_messages)
        console.log('Loaded from room from cache')
        resolve();
      } catch (e) {
        console.error(e)
        reject(e)
      }

    })

  }
  // ############################   FUNCTIONS TO HANDLE WEBSOCKET   ##########################################
  const join = async (selectedRoom) => {
    try {
      loadFromCache();
      let ws = new WebSocket(config.ROOM_SERVER_WS + selectedRoom + "/websocket");
      let rejoined = false;
      let startTime = Date.now();

      let rejoin = async () => {
        if (!rejoined) {
          rejoined = true;
          currentWebSocket = null;

          // Don't try to reconnect too rapidly.
          let timeSinceLastJoin = Date.now() - startTime;
          if (timeSinceLastJoin < 10000) {
            // Less than 10 seconds elapsed since last join. Pause a bit.
            await new Promise(resolve => setTimeout(resolve, 10000 - timeSinceLastJoin));
          }

          // OK, reconnect now!
          join(selectedRoom);
        }
      }

      ws.addEventListener("open", async (event) => {
        currentWebSocket = ws;
        // Send user info message.
        ws.send(JSON.stringify({ name: JSON.stringify(keys.exportable_pubKey) }));
        console.info('Websocket Opened')
        let messageQueue = await document.cacheDb.getItem(`${roomId}_msg_queue`)
        if (messageQueue !== null && messageQueue.length > 0) {
          processMessageQueue(messageQueue)
        }

      });

      ws.addEventListener("message", async event => {
        let data = JSON.parse(event.data);
        if (data.error) {
          sendSystemInfo("Error from server: " + data.error)
        } else if (data.ready) {
          await document.cacheDb.setItem(`${roomId}_data`, data)
          loadRoom(data);
        } else if (data.system) {
          if (data.keyRotation) {
            sendSystemInfo('The room owner has rotated their keys. Please reload the room to update your copy of the owner keys.')
          }
        } else {
          let cachedMessages = await document.cacheDb.getItem(`${roomId}_messages`)
          if (!cachedMessages) {
            cachedMessages = [];
          }
          if (Object.keys(data).length > 1) {
            document.cacheDb.setItem(`${roomId}_messages`, uniqBy([...[data], ...[cachedMessages]], '_id')[0])
          } else {
            /*
            const newCache = [];
            for(let x in cachedMessages){
              if(cachedMessages[x].)
            }

             */
            cachedMessages[Object.keys(data)[0]] = data[Object.keys(data)[0]]
            document.cacheDb.setItem(`${roomId}_messages`, uniqBy([...[cachedMessages]], '_id')[0])
          }
          const _messages = await unwrapMessages(data);
          await addChatMessage(_messages)
        }
      });

      ws.addEventListener("close", event => {
        console.info('Websocket closed', event)
        if (event.code === 4000) {
          // console.log('Room does not exist');
          sendSystemInfo(event.reason)
          setError(event.reason)
        } else {
          rejoin();
        }
      });
      ws.addEventListener("error", event => {
        console.log("WebSocket error, reconnecting:", event);
        rejoin();
      });
    } catch (e) {
      console.error(e);
      sendSystemInfo('Could not connect to websocket')
      return ({ error: 'Could not connect to the websocket' })
    }
  }
  // #######################   MISC HELPER FUNCTIONS   ###############################


  const getRoomCapacity = () => {
    fetch(config.ROOM_SERVER + roomId + "/getRoomCapacity", { credentials: 'include' })
      .then(resp => resp.json()
        .then(data => data.capacity ? setRoomCapacity(data.capacity) : setAdminError(true))
      );
  }


  const updateRoomCapacity = (roomCapacity) => {
    fetch(config.ROOM_SERVER + roomId + "/updateRoomCapacity?capacity=" + roomCapacity, { credentials: 'include' })
      .then(data => console.log('this worked!'));
  }


  const getAdminData = async () => {
    let request = { credentials: "include" };
    if (process.env.REACT_APP_ROOM_SERVER !== 's_socket.privacy.app' && roomOwner) {
      let token_data = new Date().getTime().toString();
      let token_sign = await sign(keys.personal_signKey, token_data);
      request.headers = { authorization: token_data + "." + token_sign }
    }

    const capacity = await document.cacheDb.getItem(`${roomId}_capacity`)
    const join_requests = await document.cacheDb.getItem(`${roomId}_join_requests`)
    if (capacity && join_requests) {
      console.log('Loading cached room data')
      setRoomCapacity(capacity);
      setJoinRequests(join_requests)
    }


    fetch(config.ROOM_SERVER + roomId + "/getAdminData", request)
      .then(resp => resp.json().then(data => {
          if (data.error) {
            setAdminError(true)
          } else {
            document.cacheDb.setItem(`${roomId}_capacity`, data.capacity)
            document.cacheDb.setItem(`${roomId}_join_requests`, data.join_requests)
            setRoomCapacity(data.capacity);
            setJoinRequests(data.join_requests)
          }
        })
      )
  }

  const saveUsername = (newUsername) => {
    try {
      let user = changeUsername
      const user_pubKey = JSON.parse(user._id);
      let contacts = roomContext.contacts;
      let _messages = Object.assign(messages);
      _messages.forEach(message => {
        if (message.user._id === user._id) {
          message.user.name = message.user.name.replace('(' + contacts[user_pubKey.x + ' ' + user_pubKey.y] + ')', '(' + newUsername + ')');
        }
      });
      contacts[user_pubKey.x + ' ' + user_pubKey.y] = newUsername;
      setChangeUsername({ _id: '', name: '' })
      setMessages(_messages)
      roomContext.updateContacts(contacts);
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const getUsername = () => {
    const username = localStorage.getItem(roomId + '_username');
    return username === null ? '' : username;
  }


  const acceptVisitor = async (pubKey) => {
    try {
      let updatedRequests = joinRequests;
      updatedRequests.splice(joinRequests.indexOf(pubKey), 1);
      // console.log(pubKey);
      const shared_key = await deriveKey(keys.privateKey, await importKey("jwk", JSON.parse(pubKey), "ECDH", false, []), "AES", false, ["encrypt", "decrypt"]);
      setJoinRequests(updatedRequests)
      const _encrypted_locked_key = await encrypt(JSON.stringify(keys.exportable_locked_key), shared_key, "string")
      fetch(config.ROOM_SERVER + roomId + "/acceptVisitor", {
        method: "POST",
        body: JSON.stringify({ pubKey: pubKey, lockedKey: JSON.stringify(_encrypted_locked_key) }),
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const lockRoom = async () => {
    try {
      if (keys.locked_key == null && roomAdmin) {
        const _locked_key = await window.crypto.subtle.generateKey({
          name: "AES-GCM",
          length: 256
        }, true, ["encrypt", "decrypt"]);
        const _exportable_locked_key = await window.crypto.subtle.exportKey("jwk", _locked_key);
        localStorage.setItem(roomId + '_lockedKey', JSON.stringify(_exportable_locked_key));
        const lock_success = (await (await fetch(config.ROOM_SERVER + roomId + "/lockRoom", { credentials: 'include' })).json()).locked;
        console.log(lock_success);
        if (lock_success) {
          await (await acceptVisitor(JSON.stringify(keys.exportable_pubKey))).json();
          setLocked(true)
          window.location.reload();  // Need a better way to reload
          // await getJoinRequests();
        }
      }
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const isRoomLocked = async () => {
    try {
      const locked_json = (await (await fetch(config.ROOM_SERVER + roomId + "/roomLocked", { credentials: 'include' })).json());
      return locked_json.locked;
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const getJoinRequests = async () => {
    try {
      const joinRequests = (await (await fetch(config.ROOM_SERVER + roomId + "/getJoinRequests", { credentials: 'include' })).json())
      // console.log(joinRequests)
      joinRequests.error ? setAdminError(true) : setJoinRequests(joinRequests.join_requests);
    } catch (e) {
      console.error(e);
    }
  }

  // TODO needs supporting function from component
  const setMOTD = (motd) => {
    try {
      if (roomOwner) {
        fetch(config.ROOM_SERVER + roomId + "/motd", {
          method: "POST",
          body: JSON.stringify({ motd: motd }),
          headers: {
            "Content-Type": "application/json"
          }
        });
        setMotd(motd)
      }
    } catch (e) {
      console.error(e);
    }
  }

  const chooseFile = (e) => {
    setFiles(e.target.files)
  }

  const removeInputFiles = () => {
    setFiles([])
  }

  const selectRoom = async (selectedRoom) => {
    try {

      setMessages([])
      await loadPersonalKeys(selectedRoom);
      join(selectedRoom);
      setUsername(getUsername())
      let rooms = roomContext.rooms;
      roomContext.goToRoom(selectedRoom)
      if (!rooms.hasOwnProperty(selectedRoom)) {
        rooms[selectedRoom] = { name: 'Room ' + (Object.keys(rooms).length + 1).toString() };
        //roomContext.updateRoomNames(rooms)
      }
    } catch (e) {
      console.error(e);
    }
  }

  const previewImage = async (photo, file) => {
    try {
      if (photo) {
        const b64url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(photo);
        });
        setImgUrl(b64url)
        setFiles([file])
      }
    } catch (e) {
      console.error(e);
    }
  }

  const joinRoom = (roomId) => {
    if (!(keys.exportable_pubKey || error) && localStorage.getItem(roomId) !== null) {
      try {
        selectRoom(roomId);
      } catch (e) {
        console.error(e);
        sendSystemInfo('Could not enter the room')
      }
    }
  }


  return <ActiveChatContext.Provider value={{
    messages, setMessages,
    controlMessages, setControlMessages,
    loadingMore, setLoadingMore,
    moreMessages, setMoreMessages,
    keys,
    roomId, changeRoomId,
    changeUsername, setChangeUsername,
    roomOwner, setRoomOwner,
    roomAdmin, setRoomAdmin,
    isVerifiedGuest, setIsVerifiedGuest,
    locked, setLocked,
    adminError, setAdminError,
    motd, setMotd,
    roomCapacity, setRoomCapacity,
    joinRequests, setJoinRequests,
    error, setError,
    replyTo, setReplyTo,
    replyEncryptionKey, setReplyEncryptionKey,
    username, setUsername,
    files, setFiles,
    imgUrl, setImgUrl,
    sendMessage,
    getOldMessages,
    chooseFile,
    removeInputFiles,
    getWhisperToText,
    selectRoom,
    previewImage,
    joinRoom,
    getKeys,
    saveUsername,
    lockRoom,
    setMOTD,
    updateRoomCapacity,
    sendSystemMessage,
    join
  }}>{children} </ActiveChatContext.Provider>
};

export default ActiveChatContext;

