import React from 'react';
import { isMobile } from 'react-device-detect';
import SwipeableViews from 'react-swipeable-views/src/SwipeableViews.js';
import { autoPlay, virtualize, bindKeyboard } from 'react-swipeable-views-utils';
import { Grid, IconButton, Slide, Paper } from '@mui/material';
import { Stop, SkipPrevious as SkipPreviousIcon, PlayArrow as PlayArrowIcon, SkipNext as SkipNextIcon } from '@mui/icons-material';
import ImageViewer from './ImageViewer.js';


const EnhancedSwipeableViews = bindKeyboard(autoPlay(virtualize(SwipeableViews)));

export default function ImageCarousel(props) {
    let mouseMoveTimeout;
    const { img, images, sbContext, controlMessages } = props
    let imageList = images;
    const [autoplay, setAutoplay] = React.useState(false);
    const [showControls, setShowControls] = React.useState(false);
    const [value, setValue] = React.useState(null);
    const [swipeInhibiter, inhibitSwipe] = React.useState(0);

    const containerRef = React.useRef(null);

    const handleChangeIndex = React.useCallback((index) => {
        console.log(index)
        if (index < 0) index = imageList.length - 1
        setValue(index);
    }, [imageList.length])

    React.useEffect(() => {
        const _images = images
        for (let i in _images) {
            if (_images[i]._id === img._id) {
                handleChangeIndex(Number(i))
                break;
            }
        }

    }, [handleChangeIndex, images, img._id])

    const slideRenderer = React.useCallback(({ key, index }) => {
        return (<ImageViewer
            key={key}
            image={imageList[index]}
            sbContext={sbContext}
            controlMessages={controlMessages}
            inhibitSwipe={inhibitSwipe}
            onOpen={() => {
                props.onOpen()
            }}
            onClose={() => {
                props.onClose()
            }} />
        );
    }, [controlMessages, imageList, props, sbContext])

    const toggleShowControls = (visibility) => {

        typeof visibility === "boolean" ? setShowControls(visibility) : setShowControls(!showControls)
    }


    const toggleAutoplay = (e) => {
        e.preventDefault()
        setAutoplay(!autoplay)
    }

    const showMediaControls = () => {
        if (!!swipeInhibiter || isMobile) return
        toggleShowControls(true)
        if (mouseMoveTimeout) clearTimeout(mouseMoveTimeout)
        mouseMoveTimeout = setTimeout(() => {
            toggleShowControls(false)
        }, 5000)
    }
    return (
        <>
            <EnhancedSwipeableViews
                // on={toggleShowControls}
                onMouseMove={showMediaControls}
                // onMouseLeave={() => { toggleShowControls(false) }}
                id={'image-carousel'}
                axis={'x-reverse'}
                index={value}
                disableLazyLoading
                resistance
                autoplay={autoplay && !!!swipeInhibiter}
                onChangeIndex={handleChangeIndex}
                style={{ padding: 0, height: '100%' }}
                disabled={!!swipeInhibiter}
                overscanSlideAfter={3}
                overscanSlideBefore={3}
                slideRenderer={slideRenderer}
                slideCount={imageList.length}
                interval={30000}
            />
            {/* {imageList.map((key, index) => {
                    // console.log(JSON.stringify(imageList[index]))
                    return (<ImageViewer
                        key={`image-${index}`}
                        image={imageList[index]}
                        sbContext={sbContext}
                        controlMessages={controlMessages}
                        inhibitSwipe={inhibitSwipe}
                        onOpen={() => {
                            props.onOpen()
                        }}
                        onClose={() => {
                            props.onClose()
                        }} />
                    );
                })

                }

            </EnhancedSwipeableViews> */}
            <Grid
                container
                direction="row"
                justifyContent="center"
                alignItems="center"
                style={{
                    position: "fixed",
                    bottom: 0,
                    marginBottom: 8
                }}
                onMouseMove={() => {
                    mouseMoveTimeout = null
                    toggleShowControls(true)
                }}
                ref={containerRef}
            >
                <Slide direction="up" in={showControls} container={containerRef.current}>
                    <Paper sx={{ bgcolor: 'rgb(18, 18, 18, 0.7)' }} elevation={4} onMouseMove={() => {
                        mouseMoveTimeout = null
                        toggleShowControls(true)
                    }}>
                        <Grid
                            container
                            direction="row"
                            justifyContent="center"
                            alignItems="center"
                            sx={{ width: 150 }}
                        >
                            <IconButton
                                onClick={() => {
                                    handleChangeIndex((value + 1) % imageList.length)
                                }}
                                aria-label="prev-image"
                                sx={{ color: 'white' }}
                            >
                                <SkipPreviousIcon />
                            </IconButton>
                            <IconButton
                                onClick={(e) => {
                                    toggleAutoplay(e)
                                }}
                                aria-label="play-stop"
                                sx={{ color: 'white' }}
                            >
                                {!autoplay ?
                                    <PlayArrowIcon sx={{ height: 38, width: 38 }} /> :
                                    <Stop sx={{ height: 38, width: 38 }} />

                                }

                            </IconButton>
                            <IconButton
                                sx={{ color: 'white' }}
                                onClick={() => {
                                    handleChangeIndex(value - 1)
                                }}
                                aria-label="next-image"
                            >
                                <SkipNextIcon />
                            </IconButton>
                        </Grid>
                    </Paper>
                </Slide>
            </Grid>
        </>
    );
}