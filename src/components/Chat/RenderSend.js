import * as React from 'react';
import { IconButton } from "@mui/material";
import {Send as SendIcon} from '@mui/icons-material';


function RenderSend(props) {
  const elementId = `send-button-${props.roomId}`
  const handleSend = () => {
    props.onSend({ text: props.text.trim() }, true)
    props.onTextChanged('')
  }

  return (
    <IconButton disabled={props.inputError || !props.connected} onClick={handleSend} component="div" id={elementId}
      aria-label="attach" size="large">
      <SendIcon color={props.inputError || !props.connected ? 'disabled' : 'primary'} />
    </IconButton>
  )
}

export default RenderSend;
