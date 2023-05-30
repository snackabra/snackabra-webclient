import * as React from 'react';
import ImageViewer from '../Images/ImageViewer';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import DialogContent from "@mui/material/DialogContent";
import { Grid } from '@mui/material';

export default function ImageGallery(props) {
    const { images, sbContext, controlMessages } = props
    const [selected, setSelected] = React.useState(null);
    return (
        <Dialog
            fullScreen
            open={props.open}
            style={{ backgroundColor: 'black' }}
        >

            <AppBar sx={{ position: 'relative', backgroundColor: 'black', textTransform: 'none' }}>
                <Toolbar>
                    <IconButton
                        edge="end"
                        color="inherit"
                        onClick={() => {
                            selected ? setSelected(null) : props.onClose()
                        }}
                        aria-label="close"
                    >
                        <CloseIcon />
                    </IconButton>
                </Toolbar>
            </AppBar>


            <DialogContent sx={{ p: 0, bgcolor: 'black' }} style={{ touchAction: 'none' }}>


                {selected ?
                    <ImageViewer
                        loadImage={true}
                        image={selected}
                        sbContext={sbContext}
                        controlMessages={controlMessages}
                        onClose={() => {
                            setSelected(null)
                        }} /> :
                    <Grid className='gallery-container'>
                        {images.map((item, index) => (
                            <img key={`gallery-${index}`}
                                style={{ cursor: 'pointer' }}
                                onClick={() => {
                                    setSelected(item)
                                }}
                                src={`${item.image}`}
                                srcSet={`${item.image}`}
                                alt={item.title}
                                loading="lazy"
                            />
                        ))}
                    </Grid>
                }
            </DialogContent>

        </Dialog>
    );
}
