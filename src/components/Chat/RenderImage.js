import React from 'react';
import { CircularProgress, Grid, IconButton } from "@mui/material";
import InputIcon from '@mui/icons-material/Input';


const styles = {
  left: {
    right: -60
  },
  right: {
    left: -60
  }
}

const RenderImage = (props) => {
  const [isDling, setIsDownloading] = React.useState(false)
  const downloadImage = (message) => {
    try {
      setIsDownloading(true)
      props.sbContext.SB.storage.retrieveImage(message.imageMetaData, props.controlMessages).then((data) => {
        if (data.hasOwnProperty('error')) {
          props.sendSystemMessage('Could not open image: ' + data['error']);
        } else {
          let element = document.createElement('a');
          element.setAttribute('href', data['url']);
          element.setAttribute('download', 'image.jpeg');
          document.body.appendChild(element);
          element.click();
          document.body.removeChild(element);
          setIsDownloading(false)
        }
      })
      setTimeout(() => {
        setIsDownloading(false)
      }, 30000)
    } catch (error) {
      console.info('openPreview() exception: ' + error.message);
      props.sendSystemMessage('Could not open image (' + error.message + ')');
    }
  }

  if (typeof props.currentMessage.image === 'string') {
    return (<Grid sx={{ cursor: 'pointer' }} >
      {!isDling ?
        <IconButton style={{ position: 'absolute', transform: 'rotate(90deg)', ...styles[props.position], top: '47%' }} onClick={() => { downloadImage(props.currentMessage) }} component="div"
          aria-label="attach" size="large">
          <InputIcon color={'primary'} />
        </IconButton> :
        <IconButton style={{ position: 'absolute', transform: 'rotate(90deg)', ...styles[props.position], top: '47%' }} disabled component="div"
          aria-label="attach" size="large">
          <CircularProgress size={30} />
        </IconButton>
      }

      <img className='msgImg' onClick={() => props.openImageOverlay(props.currentMessage)}
        src={props.currentMessage.image} alt='Previewed'></img>
    </Grid>)
  }
  return null;
}

export default RenderImage;
