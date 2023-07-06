import * as React from 'react';
import { IconButton } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';


function RenderSend(props) {
  const elementId = `send-button-${props.roomId}`
  const handleSend = () => {
    props.onSend({ text: props.text.trim() }, true)
    props.onTextChanged('')
  }

  return (
    <IconButton disabled={props.inputError} onClick={handleSend} component="div" id={elementId}
      aria-label="attach" size="large">
      <SendIcon color={props.inputError ? 'disabled' : 'primary'} />
    </IconButton>
  )
}

export default RenderSend;
