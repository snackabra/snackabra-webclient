import * as React from 'react';
import Button from '@mui/material/Button';
import Snackbar, { SnackbarOrigin } from '@mui/material/Snackbar';
import NotificationContext from "../contexts/NotificationContext";
import { Alert } from "@mui/material";


export default function NotificationBar() {

  const context = React.useContext(NotificationContext)

  const handleClose = () => {
    context.setOpen(false);
  };

  return (
    <div>
      <Snackbar
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'center',
        }}
        open={context.open}
        onClose={handleClose}
        autoHideDuration={context.autoHideDuration}
      >
        <Alert classes={{ message: 'message-overflow' }} onClose={handleClose} severity={context.severity}>
          {context.message}
          {context.action}
        </Alert>
      </Snackbar>
    </div>
  );
}
