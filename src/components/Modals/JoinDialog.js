import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState } from "react";

const JoinDialog = (props) => {
  const [open, setOpen] = useState(props.open);
  const [roomId, setRoomId] = useState("");

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateRoomId = (e) => {
    console.log(e.target.value)
    setRoomId(e.target.value)
  }

  const connect = () => {
    console.log(window.location.origin + "/" + roomId)
    window.location.replace(window.location.origin + "/" + roomId)
    setRoomId("");
    props.onClose()
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
            Enter the room ID you would like to connect to.
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ pb: 2, pt: 2 }}>
          <TextField
            id="sb-room-id"
            placeholder="Room ID"
            fullWidth
            onChange={updateRoomId}
            value={roomId}
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
