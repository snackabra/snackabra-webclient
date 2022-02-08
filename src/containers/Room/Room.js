/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import { GiftedChat, Bubble } from 'react-native-gifted-chat';
import { Route } from 'react-router-dom';
import { View, Text } from 'react-native';
import { JwModal } from '../Modal/Modal';
import './Room.css';
import Admin from '../../components/Admin/Admin';
import attach_img from '../../static/attach.png';
// import lock_icon from '../../static/icons8-lock-64.png';
// import secure_lock from '../../static/lock_secure.png';
import { Trans } from '@lingui/macro';
import * as utils from '../../utils/utils';



// these are set in '.env' file at root of project
let ROOM_SERVER = "https://" + process.env.REACT_APP_ROOM_SERVER + "/api/room/"
let ROOM_SERVER_WS = "wss://" + process.env.REACT_APP_ROOM_SERVER + "/api/room/"
let STORAGE_SERVER = "https://" + process.env.REACT_APP_STORAGE_SERVER + "/api/v1"

// console.log(process.env)

class Room extends React.Component {

  constructor(props) {
    super(props);
    this.currentWebSocket = null;
    this.roomId = this.props.roomId;
    this.state = {
      messages: [],
      controlMessages: [],
      loadingMore: false,
      moreMessages: true,
      keys: {},
      changeUsername: { _id: '', name: '' },
      room_owner: false,
      locked: false,
      adminError: false,
      motd: '',
      roomCapacity: 2, // this will get loaded from server (if it's in the server), current system default is 20
      joinRequests: [],
    }
  }

  // ##############################  FUNCTIONS TO GET ALL RELEVANT KEYS FROM KV/DO  ###############################

  async loadPersonalKeys() {
    try {
      let _exportable_pubKey = null;
      let _exportable_privateKey = null;
      let _privateKey = null;
      if (localStorage.getItem(this.roomId) == null) {
        const keyPair = await this.generateKeys();
        _exportable_pubKey = await window.crypto.subtle.exportKey("jwk", keyPair.publicKey);
        _exportable_privateKey = await window.crypto.subtle.exportKey("jwk", keyPair.privateKey);
        _privateKey = keyPair.privateKey;
        localStorage.setItem(this.roomId, JSON.stringify(_exportable_privateKey));
      }
      else {
        try {
          _exportable_privateKey = JSON.parse(localStorage.getItem(this.roomId));
          _exportable_pubKey = this.extractPubKey(_exportable_privateKey);
          _privateKey = await this.importKey("jwk", _exportable_privateKey, "ECDH", true, ["deriveKey"]);
        } catch {
          this.setState({ error: "The " + this.roomId + " key in the localstorage is corrupted. Please try importing it again. If you still find this error, you will need to delete the key for this room from the localStorage and the app will generate a new identity for you." })
        }
      }
      this.setState({ keys: { exportable_pubKey: _exportable_pubKey, privateKey: _privateKey } });
    } catch (e) {
      console.log(e)
    }
  }


  async loadRoomKeys(keys) {
    try {
      console.log("Loading room keys...")
      if (keys.ownerKey === null) {
        return { error: "Room does not exist" }
      }
      let _exportable_owner_pubKey = JSON.parse(keys.ownerKey || JSON.stringify({}));
      if (_exportable_owner_pubKey.hasOwnProperty('key')) {
        _exportable_owner_pubKey = typeof _exportable_owner_pubKey.key === 'object' ? _exportable_owner_pubKey.key : JSON.parse(_exportable_owner_pubKey.key)
      }
      try {
        _exportable_owner_pubKey.key_ops = [];
      } catch (error) {
        console.log("Error in getKeys(): ")
        console.log(error);
      }
      const _exportable_room_signKey = JSON.parse(keys.signKey);
      const _exportable_encryption_key = JSON.parse(keys.encryptionKey);
      let _exportable_verifiedGuest_pubKey = JSON.parse(keys.guestKey  || null);
      const _exportable_pubKey = this.state.keys.exportable_pubKey;
      const _privateKey = this.state.keys.privateKey;
      let isVerifiedGuest = false;
      const _owner_pubKey = await this.importKey("jwk", _exportable_owner_pubKey, "ECDH", false, []);
      if (_owner_pubKey.error) {
        console.log(_owner_pubKey.error);
      }
      let isOwner = this.areKeysSame(_exportable_pubKey, _exportable_owner_pubKey);
      let isAdmin = (document.cookie.split('; ').find(row => row.startsWith('token_' + this.roomId)) !== undefined) || (process.env.REACT_APP_ROOM_SERVER !== 's_socket.privacy.app' && isOwner);
      /* To overwrite owner keys
      if (isAdmin && JSON.stringify(_exportable_owner_pubKey) !== JSON.stringify(_exportable_pubKey)) {
        fetch(STORAGE_SERVER + "/postPubKey?roomId=" + this.roomId + "&type=ownerKey", {
          method: "POST",
          body: JSON.stringify(_exportable_pubKey),
          headers: {
            "Content-type": "application/json"
          },
          credentials: 'include'
        }).then(() => fetch(ROOM_SERVER + this.roomId + "/ownerKeyRotation"))
        _exportable_owner_pubKey = _exportable_pubKey;
      }
      */
      if (!isOwner && !isAdmin) {
        if (_exportable_verifiedGuest_pubKey === null) {
          fetch(ROOM_SERVER + this.roomId + "/postPubKey?type=guestKey", {
            method: "POST",
            body: JSON.stringify(_exportable_pubKey),
            headers: {
              "Content-Type": "application/json"
            }
          });
          _exportable_verifiedGuest_pubKey = { ..._exportable_pubKey };
        }
        if (this.areKeysSame(_exportable_verifiedGuest_pubKey, _exportable_pubKey)) {
          isVerifiedGuest = true;
        }
      }

      const _encryption_key = await this.importKey("jwk", _exportable_encryption_key, "AES", false, ["encrypt", "decrypt"]);

      const _room_privateSignKey = await this.importKey("jwk", _exportable_room_signKey, "ECDH", true, ['deriveKey']);
      const _exportable_room_signPubKey = this.extractPubKey(_exportable_room_signKey);

      const _room_signPubKey = await this.importKey("jwk", _exportable_room_signPubKey, "ECDH", true, []);
      const _personal_signKey = await this.deriveKey(_privateKey, _room_signPubKey, "HMAC", false, ["sign", "verify"])

      let _shared_key = null;
      if (!isOwner) {
        _shared_key = await this.deriveKey(_privateKey, _owner_pubKey, "AES", false, ["encrypt", "decrypt"]);
      }

      let _locked_key = null;
      let _exportable_locked_key = localStorage.getItem(this.roomId + '_lockedKey');
      if (_exportable_locked_key !== null) {
        _locked_key = await this.importKey("jwk", JSON.parse(_exportable_locked_key), "AES", false, ["encrypt", "decrypt"]);
      }
      else if (keys.locked_key) {
        const _string_locked_key = (await this.decrypt(isOwner ? await this.deriveKey(this.state.keys.privateKey, await this.importKey("jwk", this.state.keys.exportable_pubKey, "ECDH", true, []), "AES", false, ["decrypt"]) : _shared_key, JSON.parse(keys.locked_key), "string")).plaintext;
        _exportable_locked_key = JSON.parse(_string_locked_key);
        _locked_key = await this.importKey("jwk", JSON.parse(_exportable_locked_key), "AES", false, ["encrypt", "decrypt"]);
      }

      this.setState({ keys: { ...this.state.keys, shared_key: _shared_key, exportable_owner_pubKey: _exportable_owner_pubKey, exportable_verifiedGuest_pubKey: _exportable_verifiedGuest_pubKey, personal_signKey: _personal_signKey, room_privateSignKey: _room_privateSignKey, encryptionKey: _encryption_key, locked_key: _locked_key, exportable_locked_key: _exportable_locked_key }, room_owner: isOwner, room_admin: isAdmin, verifiedGuest: isVerifiedGuest })
      this.currentWebSocket.send(JSON.stringify({ ready: true }));
      console.log('Room keys loaded!');
      if (isAdmin) {
        this.getAdminData();
        this.props.showAdminTab();
      }
    } catch (e) {
      console.log(e);
      this.setState({ error: 'Failure loading room keys. Please try joining the room again...' })
    }
  }


  // ############################   FUNCTIONS TO HANDLE WEBSOCKET   ##########################################


  join() {
    try {
      let ws = new WebSocket(ROOM_SERVER_WS + this.roomId + "/websocket");
      let rejoined = false;
      let startTime = Date.now();

      let rejoin = async () => {
        if (!rejoined) {
          rejoined = true;
          this.currentWebSocket = null;

          // Don't try to reconnect too rapidly.
          let timeSinceLastJoin = Date.now() - startTime;
          if (timeSinceLastJoin < 10000) {
            // Less than 10 seconds elapsed since last join. Pause a bit.
            await new Promise(resolve => setTimeout(resolve, 10000 - timeSinceLastJoin));
          }

          // OK, reconnect now!
          this.join();
        }
      }

      ws.addEventListener("open", event => {
        this.currentWebSocket = ws;

        // Send user info message.
        ws.send(JSON.stringify({ name: JSON.stringify(this.state.keys.exportable_pubKey) }));
      });

      ws.addEventListener("message", async event => {
        let data = JSON.parse(event.data);
        if (data.error) {
          this.sendSystemInfo("Error from server: " + data.error)
        } else if (data.ready) {
          let _keys = data.keys;
          await this.loadRoomKeys(_keys);
          this.setState({ motd: data.motd, ownerRotation: data.ownerRotation, locked: data.roomLocked });
          if (data.motd !== '') {
            this.sendSystemInfo('Message of the Day: ' + data.motd);
          }
          else {
            this.sendSystemMessage('Connected');
          }
        } else if (data.system) {
          if (data.keyRotation) {
            this.sendSystemInfo('The room owner has rotated their keys. Please reload the room to update your copy of the owner keys.')
          }
        } else {
          const messages = await this.unwrapMessages(data);
          await this.addChatMessage(messages)
        }
      });

      ws.addEventListener("close", event => {
        if (event.code === 4000) {
          // console.log('Room does not exist');
          this.setState({ error: event.reason })
        }
        else {
          console.log("WebSocket closed, reconnecting:", event.code, event.reason);
          rejoin();
        }
      });
      ws.addEventListener("error", event => {
        console.log("WebSocket error, reconnecting:", event);
        rejoin();
      });
    } catch (e) {
      console.log(e);
      this.sendSystemInfo('Could not connect to websocket')
      return ({ error: 'Could not connect to the websocket' })
    }
  }


  // ############################   FUNCTIONS TO HANDLE MESSAGES  ############################################


  sendSystemInfo(msg_string) {
    this.setState({ messages: [...this.state.messages, { _id: this.state.messages.length, text: msg_string, user: { _id: 'system', name: 'System Message' }, whispered: false, verified: true, info: true }] });
  }


  sendSystemMessage(message) {
    this.setState({ messages: [...this.state.messages, { _id: this.state.messages.length, text: message, system: true }] });
  }


  async unwrapMessages(new_messages) {
    let unwrapped_messages = {}
    for (let id in new_messages) {
      if (new_messages[id].hasOwnProperty("encrypted_contents")) {
        try {
          const decryption_key = this.state.keys.encryptionKey
          let msg = await this.decrypt(decryption_key, new_messages[id].encrypted_contents)
          if (msg.error) {
            msg = await this.decrypt(this.state.keys.locked_key, new_messages[id].encrypted_contents)
          }
          // console.log(msg)
          const _json_msg = JSON.parse(msg.plaintext);
          // console.log(_json_msg)
          if (!_json_msg.hasOwnProperty('control')) {
            unwrapped_messages[id] = _json_msg;
          }
          else {
            // console.log(_json_msg);
            this.setState({ controlMessages: [...this.state.controlMessages, _json_msg] })
          }
        } catch (e) {
          // console.log(e);
          // Skip the message if decryption fails - its probably due to the user not having <roomId>_lockedKey. 
        }
      }
      else {
        unwrapped_messages[id] = new_messages[id];
      }
      localStorage.setItem(this.roomId + "_lastSeenMessage", id.slice(this.roomId.length));
    }
    return unwrapped_messages;
  }


  async wrapMessage(contents) {
    let enc_key;
    if (this.state.locked && this.state.keys.locked_key != null) {
      enc_key = this.state.keys.locked_key;
      // console.log(enc_key)
    } else if (contents.encrypted || !this.state.locked) {
      enc_key = this.state.keys.encryptionKey;
    }
    let msg;
    try {
      // console.log(enc_key)
      msg = { encrypted_contents: await this.encrypt(JSON.stringify(contents), enc_key, "string") }
    } catch {
      return { error: 'Could not send message. The encryption key seems to be corrupted.' }
    }
    return msg;

  }


  async addChatMessage(new_messages, old_messages = false) {
    let messages = [];
    let _text_verified = true;
    let _image_verified = true;
    let _imageMetadata_verified = true;
    let contacts = this.props.contacts;
    for (let id in new_messages) {
      try {
        if (new_messages[id].hasOwnProperty('contents')) {
          if (new_messages[id].encrypted === true) {
            let shared_key = this.state.keys.shared_key
            if (!this.areKeysSame(this.state.keys.exportable_pubKey, new_messages[id].sender_pubKey)) {
              shared_key = await this.deriveKey(this.state.keys.privateKey, await this.importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
            }
            if (new_messages[id].recipient && this.state.room_owner) {
              shared_key = await this.deriveKey(this.state.keys.privateKey, await this.importKey("jwk", new_messages[id].recipient, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
            }
            let decrypted_message = await this.decrypt(shared_key, new_messages[id].contents)
            if (decrypted_message.error && this.state.room_owner) {
              shared_key = await this.deriveKey(this.state.keys.room_privateKey, await this.importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []), "AES", false, ["encrypt", "decrypt"]);
              decrypted_message = await this.decrypt(shared_key, new_messages[id].contents)
            }
            if (new_messages[id].image != null) {
              const decrypted_image = await this.decrypt(shared_key, new_messages[id].image, "arrayBuffer");
              new_messages[id].image = decrypted_image.error ? '' : await this.getFileData(new File([decrypted_image.plaintext], "img", { type: "image/jpeg" }), "url")
              const decrypted_imageMetadata = await this.decrypt(shared_key, new_messages[id].imageMetaData)
              new_messages[id].imageMetaData = decrypted_imageMetadata.error ? {} : JSON.parse(decrypted_imageMetadata.plaintext);
            }
            new_messages[id].contents = decrypted_message.plaintext
            if (decrypted_message.error) {
              new_messages[id].whispered = true;
            }
          }
          else {
            const sign = new_messages[id].sign;
            const _image_sign = new_messages[id].image_sign
            const _imageMetadata_sign = new_messages[id].imageMetadata_sign;
            if (!sign || !_image_sign || !_imageMetadata_sign) {
              _text_verified = false
            }
            else {
              const sender_pubKey = await this.importKey("jwk", new_messages[id].sender_pubKey, "ECDH", true, []);
              const verificationKey = await this.deriveKey(this.state.keys.room_privateSignKey, sender_pubKey, "HMAC", false, ["sign", "verify"])
              _text_verified = await this.verify(verificationKey, sign, new_messages[id].contents)
              _image_verified = await this.verify(verificationKey, _image_sign, new_messages[id].image)
              _imageMetadata_verified = await this.verify(verificationKey, _imageMetadata_sign, typeof new_messages[id].imageMetaData === "object" ? JSON.stringify(new_messages[id].imageMetaData) : new_messages[id].imageMetaData)
            }
          }
          let user_key = new_messages[id].sender_pubKey.x + " " + new_messages[id].sender_pubKey.y;
          let username = "";
          let user_id = JSON.stringify(new_messages[id].sender_pubKey);
          const unnamed = ['Anonymous', 'No Name', 'Nameless', 'Incognito', 'Voldemort', 'Uomo Senza Nome', 'The Kid', 'Gunslinger', 'IT ', 'Person in Black', 'बेनाम', 'βλέμμυες', '混沌'];
          const local_username = contacts.hasOwnProperty(user_key) && contacts[user_key].split(' ')[0] !== 'User' && !unnamed.includes(contacts[user_key].trim()) ? contacts[user_key] : 'Unnamed';
          contacts[user_key] = local_username;
          const alias = new_messages[id].hasOwnProperty('sender_username') ? new_messages[id].sender_username : '';
          if (user_key === (this.state.keys.exportable_pubKey.x + " " + this.state.keys.exportable_pubKey.y) || local_username === 'Me') {
            contacts[user_key] = 'Me';
            username = 'Me';
            user_id = JSON.stringify(this.state.keys.exportable_pubKey);
          } else {
            if (alias !== '') {
              username = (local_username === alias || local_username === 'Unnamed') ? alias : alias + '  (' + local_username + ')';
            } else {
              username = '(' + local_username + ')';
            }
            if (this.areKeysSame(new_messages[id].sender_pubKey, this.state.keys.exportable_verifiedGuest_pubKey)) {
              username += "  (Verified)"
            } else if (this.areKeysSame(new_messages[id].sender_pubKey, this.state.keys.exportable_owner_pubKey)) {
              username += "  (Owner)"
            }
          }
          let new_message = { _id: id, text: new_messages[id].contents, user: { _id: user_id, name: username }, whispered: new_messages[id].encrypted, createdAt: parseInt(id.slice(-42), 2), verified: _text_verified && _image_verified && _imageMetadata_verified, image: new_messages[id].image, imageMetaData: typeof new_messages[id].imageMetaData === "object" ? new_messages[id].imageMetaData : JSON.parse(new_messages[id].imageMetaData) };

          if (!this.state.messages.some((message) => new_message._id === message._id && new_message.id !== 'system')) {
            messages.push(new_message);
          }
        }
      } catch (e) {
        console.log(e);
      }

    }
    this.props.updateContacts(contacts);

    if (old_messages) {
      const moreMessages = messages.length !== 0;
      if (!moreMessages) {
        messages.push({ _id: "no_old_message", text: "No older messages", system: true })
      }
      this.setState({ messages: [...messages, ...this.state.messages], moreMessages: moreMessages });
    } else {
      this.setState({ messages: [...this.state.messages, ...messages] });
    }
  }


  async getOldMessages() {
    try {
      this.setState({ loadingMore: true })
      const currentMessagesLength = this.state.messages.length;
      const fetch_resp = await fetch(ROOM_SERVER + this.roomId + "/oldMessages?currentMessagesLength=" + currentMessagesLength)
      let old_messages = await this.unwrapMessages(await fetch_resp.json());
      // console.log(old_messages)
      this.addChatMessage(old_messages, true);
      this.setState({ loadingMore: false })
    } catch (e) {
      console.log(e)
      this.sendSystemInfo('Could not fetch older messages');
    }
  }


  async sendMessage(message, whisper = false) {

    try {
      // If room has not been initalized, set system message

      if ("error" in this.state) {
        this.sendSystemInfo(this.state.error)
        this.setState({ moreMessages: false })
        return;
      }

      if (!whisper && this.state.keys.locked_key == null && this.state.locked) {

        this.sendSystemInfo('This room is restricted. A request to the Owner has already been sent. Until you are accepted you cannot chat in the room. You can still whisper the owner by pressing the user icon in the top right corner.')
        return;
      }
      let encrypted = (whisper && this.state.keys.shared_key != null) || this.state.reply_to;

      let contents = {}
      let msg = {}
      let shared_key = this.state.keys.shared_key;
      let file_inp = document.getElementById('fileInput');
      let file = file_inp.files.length > 0 ? await this.getFileData(await this.restrictPhoto(file_inp.files[0], 15, "image/jpeg", 0.92), encrypted ? 'arrayBuffer' : 'url') : null;
      // let imgId, imgKey, previewId, previewKey = '';
      let imgId = '', previewId = '', imgKey = '', previewKey = '', fullStorePromise = '', previewStorePromise = '';
      /*
      if (file != null) {
        let image_data = await this.saveImage(file_inp.files[0]);
        let imgKeys = image_data.full;
        imgId = imgKeys.id;
        imgKey = imgKeys.key;
        let previewKeys = image_data.preview;
        previewId = previewKeys.id;
        previewKey = previewKeys.key;
      }
      */
      if (file != null) {
        let image_data = await this.saveImage(file_inp.files[0]);
        imgId = image_data.full;
        imgKey = image_data.fullKey;
        previewId = image_data.preview;
        previewKey = image_data.previewKey;
        fullStorePromise = image_data.fullStorePromise;
        previewStorePromise = image_data.previewStorePromise;
      }
      else if (message[0].text === '') {
        return;
      }

      // If room owner wants to reply with an encrypted message to a particular user (or message sender), use a shared AES key between the user and that message sender
      if (this.state.reply_to) {
        shared_key = this.state.reply_encryptionKey;
        contents.recipient = JSON.parse(this.state.reply_to._id);
      }

      // Encrypt message with shared key between room owner and verified guest if the "Whisper" checkbox is selected or if the room owner wants to reply to a particular message with an encrypted message
      if (encrypted) {

        const _content = await this.encrypt(message[0].text, shared_key, "string");
        const encrypted_img = await this.encrypt(file, shared_key, "string");
        // const encrypted_imageMetadata = await this.encrypt(JSON.stringify({ imageId: imgId, imageKey: imgKey, previewId: previewId, previewKey: previewKey }), shared_key, "string");
        const encrypted_imageMetadata = await this.encrypt(JSON.stringify({ imageId: imgId, previewId: previewId, imageKey: imgKey, previewKey: previewKey }), shared_key, "string");

        contents = { ...contents, encrypted: true, contents: _content, sender_pubKey: this.state.keys.exportable_pubKey, image: encrypted_img, imageMetaData: encrypted_imageMetadata };
      }
      else {
        const _sign = await this.sign(this.state.keys.personal_signKey, message[0].text);
        const _image_sign = await this.sign(this.state.keys.personal_signKey, file);
        const _imageMetadata = { imageId: imgId, previewId: previewId, imageKey: imgKey, previewKey: previewKey }
        const _imageMetadata_string = JSON.stringify(_imageMetadata);
        // const _imageMetadata_sign = await this.sign(this.state.keys.personal_signKey, JSON.stringify(_imageMetadata))
        const _imageMetadata_sign = await this.sign(this.state.keys.personal_signKey, _imageMetadata_string)
        contents = { encrypted: false, contents: message[0].text, sender_pubKey: this.state.keys.exportable_pubKey, sign: _sign, image: file, image_sign: _image_sign, imageMetaData: _imageMetadata_string, imageMetadata_sign: _imageMetadata_sign };

      }
      contents.sender_username = this.state.username;
      msg = await this.wrapMessage(contents);
      if (msg.error) {
        this.sendSystemInfo(msg.error);
        return;
      }

      if (this.currentWebSocket) {

        // this.currentWebSocket.send(JSON.stringify(contents));      Version before doing E2EE
        this.currentWebSocket.send(JSON.stringify(msg));
        console.log(fullStorePromise, previewStorePromise);
        if (fullStorePromise !== '') {
          fullStorePromise.then(async (controlData) => {
            // console.log(controlData);
            let control_msg = await this.wrapMessage({ ...controlData, control: true });
            this.currentWebSocket.send(JSON.stringify(control_msg));
          });
        }
        if (previewStorePromise !== '') {
          previewStorePromise.then(async (controlData) => {
            let control_msg = await this.wrapMessage({ ...controlData, control: true });
            this.currentWebSocket.send(JSON.stringify(control_msg));
          });
        }

      } else {
        this.sendSystemMessage("Error: Lost connection")
      }

    } catch (error) {
      // console.log(e);
      this.sendSystemInfo('Could not send message');
      JwModal.open('room-response', 'Sending message failed, error from server: ' + error.message);
    }

    // Reset the 'reply_to' data once message is sent
    try {
      delete this.state.reply_to;
      delete this.state.reply_encryptionKey;
      this.removeInputFiles();
    } catch {
      // we ignore problems
    }
  }


  // ##########################   FUNCTIONS TO HANDLE ANY AND ALL CRYPTO  ####################################


  extractPubKey(privateKey) {
    try {
      let pubKey = { ...privateKey }
      delete pubKey.d;
      delete pubKey.dp;
      delete pubKey.dq;
      delete pubKey.q;
      delete pubKey.qi;
      pubKey.key_ops = []
      return pubKey;
    } catch (e) {
      console.log(e);
      return {};
    }
  }


  async generateKeys() {
    try {
      let keyPair = await window.crypto.subtle.generateKey(
        {
          name: "ECDH",
          namedCurve: "P-384"
        },
        true,
        ["deriveKey"]
      );

      return keyPair;
    }
    catch (e) {
      console.log(e);
      return { error: 'Failed to generate keys' }
    }
  }


  async importKey(format, key, type, extractable, keyUsages) {
    const keyAlgorithms = {
      ECDH: {
        name: "ECDH",
        namedCurve: "P-384"
      },
      AES: {
        name: "AES-GCM"
      },
      PBKDF2: "PBKDF2"
    }
    let _key;
    try {
      _key = await crypto.subtle.importKey(
        format,
        key,
        keyAlgorithms[type],
        extractable,
        keyUsages
      );
    } catch (error) {
      _key = { error: error };
    }
    return _key;
  }


  async deriveKey(privateKey, publicKey, type, extractable, keyUsages) {
    const keyAlgorithms = {
      AES: {
        name: "AES-GCM",
        length: 256
      },
      HMAC: {
        name: "HMAC",
        hash: "SHA-256",
        length: 256
      }
    }
    try {
      return await window.crypto.subtle.deriveKey(
        {
          name: "ECDH",
          public: publicKey
        },
        privateKey,
        keyAlgorithms[type],
        extractable,
        keyUsages
      );
    } catch (error) {
      console.log(error);
      return { error: "Could not derive keys" }
    }
  }


  async getImageKey(imageHash, _salt) {

    try {
      let keyMaterial = await this.importKey("raw", utils.base64ToArrayBuffer(decodeURIComponent(imageHash)), "PBKDF2", false, ["deriveBits", "deriveKey"]);

      // TODO - Support deriving from PBKDF2 in deriveKey function
      console.log(_salt)
      let key = await window.crypto.subtle.deriveKey(
        {
          "name": "PBKDF2",
          // salt: window.crypto.getRandomValues(new Uint8Array(16)),
          salt: _salt,
          "iterations": 100000, // small is fine, we want it snappy
          "hash": "SHA-256"
        },
        keyMaterial,
        { "name": "AES-GCM", "length": 256 },
        true,
        ["encrypt", "decrypt"]
      );
      // return key;
      return key;
    }
    catch (e) {
      console.log(e);
      return { error: e };
    }
  }


  async encrypt(contents, secret_key = null, outputType = "string", _iv = null) {
    try {
      if (contents === null) {
        return;
      }
      const iv = _iv === null ? window.crypto.getRandomValues(new Uint8Array(12)) : _iv;
      const algorithm = {
        name: "AES-GCM",
        iv: iv
      };
      let key = secret_key;
      let data = contents;
      const encoder = new TextEncoder();
      if (typeof contents === 'string') {
        data = encoder.encode(contents);
      }

      let encrypted;
      try {
        encrypted = await window.crypto.subtle.encrypt(algorithm, key, data);
      } catch (error) {
        console.log(error);
        return { error: "Encryption failed" }
      }
      return (outputType === 'string') ? { content: encodeURIComponent(utils.arrayBufferToBase64(encrypted)), iv: encodeURIComponent(utils.arrayBufferToBase64(iv)) } : { content: encrypted, iv: iv };
    } catch (e) {
      console.log(e);
      return { error: e };
    }
  }


  async decrypt(secretKey, contents, outputType = "string") {
    try {
      const ciphertext = typeof contents.content === 'string' ? utils.base64ToArrayBuffer(decodeURIComponent(contents.content)) : contents.content;
      const iv = typeof contents.iv === 'string' ? utils.base64ToArrayBuffer(decodeURIComponent(contents.iv)) : contents.iv;
      let decrypted = await window.crypto.subtle.decrypt(
        {
          name: "AES-GCM",
          iv: iv
        },
        secretKey,
        ciphertext
      );
      if (outputType === "string") {
        return { error: false, plaintext: new TextDecoder().decode(decrypted) };
      }
      return { error: false, plaintext: decrypted };
    } catch (e) {
      // console.log(e);
      return { error: true, plaintext: "(whispered)" };
    }
  }


  async sign(secretKey, contents) {
    try {
      const encoder = new TextEncoder();
      const encoded = encoder.encode(contents);
      let sign;
      try {
        sign = await window.crypto.subtle.sign(
          'HMAC',
          secretKey,
          encoded
        );
        return encodeURIComponent(utils.arrayBufferToBase64(sign));
      } catch (error) {
        console.log(error);
        return { error: "Failed to sign content" };
      }
    } catch (error) {
      console.log(error);
      return { error: error };
    }
  }


  async verify(secretKey, sign, contents) {
    try {
      const _sign = utils.base64ToArrayBuffer(decodeURIComponent(sign));
      const encoder = new TextEncoder();
      const encoded = encoder.encode(contents);
      try {
        let verified = await window.crypto.subtle.verify(
          'HMAC',
          secretKey,
          _sign,
          encoded
        );
        return verified;
      } catch (e) {
        return false;
      }
    } catch (e) {
      console.log(e);
      return false
    }
  }


  areKeysSame(key1, key2) {
    if (key1 != null && key2 != null && typeof key1 === 'object' && typeof key2 === 'object') {
      return key1['x'] === key2['x'] && key1['y'] === key2['y'];
    }
    return false;
  }


  // #######################   MISC HELPER FUNCTIONS   ###############################


  async getRoomCapacity() {
    fetch(ROOM_SERVER + this.roomId + "/getRoomCapacity", { credentials: 'include' }).then(resp => resp.json().then(data => data.capacity ? this.setState({ roomCapacity: data.capacity }) : this.setState({ adminError: true })));
  }


  updateRoomCapacity(roomCapacity) {
    fetch(ROOM_SERVER + this.roomId + "/updateRoomCapacity?capacity=" + roomCapacity, { credentials: 'include' }).then(data => JwModal.open('admin-response', 'this worked!'));
  }


  async getAdminData() {
    let request= {credentials: "include"};
    if (process.env.REACT_APP_ROOM_SERVER !== 's_socket.privacy.app' && this.state.room_owner) {
      let token_data = new Date().getTime().toString();
      let token_sign = await this.sign(this.state.keys.personal_signKey, token_data);
      request.headers= {authorization: token_data + "." + token_sign}
    }
    fetch(ROOM_SERVER + this.roomId + "/getAdminData", request).then(resp => resp.json().then(data => data.error ? this.setState({ adminError: true }) : this.setState({ roomCapacity: data.capacity, joinRequests: data.join_requests })))
  }


  saveUsername() {
    try {
      const newUsername = document.getElementById('username-input').value
      let user = this.state.changeUsername
      const user_pubKey = JSON.parse(user._id);
      let contacts = this.props.contacts
      let _messages = this.state.messages;
      _messages.forEach(message => {
        if (message.user._id === user._id) {
          message.user.name = message.user.name.replace('(' + contacts[user_pubKey.x + ' ' + user_pubKey.y] + ')', '(' + newUsername + ')');
        }
      });
      contacts[user_pubKey.x + ' ' + user_pubKey.y] = newUsername;
      this.setState({ changeUsername: { _id: '', name: '' }, messages: _messages });
      this.props.updateContacts(contacts);
      document.getElementById('change-username-close-btn').click();
    }
    catch (e) {
      console.log(e);
      return { error: e };
    }
  }


  getUsername() {
    const username = localStorage.getItem(this.roomId + '_username');
    return username === null ? '' : username;
  }


  async acceptVisitor(pubKey) {
    try {
      let updatedRequests = this.state.joinRequests;
      updatedRequests.splice(this.state.joinRequests.indexOf(pubKey), 1);
      // console.log(pubKey);
      const shared_key = await this.deriveKey(this.state.keys.privateKey, await this.importKey("jwk", JSON.parse(pubKey), "ECDH", false, []), "AES", false, ["encrypt", "decrypt"]);
      this.setState({ joinRequests: updatedRequests });
      const _encrypted_locked_key = await this.encrypt(JSON.stringify(this.state.keys.exportable_locked_key), shared_key, "string")
      // console.log("Will now fetch")
      fetch(ROOM_SERVER + this.roomId + "/acceptVisitor", {
        method: "POST",
        body: JSON.stringify({ pubKey: pubKey, lockedKey: JSON.stringify(_encrypted_locked_key) }),
        headers: {
          "Content-Type": "application/json"
        },
        credentials: 'include'
      });
    }
    catch (e) {
      console.log(e);
      return { error: e };
    }
  }


  async lockRoom() {
    try {
      if (this.state.keys.locked_key == null && this.state.room_admin) {
        const _locked_key = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
        const _exportable_locked_key = await window.crypto.subtle.exportKey("jwk", _locked_key);
        localStorage.setItem(this.roomId + '_lockedKey', JSON.stringify(_exportable_locked_key));
        const lock_success = (await (await fetch(ROOM_SERVER + this.roomId + "/lockRoom", { credentials: 'include' })).json()).locked;
        // console.log(lock_success);
        if (lock_success) {
          await (await this.acceptVisitor(JSON.stringify(this.state.keys.exportable_pubKey))).json();
          this.setState({ locked: true });
          window.location.reload();  // Need a better way to reload
          // await this.getJoinRequests();
        }
      }
    }
    catch (e) {
      console.log(e);
      return { error: e };
    }
  }


  async isRoomLocked() {
    try {
      const locked_json = (await (await fetch(ROOM_SERVER + this.roomId + "/roomLocked", { credentials: 'include' })).json());
      // console.log(locked)
      return locked_json.locked;
    }
    catch (e) {
      console.log(e);
      return { error: e };
    }
  }


  async getJoinRequests() {
    try {
      const joinRequests = (await (await fetch(ROOM_SERVER + this.roomId + "/getJoinRequests", { credentials: 'include' })).json())
      // console.log(joinRequests)
      joinRequests.error ? this.setState({ adminError: true }) : this.setState({ joinRequests: joinRequests.join_requests });
    } catch (e) {
      console.log(e);
    }
  }


  setMOTD() {
    try {
      if (this.state.room_owner) {
        const msg = document.getElementById('motd') && document.getElementById('motd').value !== "Enter Message of the Day here" ? document.getElementById('motd').value : '';
        fetch(ROOM_SERVER + this.roomId + "/motd", {
          method: "POST",
          body: JSON.stringify({ motd: msg }),
          headers: {
            "Content-Type": "application/json"
          }
        });
        this.setState({ motd: msg });
      }
    } catch (e) {
      console.log(e);
    }
    document.getElementById('motd-close-btn') && document.getElementById('motd-close-btn').click();
  }


  // handleReply() function is only available to room owners. If room owner selects "Reply To" on long pressing a message, this function sets state with shared keys for the owner and the message sender they want to reply to
  async handleReply(user) {
    try {
      if (this.state.room_owner) {
        const recipient_pubKey = await this.importKey("jwk", JSON.parse(user._id), "ECDH", true, []);
        // const reply_encryptionKey = await this.deriveSecretKey(this.state.keys.privateKey, recipient_pubKey)
        const reply_encryptionKey = await this.deriveKey(this.state.keys.privateKey, recipient_pubKey, "AES", false, ["encrypt", "decrypt"])
        // const reply_encryptionKey = this.state.sharedKeys[JSON.parse(user._id)];
        this.setState({ reply_encryptionKey: reply_encryptionKey, reply_to: user });
        JwModal.open('whisper-user');
      }
    }
    catch (e) {
      console.log(e);
    }
  }


  // #########################    FUNCTIONS TO HANDLE ALL IMAGE PROCESSING   ###########################################


  // TODO - can be optimized (asynchronized more) to return the hashes once calculated and then do all the encryption stuff.
  async saveImage(image) {
    const previewImage = this.padImage(await (await this.restrictPhoto(image, 4096, "image/jpeg", 0.92)).arrayBuffer());
    const previewHash = await this.generateImageHash(previewImage);
    const fullImage = image.size > 15728640 ? this.padImage(await (await this.restrictPhoto(image, 15360, "image/jpeg", 0.92)).arrayBuffer()) : this.padImage(await image.arrayBuffer());
    const fullHash = await this.generateImageHash(fullImage);
    const previewStorePromise = this.storeImage(previewImage, previewHash.id, previewHash.key, 'p').then(_x => { if (_x.hasOwnProperty('error'))  this.sendSystemMessage('Could not store preview: ' + _x['error']); return _x; });
    const fullStorePromise = this.storeImage(fullImage, fullHash.id, fullHash.key, 'f').then(_x => { if (_x.hasOwnProperty('error'))  this.sendSystemMessage('Could not store full image: ' + _x['error']); return _x; });

    // return { full: { id: fullHash.id, key: fullHash.key }, preview: { id: previewHash.id, key: previewHash.key } }
    return { full: fullHash.id, preview: previewHash.id, fullKey: fullHash.key, previewKey: previewHash.key, fullStorePromise: fullStorePromise, previewStorePromise: previewStorePromise };
  }


  async storeImage(image, image_id, keyData, type) {

    const storeReqResp = await (await fetch(STORAGE_SERVER + "/storeRequest?name=" + image_id)).arrayBuffer();
    const encrypt_data = utils.extractPayload(storeReqResp);
    // console.log(encrypt_data)
    const key = await this.getImageKey(keyData, encrypt_data.salt);
    let storageToken, verificationToken;
    const data = await this.encrypt(image, key, "arrayBuffer", encrypt_data.iv);
    // console.log(data)
    const storageTokenReq = await (await fetch(ROOM_SERVER + this.roomId + '/storageRequest?size=' + data.content.byteLength)).json();
    if (storageTokenReq.hasOwnProperty('error')) {
      return { error: storageTokenReq.error }
    }
    // storageToken = new TextEncoder().encode(storageTokenReq.token);
    storageToken = JSON.stringify(storageTokenReq);
    const resp = await fetch(STORAGE_SERVER + "/storeData?type=" + type + "&key=" + encodeURIComponent(image_id),
      {
	method: "POST",
	body: utils.assemblePayload({
	  iv: encrypt_data.iv,
	  salt: encrypt_data.salt,
	  image: data.content,
	  storageToken: (new TextEncoder()).encode(storageToken),
	  vid: window.crypto.getRandomValues(new Uint8Array(48))
	})
      });
    const resp_json = await resp.json();
    // console.log("Response for " + type + ": ", resp_json)
    if (resp_json.hasOwnProperty('error')) {
      // TODO - why can't we throw exceptions?
      // Promise.reject(new Error('Server error on storing image (' + resp_json.error + ')'));
      return { error: 'Error: storeImage() failed (' + resp_json.error + ')' };
    }
    verificationToken = resp_json.verification_token;
    return { verificationToken: verificationToken, id: resp_json.image_id, type: type };
  }


  async generateImageHash(image) {
    try {
      const digest = await crypto.subtle.digest('SHA-512', image);
      const _id = digest.slice(0, 32);
      const _key = digest.slice(32);
      return { id: encodeURIComponent(utils.arrayBufferToBase64(_id)), key: encodeURIComponent(utils.arrayBufferToBase64(_key)) };
    } catch (e) {
      console.log(e);
      return {};
    }
  }


  async retrieveImagePreview(msgId) {
    try {
      const imageHash = this.state.messages.find(msg => msg._id === msgId).imageMetaData;
      // console.log(imageHash)
      const image_id = imageHash.previewId;
      const imageFetch = await (await fetch(STORAGE_SERVER + "/fetchImage?id=" + encodeURIComponent(image_id))).arrayBuffer();
      const data = utils.extractPayload(imageFetch);
      const iv = data.iv;
      const salt = data.salt;
      const image_key = await this.getImageKey(imageHash.previewKey, salt);
      const encrypted_image = data.image;
      const img = await this.decrypt(image_key, { content: encrypted_image, iv: iv }, "arrayBuffer");
      //console.log(img)
      //console.log("data:image/jpeg;base64,"+this.arrayBufferToBase64(img.plaintext))
      if (!img.error) {
        return "data:image/jpeg;base64," + utils.arrayBufferToBase64(img.plaintext);
      }
      return null;
    } catch (e) {
      console.log(e);
      return null;
    }
  }


  async retrieveData(msgId) {
    // console.log(this.state.controlMessages)
    const imageMetaData = this.state.messages.find(msg => msg._id === msgId).imageMetaData;
    // console.log(imageHash)
    const image_id = imageMetaData.previewId;
    const control_msg = this.state.controlMessages.find(msg => msg.hasOwnProperty('id') && msg.id.startsWith(image_id));
    console.log(imageMetaData, image_id, control_msg, this.state.controlMessages);
    if (!control_msg) {
      return {'error': 'Failed to fetch data - missing control message for that image'};
    }
    const imageFetch = await (await fetch(STORAGE_SERVER + "/fetchData?id=" + encodeURIComponent(control_msg.id) + '&verification_token=' + control_msg.verificationToken)).arrayBuffer();
    const data = utils.extractPayload(imageFetch);
    console.log(data);
    const iv = data.iv;
    const salt = data.salt;
    const image_key = await this.getImageKey(imageMetaData.previewKey, salt);
    const encrypted_image = data.image;
    const padded_img = await this.decrypt(image_key, { content: encrypted_image, iv: iv }, "arrayBuffer");
    const img = this.unpadData(padded_img.plaintext);
    //console.log(img)
    //console.log("data:image/jpeg;base64,"+this.arrayBufferToBase64(img.plaintext))
    if (img.error) {
      console.log('(Image error: ' + img.error + ')');
      throw new Error('Failed to fetch data - authentication or formatting error');
    }
    return {'url' : "data:image/jpeg;base64," + utils.arrayBufferToBase64(img) };
  }


  async getFileData(file, outputType) {
    try {
      let reader = new FileReader();
      if(file.size === 0){
        return null;
      }
      outputType === 'url' ? reader.readAsDataURL(file) : reader.readAsArrayBuffer(file);
      let promise = new Promise((resolve, reject) => {
        reader.onloadend = (event) => {
          let the_blob = reader.result;
          resolve(the_blob);
        };
      });
      return promise;
    } catch (e) {
      console.log(e);
      return null;
    }
  }


  async restrictPhoto(photo, maxSize, imageType, qualityArgument) {
    // imageType default should be 'image/jpeg'
    // qualityArgument should be 0.92 for jpeg and 0.8 for png (MDN default)
    maxSize = maxSize * 1024; // KB
    // console.log(`Target size is ${maxSize} bytes`);
    let _c = await this.readPhoto(photo);
    var _b1 = await new Promise((resolve) => {
      _c.toBlob(resolve, imageType, qualityArgument);
    });
    // workingDots();
    // console.log(`start canvas W ${_c.width} x H ${_c.height}`)
    let _size = _b1.size;
    if (_size <= maxSize) {
      // console.log(`Starting size ${_size} is fine`);
      return _b1;
    }
    // console.log(`Starting size ${_size} too large, start by reducing image size`);
    // compression wasn't enough, so let's resize until we're getting close
    let _old_size;
    let _old_c;
    while (_size > maxSize) {
      _old_c = _c;
      _c = this.scaleCanvas(_c, .5);
      _b1 = await new Promise((resolve) => {
        _c.toBlob(resolve, imageType, qualityArgument);
      });
      _old_size = _size;
      _size = _b1.size;
      // workingDots();
      // console.log(`... reduced to W ${_c.width} x H ${_c.height} (to size ${_size})`);
    }

    // we assume that within this width interval, storage is roughly prop to area,
    // with a little tuning downards
    let _ratio = maxSize / _old_size;
    let _maxIteration = 12;  // to be safe
    // console.log(`... stepping back up to W ${_old_c.width} x H ${_old_c.height} and will then try scale ${_ratio.toFixed(4)}`);
    let _final_c;
    do {
      _final_c = this.scaleCanvas(_old_c, Math.sqrt(_ratio) * 0.99);  // we're targeting within 1%
      _b1 = await new Promise((resolve) => {
        _final_c.toBlob(resolve, imageType, qualityArgument);
        // console.log(`(generating blob of requested type ${imageType})`);
      });
      // workingDots();
      // console.log(`... fine-tuning to W ${_final_c.width} x H ${_final_c.height} (size ${_b1.size})`);
      _ratio *= (maxSize / _b1.size);
    } while (((_b1.size > maxSize) || ((Math.abs(_b1.size - maxSize) / maxSize) > 0.02)) && (--_maxIteration > 0));  // it's ok within 2%

    // workingDots();
    // console.log(`... ok looks like we're good now ... final size is ${_b1.size} (which is ${((_b1.size * 100) / maxSize).toFixed(2)}% of cap)`);

    // document.getElementById('the-original-image').width = _final_c.width;  // a bit of a hack
    return _b1;
  }


  async readPhoto(photo) {
    const canvas = document.createElement('canvas');
    const img = document.createElement('img');

    // create img element from File object
    img.src = await new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target.result);
      reader.readAsDataURL(photo);
    });
    await new Promise((resolve) => {
      img.onload = resolve;
    });

    // console.log("img object");
    // console.log(img);
    // console.log("canvas object");
    // console.log(canvas);

    // draw image in canvas element
    canvas.width = img.width;
    canvas.height = img.height;
    canvas.getContext('2d').drawImage(img, 0, 0, canvas.width, canvas.height);
    return canvas;
  };


  scaleCanvas(canvas, scale) {
    const scaledCanvas = document.createElement('canvas');
    scaledCanvas.width = canvas.width * scale;
    scaledCanvas.height = canvas.height * scale;
    // console.log(`#### scaledCanvas target W ${scaledCanvas.width} x H ${scaledCanvas.height}`);
    scaledCanvas
      .getContext('2d')
      .drawImage(canvas, 0, 0, scaledCanvas.width, scaledCanvas.height);
    // console.log(`#### scaledCanvas actual W ${scaledCanvas.width} x H ${scaledCanvas.height}`);
    return scaledCanvas;
  };


  padImage(image_buffer) {
    let _sizes = [128, 256, 512, 1024, 2048, 4096];   // in KB
    _sizes = _sizes.map((size) => size * 1024);
    const image_size = image_buffer.byteLength;
    // console.log('BEFORE PADDING: ', image_size)
    let _target;
    if (image_size < _sizes[_sizes.length - 1]) {
      for (let i = 0; i < _sizes.length; i++) {
        if (image_size + 21 < _sizes[i]) {
          _target = _sizes[i];
          break;
        }
      }
    }
    else {
      _target = (Math.ceil(image_size / (1024 * 1024))) * 1024 * 1024;
      if (image_size + 21 >= _target) {
        _target += 1024;
      }
    }
    let _padding_array = [128];
    _target = _target - image_size - 21;
    // We will finally convert to Uint32Array where each element is 4 bytes
    // So we need (_target/4) - 6 array elements with value 0 (128 bits or 16 bytes or 4 elements to be left empty,
    // last 4 bytes or 1 element to represent the size and 1st element is 128 or 0x80)
    for (let i = 0; i < _target; i++) {
      _padding_array.push(0);
    }
    // _padding_array.push(image_size);
    const _padding = new Uint8Array(_padding_array).buffer;
    // console.log('Padding size: ', _padding.byteLength)
    let final_data = utils._appendBuffer(image_buffer, _padding);
    final_data = utils._appendBuffer(final_data, new Uint32Array([image_size]).buffer);
    // console.log('AFTER PADDING: ', final_data.byteLength)
    return final_data;
  }


  unpadData(data_buffer) {
    // console.log(data_buffer, typeof data_buffer)
    const _size = new Uint32Array(data_buffer.slice(-4))[0];
    return data_buffer.slice(0, _size);
  }


  // #######################    FUNCTIONS TO MANIPULATE UI/FOR GIFTED-CHAT    #################################

  /*
  renderBubble() is a custom function to style messages.
  TODO - Have all styles in a separate file and import here to make it easier to experiment and make changes
  */

  renderBubble(props) {
    let newProps = {}
    let current_user_key;
    try {
      current_user_key = JSON.parse(props.currentMessage.user._id);
      //newProps.position = this.state.contacts[current_user_key.x + ' ' + current_user_key.y] === 'Me' ? 'right' : 'left';
    } catch (error) {
      // onsole.log(props.currentMessage.user._id)
    }
    try {
      if (props.currentMessage.whispered) {
        newProps = {
          wrapperStyle: {
            left: {
              backgroundColor: "yellow",
            },
            right: {
              backgroundColor: "yellow",
            }
          },
          textStyle: {
            left: {
              fontStyle: "italic",
              color: "Black",
            },
            right: {
              fontStyle: "italic",
              color: "black",
            }
          }
        }
      }
      else if (props.currentMessage.verified === false) {
        newProps = {
          wrapperStyle: {
            left: {
              borderColor: "red",
              borderStyle: "solid",
              borderWidth: "4px",
            },
            right: {
              borderColor: "red",
              borderStyle: "solid",
              borderWidth: "4px",
            }
          }
        }
      }
      else if (props.currentMessage.info) {
        newProps = {
          wrapperStyle: {
            left: {
              borderColor: "black",
              borderStyle: "solid",
              borderWidth: "2px",
            }
          },
          textStyle: {
            left: {
              fontStyle: "italic",
              color: "Black",
            },
          }
        }
      }
      // else if (props.currentMessage.user._id === JSON.stringify(this.state.keys.exportable_room_pubKey)) {
      else if (this.areKeysSame(current_user_key, this.state.keys.exportable_owner_pubKey)) {
        newProps = {
          wrapperStyle: {
            left: {
              borderColor: "#2ECC40",
              borderStyle: "solid",
              borderWidth: "4px",
            },
            right: {
              borderColor: "#2ECC40",
              borderStyle: "solid",
              borderWidth: "4px",
            }
          }
        }
      }
      //else if (props.currentMessage.user._id === JSON.stringify(this.state.keys.exportable_verifiedGuest_pubKey)) {
      else if (this.areKeysSame(current_user_key, this.state.keys.exportable_verifiedGuest_pubKey)) {
        newProps = {
          wrapperStyle: {
            left: {
              borderColor: "#B10DC9",
              borderStyle: "solid",
              borderWidth: "4px",
            },
            right: {
              borderColor: "#B10DC9",
              borderStyle: "solid",
              borderWidth: "4px",
            }
          }
        }
      }
    } catch (e) {
      console.log(e);
    }
    // For username on top
    return (
      <View style={{ width: '90%' }}>
        {(this.isSameUser(props.currentMessage, props.previousMessage) && this.isSameDay(props.currentMessage, props.previousMessage)) || this.areKeysSame(current_user_key, this.state.keys.exportable_pubKey) ? null : <Text numberOfLines={1} style={{ width: '50vw', paddingBottom: 3, left: 0, fontSize: 12, backgroundColor: 'transparent', color: '#aaa' }}>{props.currentMessage.user.name}</Text>}
        <Bubble
          {...props}
          {...newProps} />
      </View >
    )
    /*
    return (
      <Bubble
        {...props}
        {...newProps} />
    )
    */
  }


  // Only needed for username on top
  isSameUser(currentMessage, diffMessage) {
    return (diffMessage &&
      diffMessage.user &&
      currentMessage &&
      currentMessage.user &&
      diffMessage.user._id === currentMessage.user._id);
  }


  isSameDay(currentMessage, diffMessage) {
    if (!currentMessage || !diffMessage || (!currentMessage.createdAt && !diffMessage.createdAt)) {
      return false;
    }
    let currDt = new Date(currentMessage.createdAt);
    let diffDt = new Date(diffMessage.createdAt);
    return (currDt.getDate() - diffDt.getDate() === 0) && (currDt.getMonth() - diffDt.getMonth() === 0) && (currDt.getFullYear() - diffDt.getFullYear() === 0);
  }


  promptUsername(user) {
    try {
      const userId = JSON.parse(user._id);
      JwModal.open('change-username');
      this.setState({ changeUsername: { _id: user._id, name: this.props.contacts[userId.x + ' ' + userId.y] } });
    } catch (e) {
      console.log(e);
    }
  }


  renderAttachmentIcon() {
    try {
      return (<div>
        <div style={{ height: '0px', width: '0px', overflow: 'hidden' }}>
          <input type="file" id="fileInput" name="file-input" onChange={(event) => this.previewImage(event.target.files[0])} />
        </div>
        <img id='attachment-icon' src={attach_img} onClick={() => this.chooseFile()} alt='Attchment Icon'></img></div>)
    } catch (e) {
      console.log(e);
      return null;
    }
  }


  renderImage(imageProps) {
    if (typeof imageProps.currentMessage.image === 'string') {
      return <View><img className='msgImg' onClick={() => this.openPreview(imageProps.currentMessage._id)} src={imageProps.currentMessage.image} alt='Previwed Image'></img></View>
    }
    return null;
  }


  async openPreview(msgId) {
    try {
      document.getElementById('image_overlay').style.display = 'block';
      // this.retrieveImagePreview(msgId).then((url) => {
      this.retrieveData(msgId).then((data) => {
	if (data.hasOwnProperty('error')) {
	  this.sendSystemMessage('Could not open image: ' + data['error']);
	  document.getElementById('image_overlay').style.display = 'none';
	} else {
	  let url = data['url'];
          document.getElementById('preview_img').classList.remove('center');
          document.getElementById('preview_img').innerHTML = '<img src=url style="position: absolute; display: block; left: 0; right :0; top: 0; bottom: 0; margin: auto; max-height:80%; max-width: 100%; z-index:2; object-fit: contain"></img>'.replace('url', url);
	}
      })
    } catch (error) {
      console.log('openPreview() exception: ' + error.message);
      this.sendSystemMessage('Could not open image (' + error.message + ')');
      document.getElementById('image_overlay').style.display = 'none';
    }
  }


  renderChatFooter() {
    return this.state.imgUrl ? <View style={{ borderTopStyle: 'solid', borderTopColor: 'rgb(178, 178, 178)', borderTopWidth: '1px', minHeight: '50px' }}><button className="close-btn" onClick={() => { this.removeInputFiles() }}>&#10006;</button><img id='previewImage' width='150px' src={this.state.imgUrl} alt='Image preview'></img></View> : null
  }


  removeInputFiles() {
    if (document.getElementById('fileInput')) {
      document.getElementById('fileInput').value = '';
    }
    this.setState({ imgUrl: false })
  }


  chooseFile() {
    document.getElementById('fileInput') && document.getElementById('fileInput').click();
  }


  async previewImage(photo) {
    try {
      if (photo) {
        const b64url = await new Promise((resolve) => {
          const reader = new FileReader();
          reader.onload = (e) => resolve(e.target.result);
          reader.readAsDataURL(photo);
        });
        this.setState({ imgUrl: b64url })
      }
    } catch (e) {
      console.log(e);
    }
  }


  async selectRoom() {
    try {
      this.setState({ messages: [] })
      await this.loadPersonalKeys();
      this.join();
      // const locked = await this.isRoomLocked();
      const username = this.getUsername();
      // this.setState({ locked: locked, username: username });
      this.setState({ username: username })
      const images = document.querySelectorAll('.msgImg');

      images.forEach(el => el.addEventListener('touchforcechange', event => {
        event.preventDefault();
      }));
      let rooms = this.props.rooms;
      if (!rooms.hasOwnProperty(this.roomId)) {
        rooms[this.roomId] = { name: 'Room ' + (Object.keys(rooms).length + 1).toString() };
        this.props.updateRoomNames(rooms)
      }
    } catch (e) {
      console.log(e);
    }
  }


  renderTime(props) {
    let return_str = '';
    try {
      // Reference from https://stackoverflow.com/questions/32199998/check-if-date-is-today-was-yesterday-or-was-in-the-last-7-days
      let months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
      let dt = new Date(props.currentMessage.createdAt);
      let date = dt.getDate();
      let month = months[dt.getMonth()];
      let diffDays = new Date().getDate() - date;
      let diffMonths = new Date().getMonth() - dt.getMonth();
      let diffYears = new Date().getFullYear() - dt.getFullYear();

      if (diffYears === 0 && diffDays === 0 && diffMonths === 0) {
        return_str = "Today";
      } else if (diffYears === 0 && diffDays === 1) {
        return_str = "Yesterday";
      } else if (diffYears >= 1) {
        return_str = month + " " + date + ", " + dt.getFullYear();
      } else {
        return_str = month + " " + date;
      }
      return_str += ", " + dt.toLocaleTimeString([], { hour12: true, hour: 'numeric', minute: 'numeric' })
    } catch (e) {
      console.log(e);
      return_str = ''
    }
    return (<View style={{
      marginLeft: 10,
      marginRight: 10,
    }}
    >
      <Text
        style={{
          fontSize: 12,
          backgroundColor: 'transparent',
          textAlign: 'right',
          color: props.currentMessage.whispered || props.position === 'left' ? '#aaa' : 'white'
        }}
      >{return_str}
      </Text>
    </View>);
  }


  async componentDidMount() {
    try {
      if (localStorage.getItem(this.roomId) === null && this.roomId !== '') {
        JwModal.open('lastvisit-empty');
      }
    } catch (error) {
      console.log('Error in componentDidMount()')
      console.log(error)
    }

    if (!(this.state.keys.exportable_pubKey || this.state.error) && localStorage.getItem(this.roomId) !== null) {
      try {
        this.selectRoom(this.roomId);
        // this.addEventListeners();      TODO
      } catch (e) {
        console.log(e);
        this.sendSystemInfo('Could not enter the room')
      }
    }
  }


  render() {
    return (this.state.keys.exportable_pubKey || this.state.error || localStorage.getItem(this.roomId) === null ? (
      <View style={{ width: "100%", height: "100%", flex: 1, display: this.props.className === 'hidden' && window.location.pathname !== '/' + this.props.roomId + '/admin' ? 'none' : null }}>
        <View style={{ width: "100%", height: "100%", flex: 1, display: this.props.className === 'hidden' ? 'none' : null }}>
        <JwModal id="room-response">
          <button className='admin-button gray-btn' onClick={JwModal.close('admin-response')}>Close</button>
        </JwModal>
          <JwModal id="change-username">
            <label htmlFor="username-input" style={{ fontSize: "16px" }}><Trans id='change username label'>Change Username</Trans></label>
            <br />
            <input type="text" id='username-input' placeholder="Enter Username Here" defaultValue={this.state.changeUsername.name} onFocus={(event) => event.target.select()} autoFocus />
            <br />
            <button className='admin-button green-btn' id='change-username-save-btn' onClick={() => { this.saveUsername() }}><Trans id='save button text'>Save</Trans></button>
            <button className='admin-button gray-btn' id='change-username-close-btn' onClick={JwModal.close('change-username')}><Trans id='cancel button text'>Cancel</Trans></button>
            <button className='admin-button green-btn' id='change-username-me-btn' onClick={() => {
              document.getElementById('username-input').value = 'Me';
              this.saveUsername();
	     }}><Trans id='change username me button text'>Me</Trans></button>
          </JwModal>
          <JwModal id='whisper-user'>
            {this.state.reply_to ?
              <div>
                <Trans id='whisper header'>Whisper to {this.props.contacts[JSON.parse(this.state.reply_to._id).x + ' ' + JSON.parse(this.state.reply_to._id).y]}</Trans>
                <br />
                <br />
                <textarea rows={5} cols={50} id='whisper-text'></textarea>
                <br />
                <button className='admin-button green-btn' id='send-whisper-btn' onClick={(e) => {
                  this.sendMessage([{ text: document.getElementById('whisper-text').value }]);
                  JwModal.close('whisper-user')(e);
                }}><Trans id='send button text'>Send</Trans></button>
                <button className='admin-button gray-btn' onClick={(e) => {
                  JwModal.close('whisper-user')(e);
                  delete this.state.reply_to;
                  delete this.state.reply_encryptionKey;
                }
                }><Trans id='cancel button text'>Cancel</Trans></button>
                <br />
              </div> : null}
          </JwModal>
          <JwModal id={'user-info-' + this.roomId}>
            <h2>{this.props.roomName}</h2>
            {this.state.motd !== '' && <Trans id='motd text'>Message of the day: {this.state.motd}</Trans>}
            <br />
            {!this.state.room_owner ?
              <div>
                Whisper to room owner.
                <br />
                <br />
                <textarea rows={5} cols={50} id='whisper-text' placeholder='Whisper to owner'></textarea>
                <br />
              </div> : null}
            {!this.state.room_owner ? <button className='admin-button green-btn' id='send-whisper-btn' onClick={(e) => {
              this.sendMessage([{ text: document.getElementById('whisper-text').value }], true);
              JwModal.close('user-info-' + this.roomId)(e)
            }}>Send</button> : null}
            <button className='admin-button gray-btn' onClick={JwModal.close('user-info-' + this.roomId)}>Close</button>
          </JwModal>
          <JwModal id='lock-info-modal'>
            <h2>{this.props.roomName}</h2>
            <br />
            {this.state.locked && "The green 'lock' icon indicates this room is ‘restricted’ by the Owner. Only accepted participants can send and receive chats. Remember to make sure you don’t lose your locally stored keys, because if you do, the Owner will have to accept you again."}
            <br />
            <br />
            <button className='admin-button gray-btn' id='lock-info-close-btn' onClick={JwModal.close('lock-info-modal')}>Close</button>
          </JwModal>
          <JwModal id='lastvisit-empty'>
            <Trans id='first visit modal message'>Welcome! If this is the first time you’ve been to this room, enter your username for this room and press ‘Ok’ and we we will generate fresh cryptographic keys that are unique to you and to this room. If you have already been here, then you might want to load your keys from your backup - press ‘Cancel’ and we’ll take you to the ‘Home’ tab.</Trans>
            <br />
            <br />
            <input type="text" id='public-username-input' placeholder="Enter Username Here" onFocus={(event) => event.target.select()} autoFocus />
            <br />
            <button className='admin-button green-btn' id='acknowledge-localstorage-btn' onClick={(e) => {
              localStorage.setItem(this.roomId + '_username', document.getElementById('public-username-input') && document.getElementById('public-username-input').value)
              JwModal.close('lastvisit-empty')(e);
              this.selectRoom(this.roomId);
            }}><Trans id='ok button text'>Ok</Trans></button>
            <button className='admin-button green-btn' id='cancel-localstorage-btn' onClick={(e) => {
              window.location.href = '{ process.env.PUBLIC_URL }'
            }}><Trans id='cancel button text'>Cancel</Trans></button>
          </JwModal>
          <GiftedChat
            messages={this.state.messages}
            onSend={messages => this.sendMessage(messages)}
            // timeFormat='L LT'
            user={{ _id: JSON.stringify(this.state.keys.exportable_pubKey) }}
            inverted={false}
            alwaysShowSend={true}
            loadEarlier={this.state.moreMessages}
            isLoadingEarlier={this.state.loadingMore}
            onLoadEarlier={() => { return this.getOldMessages() }}
            renderActions={() => { return this.renderAttachmentIcon() }}
            // renderUsernameOnMessage={true}
            // infiniteScroll={true}   // This is not supported for web yet
            renderMessageImage={(props) => { return this.renderImage(props) }}
            scrollToBottom={true}
            showUserAvatar={true}
            onPressAvatar={(context) => { return this.promptUsername(context) }}
            onLongPressAvatar={(context) => { return this.handleReply(context) }}
            renderChatFooter={() => this.renderChatFooter()}
            renderBubble={(props) => { return this.renderBubble(props) }}
            // onPress={(context, message) => { return this.handleReply(message.user) }}
            // textInputProps={this.getInputPlaceHolder()}
            onLongPress={() => false}
            renderTime={(props) => this.renderTime(props)}
          />
        </View >
        { (this.state.room_admin || process.env.REACT_APP_ROOM_SERVER !== 's4.privacy.app') && <Route exact path={"/" + this.props.roomId + "/admin"} children={({ match }) => (
          <Admin
            id={this.state.locked + this.state.motd}
            roomName={this.props.roomName}
            className={!match ? 'hidden' : null}
            updateAdmin={this.getAdminData}
            updateContacts={(contacts) => this.props.updateContacts(contacts)}
            adminError={this.state.adminError}
            roomCapacity={this.state.roomCapacity}
            locked={this.state.locked}
            joinRequests={this.state.joinRequests}
            contacts={this.props.contacts}
            exportable_pubKey={this.state.keys.exportable_pubKey}
            motd={this.state.motd}
            updateRoomCapacity={(roomCapacity) => this.updateRoomCapacity(roomCapacity)}
            acceptVisitor={(pubKey) => this.acceptVisitor(pubKey)}
            lockRoom={() => this.lockRoom()}
            setMOTD={() => this.setMOTD()} />
        )}
        />}
      </View>) : <div><Trans id='loading room text'>Loading room...{this.roomId}</Trans></div>)
  }
}

export default Room;
