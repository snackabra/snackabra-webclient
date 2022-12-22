import React from 'react';
import { CircularProgress, Grid, IconButton } from "@mui/material";
import InputIcon from '@mui/icons-material/Download';
import CheckIcon from '@mui/icons-material/Check';


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
  const [downloaded, setDownloaded] = React.useState(false)
  const downloadImage = (message) => {
    setIsDownloading(true)
    props.sbContext.SB.storage.retrieveImage(message.imageMetaData, props.controlMessages).then((data) => {
      if (data.hasOwnProperty('error')) {
        setTimeout(()=>{
          setIsDownloading(false)
          setDownloaded(false)
        }, 2000)

        props.sendSystemMessage('Could not open image (' + data.error + ')');
      } else {
        let element = document.createElement('a');
        element.setAttribute('href', data['url']);
        element.setAttribute('download', 'image.jpeg');
        document.body.appendChild(element);
        element.click();
        document.body.removeChild(element);

        setDownloaded(true)
        setTimeout(() => {
          setIsDownloading(false)
          setDownloaded(false)
        }, 10000)
      }
    }).catch(error => {
      setIsDownloading(false)
      setDownloaded(false)
      console.info('openPreview() exception: ' + error.message);
      props.sendSystemMessage('Could not open image (' + error.message + ')');
    })
  }

  if (typeof props.currentMessage.image === 'string') {
    return (<Grid sx={{ cursor: 'pointer' }} >
      {!isDling ?
        <IconButton style={{ position: 'absolute', ...styles[props.position], top: '47%' }} onClick={() => { downloadImage(props.currentMessage) }} component="div"
          aria-label="attach" size="large">
          <InputIcon color={'primary'} />
        </IconButton> : !downloaded ?
          <IconButton style={{ position: 'absolute', ...styles[props.position], top: '47%' }} disabled component="div"
            aria-label="attach" size="large">
            <CircularProgress size={30} />
          </IconButton> :
          <IconButton style={{ position: 'absolute', ...styles[props.position], top: '47%' }} onClick={() => { downloadImage(props.currentMessage) }} component="div"
            aria-label="attach" size="large">
            <CheckIcon color={'primary'} />
          </IconButton>

      }

      <img className='msgImg' onClick={() => props.openImageOverlay(props.currentMessage)}
        src={props.currentMessage.image} alt='Previewed'></img>
    </Grid>)
  }
  return null;
}

export default RenderImage;
