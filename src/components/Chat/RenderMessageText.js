import { Typography } from '@mui/material';
import * as React from 'react';


function RenderMessageText(props) {

  const textStyle = {
    right: {
      color: props.currentMessage.whispered ? '#aaa' : 'white',
      overflowWrap: 'anywhere'
    },
    left: {
      color: props.currentMessage.whispered ? '#aaa' : 'black',
      overflowWrap: 'anywhere'
    }
  }
  return (
    <Typography variant="body1" style={{ ...textStyle[props.position], margin: 8 }}>
      {props.currentMessage.text}
    </Typography>
  )
}

export default RenderMessageText;
