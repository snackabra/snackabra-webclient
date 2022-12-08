import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import DialogContent from "@mui/material/DialogContent";
import { Image } from 'mui-image'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ImageOverlay(props) {
  const [open, setOpen] = React.useState(props.open);
  const [img, setImage] = React.useState(props.img);
  const [imgLoaded, setImageLoaded] = React.useState(props.imgLoaded);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  React.useEffect(() => {
    setImage(props.img)
    // window.pinchZoomEvent = document.addEventListener('touchmove', function (event) {

    // }, { passive: false });
    // return () =>{
    //   window.pinchZoomEvent = document.addEventListener('touchmove', function (event) {
    //     if (event.scale !== 1) { event.preventDefault(); }
    //   }, { passive: false });
    // }
  }, [props.img])

  React.useEffect(() => {
    setImageLoaded(props.imgLoaded)
  }, [props.imgLoaded])
  return (
    <div>
      <Dialog
        fullScreen
        open={open}
        onClose={props.onClose}
        TransitionComponent={Transition}
      >
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
        </AppBar>
        <DialogContent sx={{ p: 0 }}>
            <Image
              src={img}
              height="100%"
              width="100%"
              fit="contain"
              duration={imgLoaded ? 0 : 1000}
              easing="cubic-bezier(0.7, 0, 0.6, 1)"
              showLoading={true}
              errorIcon={true}
              shift={null}
              distance="100px "
              shiftDuration={imgLoaded ? 0 : 1000}
              bgColor="inherit"
            />


        </DialogContent>
      </Dialog>
    </div>
  );
}
