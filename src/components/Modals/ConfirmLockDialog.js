/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React, { useState } from 'react';
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";

const ConfirmLockDialog = (props) => {
  const [open, setOpen] = useState(props.open);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  return (<ResponsiveDialog
      title={'Are you sure?'}
      onClose={props.onClose}
      open={open}>
      <Grid container
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start">
        <Grid item xs={12}>
          <Typography variant={"body1"}>
            Restriction will cause new encryption keys to be generated, and will only be
            shared to participants that you as Owner explicitly approve. New participants can still whisper to you, but
            not send or receive messages from anybody else.
          </Typography>
        </Grid>
        <StyledButton variant={"contained"} sx={{ pb: 1, pt: 1 }} onClick={props.lockRoom}>
          <Typography variant={"button"}>Confirm</Typography>
        </StyledButton>
        <StyledButton variant={"contained"} onClick={props.cancelLock} sx={{ pb: 1, pt: 1 }}>
          <Typography variant={"button"}>Cancel</Typography>
        </StyledButton>


      </Grid>
    </ResponsiveDialog>
  );
}

export default ConfirmLockDialog;
