import * as React from 'react';
import { IconButton } from "@mui/material";
import SendIcon from '@mui/icons-material/Send';


function RenderSend(props) {

  const handleSend = () => {
    props.onSend({ text: props.text.trim() }, true)
    props.onTextChanged('')
  }

  return (
    <IconButton onClick={handleSend} component="div" id={'send-button'}
                aria-label="attach" size="large">
      <SendIcon color={'primary'} />
    </IconButton>
  )
}

export default RenderSend;
