/* 
   Copyright (C) 2019-2021 Magnusson Institute, All Rights Reserved

   "Snackabra" is a registered trademark

   This program is free software: you can redistribute it and/or
   modify it under the terms of the GNU Affero General Public License
   as published by the Free Software Foundation, either version 3 of
   the License, or (at your option) any later version.

   This program is distributed in the hope that it will be useful, but
   WITHOUT ANY WARRANTY; without even the implied warranty of
   MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU
   Affero General Public License for more details.

   You should have received a copy of the GNU Affero General Public
   License along with this program.  If not, see www.gnu.org/licenses/

*/

import React, { useState } from 'react';
import './LandingPage.css';
import { useHistory } from 'react-router-dom'
import { JwModal } from '../../containers/Modal/Modal'
import edit_icon from '../../static/icons8-edit-24.png'
import refresh_icon from '../../static/icons8-refresh-24.png'
import download_icon from '../../static/download-file-square-line.png'
import { Trans } from '@lingui/macro'
import * as utils from '../../utils/utils';

const LandingPage = (props) => {

  let ROOM_SERVER = "https://" + process.env.REACT_APP_ROOM_SERVER + "/api/room/"
  let STORAGE_SERVER = "https://" + process.env.REACT_APP_STORAGE_SERVER + "/api/v1/"

  const [rooms, setRooms] = useState({ ...props.rooms });
  const [renameRoom, setRenameRoom] = useState('');
  const history = useHistory();

  const downloadFile = (text, file) => {
    try {
      let element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(text));
      element.setAttribute('download', file);
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.log(error);
    }
  }

  const importFile = () => {
    const reader = new FileReader()
    reader.onload = event => {
      try {
        const keys = JSON.parse(event.target.result);
        importKeysToLS(keys);
        document.getElementById("key_import_ta").value = 'Import successful!'
      } catch (error) {
        console.log(error)
        document.getElementById("key_import_ta").value = 'Error importing file! Please try again. The file might not have proper JSON stringified keys'
      }
    }// desired file content
    reader.onerror = error => { console.log(error); document.getElementById("key_import_ta").value = 'Error importing file! Please try again.' }
    if (document.getElementById('importKeyFile').files.length > 0) {
      reader.readAsText(document.getElementById('importKeyFile').files[0]);
    }
    else {
      try {
        importKeysToLS(JSON.parse(document.getElementById('key_import_ta').value));
        document.getElementById("key_import_ta").value = 'Import successful!'
      } catch (error) {
        console.log(error)
        document.getElementById("key_import_ta").value = 'Error importing keys! Please try again. Please ensure that the keys are in a JSON stringified format'
      }
    }
  }

  const importKeysToLS = async (data) => {
    try {
      let pem = false;
      if (data.hasOwnProperty("pem") && data["pem"] == true) {
        pem = true;
      }
      for (let room in data['roomData']) {
        for (let type in data['roomData'][room]) {
          if (type === 'key') {
            let key = data['roomData'][room][type]
            if (pem) {
              let cryptokey = await importPrivatePemKey(key);
              let jsonKey = await window.crypto.subtle.exportKey("jwk", cryptokey);
              key = JSON.stringify(jsonKey);
            }
            localStorage.setItem(room, key);
          } else {
            localStorage.setItem(room + '_' + type, data['roomData'][room][type]);
          }
        }
      }
      localStorage.setItem('rooms', JSON.stringify(data['roomMetadata']));
      localStorage.setItem('contacts', JSON.stringify(data['contacts']));
      setData(processLocalStorage)
      props.refreshRooms();
    }
    catch (e) {
      console.log(e);
    }
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
    return { roomData: _rooms, contacts: _contacts, roomMetadata: _roomMetadata, pem: false };
  }

  /*
  Export the given key and write it into the "exported-key" space.
  */
  const exportPrivateCryptoKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey(
      "pkcs8",
      key
    );
    const exportedAsString = utils.ab2str(exported);
    const exportedAsBase64 = utils.partition(window.btoa(exportedAsString), 64).join('\n');;
    const pemExported = `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;

    return pemExported
  }

  const exportPemKeys = async () => {
    const _rooms = {};
    for (let key of Object.keys(localStorage)) {
      if (key !== 'rooms' && key !== 'contacts') {
        const _roomName = key.slice(0, 64);
        const _type = key.length > 64 ? key.slice(65) : 'key';
        _rooms[_roomName] = { ..._rooms[_roomName] };
        if (_type === 'key') {
          _rooms[_roomName][_type] = await exportPrivateCryptoKey(await window.crypto.subtle.importKey("jwk", JSON.parse(localStorage.getItem(key)), { name: 'ECDH', namedCurve: 'P-384' }, true, ["deriveKey"]));
        } else {
          _rooms[_roomName][_type] = localStorage.getItem(key);
        }
      }
    }
    const _roomMetadata = localStorage.hasOwnProperty('rooms') ? JSON.parse(localStorage.getItem('rooms')) : {}
    const _contacts = localStorage.hasOwnProperty('contacts') ? JSON.parse(localStorage.getItem('contacts')) : {};
    setData({ roomData: _rooms, contacts: _contacts, roomMetadata: _roomMetadata, pem: true });
    if (document.getElementById("key_export_ta") !== null) {
      document.getElementById("key_export_ta").value = JSON.stringify({ roomData: _rooms, contacts: _contacts, roomMetadata: _roomMetadata, pem: true }, undefined, 2)
    }
  }

  const importPrivatePemKey = (pem) => {
    // fetch the part of the PEM string between header and footer
    const pemHeader = "-----BEGIN PRIVATE KEY-----";
    const pemFooter = "-----END PRIVATE KEY-----";
    const pemContents = pem.substring(pemHeader.length, pem.length - pemFooter.length);
    // base64 decode the string to get the binary data
    const binaryDerString = window.atob(pemContents);
    // convert from a binary string to an ArrayBuffer
    const binaryDer = utils.str2ab(binaryDerString);

    return window.crypto.subtle.importKey(
      "pkcs8",
      binaryDer,
      {
        name: "ECDH",
        namedCurve: "P-384",
      },
      true,
      ["deriveKey"]
    );
  }

  const downloadRoomData = async (roomId) => {
    console.log("Fetching room data...")
    let fetchReq = await fetch(ROOM_SERVER + roomId + "/downloadData");
    let data = await fetchReq.arrayBuffer();
    console.log("Got data...");
    try {
      let dataString = new TextDecoder().decode(data);
      console.log("Got data string...")
      console.log("Will now process messages to find image ids");
      let dataJson = JSON.parse(dataString);
      let room_lockedKey_string = localStorage.getItem(roomId + "_lockedKey");
      let decKey_string = dataJson["encryptionKey"];
      let decKey = await crypto.subtle.importKey("jwk", JSON.parse(decKey_string), { name: "AES-GCM" }, false, ["decrypt"]);
      let room_lockedKey = null;
      if (room_lockedKey_string != null) {
        console.log("Found locked key in localstorage")
        room_lockedKey = await crypto.subtle.importKey("jwk", JSON.parse(room_lockedKey_string), { name: "AES-GCM" }, false, ["decrypt"]);
      }
      console.log("Imported decryption keys", decKey, room_lockedKey)
      let imageData = await getImageIds(dataJson, decKey, room_lockedKey);
      imageData["target"] = "s4.privacy.app";
      let imagedataString = JSON.stringify(imageData);
      downloadFile(imagedataString, rooms[roomId]["name"] + "_storage.txt")
      downloadFile(dataString, rooms[roomId]["name"] + "_data.txt");
    } catch (err) {
      console.log(err);
    }
  }

  const getImageIds = async (messages, decKey, lockedKey) => {
    let unwrapped_messages = {}
    for (let id in messages) {
      try {
        let message = JSON.parse(messages[id]);
        if (message.hasOwnProperty("encrypted_contents")) {
          let msg = await decrypt(decKey, message.encrypted_contents)
          if (msg.error && lockedKey !== null) {
            msg = await decrypt(lockedKey, message.encrypted_contents)
          }
          // console.log(msg)
          const _json_msg = JSON.parse(msg.plaintext);
          // console.log(_json_msg)
          if (_json_msg.hasOwnProperty('control')) {
            console.log(_json_msg)
            unwrapped_messages[_json_msg["id"]] = _json_msg['verificationToken'];
          }
        }
      } catch (e) {
        // console.log(e);
        // Skip the message if decryption fails - its probably due to the user not having <roomId>_lockedKey. 
      }
    }
    return unwrapped_messages;
  }

  const uploadRoomData = async () => {
    const reader = new FileReader()
    reader.onload = async event => {
      try {
        const dataJSON = JSON.parse(event.target.result);
        if (document.getElementById("serverSecretInput") !== null) {
          dataJSON["SERVER_SECRET"] = document.getElementById("serverSecretInput").value;
        }
        if (dataJSON.hasOwnProperty("roomId")) {
          let roomId = dataJSON["roomId"];
          let data = new TextEncoder().encode(JSON.stringify(dataJSON));
          let req = await fetch(ROOM_SERVER + roomId + "/uploadRoom", {
            method: "POST",
            body: data
          });
        } else {
          console.log("Room id not present in the file")
        }
      } catch (error) {
        console.log(error)
      }
    }// desired file content
    reader.onerror = error => { console.log(error) }
    if (document.getElementById('uploadRoomFile').files.length > 0) {
      reader.readAsText(document.getElementById('uploadRoomFile').files[0]);
    }
  }

  const uploadStorageData = async () => {
    console.log("In function")
    const reader = new FileReader()
    reader.onload = async event => {
      try {
        const dataJSON = JSON.parse(event.target.result);
        if (document.getElementById("storageServerSecretInput") !== null) {
          dataJSON["SERVER_SECRET"] = document.getElementById("storageServerSecretInput").value;
        }
        let data = new TextEncoder().encode(JSON.stringify(dataJSON));
        let req = await fetch(STORAGE_SERVER + "migrateStorage", {
          method: "POST",
          body: data
        });
      } catch (error) {
        console.log(error)
      }
    }// desired file content
    reader.onerror = error => { console.log(error) }
    if (document.getElementById('uploadStorageFile').files.length > 0) {
      reader.readAsText(document.getElementById('uploadStorageFile').files[0]);
    }
  }

  const createNewRoom = async () => {
    let ownerKeyPair = await window.crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-384" }, true, ["deriveKey"]);
    let exportable_privateKey = await window.crypto.subtle.exportKey("jwk", ownerKeyPair.privateKey);
    let exportable_pubKey = await window.crypto.subtle.exportKey("jwk", ownerKeyPair.publicKey);
    let roomId = await generateRoomId(exportable_pubKey.x, exportable_pubKey.y);
    let encryptionKey = await window.crypto.subtle.generateKey({ name: "AES-GCM", length: 256 }, true, ["encrypt", "decrypt"]);
    let exportable_encryptionKey = await window.crypto.subtle.exportKey("jwk", encryptionKey);
    let signKeyPair = await window.crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-384" }, true, ["deriveKey"]);
    let exportable_signKey = await window.crypto.subtle.exportKey("jwk", signKeyPair.privateKey);
    // let ledgerKey = await window.crypto.subtle.generateKey({ name: "RSA-OAEP", modulusLength: 4096, publicExponent: new Uint8Array([1, 0, 1]), hash: "SHA-256" }, true, ["encrypt", "decrypt"] );
    // let exportable_ledgerKey = await window.crypto.subtle.exportKey("jwk", ledgerKey.publicKey);
    let roomData = { roomId: roomId, ownerKey: JSON.stringify(exportable_pubKey), encryptionKey: JSON.stringify(exportable_encryptionKey), signKey: JSON.stringify(exportable_signKey) }
    if (document.getElementById("serverSecretInput") !== null) {
      roomData["SERVER_SECRET"] = document.getElementById("serverSecretInput").value;
    }
    let data = new TextEncoder().encode(JSON.stringify(roomData));
    let req = await fetch(ROOM_SERVER + roomId + "/uploadRoom", {
      method: "POST",
      body: data
    });
    let resp = await req.json();
    if (resp.hasOwnProperty("success") && resp["success"] === true) {
      localStorage.setItem(roomId, JSON.stringify(exportable_privateKey));
    }
  }

  const generateRoomId = async (x, y) => {
    let xBytes = utils.base64ToArrayBuffer(utils.decodeB64Url(x));
    let yBytes = utils.base64ToArrayBuffer(utils.decodeB64Url(y));
    let roomBytes = utils._appendBuffer(xBytes, yBytes);
    let roomBytesHash = await window.crypto.subtle.digest("SHA-384", roomBytes);
    return utils.encodeB64Url(utils.arrayBufferToBase64(roomBytesHash));
  }

  const authorizeRoom = async () => {
    if (document.getElementById('authorizeRoomServerSecretInput') !== null && document.getElementById('authorizeRoomIdInput') !== null && document.getElementById('authorizeOwnerInput')) {
      let roomId = document.getElementById('authorizeRoomIdInput').value;
      let secret = document.getElementById('authorizeRoomServerSecretInput').value;
      let ownerKey = document.getElementById('authorizeOwnerInput').value;
      let req = await fetch(ROOM_SERVER + roomId + "/authorizeRoom", {
        method: "POST",
        body: { roomId: roomId, SERVER_SECRET: secret, ownerKey: ownerKey }
      });
    }
  }

  const decrypt = async (secretKey, contents, outputType = "string") => {
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

  let [data, setData] = useState(processLocalStorage());

  const rooms_found = props.rooms !== null && Object.keys(props.rooms).length > 0;
  setTimeout(() => {
    document.getElementById(window.location.hash.split('#')[1]) && document.getElementById(window.location.hash.split('#')[1]).scrollIntoView()
  }, 0);
  return (
    <div className={"landingPage " + props.className}>
      <JwModal id="rename-room">
        <label htmlFor="roomname-input"><h2><Trans id='room rename header modal'>Rename Room</Trans></h2></label>
        <br />
        <input type="text" id='roomname-input' placeholder="Enter Roomname Here" defaultValue={rooms.hasOwnProperty(renameRoom) ? rooms[renameRoom]['name'] : ''} onFocus={(event) => event.target.select()} autoFocus />
        <br />
        <button className='admin-button green-btn' id='change-roomname-save-btn' onClick={(event) => {
          rooms[renameRoom]['name'] = document.getElementById('roomname-input').value;
          setRooms({ ...rooms });
          props.updateRoomNames(rooms);
          JwModal.close('rename-room')(event);
        }}><Trans id='save button text'>Save</Trans></button>
        <button className='admin-button gray-btn' onClick={JwModal.close('rename-room')}><Trans id='Cancel Button Text'>Cancel</Trans></button>
      </JwModal>
      <h2><Trans id='welcome header'>Welcome to Snackabra!</Trans></h2>
      <p><Trans id='member message'>If you are a <a href='https://privacy.app//member'>Privacy.App Member</a>, you can log in on your membership page, which will manage your rooms for you.</Trans></p>
      {rooms_found ?
        <div id="roomList">
          <h3><Trans id='room list header'>Rooms &emsp;</Trans><img src={refresh_icon} style={{ cursor: 'pointer', verticalAlign: 'middle' }} alt='Refresh room list' onClick={() => props.refreshRooms()}></img></h3>
          <table id="roomListTable">
            <tbody style={{ width: "100%" }}>
              {props.sortRooms(rooms).map((room) => {
                return (
                  <tr key={room[0]}>
                    <td id="roomname_edit_td"><img src={edit_icon} style={{ cursor: 'pointer' }} alt='Rename Room' onClick={() => {
                      setRenameRoom(room[0]);
                      JwModal.open('rename-room');
                    }} /></td>
                    <td id="download_roomData_td"><img src={download_icon} style={{ cursor: 'pointer', width: '24px' }} alt='Download room data' onClick={() => {
                      downloadRoomData(room[0]);
                    }} /></td>
                    <td id='roomname_td'><div id='roomname_td_div' onClick={() => {
                      props.goToRoom(room[0]);
                      history.push(room[0]);
                    }}>{room[1]['unread'] ? <b>{room[1]['name']}</b> : room[1]['name']}</div></td>
                  </tr>
                )
              }
              )}
            </tbody>
          </table>
        </div> : null}
      <div className="key_ops">
        <div id="key_export">
          <h3><Trans id='key export header'>Export Keys</Trans></h3>
          {Object.keys(data['roomMetadata']).length > 0 || Object.keys(data['contacts']).length > 0 || Object.keys(data['roomData']).length > 0 ? <div>
            <label htmlFor='keyFile_name' style={{ fontSize: "16px" }}><Trans id='key export filename label'>Enter filename you want to save as:&emsp;</Trans></label>
            <input type='text' id='keyFile_name' defaultValue='SnackabraData' onFocus={(e) => e.target.select()}></input>
            <button className='admin-button gray-btn' onClick={() => downloadFile(JSON.stringify(data), document.getElementById('keyFile_name').value + '.txt')}><Trans id='Download LS data button'>Download Data</Trans></button>
            <button className='admin-button gray-btn' onClick={() => exportPemKeys()}><Trans id='Convert to PEM button'>Convert to PEM</Trans></button>
            <p><Trans id='copy paste ls message'>You can also copy-paste the following:</Trans></p>
            <textarea rows={10} id="key_export_ta" defaultValue={JSON.stringify(data, undefined, 2)}></textarea>
          </div> : <Trans id='key export ls empty message'>Your localstorage does not have any data to export!</Trans>}
        </div>
        <div id="key_import">
          <h3><Trans id='key import header'>Import Keys</Trans></h3>
          <div>
            <input type="file" id="importKeyFile" name="file-input" onChange={() => {
              document.getElementById("key_import_ta").value = "Selecting file...."
              const reader = new FileReader()
              reader.onload = event => { document.getElementById("key_import_ta").value = event.target.result } // desired file content
              reader.onerror = error => { console.log(error); document.getElementById("key_import_ta").value = 'Error importing file! Please try again.' }
              reader.readAsText(document.getElementById('importKeyFile').files[0]);
            }} />
            <p><Trans id='key import paste message'>Or paste the keys you want to import</Trans></p>
            <textarea rows={5} id="key_import_ta" onFocus={(e) => e.target.select()} defaultValue={"No file selected"}></textarea>
            <br />
            <button className='admin-button gray-btn' onClick={importFile}><Trans id='key import header'>Import Keys</Trans></button>
          </div>
        </div>
      </div>
      <div id="server_admin">
        <div id="uploadRoom">
          <h3><Trans id='room upload header'>Upload/Create Room</Trans></h3>
          <p><Trans id='room upload message'>You can upload room data for a previously generated room or create a new room by entering your room server secret and pressing the button below. Creating a new room will generate the necessary keys for the new room and initialize the room for you on your server.</Trans></p>
          <br /> <br />
          <input type="file" id="uploadRoomFile" name="file-input" />
          <br /> <br />
          <label htmlFor='serverSecretInput'>Enter Room Server Secret: </label>
          <input type="text" id="serverSecretInput"></input>
          <br />
          <button className='admin-button gray-btn' onClick={uploadRoomData}><Trans id='room upload button'>Upload Room Data</Trans></button>
          <button className='admin-button gray-btn' onClick={createNewRoom}><Trans id='new room button'>Create New Room</Trans></button>
        </div>
        <div id="uploadStorage">
          <h3><Trans id='storage upload header'>Upload Storage Data</Trans></h3>
          <p><Trans id='storage upload message'>You can upload storage data for a previously generated room by entering your storage server secret and pressing the button below.</Trans></p>
          <br /> <br />
          <input type="file" id="uploadStorageFile" name="file-input" />
          <br /> <br />
          <label htmlFor='storageServerSecretInput'>Enter Storage Server Secret: </label>
          <input type="text" id="storageServerSecretInput"></input>
          <br />
          <button className='admin-button gray-btn' onClick={uploadStorageData}><Trans id='storage upload button'>Upload Storage Data</Trans></button>
        </div>
        <div id="authorizeRoom">
          <h3><Trans id='room authorize header'>Authorize Room</Trans></h3>
          <p><Trans id='room authorize message'>You can authorize a room to be made available on your server. To do that, enter the roomId, the public key of the room owner and your server secret and press Authorize Room.</Trans></p>
          <br /> <br />
          <label htmlFor='authorizeRoomServerSecretInput'>Enter Room Server Secret: </label>
          <input type="text" id="authorizeRoomServerSecretInput"></input>
          <br /> <br />
          <label htmlFor='authorizeRoomIdInput'>Enter Room ID: </label>
          <input type="text" id="authorizeRoomIdInput"></input>
          <br /> <br />
          <label htmlFor='authorizeOwnerInput'>Enter Room Owner Public Key: </label>
          <input type="text" id="authorizeRoomOwnerInput"></input>
          <br />
          <button className='admin-button gray-btn' onClick={authorizeRoom}><Trans id='room authorize button'>Authorize Room</Trans></button>
        </div>
      </div>
    </div>
  )
}

export default LandingPage;
