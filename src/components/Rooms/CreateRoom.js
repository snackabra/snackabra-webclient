import * as React from "react"
import { Trans } from "@lingui/macro";
import { Grid, TextField } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import CircularProgress from '@mui/material/CircularProgress';
import { useState, useContext } from "react"
import NotificationContext from "../../contexts/NotificationContext";
import FirstVisitDialog from "../Modals/FirstVisitDialog";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";


const CreateRoom = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = useContext(NotificationContext)
  const [secret, setSecret] = useState('');
  const [roomId, setRoomId] = useState('');
  const [creating, setCreating] = useState(false);
  const [openFirstVisit, setOpenFirstVisit] = useState(false);

  const success = (roomId) => {
    if (typeof props?.onClose === 'function') {
      props.onClose()
    }
    Notifications.setMessage('Room Created!');
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
    setCreating(false)
    setTimeout(() => {
      window.location.href = window.location.origin + `/${roomId}`
    }, 750)

  }

  const error = () => {
    Notifications.setMessage('Error creating the room');
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
  }


  const createRoom = async () => {
    try {
      setCreating(true)
      sbContext.createRoom(secret).then((channel) => {
        setRoomId(channel)
        setOpenFirstVisit(true)
      })
    } catch (e) {
      console.error(e)
      error()
    }
  }

  const saveUsername = (newUsername) => {
    return new Promise((resolve) => {
      const _id = sbContext.user._id;
      sbContext.username = newUsername;
      const contacts = sbContext.contacts
      const user_pubKey = _id;
      contacts[user_pubKey.x + ' ' + user_pubKey.y] = newUsername;
      sbContext.contacts = contacts;
      resolve(true)
    })

  }

  return (
    <Grid spacing={2}
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
        {creating ?
          <StyledButton disabled variant={'outlined'}>
            <CircularProgress color={"success"} size={20} />
            &nbsp;Creating
          </StyledButton>

          :
          <StyledButton variant="contained" onClick={createRoom}><Trans id='new room header'>Create New
            Room</Trans></StyledButton>
        }

      </Grid>
      <FirstVisitDialog open={openFirstVisit} sbContext={sbContext} onClose={(username) => {
        saveUsername(username).then(()=>{
          setOpenFirstVisit(false)
          success(roomId);
        })

      }} roomId={roomId} />
    </Grid>
  )
})

export default CreateRoom
