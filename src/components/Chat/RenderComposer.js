import * as React from 'react';
import TextField from '@mui/material/TextField';


function RenderComposer(props) {
  const [text, setText] = React.useState('')
  const [filesAttached, setFilesAttached] = React.useState(props.filesAttached)

  React.useEffect(() => {
    const sendButton = document.getElementById('send-button');
    sendButton.addEventListener('click', handleSend)
  }, [])

  const handleSend = () => {
    setTimeout(()=>{
      setText('')
      props.onTextChanged('')
    }, 100)

  }

  React.useEffect(() => {
    setFilesAttached(props.filesAttached)
    if (props.filesAttached) {
      setText('')
      props.onTextChanged('')
    }
  }, [props])

  const checkForSend = (e) => {
    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey) {
      document.getElementById('send-button').click()
      const input = document.getElementById('sb_render_composer_textarea');
      input.value = ""
      handleSend();
    }
  }

  const handlChange = (e) => {
    setText(e.target.value)
    props.onTextChanged(e.target.value)
  }

  return (
    <TextField
      id="sb_render_composer_textarea"
      label=""
      value={text}
      placeholder="Type a message..."
      className="textinput-composer"
      multiline
      onKeyUp={checkForSend}
      onChange={handlChange}
      readOnly={filesAttached}
      variant={'standard'}
      InputProps={{
        disableUnderline: true
      }}
      style={{
        flexGrow: 1,
        padding: 8
      }}
    />
  )
}

export default RenderComposer;
