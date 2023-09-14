import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogActions from '@mui/material/DialogActions';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from '@mui/material/DialogContent';
import DialogTitle from '@mui/material/DialogTitle';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';
import { StyledButton } from "../styles/Buttons";

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
