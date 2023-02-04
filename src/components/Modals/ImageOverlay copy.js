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
  const [closing, setClosing] = React.useState(false);
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
    open({ canceled: true })
    if(props.img !== img){
      setImage(props.img)
      setClosing(false)
    }
  }, [props.img])

  React.useEffect(() => {
    setImageLoaded(props.imgLoaded)
  }, [props.imgLoaded])



  const open = ({ canceled }) => {
    // when cancel is true, it means that the user passed the upwards threshold
    // so we change the spring config to create a nice wobbly effect
    if (canceled)
      api.start({ y: 0, x: 0, scale: 1, rotateZ: 0, pinching: false, reset: true, immediate: true, config: canceled ? config.wobbly : config.stiff })
  }

  const close = () => {
    api.start({ y: 0, x: 0, scale: 1, rotateZ: 0, reset: true, immediate: true, config: { ...config.stiff, velocity: 0 } })
    setTimeout(() => {
      props.onClose()
    }, 50)

  }

  useGesture(
    {
      onDrag: (state) => {
        const { down, pinching, dragging, offset: [x, y], last, velocity: [vy], movement: [mx] } = state
        // if the user drags up passed a threshold, then we cancel
        // the drag so that the sheet resets to its open position
        console.log(state)
        if (down && !dragging && !pinching) {
          return;
        }
        const s = scale.animation.to;
        if (last && s === 1) {
          if (Math.abs(y) > height * 0.4) {

            api.start({
              y: Math.sign(mx) < 0 ? window.innerHeight : -Math.abs(window.innerHeight), x: 0
            })
            setTimeout(() => {
              setClosing(true)
            }, 50)
            setTimeout(() => {
              close(vy)
            }, 200)
          } else {
            open({ canceled: true })
          }
        } else {
          if (s <= 1) {
            api.start({
              y: y, x: 0
            })

          } else {
            const width = Number((window.innerWidth * s) / 2).toFixed(0);
            const xLimit = Math.abs(x) + (window.innerWidth / 2) >= width;
            if (xLimit) return
            api.start({
              y: y,
              x: x
            })
          }

        }
      },
      onPinch: (state) => {
        // console.log(state)
        let { offset: [s] } = state;
        if (s < 1) s = 1
        api.start({ scale: s })
        if (s === 1) {
          api.start({ scale: 1, y: 0, x: 0 })
        }
      },
    },
    {
      target: myRef,
      drag: { from: () => [x.get(), y.get()], filterTaps: true, rubberband: false, immediate: true },
      pinch: { scaleBounds: { min: 1, max: 20 }, pinchOnWheel: true, rubberband: false, immediate: true },
    }
  )
  // console.log(scale)
  return (

    <Dialog
      fullScreen
      open={isOpen}
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

        <a.div id={'gesture-container'} ref={myRef} style={{ touchAction: 'none', display: 'block', x, y, scale, rotateZ }} className={`flex fill center`}>
          {img &&

            <Image
              style={{
                display: closing ? 'none' : 'inherit'
              }}
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
