import React from "react";
import { Typography, DialogActions, DialogContent, Button } from "@mui/material";
import ResponsiveDialog from "../ResponsiveDialog.js";


export default function ConfirmationDialog(props) {
  const [open, setOpen] = React.useState(props.open);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  return (
    <ResponsiveDialog title={'Confirm'} open={open} onClose={props.onClose}>
      <DialogContent dividers>
        <Typography variant="body1">{props.text}</Typography>
      </DialogContent>
      <DialogActions>
        <Button variant="outlined" autoFocus onClick={props.onCancel}>
          Cancel
        </Button>
        <Button variant="contained" onClick={props.onConfirm}>Ok</Button>
      </DialogActions>
    </ResponsiveDialog>
  )

}
