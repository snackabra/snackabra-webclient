import * as React from "react"
import config from "../config";
import * as utils from "../utils/utils";

const RoomContext = React.createContext(undefined);
let ROOM_API = config.ROOM_API

export const RoomProvider = ({ children }) => {

  const reserved_paths = ['', 'guide', 'settings'];

  const [rooms, setRooms] = React.useState({});
  const [roomMetadata, setRoomMetadata]  = React.useState({});
  const [activeRoom, setActiveRoom] = React.useState("");
  const [activeRooms, setActiveRooms] = React.useState([]);
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
        console.log("got rooms from local storage")
        console.log(room.split('_').slice(-1))
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
        console.log("Got Room list:")
        console.log(body)
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

  const goToRoom = (roomId) => {
    if (isValidRoomId(roomId) && !activeRooms.includes(roomId)) {
      setActiveRooms([...activeRooms, roomId]);
    }
    setActiveRoom(roomId);
    setShowAdminTab(isValidRoomId(activeRoom) && document.cookie.split('; ').find(row => row.startsWith('token_' + activeRoom)) !== undefined)
  }

  const isValidPath = (path) => {
    return isValidRoomId(path) || reserved_paths.includes(path);
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
    let xBytes = utils.base64ToArrayBuffer(utils.decodeB64Url(x));
    let yBytes = utils.base64ToArrayBuffer(utils.decodeB64Url(y));
    let roomBytes = utils._appendBuffer(xBytes, yBytes);
    let roomBytesHash = await window.crypto.subtle.digest("SHA-384", roomBytes);
    return utils.encodeB64Url(utils.arrayBufferToBase64(roomBytesHash));
  }

  const createNewRoom = async (serverSecret) => {
    let ownerKeyPair = await window.crypto.subtle.generateKey({
      name: "ECDH",
      namedCurve: "P-384"
    }, true, ["deriveKey"]);
    let exportable_privateKey = await window.crypto.subtle.exportKey("jwk", ownerKeyPair.privateKey);
    let exportable_pubKey = await window.crypto.subtle.exportKey("jwk", ownerKeyPair.publicKey);
    let roomId = await generateRoomId(exportable_pubKey.x, exportable_pubKey.y);
    let encryptionKey = await window.crypto.subtle.generateKey({
      name: "AES-GCM",
      length: 256
    }, true, ["encrypt", "decrypt"]);
    let exportable_encryptionKey = await window.crypto.subtle.exportKey("jwk", encryptionKey);
    let signKeyPair = await window.crypto.subtle.generateKey({
      name: "ECDH",
      namedCurve: "P-384"
    }, true, ["deriveKey"]);
    let exportable_signKey = await window.crypto.subtle.exportKey("jwk", signKeyPair.privateKey);
    // let ledgerKey = await window.crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"] );
    // let exportable_ledgerKey = await window.crypto.subtle.exportKey("jwk", ledgerKey.publicKey);
    let roomData = {
      roomId: roomId,
      ownerKey: JSON.stringify(exportable_pubKey),
      encryptionKey: JSON.stringify(exportable_encryptionKey),
      signKey: JSON.stringify(exportable_signKey)
    }
    roomData["SERVER_SECRET"] = serverSecret;
    let data = new TextEncoder().encode(JSON.stringify(roomData));
    let req = await fetch(config.ROOM_SERVER + roomId + "/uploadRoom", {
      method: "POST",
      body: data
    });
    let resp = await req.json();
    if (resp.hasOwnProperty("success") && resp["success"] === true) {
      localStorage.setItem(roomId, JSON.stringify(exportable_privateKey));
    }
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
    getRooms
  }}>{children} </RoomContext.Provider>)
};

export default RoomContext;

