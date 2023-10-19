import * as React from 'react';
import { observer } from "mobx-react"
import { TextField } from '@mui/material';
import { SBImage } from "../../utils/ImageProcessorSBFileHelper.js";



const RenderComposer = observer((props) => {
  // eslint-disable-next-line no-undef
  const FileHelper = window.SBFileHelper;
  const sendElementId = `send-button-${props.roomId}`
  const elementId = `composer-${props.roomId}`
  const { filesAttached, onTextChanged, inputErrored } = props
  const [text, setText] = React.useState('')
  const [error, setError] = React.useState(false)
  const [attachedFiles, setFilesAttached] = React.useState(filesAttached)


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
  }, [inputErrored]);

  React.useEffect(() => {
    validateText(text)
  }, [text, validateText])

  const handleSend = React.useCallback(() => {
    setText('')
  }, [])

  React.useEffect(() => {
    const sendButton = document.getElementById(sendElementId);
    sendButton.addEventListener('click', handleSend)
  }, [handleSend, sendElementId])

  React.useEffect(() => {
    setFilesAttached(filesAttached)
    if (filesAttached !== attachedFiles) {
      setText('')
      onTextChanged('')
      onTextChanged('')
    }
  }, [attachedFiles, filesAttached, onTextChanged, setText])

  const checkForSend = (e) => {
    if (e.keyCode === 13 && !e.ctrlKey && !e.shiftKey && !error) {
      document.getElementById(sendElementId).click()
      const input = document.getElementById(elementId);
      input.value = ""
      handleSend();
    }
  }

  const handlChange = (e) => {
    setText(e.target.value)
    props.onTextChanged(e.target.value)
  }


  const selectFiles = () => {
    // props.showLoading(true)
    try {
      console.log('SBFileHelper.finalFileList')

      const FileMap = new Map(FileHelper.finalFileList)
      console.log('FileMap', FileMap)
      for (const [key, value] of FileMap.entries()) {
        console.log('asdfadsfjkbasdkjfaskjfb', key, value);
        console.log(FileHelper.knownShards.get(value.uniqueShardId))

        const original = FileHelper.finalFileList.get(key)
        if (!FileHelper.knownShards.has(value.uniqueShardId)) {
          original.knownShard = value.uniqueShardId
        }
        const buffer = FileHelper.globalBufferMap.get(value.uniqueShardId)
        // const preview = window.SBFileHelper.finalFileList.get(value.uniqueShardId)
        console.log('buffer', buffer
          , 'original.sbImage', original)
        if (buffer && !original.sbImage && !FileHelper.ignoreProcessing.has(value.uniqueShardId)) {
          props.incrementFiles()
          console.log('buffer found', buffer)
          const sbImage = new SBImage(buffer, value);
          sbImage.processThumbnail()
          sbImage.processImage()
          original.sbImage = sbImage
        } else {
          console.error('Buffer not found')
          // throw new Error('Buffer not found')
        }

      };
      // props.showFiles()

    } catch (e) {
      console.log(e)
    }
  }

  const pasteEvent = async (e) => {
    console.log(e)

    let mockEvent = {
      preventDefault: () => { console.log('preventDefault') },
      target: {
        files: []
      }
    }
    setError(true)
    e.nativeEvent.dataTransfer = e.nativeEvent.clipboardData
    const files = Object.assign(e.nativeEvent.clipboardData.files)
    if (files.length > 0) {
      setText('')
    }
    for (let x in files) {
      if (files[x] instanceof File) {
        if (files[x].type.match(/^image/)) {
          mockEvent.target.files.push(new File([files[x]], files[x].name, { type: files[x].type }))
        }
      }
    }
    FileHelper.handleFileDrop(mockEvent, selectFiles);

  }

  return (
    <TextField
      id={elementId}
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
      disabled={!props.connected}
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
