import * as React from 'react';
import SwipeableViews from 'react-swipeable-views';
import { useTheme } from '@mui/material/styles';
import ImageViewer from './ImageViewier';

export default function ImageCarousel(props) {
    const { img, images, sbContext, controlMessages } = props
    const [imageList, setImageList] = React.useState(images);
    const theme = useTheme();
    const [value, setValue] = React.useState(null);
    const [swipeInhibiter, inhibitSwipe] = React.useState(0);
    const handleChangeIndex = (index) => {
        setValue(index);
    };

    React.useEffect(() => {
        const _images = images.reverse()
        for (let i in _images) {
            if (_images[i]._id === img._id) {
                handleChangeIndex(Number(i))
                break;
            }
        }
        setImageList(_images)

    }, [images, img])

    return (

        <SwipeableViews
            id={'image-carousel'}
            axis={theme.direction === 'rtl' ? 'x-reverse' : 'x'}
            index={value}
            disableLazyLoading
            resistance
            onChangeIndex={handleChangeIndex}
            style={{ padding: 0, height: '100%' }}
            disabled={!!swipeInhibiter}
        >
            {imageList.map((item, index) => {
                return (<ImageViewer
                    key={'image-viewer-' + index}
                    image={item}
                    sbContext={sbContext}
                    controlMessages={controlMessages}
                    loadImage={value === index}
                    inhibitSwipe={inhibitSwipe}
                    onOpen={() => {
                        props.onOpen()
                    }}
                    onClose={() => {
                        props.onClose()
                    }} />)
            })}
        </SwipeableViews>

    );
}
