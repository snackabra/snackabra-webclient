/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import React from 'react';
import { Grid, Typography, Button } from "@mui/material";
import ResponsiveDialog from "../ResponsiveDialog.js";


const ConfirmLockDialog = (props) => {
  const [open, setOpen] = React.useState(props.open);

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
        <Button variant={"contained"} sx={{ pb: 1, pt: 1 }} onClick={props.lockRoom}>
          <Typography variant={"button"}>Confirm</Typography>
        </Button>
        <Button variant={"contained"} onClick={props.cancelLock} sx={{ pb: 1, pt: 1 }}>
          <Typography variant={"button"}>Cancel</Typography>
        </Button>


      </Grid>
    </ResponsiveDialog>
  );
}

export default ConfirmLockDialog;
