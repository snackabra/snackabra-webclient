import * as React from 'react';
import { Grid, DialogContent, Toolbar, AppBar, Dialog, IconButton } from '@mui/material';
import ImageViewer from '../Images/ImageViewer.js';
import { Close } from '@mui/icons-material';



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
                        <Close />
                    </IconButton>
                </Toolbar>
            </AppBar>


            <DialogContent sx={{ p: 0, bgcolor: 'black' }} style={{ touchAction: 'none' }}>


                {selected ?
                    <ImageViewer
                        focused={true}
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
