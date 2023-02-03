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
import { useDrag, usePinch, createUseGesture, dragAction, pinchAction } from '@use-gesture/react'
import { a, useSpring, config } from '@react-spring/web'
import { CodeSharp } from '@mui/icons-material';
import zIndex from '@mui/material/styles/zIndex';

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

const useGesture = createUseGesture([dragAction, pinchAction])

export default function ImageOverlay(props) {
  const [isOpen, setOpen] = React.useState(props.open);
  const [img, setImage] = React.useState(props.img);
  const [imgLoaded, setImageLoaded] = React.useState(props.imgLoaded);
  const myRef = React.createRef();

  let [{ x, y, scale, rotateZ }, api] = useSpring(() => ({
    x: 0,
    y: 0,
    scale: 1,
    rotateZ: 0,
  }))


  React.useEffect(() => {
    const handler = (e) => e.preventDefault()
    document.addEventListener('gesturestart', handler)
    document.addEventListener('gesturechange', handler)
    document.addEventListener('gestureend', handler)
    return () => {
      document.removeEventListener('gesturestart', handler)
      document.removeEventListener('gesturechange', handler)
      document.removeEventListener('gestureend', handler)
    }
  }, [])

  let height = window.innerHeight - (window.innerHeight / 4)
  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  React.useEffect(() => {
    setImage(props.img)
    if (isMobile) {
      console.log()
      open({ canceled: true })
    }

  }, [props.img])

  React.useEffect(() => {
    setImageLoaded(props.imgLoaded)
  }, [props.imgLoaded])



  const open = ({ canceled }) => {
    // when cancel is true, it means that the user passed the upwards threshold
    // so we change the spring config to create a nice wobbly effect
    if (canceled)
      api.start({ y: 0, x: 0, scale: 1, rotateZ: 0, pinching: false, reset: true, immediate: false, config: canceled ? config.wobbly : config.stiff })
  }

  const close = () => {
    api.start({ y: 0, x: 0, scale: 1, rotateZ: 0, reset: true, immediate: false, config: { ...config.stiff, velocity: 0 } })
    setTimeout(() => {
      props.onClose()
    }, 50)

  }

  useGesture(
    {
      onDrag: (state) => {
        const { down, dragging, offset: [x, y], last, velocity: [vy], direction: [, dy] } = state
        // if the user drags up passed a threshold, then we cancel
        // the drag so that the sheet resets to its open position
        if (down && !dragging) {
          return;
        }
        const s = scale.animation.to;
        if (last && s <= 1) {
          console.log(Math.abs(y), height * 0.5)
          console.log(Math.abs(y) > height * 0.5)
          if (Math.abs(y) > height * 0.5) {
            close(vy)
          } else {
            open({ canceled: true })
          }
        } else {
          if (s <= 1) {
            api.start({ y: y, x: 0, immediate: true, rubberband: false })

          } else {
            api.start({ y: y, x: x, immediate: true, rubberband: false })
          }

        }
      },
      onPinch: (state) => {
        let { offset: [s] } = state;
        if (s < 1) s = 1
        api.start({ scale: s })
        if (s === 1) {
          open({ canceled: true })
        }
      },
    },
    {
      target: myRef,
      drag: { from: () => [x.get(), y.get()], filterTaps: true, rubberband: false },
      pinch: { scaleBounds: { min: 1, max: 20 }, pinchOnWheel: true, rubberband: true },
    }
  )
  return (

    <Dialog
      fullScreen
      open={isOpen}
      onClose={props.onClose}
      TransitionComponent={Transition}
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
        </AppBar> :
        <IconButton
          edge="end"
          color="inherit"
          style={{
            right: 0,
            width: 40,
            height: 40,
            backgroundColor: 'gray',
            position: 'fixed',
            right: 16,
            zIndex: 1000
          }}
          onClick={props.onClose}
          aria-label="close"
        >
          <CloseIcon />
        </IconButton>
      }


      <DialogContent sx={{ p: 0 }} style={{ touchAction: 'none' }}>

        <a.div ref={myRef} style={{ touchAction: 'none', display: 'block', x, y, scale, rotateZ }} className={`flex fill center`}>
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

    </Dialog>

  );
}
