import React, { useCallback, useMemo } from 'react'
import { SBImage } from "../utils/ImageProcessor";
import { SnackabraContext } from "mobx-snackabra-store";
import Dropzone from 'react-dropzone'
import { Grid } from "@mui/material";
import { observer } from "mobx-react"
import { isMobile } from 'react-device-detect';


const baseStyle = {
  flex: 1,
  height: '100%',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  borderWidth: 1,
  borderRadius: 2,
  borderColor: '#eeeeee',
  borderStyle: 'solid',
  backgroundColor: '##fff',
  color: '#bdbdbd',
  outline: 'none',
  transition: 'border .24s ease-in-out',
}

const focusedStyle = {
  borderColor: '#2196f3',
}

const acceptStyle = {
  borderColor: '#00e676',
}

const rejectStyle = {
  borderColor: '#ff1744',
}

const DropZone = observer((props) => {
  const { onDrop, children, dzRef, notify, overlayOpen } = props;
  const [success, setSuccess] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const sbContext = React.useContext(SnackabraContext);

  let maxFiles = isMobile ? 15 : 30
  const getSbImage = (file, sbContext) => {
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

  const selectFiles = async (acceptedFiles) => {
    props.showLoading(true)
    try {
      const files = []
      for (let i in acceptedFiles) {
        if (typeof acceptedFiles[i] === 'object') {
          const attachment = await getSbImage(acceptedFiles[i], sbContext)
          files.push(attachment)

        }
      }
      props.addFile(files)
    } catch (e) {
      console.log(e)
    }
  }

  React.useEffect(() => {
    console.log(overlayOpen)
    setPreviewOpen(overlayOpen)
  }, [overlayOpen])

  React.useEffect(() => {
    if (success) {
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    }
  }, [success])


  const onDropCallback = (acceptedFiles) => {
    if(!previewOpen){
      selectFiles(acceptedFiles)
    } 
    
  }

  const onRejected = (e) => {
    console.log(e[0].errors[0].code)
    switch (e[0].errors[0].code) {
      case 'too-many-files':
        notify(`Too many files attached, maximum limit is ${maxFiles}`, 'error')
        break;
      default:
        console.error(e[0].errors);
        notify('There was an issue attaching your files', 'error');
        break;
    }
  }

  const onError = (e) => {
    console.error(e);
    notify('There was an error attaching your files', 'error');
  }


  //This is where we would want to do something with the files when they are uploaded
  //https://mozilla.github.io/pdf.js/examples/
  const onDropZone = useCallback(onDropCallback, [previewOpen, selectFiles])


  return (
    <Dropzone id={'sb_drobox'} ref={dzRef} onDrop={onDropZone} onDropRejected={onRejected} onError={onError} noClick noKeyboard accept={{ 'image/*': [] }} maxFiles={maxFiles}>
      {({ getRootProps, getInputProps, isFocused, isDragAccept, isDragReject }) => {
        const style = useMemo(
          () => ({
            ...baseStyle,
            ...(isFocused ? focusedStyle : {}),
            ...(isDragAccept ? acceptStyle : {}),
            ...(isDragReject ? rejectStyle : {}),
          }),
          [isFocused, isDragAccept, isDragReject]
        )
        return (
          <Grid {...getRootProps({ style })}
            container
            direction="row"
            justifyContent="center"
            alignItems="center">
            <input {...getInputProps()} />
            {children}
          </Grid>
        );
      }}
    </Dropzone>

  )


})

export default DropZone
