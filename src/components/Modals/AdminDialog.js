/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React, { useState } from 'react';
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import ConfirmLockDialog from "./ConfirmLockDialog";
import NotificationContext from "../../contexts/NotificationContext";
import { observer } from "mobx-react"
import SnackabraContext from "../../contexts/SnackabraContext";

function isNumeric(v) {
  return !isNaN(v) &&
    !isNaN(parseFloat(v))
}

const AdminDialog = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const notify = React.useContext(NotificationContext);
  const channel = sbContext.channels[props.roomId];
  const [roomCapacity, setRoomCapacity] = useState(channel.capacity);
  const [motd, setMOTD] = useState(channel.motd);
  const [open, setOpen] = useState(props.open);
  const [openLockDialog, setOpenLockDialog] = useState(false);

  React.useEffect(() => {
    if (motd === null && props.motd) {
      setMOTD(props.motd)
    }
    if (roomCapacity === null && props.capacity) {
      setRoomCapacity(props.capacity)
    }
  }, [motd, roomCapacity, props])

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const lockRoom = () => {
    channel.lockRoom();
    props.onClose();
  }

  const cancelLock = () => {
    setOpenLockDialog(false)
  }

  const setCapacity = () => {
    if (isNumeric(roomCapacity)) {
      channel.capacity = Number(roomCapacity)
      props.onClose();
    } else {
      notify.setMessage('Invalid room capacity');
      notify.setSeverity('error');
      notify.setOpen(true)
    }
  }

  const sendMotdMessage = () => {
    console.log(motd)
    props.sendSystemInfo(`MOTD: ${motd}`);
  }

  return (<ResponsiveDialog
    title={'Admin Controls'}
    onClose={props.onClose}
    open={open}>
    <ConfirmLockDialog
      onClose={() => {
        setOpenLockDialog(false)
      }}
      open={openLockDialog}
      lockRoom={lockRoom}
      cancelLock={cancelLock} />
    <Grid container
      direction="row"
      justifyContent="space-between"
      alignItems="flex-start">
      <Grid item xs={12}>
        <TextField
          id="sb-motd"
          multiline
          placeholder={'MOTD'}
          rows={4}
          value={motd}
          onChange={(e) => {
            setMOTD(e.target.value)
          }}
          fullWidth
          sx={{ pb: 1, pt: 1 }}
        />
        <StyledButton variant={"contained"} onClick={() => {
          channel.motd = motd
          if (motd !== '') {
            sendMotdMessage()
          }
          props.onClose()
        }}>
          <Typography variant={"button"}>Save MOTD</Typography>
        </StyledButton>
      </Grid>
      <Grid item xs={12}>
        <TextField
          id="sb-rrom-capacity"
          placeholder={'Room Capacity'}
          inputProps={{ inputMode: 'numeric', pattern: '[0-9]*' }}
          value={roomCapacity}
          onChange={(e) => {
            setRoomCapacity(e.target.value)
          }}
          fullWidth
          sx={{ pb: 1, pt: 1 }}
        />
      </Grid>

      <StyledButton variant={"contained"} sx={{ pb: 1, pt: 1 }} onClick={setCapacity}>
        <Typography variant={"button"}>Save Capacity</Typography>
      </StyledButton>

      {/* 
      <StyledButton variant={"contained"} onClick={openConfirm} sx={{ pb: 1, pt: 1 }}>
        <Typography variant={"button"}>Restrict Room</Typography>
      </StyledButton> */}
      <Grid item xs={12} sx={{ pb: 1, pt: 1 }}>
        <StyledButton variant={"contained"} onClick={props.onClose} sx={{ pb: 1, pt: 1 }}>
          <Typography variant={"button"}>Cancel</Typography>
        </StyledButton>
      </Grid>
    </Grid>
  </ResponsiveDialog>
  );
})

export default AdminDialog;