import React from 'react';
import { isMobile } from 'react-device-detect';
import SwipeableViews from 'react-swipeable-views/src/SwipeableViews.js';
import { autoPlay, virtualize, bindKeyboard } from 'react-swipeable-views-utils';
import { Grid, IconButton, Slide, Paper } from '@mui/material';
import { Stop, SkipPrevious as SkipPreviousIcon, PlayArrow as PlayArrowIcon, SkipNext as SkipNextIcon } from '@mui/icons-material';
import ImageViewer from './ImageViewer.js';


const EnhancedSwipeableViews = bindKeyboard(autoPlay(virtualize(SwipeableViews)));

export default function ImageCarousel(props) {
    console.log('rendering image carousel')
    let mouseMoveTimeout;
    const { img, sbContext, controlMessages } = props
    const [images] = React.useState(props.images)
    const [focusedIndex, setFocusedIndex] = React.useState(0)
    const [autoplay, setAutoplay] = React.useState(false);
    const [showControls, setShowControls] = React.useState(false);
    const [value, setValue] = React.useState(null);
    const [swipeInhibiter, inhibitSwipe] = React.useState(0);

    const containerRef = React.useRef(null);

    const handleChangeIndex = React.useCallback((index) => {
        if (index < 0) index = images.length - 1
        setValue(index);
    }, [images.length])

    React.useEffect(() => {
        const _images = images
        for (let i in _images) {
            if (_images[i]._id === img._id) {
                handleChangeIndex(Number(i))
                break;
            }
        }

    }, [handleChangeIndex, images, img._id])

    const getFullSizeImage = (message) => {
        const hash = message.fileMetadata.previewHash ? message.fileMetadata.previewHash : message.fileMetadata.fullImageHash
        console.log('loading full size image', controlMessages[hash])
        return sbContext.SB.storage.fetchData(controlMessages[hash])
    }


    const slideRenderer = React.useCallback(({ key, index }) => {
        const item = images[index]
        return (
            <ImageViewer
                key={key}
                focused={focusedIndex === value}
                image={item}
                sbContext={sbContext}
                inhibitSwipe={inhibitSwipe}
                controlMessages={controlMessages}
                onOpen={() => {
                    props.onOpen()
                }}
                onClose={() => {
                    props.onClose()
                }} />
        );
    }, [getFullSizeImage, images, props, sbContext])


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
                onTransitionEnd={() => {
                    setFocusedIndex(value)
                }}
                style={{ padding: 0, height: '100%' }}
                disabled={!!swipeInhibiter}
                overscanSlideAfter={3}
                overscanSlideBefore={3}
                slideRenderer={slideRenderer}
                slideCount={images.length}
                interval={30000}
            />
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
                                    handleChangeIndex((value + 1) % images.length)
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