import * as React from 'react';
import TextField from '@mui/material/TextField';
import { SBImage } from "../../utils/ImageProcessor";
import { SnackabraContext } from "mobx-snackabra-store";
import { observer } from "mobx-react"

const RenderComposer = observer((props) => {
  const { filesAttached, onTextChanged, inputErrored } = props
  const sbContext = React.useContext(SnackabraContext);
  const [text, setText] = React.useState('')
  const [error, setError] = React.useState(false)
  const [attachedFiles, setFilesAttached] = React.useState(filesAttached)


  React.useEffect(() => {
    const sendButton = document.getElementById('send-button');
    sendButton.addEventListener('click', handleSend)
  }, [])

  const validateText = React.useCallback((text) => {
    const enc = new TextEncoder()
    const ab = enc.encode(text)
    console.log(ab)
    const c = new Blob([ab])
    console.log(c)
    if (c.size <= 1024 * 64) {
      setError(false)
      inputErrored(false)
    } else {
      setError(true)
      inputErrored(true)
    }
  }, []);

  React.useEffect(() => {
    validateText(text)
  }, [text, validateText])

  const handleSend = () => {
    setTimeout(() => {
      setText('')
      props.onTextChanged('')
    }, 100)

  }

  React.useEffect(() => {
    setFilesAttached(filesAttached)
    if (filesAttached) {
      setText('')
      onTextChanged('')
    }
  }, [filesAttached, onTextChanged, setText])

  const getSbImage = (file, props, sbContext) => {
    return new Promise((resolve) => {
      const sbImage = new SBImage(file, sbContext.SB);
      sbImage.img.then((i) => {
        sbImage.url = i.src
        props.showLoading(false)
        resolve(sbImage)
        queueMicrotask(() => {
          const SBImageCanvas = document.createElement('canvas');
          sbImage.loadToCanvas(SBImageCanvas).then((c) => {
            // SBImageCanvas.remove()
          });
        });
      })
    })
  }

  const checkForSend = (e) => {
    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !error) {
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

  const pasteEvent = async (e) => {
    console.log(e.nativeEvent.clipboardData.files)
    const files = Object.assign(e.nativeEvent.clipboardData.files)
    console.log(files)
    if(files.length > 0){
      setText('')
    }
    let _files = []
    for (let x in files) {
      if (files[x] instanceof File) {
        if (files[x].type.match(/^image/)) {
          _files.push(await getSbImage(files[x], props, sbContext))
        }
      }
    }
    props.setFiles(_files)
  }

  return (
    <TextField
      id="sb_render_composer_textarea"
      label=""
      value={text}
      error={error}
      onFocus={props.onFocus}
      onBlur={props.onBlur}
      placeholder="Type a message..."
      className="textinput-composer"
      multiline
      onPaste={pasteEvent}
      onKeyUp={checkForSend}
      onChange={handlChange}
      readOnly={attachedFiles}
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
})

export default RenderComposer;
