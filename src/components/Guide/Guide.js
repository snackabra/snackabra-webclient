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

import React from 'react';
import './Guide.css';
import { Trans } from '@lingui/macro'

const Guide = (props) => {
  return (
    <div className={"guide " + props.className}>
      <h2><Trans id='welcome header'>Welcome to the Snackabra</Trans></h2>
      <p><Trans id='guide introduction'>For full documentation see <a href="https://snackabra.io">https://snackabra.io</a>. You're probably here because somebody sent you a link or a printed QR code. Welcome!</Trans></p>
      <ul>
        <Trans id='guide bullet points'>
          <li>The first time you join a room, a cryptographic public/private key pair will be generated for you and stored in the localstorage of your browser. This will serve as your identity for the room. Do not share the private key with anyone. If you are the room owner, the SSO will manage your keys for you unless you explicitly choose not to. For all other visitors, if you want to preserve your identity across browsers, you can just add the private key to the localstorage for that browser. If you clear your localstorage, you will lose the key and there is no way to retrieve it. A new pair will be generated and hence you get a new identity.</li>
          <li>Anyone who has joined this room can send a message to everyone else.</li>
          <li>If you are the room owner, you can whisper a message to anyone by long pressing their user icon. If you are a visitor, you can whisper a message to the room owner by tapping/clicking on the user icon in the top right corner. By doing this, only the recipient will be able to read the message you send.</li>
          <li>If a message shows as "whispered" with yellow background, someone else whispered a message that is not meant for you.</li>
          <li>Messages sent by the room creator will have a green border. Messages with a red border are probably tampered with, so be cautious about those. Messages with a purple border were sent by the first guest joining the room.</li>
          <li>Each room can be ‘restricted’ by the Owner. A restricted room will have a green ‘lock’ symbol next to its name. This means you will only be able to talk with anybody in the room if you have been approved, though you can always whisper the Owner</li>
          <li>The 'Home' tab maintains a list of all the rooms for which the keys are found in your localstorage. You can also export/import keys from/to the LocalStorage from there.</li>
          <li>We will soon add support for sending files as well.</li>
        </Trans>
      </ul>
    </div>
  );
}

export default Guide
