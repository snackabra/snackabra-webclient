import React from "react"
import { useNavigate } from "react-router-dom";
import { observer } from "mobx-react";
import { Grid, TextField, Typography, Button } from "@mui/material";
import NotificationContext from "../../contexts/NotificationContext.js";
import SnackabraContext from "../../contexts/SnackabraContext.js";
import ResponsiveDialog from "../ResponsiveDialog.js";


const JoinDialog = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = React.useContext(NotificationContext);
  const navigate = useNavigate();
  const [open, setOpen] = React.useState(props.open);
  const [roomId, setRoomId] = React.useState("");
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
    try{
      parseRoomId(e.target.value.trim())
    }catch(err){
      errorNotify(err.message)
    }

  }

  const errorNotify = (message) => {
    Notifications.setMessage(message);
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
    setErrored(true)
  }

  const join = () => {
    try{
      parseRoomId(roomId)
      sbContext.join(roomId, userName).then((channel) => {
        sbContext.channels[channel._id].alias = roomName
        const user = userName.length > 0 ? userName : 'Unamed'
        sbContext.createContact(user, channel.key)
        navigate("/" + roomId);
        setRoomId("");
        setErrored(false);
        props.onClose(channel._id, index);
      })
    }catch(err){
      errorNotify(err.message)
    }

  }

  const parseRoomId = (value) => {
    if (value.match(/^http|^https/)) {
      const uriParts = value.split('/')
      const pathname = uriParts[uriParts.length - 1]
      if (pathname.length === 64) {
        setRoomId(pathname)
      } else {
        errorNotify('The room id provided is not the correct format.')
      }

    } else {
      if (value.length === 64) {
        setRoomId(value)
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
                join()
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
                join()
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
                join()
              }
            }}
          />
        </Grid>

      </Grid>
      <Grid container
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start">
        <Button variant={'outlined'} onClick={join}>Connect</Button>
        <Button variant={'outlined'} onClick={props.onClose}>Cancel</Button>
      </Grid>
    </ResponsiveDialog>
  )

})

export default JoinDialog
