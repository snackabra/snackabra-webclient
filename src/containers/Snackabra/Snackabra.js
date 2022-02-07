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
import './Snackabra.css'
import { BrowserRouter as Router, Route, NavLink } from "react-router-dom";
import Room from '../Room/Room';
import Guide from '../../components/Guide/Guide';
import { View } from 'react-native';
import user_icon from '../../static/icons8-user-64.png';
import { JwModal } from '../Modal/Modal';
import LandingPage from '../../components/LandingPage/LandingPage';

let ROOM_SERVER = "https://" + process.env.REACT_APP_ROOM_SERVER + "/api/room/"
let ROOM_API = "https://" + process.env.REACT_APP_ROOM_SERVER + "/api"

class Snackabra extends React.Component {

  constructor() {
    super();
    this.reserved_paths = ['', 'guide', 'settings'];
    this.state = {
      rooms: this.getRooms(),
      activeRoom: window.location.pathname.split('/')[1],
      activeRooms: [],
      showAdminTab: false,
      contacts: localStorage.getItem('contacts') ? JSON.parse(localStorage.getItem('contacts')) : {},
    }
  }


  getRooms() {
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
      if (!_rooms.hasOwnProperty(_currentRoom) && this.isValidRoomId(_currentRoom)) {
        _rooms[_currentRoom] = { name: 'Room ' + counter };
        counter += 1;
      }
      fetch(ROOM_API + '/getLastMessageTimes', {
        method: 'POST',
        body: JSON.stringify(Object.keys(_rooms))
      }).then(res => res.json().then(message_times => {
        Object.keys(_rooms).forEach(room => {
          _rooms[room]['lastMessageTime'] = message_times[room];
          _rooms[room]['unread'] = (!localStorage.hasOwnProperty(room + '_lastSeenMessage') || (localStorage.hasOwnProperty(room + '_lastSeenMessage') && parseInt(localStorage.getItem(room + '_lastSeenMessage'), 2) < parseInt(message_times[room], 2))) && message_times[room]!=='0';
        })
        this.setState({ rooms: _rooms })
        localStorage.setItem('rooms', JSON.stringify(_rooms))
      }))
      localStorage.setItem('rooms', JSON.stringify(_rooms))
      return _rooms;
    } catch (e) {
      console.log(e);
    }
  }

  goToRoom(roomId) {
    if (this.isValidRoomId(roomId) && !this.state.activeRooms.includes(roomId)) {
      this.setState({ activeRooms: [...this.state.activeRooms, roomId] });
    }
    this.setState({ activeRoom: roomId, showAdminTab: this.isValidRoomId(this.state.activeRoom) && document.cookie.split('; ').find(row => row.startsWith('token_' + this.state.activeRoom)) !== undefined});
  }

  isValidPath(path) {
    return this.isValidRoomId(path) || this.reserved_paths.includes(path);
  }

  isValidRoomId(roomId) {
    return !this.reserved_paths.includes(roomId) && roomId.length === 64;
  }

  showAdminTab() {
    this.setState({showAdminTab: true});
  }

  updateContacts(contacts) {
    this.setState({ contacts: { ...contacts } })
    localStorage.setItem('contacts', JSON.stringify(contacts));
  }

  updateRoomNames(rooms) {
    this.setState({ rooms: rooms });
    localStorage.setItem('rooms', JSON.stringify(rooms))
  }

  sortRooms(rooms) {
    return Object.entries(rooms).sort((a, b) => {
      if (parseInt(a[1]['lastMessageTime'], 2) > parseInt(b[1]['lastMessageTime'], 2)) {
        return -1;
      } else if (parseInt(a[1]['lastMessageTime'], 2) < parseInt(b[1]['lastMessageTime'], 2)) {
        return 1;
      }
      return a[1]['name'].toLowerCase().localeCompare(b[1]['name'].toLowerCase(), undefined, { numeric: true });
    })
  }


  async componentDidMount() {
    window.onmessage = async (e) => {
      if (e.origin !== 'https://privacy.app') {
        return;
      }
      try {
        let payload = JSON.parse(e.data);
        if (payload.hasOwnProperty('localStorage')) {
          e.source.postMessage(JSON.stringify(localStorage));
        }
        for (let room in payload) {
          if (room.split('.')[1] === 'name') {
            let rooms = this.getRooms();
            rooms[room.split('.')[0]] = { name: payload[room] };
            this.updateRoomNames(rooms);
          }
          else if (room.split('.')[1] === 'keyRotation') {
            fetch(ROOM_SERVER + this.state.activeRoom + "/ownerKeyRotation", { credentials: 'include' });
          }
          else {
            localStorage.setItem(room, JSON.stringify(payload[room]));
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
    window.onclick = function (event) {
      if (!event.target.matches('#roomListNavlink') && !event.target.matches('#menuDropdownIcon')) {
        var dropdowns = document.getElementsByClassName("dropdown-content");
        var i;
        for (i = 0; i < dropdowns.length; i++) {
          var openDropdown = dropdowns[i];
          if (openDropdown.classList.contains('show')) {
            openDropdown.classList.remove('show');
          }
        }
      }
    }
    this.getRooms();
    if (this.isValidRoomId(this.state.activeRoom)) {
      this.setState({ activeRooms: [...this.state.activeRooms, this.state.activeRoom] });
    }
  }

  render() {
    const _validRoomId = this.isValidRoomId(this.state.activeRoom);
    return (
      <Router>
        <div id='image_overlay'>
          <div id="preview_img" className="center"><h2>Fetching image....</h2></div>
          <button className="close-btn" onClick={() => {
            document.getElementById('image_overlay').style.display = 'none';
            document.getElementById('preview_img').classList.add('center');
            document.getElementById('preview_img').innerHTML = '<h2>Fetching image...</h2>';
          }}>&#10006;</button>
        </div>
        {!this.isValidPath(this.state.activeRoom) ? <Route>
          <h2 style={{ textAlign: 'center' }}>You tried to open room {window.location.pathname.slice(1)} which is not a proper room name. Room names are always a 64 character b-64 string.</h2>
        </Route> :
          <View style={{ width: "100%", height: "100%", flex: 1, maxWidth: "1000px", margin: "auto", borderTopWidth: "0", borderStyle: "solid", borderWidth: "1px", borderColor: "rgb(178, 178, 178)", overflow: "auto" }}>
            <ul className="header">
              <li className="header-link"><NavLink exact activeClassName="activeNavlink" className="navlink" to={"/"}>Home</NavLink></li>
              {_validRoomId && <li className="header-link">
                <NavLink onClick={() => { window.location.pathname === '/' + this.state.activeRoom && document.getElementById("roomDropdown").classList.toggle("show") }} exact activeClassName="activeNavlink" className="navlink" id='roomListNavlink' to={"/" + this.state.activeRoom}>{this.state.rooms[this.state.activeRoom]['name']}</NavLink>
                <div id="roomDropdown" className="dropdown-content">
                  {this.sortRooms(this.state.rooms).slice(0, 8).map(room => {
                    return <NavLink onClick={() => this.goToRoom(room[0])} key={room[0]} to={room[0]}>{room[1]['unread'] ? <b>{room[1]['name']}</b> : room[1]['name']}</NavLink>
                  })}
                  <NavLink to='/#roomList'>All Rooms</NavLink>
                </div></li>}
              <li className="header-link"><NavLink exact activeClassName="activeNavlink" className="navlink" to={"/guide"}>Guide</NavLink></li>
              {this.state.showAdminTab && <li className="header-link"><NavLink exact className="navlink" activeClassName="activeNavlink" to={"/" + this.state.activeRoom + "/admin"}>Admin</NavLink></li>}
              {!this.state.showAdminTab && _validRoomId && <li className="header-link" id="user-icon"><img src={user_icon} onClick={(event) => JwModal.open('user-info-'+ this.state.activeRoom)} alt='User Icon'></img></li>}
            </ul>
            <Route exact path="/" children={({ match, location }) => (
              <LandingPage
                key={JSON.stringify(this.state.rooms)}
                className={!match ? 'hidden' : null}
                rooms={this.state.rooms}
                currentRoom={this.state.activeRoom}
                refreshRooms={() => this.getRooms()}
                updateRoomNames={(rooms) => { this.updateRoomNames(rooms) }}
                goToRoom={(roomId) => this.goToRoom(roomId)}
                sortRooms={(rooms) => this.sortRooms(rooms)} />
            )}
            />
            <Route exact path="/guide" children={({ match }) => (
              <Guide
                className={!match ? 'hidden' : null} />
            )}
            />
            {this.state.activeRooms.map((roomId) => {
              return <Route key={roomId} exact path={'/' + roomId} children={({ match }) => (
                <Room
                  rooms={this.state.rooms}
                  roomId={roomId}
                  roomName={this.state.rooms[roomId]['name']}
                  className={!match ? 'hidden' : null}
                  contacts={this.state.contacts}
                  updateContacts={(contacts) => this.updateContacts(contacts)}
                  updateRoomNames={(rooms) => this.updateRoomNames(rooms)}
                  showAdminTab={this.showAdminTab}
                />
              )}
              />
            })}
          </View>
        }
      </Router >

    )
  }
}

export default Snackabra
