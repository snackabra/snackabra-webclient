import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import NotificationContext from "../../contexts/NotificationContext";
import { useNavigate } from "react-router-dom";

const JoinDialog = (props) => {
  const Notifications = React.useContext(NotificationContext);
  const navigate = useNavigate();

  const [open, setOpen] = React.useState(props.open);
  const [roomId, setRoomId] = React.useState("");
  const [error, setErrored] = React.useState(false);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateRoomId = (e) => {
    console.log(e.target.value)
    setRoomId(e.target.value.trim())
  }

  const errorNotify = (message) => {
    Notifications.setMessage(message);
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
    setErrored(true)
  }


  const connect = () => {

    if (roomId.match(/^http|^https/)) {
      const uriParts = roomId.split('/')
      const pathname = uriParts[uriParts.length - 1]
      if (pathname.length === 64) {
        navigate("/" + pathname);
        setRoomId("");
        props.onClose()
      } else {
        errorNotify('The room id provided is not the correct format.')
      }

    } else {
      console.log(window.location.origin + "/" + roomId)
      if (roomId.length === 64) {
        navigate("/" + roomId);
        setRoomId("");
        props.onClose()
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
      open={open}>
      <Grid container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start">
        <Grid item xs={12}>
          <Typography variant={'body1'}>
            Enter the room ID or URL you would like to connect to.
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ pb: 2, pt: 2 }}>
          <TextField
            id="sb-room-id"
            error={error}
            placeholder="Room ID or URL"
            fullWidth
            onChange={updateRoomId}
            value={roomId}
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

}

export default JoinDialog
