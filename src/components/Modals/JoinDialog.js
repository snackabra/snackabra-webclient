import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import NotificationContext from "../../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react";
import SnackabraContext from "../../contexts/SnackabraContext";

const JoinDialog = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = React.useContext(NotificationContext);
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(props.open);
  const [roomId, setRoomId] = React.useState(props.joinRoomId);
  const [error, setErrored] = React.useState(false);
  const [roomName, setRoomName] = React.useState(`Room ${Object.keys(sbContext.channels).length + 1}`);
  const [userName, setUserName] = React.useState('');
  const index = Object.keys(sbContext.channels).length

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  React.useEffect(() => {
    if (props.joinRoomId && props.joinRoomId !== roomId) {
      setRoomId(props.joinRoomId)
    }
  }, [props.joinRoomId, roomId])

  const updateRoomId = (e) => {
    setRoomId(e.target.value.trim())
  }

  const errorNotify = (message) => {
    Notifications.setMessage(message);
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
    setErrored(true)
  }

  const join = () => {
    sbContext.join(roomId, userName).then((channel) => {
      sbContext.channels[channel._id].alias = roomName
      const user = userName.length > 0 ? userName : 'Unamed'
      sbContext.createContact(user, channel.key)
      navigate("/" + roomId);
      setRoomId("");
      props.onClose(channel._id, index);
    })
  }

  const connect = () => {

    if (roomId.match(/^http|^https/)) {
      const uriParts = roomId.split('/')
      const pathname = uriParts[uriParts.length - 1]
      if (pathname.length === 64) {
        join()
      } else {
        errorNotify('The room id provided is not the correct format.')
      }

    } else {
      if (roomId.length === 64) {
        join()
      } else {
        errorNotify('The room id provided is not the correct format.')
      }
    }
  }

  const onClose = () => {
    props.onClose();
  }

  return (
    <ResponsiveDialog
      title={'Join Room'}
      onClose={onClose}
      open={open}
      showActions>
      <Grid container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start"
        style={{ width: '100%' }}>
        <Grid item xs={12} >
          {props.joinRoomId ? (

            <Typography variant={'body1'}>
              Welcome! If this is the first time you've been to this room, enter
              your username (optional) for this room and press 'Ok' and we we will generate fresh cryptographic keys that are
              unique to you and to this room.
            </Typography>
          ) : (
            <Typography variant={'body1'}>
              Enter the room ID or URL you would like to connect to.
            </Typography>)
          }

        </Grid>
        <Grid item xs={12} sx={{ pb: 2, pt: 2 }}>
          <TextField
            id="sb-room-id"
            error={error}
            label={'Room ID'}
            placeholder="Room ID or URL"
            fullWidth
            onChange={updateRoomId}
            value={roomId ? roomId : ''}
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                connect()
              }
            }}
          />
        </Grid>

        <Grid item xs={12} sx={{ pb: 2, pt: 2 }}>
          <TextField
            id="sb-room-user-name"
            label={'Room Name (optional)'}
            error={error}
            placeholder={'Room Name (optional)'}
            fullWidth
            onChange={(e) => {
              setRoomName(e.target.value)
            }}
            value={roomName}
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                connect()
              }
            }}
          />
        </Grid>
        <Grid item xs={12} sx={{ pb: 2, pt: 2 }}>
          <TextField
            id="sb-room-user-name"
            label={'Username (optional)'}
            error={error}
            placeholder="Username (optional)"
            fullWidth
            onChange={(e) => {
              setUserName(e.target.value)
            }}
            value={userName}
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                connect()
              }
            }}
          />
        </Grid>

      </Grid>
      <Grid container
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start">
        <StyledButton variant={'outlined'} onClick={connect}>Connect</StyledButton>
        <StyledButton variant={'outlined'} onClick={props.onClose}>Cancel</StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

})

export default JoinDialog
