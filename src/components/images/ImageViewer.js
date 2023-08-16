import * as React from 'react';
import NotificationContext from "../../contexts/NotificationContext";
import { Image } from 'mui-image'
import { createUseGesture, dragAction, pinchAction } from '@use-gesture/react'
import { a, useSpring, config } from '@react-spring/web'
let SB = require('snackabra')

const useGesture = createUseGesture([dragAction, pinchAction])

export default function ImageViewer(props) {
    const { image, controlMessages, sbContext, inhibitSwipe } = props
    const notify = React.useContext(NotificationContext)
    const [img, setImage] = React.useState(image?.image);
    const [imgLoaded, setImageLoaded] = React.useState(true);
    const [closing, setClosing] = React.useState(false);
    const myRef = React.createRef();

    let [style, api] = useSpring(() => ({
        x: 0,
        y: 0,
        scale: 1,
        rotateZ: 0,
    }))

    React.useEffect(() => {
        setImage(image.image)
        if (image?.image) {

            if (controlMessages[image.fileMetadata.previewHash]) {
                sbContext.SB.storage.fetchData(controlMessages[image.fileMetadata.previewHash]).then((data) => {
                    if (data.hasOwnProperty('error')) {
                        console.error(data['error'])
                        notify.warn('Could not load full size image')
                    } else {
                        console.log('loaded full size image', data)
                        setImage('data:image/jpeg;base64,' + SB.arrayBufferToBase64(data, 'b64'))
                        setImageLoaded(true)
                    }
                }).catch((error) => {
                    console.error('openPreview() exception: ' + error.message);
                    notify.warn('Could not load full size image')
                })
            } else {
                setImageLoaded(true)
                notify.warn('Could not load full size image')
            }
        }
    }, [controlMessages, image, notify, sbContext.SB.storage])


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
        open({ canceled: true })
        if (props.img !== img) {
            setImage(props.img)
            setClosing(false)
        }

        // Ignored this is not an exhaustive dependency list
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [props.img])

    React.useEffect(() => {
        setImageLoaded(props.imgLoaded)
    }, [props.imgLoaded])



    const open = ({ canceled }) => {
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
                const { pinching, offset: [x, y], last, velocity: [vy], cancel } = state
                // if the user drags up passed a threshold, then we cancel
                // the drag so that the sheet resets to its open position
                // console.log(state)
                if (pinching) {
                    return cancel()
                }
                const s = style.scale.animation.to;
                if (last && s === 1) {
                    if (Math.abs(y) > height * 0.6) {
                        setTimeout(() => {
                            setClosing(true)
                        }, 25)
                        setTimeout(() => {
                            close(vy)
                        }, 75)
                    } else {
                        open({ canceled: true })
                    }
                } else {
                    if (s <= 1) {
                        api.start({
                            y: y, x: 0, immediate: false
                        })

                    } else {
                        const width = Number((window.innerWidth * s) / 2).toFixed(0);
                        const xLimit = Math.abs(x) + (window.innerWidth / 2) >= width;
                        if (xLimit) return
                        api.start({
                            y: y,
                            x: x,
                            immediate: true
                        })
                    }

                }
            },
            onPinch: (state) => {
                let { origin: [ox, oy], first, movement: [ms], offset: [s], memo } = state
                if (inhibitSwipe)
                    inhibitSwipe(1)

                if (first) {
                    const { width, height, x, y } = myRef.current?.getBoundingClientRect()
                    const tx = ox - (x + width / 2)
                    const ty = oy - (y + height / 2)
                    memo = [style.x.get(), style.y.get(), tx, ty]
                }

                const x = memo[0] - (ms - 1) * memo[2]
                const y = memo[1] - (ms - 1) * memo[3]
                if (s === 1) {
                    setTimeout(() => {
                        if (inhibitSwipe)
                            inhibitSwipe(0)
                    }, 200)

                    api.start({ scale: 1, y: 0, x: 0, rubberband: false, immediate: true })
                } else {

                    api.start({ scale: s, x, y, rubberband: false, immediate: true })

                }
                return memo
            },
        },
        {
            target: myRef,
            drag: { from: () => [style.x.get(), style.y.get()], filterTaps: true, rubberband: true, immediate: true },
            pinch: { scaleBounds: { min: 1, max: 20 }, pinchOnWheel: true, rubberband: false, immediate: true },
        }
    )
    return (
        <a.div ref={myRef} style={{ touchAction: 'none', ...style }} className={`flex fill center`} >
            {img && <Image
                style={{
                    display: closing ? 'none' : 'inherit'
                }}
                src={img}
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
            }
        </a.div>
    );
}
