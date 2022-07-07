import * as React from "react"
import { Trans } from "@lingui/macro";
import { Grid, TextField } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useContext } from "react"
import NotificationContext from "../../contexts/NotificationContext";
import RoomContext from "../../contexts/RoomContext";


const ImportRoomKeys = (props) => {
  const Notifications = useContext(NotificationContext)
  const Room = useContext(RoomContext)
  const [secret, setSecret] = useState('');

  const success = () => {
    Notifications.setMessage('Room Created!');
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
  }

  const error = () => {
    Notifications.setMessage('Error creating the room');
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
  }


  const createRoom = async () => {
    try {
      await Room.createNewRoom(secret)
      if (typeof props?.onClose === 'function') {
        props.onClose()
      }
      success();
    } catch (e) {
      console.error(e)
      error()
    }
  }

  return (
    <Grid xs={12}
          spacing={2}
          container
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start">

      <Grid xs={12} item>
        <TextField
          fullWidth
          placeholder={'Server Secret'}
          value={secret}
          onChange={(e) => {
            setSecret(e.target.value)
          }}
        />
      </Grid>
      <Grid xs={12} item>
        <StyledButton variant="contained" onClick={createRoom}><Trans id='new room header'>Create New
          Room</Trans></StyledButton>
      </Grid>

    </Grid>
  )
}

export default ImportRoomKeys
