import * as React from "react"
import { Trans } from "@lingui/macro";
import refresh_icon from "../../images/icons8-refresh-24.png";
import edit_icon from "../../images/icons8-edit-24.png";
import { JwModal } from "../../containers/Modal/Modal";
import download_icon from "../../images/download-file-square-line.png";
import { Grid, Typography } from "@mui/material";


const Welcome = (props) => {

  return (
    <Grid container>
      <Typography variant={'h2'}><Trans id='welcome header'>Welcome to Snackabra!</Trans></Typography>
      <Typography variant={"body1"}><Trans id='member message'>If you are a <a href='https://privacy.app/member'>Privacy.App Member</a>, you can log in on your membership page, which will manage your rooms for you.</Trans></Typography>
      {props.rooms_found ?
        <div id="roomList">
          <Typography variant={'h3'}><Trans id='room list header'>Rooms &emsp;</Trans><img src={refresh_icon} style={{ cursor: 'pointer', verticalAlign: 'middle' }} alt='Refresh room list' onClick={() => props.refreshRooms()}></img></Typography>
          <table id="roomListTable">
            <tbody style={{ width: "100%" }}>
            {props.sortRooms(props.rooms).map((room) => {
                return (
                  <tr key={room[0]}>
                    <td id="roomname_edit_td"><img src={edit_icon} style={{ cursor: 'pointer' }} alt='Rename Room' onClick={() => {
                      props.setRenameRoom(room[0]);
                      JwModal.open('rename-room');
                    }} /></td>
                    <td id="download_roomData_td"><img src={download_icon} style={{ cursor: 'pointer', width: '24px' }} alt='Download room data' onClick={() => {
                      props.downloadRoomData(room[0]);
                    }} /></td>
                    <td id='roomname_td'>
                      <div id='roomname_td_div' onClick={() => {
                        props.goToRoom(room[0]);
                        // history.push(room[0]);
                      }}>{room[1]['unread'] ? <b>{room[1]['name']}</b> : room[1]['name']}</div>
                    </td>
                  </tr>
                )
              }
            )}
            </tbody>
          </table>
        </div> : null}
    </Grid>

  )
}

export default Welcome
