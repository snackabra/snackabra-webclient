import * as React from 'react';

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
    },250)
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
      handleSend();
    }
  }

  const handlChange = (e) => {
    setText(e.target.value)
    props.onTextChanged(e.target.value)
  }

  return (
    <textarea placeholder="Type a message..." autoCapitalize="sentences" autoComplete="on" autoCorrect="on" dir="auto"
              value={text}
              rows="1" spellCheck="true" aria-label="Type a message..."
              className="textinput-composer"
              data-testid="Type a message..."
              onKeyUp={checkForSend}
              onChange={handlChange}
              readOnly={filesAttached}
              style={{
                '--placeholderTextColor': '#b2b2b2',
                height: '34px',
                outlineWidth: '0px',
                outlineColor: 'transparent',
                outlineOffset: '0px'
              }}
    />
  )
}

export default RenderComposer;
