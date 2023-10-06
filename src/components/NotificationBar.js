import * as React from 'react';
import {Snackbar, Alert} from '@mui/material';
import { Portal } from '@mui/base';
import NotificationContext from "../contexts/NotificationContext.js";

export default function NotificationBar() {

  const context = React.useContext(NotificationContext)

  const handleClose = () => {
    context.setOpen(false);
  };

  return (
    <Portal>
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
    </Portal>
  );
}
