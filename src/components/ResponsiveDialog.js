import * as React from 'react';
import { Dialog, IconButton, DialogContent, DialogTitle, useMediaQuery, useTheme } from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material/';

export default function ResponsiveDialog(props) {
  const [open, setOpen] = React.useState(props.open);
  const theme = useTheme();
  const fullScreen = useMediaQuery(theme.breakpoints.down('md'));

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const handleClose = () => {
    if (props.hasOwnProperty('onClose')) {
      props.onClose()
    } else {
      setOpen(false);
    }

  };

  return (
    <div>
      <Dialog
        fullScreen={fullScreen || props.fullScreen}
        open={open}
        onClose={handleClose}
      >
        <DialogTitle id={props.title.replace(" ", "-")}>
          {props.title}
          {props.showActions &&
            <IconButton color="inherit" onClick={handleClose} sx={{ position: 'absolute', right: 16, top: 16 }} aria-label="delete">
              <CloseIcon />
            </IconButton>}
        </DialogTitle>
        <DialogContent>
          {props.children}
        </DialogContent>
        {/* {props.showActions &&
          (<DialogActions>
            <StyledButton variant={'contained'} autoFocus onClick={handleClose}>
              Cancel
            </StyledButton>

          </DialogActions>)
        } */}
      </Dialog>
    </div>
  );
}
