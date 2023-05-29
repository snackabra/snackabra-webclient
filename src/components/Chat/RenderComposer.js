import * as React from 'react';
import TextField from '@mui/material/TextField';
import { SBImage } from "../../utils/ImageProcessor";
import { SnackabraContext } from "mobx-snackabra-store";
import { observer } from "mobx-react"
import { isDataURL } from '../../utils/misc';

// import { base64ToArrayBuffer } from "snackabra"
const SB = require('snackabra');

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

  const validateText = React.useCallback(async (text) => {
    const enc = new TextEncoder()
    const ab = enc.encode(text)
    const c = new Blob([ab])
    if (c.size <= 1024 * 64) {
      setError(false)
      inputErrored(false)
    } else {
      const n = c.slice(0, 1024 * 64)
      const dec = new TextDecoder()
      const ab = await n.arrayBuffer();
      const t = dec.decode(ab);
      setText(t)
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
    // console.log(e.nativeEvent.clipboardData.getData('text/plain'))
    setError(true)
    let _files = []
    const files = Object.assign(e.nativeEvent.clipboardData.files)
    console.log(files)
    if (files.length > 0) {
      setText('')
    }
    const text = e.nativeEvent.clipboardData.getData('text/plain');
    if (isDataURL(text) && text.match(/data:image/)) {
      setText('')
      const base64 = e.nativeEvent.clipboardData.getData('text/plain').split(/data:image\/[a-zA-Z]{3,4};base64,/)[1]
      const ab = SB.base64ToArrayBuffer(base64)
      _files.push(await getSbImage(new Blob([ab]), props, sbContext))
    }


    for (let x in files) {
      if (files[x] instanceof File) {
        if (files[x].type.match(/^image/)) {
          _files.push(await getSbImage(files[x], props, sbContext))
        }
      }
    }
    if (_files.length > 0) {
      props.setFiles(_files)
      setText('')
      // props.onSend({ text: '' }, true)
      setTimeout(() => {
        props.onTextChanged('')
        setError(false)
      }, 100)

    }
  }

  return (
      <TextField
        id="sb_render_composer_textarea"
        label=""
        value={text}
        error={error}
        // onFocus={props.onFocus}
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
          padding: 8,
          maxHeight: '25vh',
          overflowY: 'auto'
        }}
      />
  )
})

export default RenderComposer;
