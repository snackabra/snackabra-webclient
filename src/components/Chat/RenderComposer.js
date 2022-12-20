import * as React from 'react';
import TextField from '@mui/material/TextField';

// style="--placeholderTextColor:#b2b2b2; height: 34px; outline-width: 0px; outline-color: transparent; outline-offset: 0px;"

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
      const input = document.getElementById('send-sb_render_composer_textarea');
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
    // <textarea placeholder="Type a message..." autoCapitalize="sentences" autoComplete="on" autoCorrect="on" dir="auto"
    //   value={text}
    //   id="sb_render_composer_textarea"
    //   rows="1" spellCheck="true" aria-label="Type a message..."
    //   className="MuiInput-root"
    //   data-testid="Type a message..."
    //   onKeyUp={checkForSend}
    //   onChange={handlChange}
    //   readOnly={filesAttached}
    //   style={{
    //     '--placeholderTextColor': '#b2b2b2',
    //     height: 34,
    //     outlineWidth: 'opx !important',
    //     outlineColor: 'transparent !important',
    //     outlineStyle: 'none  !important',
    //     // outlineWidth: '0px  !important',
    //     // outlineColor: 'transparent !important',
    //     outlineOffset: '0px  !important',
    //     // outlineStyle: 'none !important',
    //     font: 'inherit',
    //     letterSspacing: 'inherit',
    //     color: 'currentColor',
    //     padding: 0,
    //     border: '0',
    //     boxSizing: 'content-box',
    //     background: 'none',
    //     // height: '1.4375em',
    //     margin: '0',
    //     '-webkit-tap-highlight-color': 'transparent',
    //     display: 'block',
    //     minWidth: '0',
    //     width: '100%',
    //     webkitAnimationName: 'mui-auto-fill-cancel',
    //     animationName: 'mui-auto-fill-cancel',
    //     '-webkit-animation-duration': '10ms',
    //     animationDuration: '10ms',
    //   }}
    // />
  )
}

export default RenderComposer;
