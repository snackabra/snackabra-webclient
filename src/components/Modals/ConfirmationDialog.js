import * as React from "react";
import ResponsiveDialog from "../ResponsiveDialog";

import DialogContent from '@mui/material/DialogContent';
import DialogActions from '@mui/material/DialogActions';
import { StyledButton } from "../../styles/Buttons";
import { Typography } from "@mui/material";


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
        <StyledButton variant="outlined" autoFocus onClick={props.onCancel}>
          Cancel
        </StyledButton>
        <StyledButton variant="contained" onClick={props.onConfirm}>Ok</StyledButton>
      </DialogActions>
    </ResponsiveDialog>
  )

}
