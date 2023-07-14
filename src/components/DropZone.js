import React from 'react'
import { SBImage } from "../utils/ImageProcessorSBFileHelper";
import Dropzone from 'react-dropzone'
import { Grid } from "@mui/material";
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

const DropZone = (props) => {
  const { children, dzRef, notify, openPreview } = props;
  const [success, setSuccess] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const elementId = `dropzone-${props.roomId}`
  let maxFiles = isMobile ? 15 : 30

  const selectFiles = async () => {
    props.showLoading(true)
    try {
      console.log('SBFileHelper.finalFileList')
      let files = []
      // eslint-disable-next-line no-undef
      const FileMap = new Map(SBFileHelper.finalFileList)

      for (const [key, value] of FileMap.entries()) {
        // eslint-disable-next-line no-undef
        const original = SBFileHelper.finalFileList.get(key)
        // eslint-disable-next-line no-undef
        const buffer = SBFileHelper.globalBufferMap.get(value.uniqueShardId)
        if (buffer) {
          const sbImage = new SBImage(buffer, value);
          sbImage.processThumbnail()
          sbImage.processImage()
          original.sbImage = sbImage
        } else {
          throw new Error('Buffer not found')
        }
      };
      props.showFiles()

    } catch (e) {
      console.log(e)
    }
  }

  React.useEffect(() => {
    setPreviewOpen(openPreview)
  }, [openPreview])

  React.useEffect(() => {
    if (success) {
      setTimeout(() => {
        setSuccess(false)
      }, 5000)
    }
  }, [success])


  const onDropCallback = () => {
    if (!previewOpen) {
      selectFiles()
    } else {
      notify('Please close the preview before adding more files', 'info')
    }

  }

  const onRejected = (e) => {
    console.log(e[0].errors[0].code)
    switch (e[0].errors[0].code) {
      case 'too-many-files':
        notify(`Too many files attached, maximum limit is ${maxFiles}`, 'error')
        break;
      case 'file-invalid-type':
        notify('Invalid file type', 'error')
        break;
      case 'file-too-large':
        notify('File is too large', 'error')
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

  // We use this to get the raw drop event so we can use SBFileHelper to upload the files
  const eventHandler = async (e) => {
    console.log(e)
    try {

      const files = [];
      // eslint-disable-next-line no-undef
      if (e[0] instanceof FileSystemHandle) {
        let fakeEvent = {
          preventDefault: () => { console.log('preventDefault')},
          target: {
            files: []
          }
        }
        for (let x in e) {
          const file = await e[x].getFile()
          files.push(file)
          fakeEvent.target.files.push(file)
        }
        console.log(files)
        // eslint-disable-next-line no-undef
        SBFileHelper.handleFileDrop(fakeEvent, onDropCallback);
        return files;
      } else {
        const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
        if (e.type === 'drop') {
          for (var i = 0; i < fileList.length; i++) {
            const file = fileList.item(i);
            files.push(file);

          }
          // eslint-disable-next-line no-undef
          SBFileHelper.handleFileDrop(e.nativeEvent, onDropCallback);
        }
      }


      return files;
    } catch (e) {
      console.log(e)
    }

  }


  //This is where we would want to do something with the files when they are uploaded
  //https://mozilla.github.io/pdf.js/examples/
  // const onDropZone = useCallback(onDropCallback, [previewOpen, selectFiles])


  return (
    <Dropzone id={elementId} ref={dzRef} onDropRejected={onRejected} onError={onError} noClick noKeyboard accept={{ 'image/*': [] }} maxFiles={maxFiles} getFilesFromEvent={async (e) => { return await eventHandler(e) }}>
      {({ getRootProps, getInputProps, isFocused, isDragAccept, isDragReject }) => {
        const style = {
          ...baseStyle,
          ...(isFocused ? focusedStyle : {}),
          ...(isDragAccept ? acceptStyle : {}),
          ...(isDragReject ? rejectStyle : {}),
        }
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


}

export default DropZone
