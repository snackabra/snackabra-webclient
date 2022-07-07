import * as React from 'react';
import Button from '@mui/material/Button';
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

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  React.useEffect(() => {
    setImage(props.img)
  }, [props.img])

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
            duration={3000}
            easing="cubic-bezier(0.7, 0, 0.6, 1)"
            showLoading={true}
            errorIcon={true}
            shift={null}
            distance="100px "
            shiftDuration={900}
            bgColor="inherit"
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
