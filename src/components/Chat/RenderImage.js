import React from 'react';
import { Grid } from "@mui/material";

const RenderImage = (props) => {

  if (typeof props.currentMessage.image === 'string') {
    return (<Grid sx={{cursor: 'pointer'}} >
      <img className='msgImg' onClick={() => props.openImageOverlay(props.currentMessage)}
           src={props.currentMessage.image} alt='Previewed Image'></img>
    </Grid>)
  }
  return null;
}

export default RenderImage;
