import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import DialogContent from "@mui/material/DialogContent";
import { isMobile } from 'react-device-detect';
import ImageCarousel from '../images/ImageCarousel';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});


export default function ImageOverlay(props) {

  return (

    <Dialog
      fullScreen
      open={props.open}
      onClose={props.onClose}
      TransitionComponent={Transition}
      style={{ backgroundColor: 'black' }}
    >

      {!isMobile ?
        <AppBar sx={{ position: 'relative', backgroundColor: 'black', textTransform: 'none' }}>
          <Toolbar>
            <IconButton
              edge="end"
              color="inherit"
              onClick={props.onClose}
              aria-label="close"
            >
              <CloseIcon />
            </IconButton>
          </Toolbar>
        </AppBar> : null
      }


      <DialogContent sx={{ p: 0, bgcolor: 'black' }} style={{ touchAction: 'none' }}>

        <ImageCarousel {...props} />
      </DialogContent>

    </Dialog>

  );
}
