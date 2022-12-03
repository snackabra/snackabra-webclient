import * as React from "react"
import config from "../config";
// import * as utils from "../utils/utils";
// import { areKeysSame, deriveKey, encrypt, importKey, sign } from "../utils/crypto";

import { base64ToArrayBuffer, arrayBufferToBase64, areKeysSame, deriveKey, encrypt, importKey, sign } from "snackabra";

const RoomContext = React.createContext(undefined);
let ROOM_API = config.ROOM_API

export const RoomProvider = ({ children }) => {

  const reserved_paths = ['', 'guide', 'settings'];

  const [rooms, setRooms] = React.useState({});
  const [roomMetadata, setRoomMetadata] = React.useState({});
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [moreMessages, setMoreMessages] = React.useState(true);
  const [motd, setMotd] = React.useState('');
  const [locked, setLocked] = React.useState(false);
  const [isVerifiedGuest, setIsVerifiedGuest] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState(null);
  const [replyEncryptionKey, setReplyEncryptionKey] = React.useState({});
  const [username, setUsername] = React.useState({});
  const [ownerRotation, setOwnerRotation] = React.useState(null);
  const [roomCapacity, setRoomCapacity] = React.useState(2);
  const [activeRoom, setActiveRoom] = React.useState("");
  const [activeRooms, setActiveRooms] = React.useState([]);
  const [adminError, setAdminError] = React.useState(false);
  const [roomOwner, setRoomOwner] = React.useState(false);
  const [keys, setKeys] = React.useState({});
  const [changeUsername, setChangeUsername] = React.useState('');
  const [joinRequests, setJoinRequests] = React.useState({});
  const [roomAdmin, setRoomAdmin] = React.useState(false);
  const [messages, setMessages] = React.useState({});
  const [showAdminTab, setShowAdminTab] = React.useState(false);
  const [contacts, setContacts] = React.useState(localStorage.getItem('contacts') ? JSON.parse(localStorage.getItem('contacts')) : {});


  React.useEffect(() => {
    processLocalStorage()
  }, [])

  const getRooms = () => {
    let _rooms = {}
    try {
      if (localStorage.getItem('rooms')) {
        _rooms = JSON.parse(localStorage.getItem('rooms'))
        Object.keys(_rooms).forEach(room => {
          if (typeof _rooms[room] === 'string') {
            _rooms[room] = { name: _rooms[room] };
          }
        })
      }
      let counter = Math.max(Object.keys(_rooms).length, 1);
      for (const room in _rooms) {
        if (!localStorage.hasOwnProperty(room)) {
          delete _rooms[room];
        }
      }
      Object.keys(localStorage).forEach((room) => {
        //console.log(room.split('_').slice(-1))
        if (!(_rooms.hasOwnProperty(room) || room === 'contacts' || room.split('_').slice(-1)[0] === 'lockedKey' || room.split('_').slice(-1)[0] === 'owner' || room.split('_').slice(-1)[0] === 'room' || room.split('_').slice(-1)[0] === 'username' || room === 'rooms' || room === 'lastvisit' || room.split('_').slice(-1)[0] === 'lastSeenMessage')) {
          _rooms[room] = { name: 'Room ' + counter };
          counter += 1;
        }
      });
      const _currentRoom = window.location.pathname.split('/')[1];
      if (!_rooms.hasOwnProperty(_currentRoom) && isValidRoomId(_currentRoom)) {
        _rooms[_currentRoom] = { name: 'Room ' + counter };
        counter += 1;
      }
      fetch(ROOM_API + '/getLastMessageTimes', {
        method: 'POST',
        body: JSON.stringify(Object.keys(_rooms))
      }).then(res => res.json().then(message_times => {
        Object.keys(_rooms).forEach(room => {
          _rooms[room]['lastMessageTime'] = message_times[room];
          _rooms[room]['unread'] = (!localStorage.hasOwnProperty(room + '_lastSeenMessage') || (localStorage.hasOwnProperty(room + '_lastSeenMessage') && parseInt(localStorage.getItem(room + '_lastSeenMessage'), 2) < parseInt(message_times[room], 2))) && message_times[room] !== '0';
        })
        setRooms(_rooms)
        localStorage.setItem('rooms', JSON.stringify(_rooms))
      }))
      localStorage.setItem('rooms', JSON.stringify(_rooms))
      return _rooms;
    } catch (e) {
      console.log(e);
    }
  }

  const goToRoom = (roomId, isAdmin) => {
    if (isValidRoomId(roomId) && !activeRooms.includes(roomId)) {
      setActiveRooms([...activeRooms, roomId]);
    }
    setActiveRoom(roomId);
    setShowAdminTab(isValidRoomId(roomId) && isAdmin)
  }

  const isValidRoomId = (roomId) => {
    return !reserved_paths.includes(roomId) && roomId.length === 64;
  }

  const updateContacts = (contacts) => {
    setContacts(contacts)
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }
  // TODO this is corrupting the local storage
  const updateRoomNames = (rooms) => {
    localStorage.setItem('rooms', JSON.stringify(rooms))
    processLocalStorage();
  }

  const sortRooms = (rooms) => {
    return Object.entries(rooms).sort((a, b) => {
      if (parseInt(a[1]['lastMessageTime'], 2) > parseInt(b[1]['lastMessageTime'], 2)) {
        return -1;
      } else if (parseInt(a[1]['lastMessageTime'], 2) < parseInt(b[1]['lastMessageTime'], 2)) {
        return 1;
      }
      return a[1]['name'].toLowerCase().localeCompare(b[1]['name'].toLowerCase(), undefined, { numeric: true });
    })
  }

  const processLocalStorage = () => {
    const _rooms = {};
    Object.keys(localStorage).forEach((key) => {
      if (key !== 'rooms' && key !== 'contacts') {
        const _roomName = key.slice(0, 64);
        const _type = key.length > 64 ? key.slice(65) : 'key';
        _rooms[_roomName] = { ..._rooms[_roomName] };
        _rooms[_roomName][_type] = localStorage.getItem(key);
      }
    });
    const _roomMetadata = localStorage.hasOwnProperty('rooms') ? JSON.parse(localStorage.getItem('rooms')) : {}
    const _contacts = localStorage.hasOwnProperty('contacts') ? JSON.parse(localStorage.getItem('contacts')) : {};
    setRooms(_rooms);
    setContacts(_contacts);
    setRoomMetadata(_roomMetadata)
  }

  const generateRoomId = async (x, y) => {
    console.trace("generateRoomId() should not be called")
    // let xBytes = utils.base64ToArrayBuffer(utils.decodeB64Url(x));
    // let yBytes = utils.base64ToArrayBuffer(utils.decodeB64Url(y));
    // let roomBytes = utils._appendBuffer(xBytes, yBytes);
    // let roomBytesHash = await window.crypto.subtle.digest("SHA-384", roomBytes);
    // return utils.encodeB64Url(utils.arrayBufferToBase64(roomBytesHash));
  }

  const createNewRoom = async (serverSecret) => {
    console.trace("createNewRoom() should not be called")
    // let ownerKeyPair = await window.crypto.subtle.generateKey({
    //   name: "ECDH",
    //   namedCurve: "P-384"
    // }, true, ["deriveKey"]);
    // let exportable_privateKey = await window.crypto.subtle.exportKey("jwk", ownerKeyPair.privateKey);
    // let exportable_pubKey = await window.crypto.subtle.exportKey("jwk", ownerKeyPair.publicKey);
    // let roomId = await generateRoomId(exportable_pubKey.x, exportable_pubKey.y);
    // let encryptionKey = await window.crypto.subtle.generateKey({
    //   name: "AES-GCM",
    //   length: 256
    // }, true, ["encrypt", "decrypt"]);
    // let exportable_encryptionKey = await window.crypto.subtle.exportKey("jwk", encryptionKey);
    // let signKeyPair = await window.crypto.subtle.generateKey({
    //   name: "ECDH",
    //   namedCurve: "P-384"
    // }, true, ["deriveKey"]);
    // let exportable_signKey = await window.crypto.subtle.exportKey("jwk", signKeyPair.privateKey);
    // // let ledgerKey = await window.crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"] );
    // // let exportable_ledgerKey = await window.crypto.subtle.exportKey("jwk", ledgerKey.publicKey);
    // let roomData = {
    //   roomId: roomId,
    //   ownerKey: JSON.stringify(exportable_pubKey),
    //   encryptionKey: JSON.stringify(exportable_encryptionKey),
    //   signKey: JSON.stringify(exportable_signKey)
    // }
    // roomData["SERVER_SECRET"] = serverSecret;
    // let data = new TextEncoder().encode(JSON.stringify(roomData));
    // let req = await fetch(config.ROOM_SERVER + roomId + "/uploadRoom", {
    //   method: "POST",
    //   body: data
    // });
    // let resp = await req.json();
    // if (resp.hasOwnProperty("success") && resp["success"] === true) {
    //   localStorage.setItem(roomId, JSON.stringify(exportable_privateKey));
    // }
  }

  // #######################   MISC HELPER FUNCTIONS   ###############################


  const getRoomCapacity = () => {
    console.trace("getRoomCapacity() should not be called")
    // fetch(config.ROOM_SERVER + activeRoom + "/getRoomCapacity", { credentials: 'include' })
    //   .then(resp => resp.json()
    //     .then(data => data.capacity ? setRoomCapacity(data.capacity) : setAdminError(true))
    //   );
  }


  const updateRoomCapacity = (roomCapacity) => {
    console.trace("updateRoomCapacity() should not be called")
    // fetch(config.ROOM_SERVER + activeRoom + "/updateRoomCapacity?capacity=" + roomCapacity, { credentials: 'include' })
    //   .then(data => console.log('this worked!'));
  }


  const getAdminData = async () => {
    console.trace("getAdminData() should not be called")
    // let request = { credentials: "include" };
    // if (process.env.REACT_APP_ROOM_SERVER !== 's_socket.privacy.app' && roomOwner) {
    //   let token_data = new Date().getTime().toString();
    //   let token_sign = await sign(keys.personal_signKey, token_data);
    //   request.headers = { authorization: token_data + "." + token_sign }
    // }
    // const capacity = await document.cacheDb.getItem(`${activeRoom}_capacity`)
    // const join_requests = await document.cacheDb.getItem(`${activeRoom}_join_requests`)
    // if (capacity && join_requests) {
    //   console.log('Loading cached room data')
    //   setRoomCapacity(capacity);
    //   setJoinRequests(join_requests)
    // }
    // fetch(config.ROOM_SERVER + activeRoom + "/getAdminData", request)
    //   .then(resp => resp.json().then(data => {
    //       if (data.error) {
    //         setAdminError(true)
    //       } else {
    //         document.cacheDb.setItem(`${activeRoom}_capacity`, data.capacity)
    //         document.cacheDb.setItem(`${activeRoom}_join_requests`, data.join_requests)
    //         setRoomCapacity(data.capacity);
    //         setJoinRequests(data.join_requests)
    //       }
    //     })
    //   )
  }

  const saveUsername = (newUsername) => {
    try {
      let user = changeUsername
      const user_pubKey = JSON.parse(user._id);
      let _messages = Object.assign(messages);
      _messages.forEach(message => {
        if (message.user._id === user._id) {
          message.user.name = message.user.name.replace('(' + contacts[user_pubKey.x + ' ' + user_pubKey.y] + ')', '(' + newUsername + ')');
        }
      });
      contacts[user_pubKey.x + ' ' + user_pubKey.y] = newUsername;
      setChangeUsername({ _id: '', name: '' })
      setMessages(_messages)
      updateContacts(contacts);
    } catch (e) {
      console.error(e);
      return { error: e };
    }
  }


  const getUsername = () => {
    const username = localStorage.getItem(activeRoom + '_username');
    return username === null ? '' : username;
  }


  const acceptVisitor = async (pubKey) => {
    console.trace("acceptVisitor() should not be called")
    // try {
    //   let updatedRequests = joinRequests;
    //   updatedRequests.splice(joinRequests.indexOf(pubKey), 1);
    //   // console.log(pubKey);
    //   const shared_key = await deriveKey(keys.privateKey, await importKey("jwk", JSON.parse(pubKey), "ECDH", false, []), "AES", false, ["encrypt", "decrypt"]);
    //   setJoinRequests(updatedRequests)
    //   const _encrypted_locked_key = await encrypt(JSON.stringify(keys.exportable_locked_key), shared_key, "string")
    //   fetch(config.ROOM_SERVER + activeRoom + "/acceptVisitor", {
    //     method: "POST",
    //     body: JSON.stringify({ pubKey: pubKey, lockedKey: JSON.stringify(_encrypted_locked_key) }),
    //     headers: {
    //       "Content-Type": "application/json"
    //     },
    //     credentials: 'include'
    //   });
    // } catch (e) {
    //   console.error(e);
    //   return { error: e };
    // }
  }


  const lockRoom = async () => {
    console.trace("lockRoom() should not be called")
    // try {
    //   if (keys.locked_key == null && roomAdmin) {
    //     const _locked_key = await window.crypto.subtle.generateKey({
    //       name: "AES-GCM",
    //       length: 256
    //     }, true, ["encrypt", "decrypt"]);
    //     const _exportable_locked_key = await window.crypto.subtle.exportKey("jwk", _locked_key);
    //     localStorage.setItem(activeRoom + '_lockedKey', JSON.stringify(_exportable_locked_key));
    //     const lock_success = (await (await fetch(config.ROOM_SERVER + activeRoom + "/lockRoom", { credentials: 'include' })).json()).locked;
    //     console.log(lock_success);
    //     if (lock_success) {
    //       await (await acceptVisitor(JSON.stringify(keys.exportable_pubKey))).json();
    //       setLocked(true)
    //       window.location.reload();  // Need a better way to reload
    //       // await getJoinRequests();
    //     }
    //   }
    // } catch (e) {
    //   console.error(e);
    //   return { error: e };
    // }
  }


  const isRoomLocked = async () => {
    console.trace("isRoomLocked() should not be called")
    // try {
    //   const locked_json = (await (await fetch(config.ROOM_SERVER + activeRoom + "/roomLocked", { credentials: 'include' })).json());
    //   return locked_json.locked;
    // } catch (e) {
    //   console.error(e);
    //   return { error: e };
    // }
  }


  const getJoinRequests = async () => {
    console.trace("getJoinRequests() should not be called")
    // try {
    //   const joinRequests = (await (await fetch(config.ROOM_SERVER + activeRoom + "/getJoinRequests", { credentials: 'include' })).json())
    //   // console.log(joinRequests)
    //   joinRequests.error ? setAdminError(true) : setJoinRequests(joinRequests.join_requests);
    // } catch (e) {
    //   console.error(e);
    // }
  }

  // TODO needs supporting function from component
  const setMOTD = (motd) => {
    console.trace("setMOTD() should not be called")
    // try {
    //   if (roomOwner) {
    //     fetch(config.ROOM_SERVER + activeRoom + "/motd", {
    //       method: "POST",
    //       body: JSON.stringify({ motd: motd }),
    //       headers: {
    //         "Content-Type": "application/json"
    //       }
    //     });
    //     setMotd(motd)
    //   }
    // } catch (e) {
    //   console.error(e);
    // }
  }

  const getWhisperToText = () => {
    return contacts[JSON.parse(replyTo._id).x + ' ' + JSON.parse(replyTo._id).y]
  }

  const loadRoom = async (data = null, sendSystemInfo, sendSystemMessage) => {
    console.time('load-room')
    setMotd(data?.motd);
    setLocked(data?.roomLocked)
    setOwnerRotation(data?.ownerRotation)
    if (data.motd !== '') {
      sendSystemInfo('Message of the Day: ' + data.motd);
    } else {
      sendSystemMessage('Connected');
    }

    console.timeEnd('load-room')
  }

  return (<RoomContext.Provider value={{
    rooms,
    updateRoomNames,
    roomMetadata,
    setRoomMetadata,
    sortRooms,
    activeRoom,
    setActiveRoom,
    activeRooms,
    goToRoom,
    showAdminTab,
    setShowAdminTab,
    contacts,
    updateContacts,
    processLocalStorage,
    createNewRoom,
    getRooms,
    loadRoom
  }}>{children} </RoomContext.Provider>)
};

export default RoomContext;

