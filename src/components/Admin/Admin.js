/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React, { useState } from 'react';
import { JwModal } from '../../containers/Modal/Modal'
import { Trans } from '@lingui/macro'
import './Admin.css'

const Admin = (props) => {
  const [roomCapacity, setRoomCapacity] = useState(props.roomCapacity);
  const [motd, setMOTD] = useState(props.motd);
  /*
  if(props.roomCapacity!==roomCapacity) {
    setRoomCapacity(props.roomCapacity);
  }
  */
  React.useEffect(() => {
    setRoomCapacity(props.roomCapacity);
  }, [props.roomCapacity]);

  React.useEffect(() => {
    setMOTD(props.motd);
  }, [props.motd])
  return props.adminError ? (
    <div className={"admin " + props.className}>
      <h2><Trans id='admin error header'>Please join again from your membership page to access the admin features</Trans></h2>
    </div>
  ) :
    (
      <div className={"admin " + props.className}>
        <JwModal id="admin-response">
          <button className='admin-button gray-btn' onClick={JwModal.close('admin-response')}>Close</button>
        </JwModal>
        <JwModal id="confirm-lockdown">
          <Trans id='confirm restriction message'>Restriction will cause new encryption keys to be generated, and will only be shared to participants that you as Owner explicitly approve. New participants can still whisper to you, but not send or receive messages from anybody else.</Trans>
          <br />
          <button className='admin-button green-btn' id='confirm-lockdown-btn' onClick={(e) => {
            props.lockRoom();
            JwModal.close('confirm-lockdown')(e);
          }}><Trans id='confirm room restriction button text'>Confirm Room Restriction</Trans></button>
        </JwModal>
        <h2 id='admin-title'><Trans id='admin header'>Admin Controls - {props.roomName}</Trans></h2 >
        <div className="adminSection">
          <label htmlFor='motd'><Trans id='motd label'>Enter the Message of the Day below: </Trans></label>
          <br />
          <textarea rows={5} cols={50} id='motd' onFocus={(event) => event.target.select()} placeholder='Enter the Message of the Day here...' value={motd} onChange={(event)=>setMOTD(event.target.value)}></textarea>
          <br /><br />
          <button className='admin-button green-btn' id='motd-save-btn' onClick={() => { props.setMOTD() }}><Trans id='save button text'>Save</Trans></button>
        </div>
        <div className="adminSection">
          <label htmlFor="roomCapacity-input" style={{ fontSize: "20px" }}><Trans id='change room capacity label'>Change Room Capacity</Trans></label>
          <br /><br />
          <input type="text" id='roomCapacity-input' placeholder="Enter Room Capacity" value={roomCapacity} onChange={(event) => setRoomCapacity(event.target.value)} onFocus={(event) => event.target.select()} autoFocus />
          <br />
          <button className='admin-button gray-btn' onClick={() => props.updateRoomCapacity(roomCapacity)}><Trans id='update button text'>Update</Trans></button>
        </div>
        <br /> <br />
        {
          props.locked ?
            <div className="adminSection">
              <p style={{ fontSize: "20px", textDecoration: "none" }}><Trans id='join requests header'>Join Requests</Trans></p>
              <table id="joinRequests">
                <tbody style={{ width: "100%" }}>
                  {props.joinRequests.length > 0 ? props.joinRequests.map((_pubKey) => {
                    const pubKey = JSON.parse(_pubKey) || '';
                    let contacts = props.contacts;
                    let user_key = pubKey.x + " " + pubKey.y;
                    if (!contacts.hasOwnProperty(pubKey.x + " " + pubKey.y)) {
                      const username = (user_key === (props.exportable_pubKey.x + " " + props.exportable_pubKey.y)) ? "Me" : 'User ' + (Object.keys(contacts).length + 1).toString();
                      contacts[user_key] = username;
                      props.updateContacts(contacts);
                    }
                    return (
                      <tr>
                        <td id='username-joinRequest'>{contacts[pubKey.x + " " + pubKey.y]}</td>
                        <td><button className='admin-button green-btn' id='green-btn' onClick={() => props.acceptVisitor(_pubKey)}><Trans id='accept button text'>ACCEPT</Trans></button></td>
                      </tr>
                    )
                  }) : <Trans id='no join requests text'>No new join requests for this room!</Trans>}
                </tbody>
              </table>
            </div> : null
        }
        {
          !props.locked ?
            <div className="adminSection">
              <button className='admin-button gray-btn' onClick={() => JwModal.open('confirm-lockdown')}><Trans id='restrict button text'>Restrict</Trans></button>
            </div> : null
        }
      </div >
    );
}

export default Admin;
