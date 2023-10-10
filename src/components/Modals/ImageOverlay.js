import React from 'react';
import {Dialog, AppBar, Toolbar, IconButton, Slide, DialogContent} from '@mui/material';
import {Close} from '@mui/icons-material';
import { isMobile } from 'react-device-detect';
import ImageCarousel from '../Images/ImageCarousel.js';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});


export default function ImageOverlay(props) {
  console.log('rendering image overlay')
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
              <Close />
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
