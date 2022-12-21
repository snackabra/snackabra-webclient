import React from 'react';
import { Grid, IconButton } from "@mui/material";
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
  console.log(props)
  if (typeof props.currentMessage.image === 'string') {
    return (<Grid sx={{ cursor: 'pointer' }} >
      <IconButton style={{ position: 'absolute', transform: 'rotate(90deg)', ...styles[props.position], top: '47%' }} onClick={() => { props.downloadImage(props.currentMessage) }} component="div"
        aria-label="attach" size="large">
        <InputIcon color={'primary'} />
      </IconButton>
      <img className='msgImg' onClick={() => props.openImageOverlay(props.currentMessage)}
        src={props.currentMessage.image} alt='Previewed'></img>
    </Grid>)
  }
  return null;
}

export default RenderImage;
