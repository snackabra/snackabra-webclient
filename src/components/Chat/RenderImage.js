import React from 'react';
import { CircularProgress, Grid, IconButton } from "@mui/material";
import {Download as InputIcon, Check as CheckIcon} from '@mui/icons-material';
import { isSameUser } from "react-native-gifted-chat";
import { downloadFile } from '../../utils/misc.js'

const styles = {
  left: {
    right: -60
  },
  right: {
    left: -60
  }
}

const imageStyleSameUser = {
  left: {
    borderRadius: '0px 11px 0px 0px'
  },
  right: {
    borderRadius: '11px 0px 0px 0px'
  }
}

const RenderImage = (props) => {
  const SB = window.SB;
  const [isDling, setIsDownloading] = React.useState(false)
  const [downloaded, setDownloaded] = React.useState(false)
  const downloadImage = (message) => {
    setIsDownloading(true)
    //  mtg: In scenarios where the preview and full size image are the same file because the full image is below 4MB
    const type = message.imageMetaData.imageId === message.imageMetaData.previewId ? 'p' : 'f'
    props.sbContext.SB.storage.fetchData(props.controlMessages[message.fileMetadata.fullImageHash]).then((data) => {
      if (data.hasOwnProperty('error')) {
        setTimeout(() => {
          setIsDownloading(false)
          setDownloaded(false)
        }, 2000)
        throw new Error(`Could not open image (${data.error})`)

      } else {
        try {
          downloadFile( SB.arrayBufferToBase64(data, 'b64'), 'image.jpeg', type)
          setDownloaded(true)
          setTimeout(() => {
            setIsDownloading(false)
            setDownloaded(false)
          }, 10000)
        } catch {
          throw new Error("Error processing file download")
        }
      }
    })
  }

  const getStyle = () => {
    if (isSameUser(props.currentMessage, props.previousMessage)) {
      return imageStyleSameUser[props.position]
    }
    return {}
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

      <img className='msgImg' style={getStyle()} onClick={() => props.openImageOverlay(props.currentMessage)}
        src={props.currentMessage.image} alt='Previewed'></img>
    </Grid>)
  }
  return null;
}

export default RenderImage;
