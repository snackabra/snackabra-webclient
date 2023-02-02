import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import DialogContent from "@mui/material/DialogContent";
import { Image } from 'mui-image'
import { isMobile } from 'react-device-detect';
import { useDrag } from '@use-gesture/react'
import { a, useSpring, config } from '@react-spring/web'

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function ImageOverlay(props) {
  const [isOpen, setOpen] = React.useState(props.open);
  const [img, setImage] = React.useState(props.img);
  const [imgLoaded, setImageLoaded] = React.useState(props.imgLoaded);
  const myRef = React.createRef();

  let height = window.innerHeight - (window.innerHeight / 4)
  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  React.useEffect(() => {
    setImage(props.img)
    if (isMobile) {
      open(myRef)
    }

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

  const [{ y }, api] = useSpring(() => ({ y: height }))

  const open = ({ canceled }) => {
    // when cancel is true, it means that the user passed the upwards threshold
    // so we change the spring config to create a nice wobbly effect
    console.log(canceled)
    api.start({ y: 0, immediate: false, config: canceled ? config.wobbly : config.stiff })
  }
  const close = (velocity = 0) => {
    api.start({ y: height, immediate: false, config: { ...config.stiff, velocity } })
  }

  const bind = useDrag(
    ({ last, velocity: [, vy], direction: [, dy], movement: [, my], cancel, canceled }) => {
      // if the user drags up passed a threshold, then we cancel
      // the drag so that the sheet resets to its open position
      if (my < -70) {
        props.onClose()
        // cancel()
      }

      // when the user releases the sheet, we check whether it passed
      // the threshold for it to close, or if we reset it to its open positino
      if (last) {
        my > height * 0.5 || (vy > 0.5 && dy > 0) ?
          props.onClose() :
          open({ canceled })
      }
      // when the user keeps dragging, we just move the sheet according to
      // the cursor position
      else api.start({ y: my, immediate: true })
    },
    { from: () => [0, y.get()], filterTaps: true, bounds: { top: 0 }, rubberband: true }
  )

  return (
    <div style={{ overflow: 'hidden' }} ref={myRef}>
      <Dialog
        fullScreen
        open={isOpen}
        onClose={props.onClose}
        TransitionComponent={Transition}
      >
        {!isMobile &&
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
        }
        {isMobile ?
          <DialogContent sx={{ p: 0 }}>
            <a.div {...bind()} style={{ display: 'block', y }}>
              {img &&

                <Image
                  src={img}
                  height="100%"
                  // width="100%"
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
              }

            </a.div>
          </DialogContent>
          :
          <DialogContent sx={{ p: 0 }}>
            <Image
              src={img}
              height="100%"
              // width="100%"
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
        }
      </Dialog>
    </div>
  );
}
