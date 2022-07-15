/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React, { useState } from 'react';
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import ActiveChatContext from "../../contexts/ActiveChatContext";
import ConfirmLockDialog from "./ConfirmLockDialog";
import NotificationContext from "../../contexts/NotificationContext";

function isNumeric(v) {
  return !isNaN(v) &&
    !isNaN(parseFloat(v))
}

const AdminDialog = (props) => {
  const activeChatContext = React.useContext(ActiveChatContext);
  const notify = React.useContext(NotificationContext);
  const [roomCapacity, setRoomCapacity] = useState(activeChatContext.roomCapacity);
  const [motd, setMOTD] = useState(activeChatContext.motd);
  const [open, setOpen] = useState(props.open);
  const [openLockDialog, setOpenLockDialog] = useState(false);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  React.useEffect(() => {
    setRoomCapacity(activeChatContext.roomCapacity);
  }, [activeChatContext.roomCapacity]);

  React.useEffect(() => {
    setMOTD(activeChatContext.motd);
  }, [activeChatContext.motd])

  const lockRoom = () => {
    activeChatContext.lockRoom();
    props.onClose();
  }

  const openConfirm = () => {
    setOpenLockDialog(true)
  }

  const cancelLock = () => {
    setOpenLockDialog(false)
  }

  const setCapacity = () => {
    if (isNumeric(roomCapacity)) {
      activeChatContext.updateRoomCapacity(Number(roomCapacity))
      props.onClose();
    }else{
      notify.setMessage('Invalid room capacity');
      notify.setSeverity('error');
      notify.setOpen(true)
    }
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
            activeChatContext.setMOTD(motd)
            props.onClose()
          }}>
            <Typography variant={"button"}>Save MOTD</Typography>
          </StyledButton>
        </Grid>
        <Grid item xs={12}>
          <TextField
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


        <StyledButton variant={"contained"} onClick={openConfirm} sx={{ pb: 1, pt: 1 }}>
          <Typography variant={"button"}>Restrict Room</Typography>
        </StyledButton>
        <Grid item xs={12} sx={{ pb: 1, pt: 1 }}>
          <StyledButton variant={"contained"} onClick={props.onClose} sx={{ pb: 1, pt: 1 }}>
            <Typography variant={"button"}>Cancel</Typography>
          </StyledButton>
        </Grid>
      </Grid>
    </ResponsiveDialog>
  );
}

export default AdminDialog;
