import React from 'react';
import { Image } from 'mui-image'
import { createUseGesture, dragAction, pinchAction } from '@use-gesture/react'
import { a, useSpring, config } from '@react-spring/web'
import IndexedKV from "../../utils/IndexedKV.js";
import NotificationContext from "../../contexts/NotificationContext.js";

const useGesture = createUseGesture([dragAction, pinchAction])

function ImageViewer(props) {
    const { image, inhibitSwipe, sbContext, controlMessages, focused, swiping } = props
    const notify = React.useContext(NotificationContext)
    const cacheDb = React.useRef(new IndexedKV({
        db: 'sb_data_cache',
        table: 'images'
    }));
    const [fullSizeImage, setFullSizeImage] = React.useState(null);
    const [closing, setClosing] = React.useState(false);
    const myRef = React.createRef();

    let [style, api] = useSpring(() => ({
        x: 0,
        y: 0,
        scale: 1,
        rotateZ: 0,
    }), [])


    const getFullSizeImage = (message) => {
        return new Promise((resolve) => {
            const hash = message.fileMetadata.previewHash ? message.fileMetadata.previewHash : message.fileMetadata.fullImageHash
            cacheDb.current.getItem(hash).then(async (data) => {
                console.log('loading full size image from cache', data)
                if (data) {
                    resolve(data)
                } else {
                    console.log('cache miss, loading full size image from IHD')
                    resolve(await sbContext.SB.storage.fetchData(controlMessages[hash]))
                }
            })
        })
    }

    React.useEffect(() => {
        console.log(focused)
        if (!image) return

        if (focused) {
            getFullSizeImage(image).then((data) => {
                if (data.hasOwnProperty('error')) {
                    console.error(data['error'])
                    notify.error('Could not load full size image')
                } else {
                    console.log('loaded full size image', data)
                    setFullSizeImage('data:image/jpeg;base64,' + window.SB.arrayBufferToBase64(data, 'b64'))
                }
            })
        }
    }, [image, focused])

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

    const open = ({ canceled }) => {
        if (canceled)
            api.start({ y: 0, x: 0, scale: 1, rotateZ: 0, pinching: false, reset: true, immediate: true, config: canceled ? config.wobbly : config.stiff })
    }

    const close = () => {
        api.start({ y: 0, x: 0, scale: 1, rotateZ: 0, reset: true, immediate: true, config: { ...config.stiff, velocity: 0 } })
        setTimeout(() => {
            props.onClose()
        }, 100)

    }

    useGesture(
        {
            onDrag: (state) => {
                const { pinching, offset: [x, y], last, velocity: [vy], memo, cancel } = state
                // if the user drags up passed a threshold, then we cancel
                // the drag so that the sheet resets to its open position
                if (pinching || swiping) {
                    return cancel()
                }
                // console.log(vy, mx, mx)
                const s = style.scale.animation.to;
                const width = Number((window.innerWidth * s) / 2).toFixed(0);
                const xLimit = Math.abs(x) + (window.innerWidth / 2) >= width;
                if (last && s === 1) {
                    console.log(vy, memo.velocity[1])
                    if (Math.abs(y) > height * 0.5 || Math.abs(memo.velocity[1]) > 1.6) {
                        setClosing(true)
                        close()
                    } else {
                        open({ canceled: true })
                        api.start({
                            y: 0, x: 0, immediate: true
                        })
                    }
                } else {
                    if (s <= 1) {
                        api.start({
                            y: y, x: 0, immediate: true
                        })

                    } else {

                        if (xLimit) return
                        api.start({
                            y: y,
                            x: x,
                            immediate: true
                        })
                    }

                }

                return state
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
            pinch: { scaleBounds: { min: 1, max: 25 }, pinchOnWheel: true, rubberband: true, immediate: true },
        }
    )
    return (
        <a.div ref={myRef} style={{ touchAction: 'none', ...style }} className={`flex fill center`} >
            <Image
                style={{
                    display: closing ? 'none' : 'inherit'
                }}
                src={fullSizeImage ? fullSizeImage : image.image}
                width="100%"
                fit="contain"
                duration={500}
                easing="cubic-bezier(0.7, 0, 0.6, 1)"
                showLoading={true}
                errorIcon={true}
                shift={null}
                distance="100px "
                shiftDuration={500}
                bgColor="inherit"
            />

        </a.div>
    );
}

export default ImageViewer;