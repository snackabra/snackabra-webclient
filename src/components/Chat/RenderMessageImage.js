import React from 'react'
import { IconButton } from "@mui/material";
import InputIcon from '@mui/icons-material/Input';
import { MessageImage } from 'react-native-gifted-chat';

const styles = {
  left: {
    right: 60
  },
  right: {
    left: -60
  }
}

const RenderMessageImage = (props) => {
  console.log(props)
  return <>
    <IconButton style={{ position: 'absolute', transform: 'rotate(90deg)', ...styles[props.position] }} onClick={() => { alert('yup') }} component="div"
      aria-label="attach" size="large">
      <InputIcon color={'primary'} />
    </IconButton>
    <MessageImage {...props} />
  </>;

};


export default RenderMessageImage 