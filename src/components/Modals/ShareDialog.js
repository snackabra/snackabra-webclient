import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState } from "react";

const ShareDialog = (props) => {
  const [open, setOpen] = useState(props.open);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const copy = async () => {
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(props.roomId);
    } else {
      document.execCommand('copy', true, props.roomId);
    }
    setTimeout(() => {
      props.onClose();
    }, 250)

  }

  const onClose = () => {
      props.onClose();
  }

  return (
    <ResponsiveDialog
      title={'Copy Room ID'}
      onClose={onClose}
      open={open}>
      <Grid container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start">
        <Grid item xs={12}>
          <Typography variant={'body1'}>
            Click copy to gather the room ID
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ pb: 2, pt: 2 }}>
          <TextField
            id="sb-copy_room_id"
            placeholder="Room ID"
            fullWidth
            value={props.roomId}
            disabled
          />
        </Grid>
        <StyledButton variant={'outlined'} onClick={copy}>Copy</StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

}

export default ShareDialog
