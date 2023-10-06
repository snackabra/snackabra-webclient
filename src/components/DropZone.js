import React from 'react'
import { SBImage } from "../utils/ImageProcessorSBFileHelper.js";
import Dropzone from 'react-dropzone/dist/es/index.js'
import {isEvtWithFiles, allFilesAccepted, acceptPropAsAcceptAttr} from 'react-dropzone/dist/es/utils/index.js'
import { Grid } from "@mui/material";
import { isMobile } from 'react-device-detect';
import { fromEvent } from "file-selector";


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
  // eslint-disable-next-line no-undef
  const FileHelper = window.SBFileHelper;
  const { children, dzRef, notify, openPreview } = props;
  const [success, setSuccess] = React.useState(false)
  const [previewOpen, setPreviewOpen] = React.useState(false)
  const [dragAccept, setDragAccept] = React.useState(false)
  const [draggReject, setDragReject] = React.useState(false)
  const elementId = `dropzone-${props.roomId}`
  let maxFiles = isMobile ? 5 : 10

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
    // if (!previewOpen) {
    selectFiles()
    // } else {
    //   notify('Please close the preview before adding more files', 'info')
    // }

  }

  const onRejected = (e) => {
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
    setTimeout(() => {
      console.log('resetting')
      setDragAccept(false)
      setDragReject(false)
    }, 2000)
  }

  const onError = (e) => {
    console.error(e);
    notify('There was an error attaching your files', 'error', 5);

  }

  const onDragEnter = (event) => {

    if (isEvtWithFiles(event)) {
      Promise.resolve(fromEvent(event)).then(function (files) {

        var fileCount = files.length;
        var isDragAccept = fileCount > 0 && allFilesAccepted({
          files: files,
          accept: acceptPropAsAcceptAttr({ 'image/*': [] }),
          minSize: 0,
          maxSize: Infinity,
          multiple: true,
          maxFiles: maxFiles,
          validator: null
        });
        var isDragReject = fileCount > 0 && !isDragAccept;
        setDragAccept(isDragAccept)
        setDragReject(isDragReject)
        console.log('dragrefjectedornot', {
          isDragAccept: isDragAccept,
          isDragReject: isDragReject,
          isDragActive: true,
          type: "setDraggedFiles"
        });

        // if (onDragEnter) {
        //   onDragEnter(event);
        // }
      }).catch(function (e) {
        console.error(e);
      });
    }
  }
  const onDragLeave = () => {
    setDragAccept(false)
    setDragReject(false)
  }
  const toggleDragState = (e) => {
    if (e.type === 'dragleave') {
      setDragAccept(false)
      setDragReject(false)
    }
  }

  const getFilesFromFileSystemHandle = async (e) => {
    let files = []
    let mockEvent = {
      preventDefault: () => { console.log('preventDefault') },
      target: {
        files: []
      }
    }
    for (let x in e) {
      const file = await e[x].getFile()
      files.push(file)
      mockEvent.target.files.push(file)
    }
    console.log(files)
    // eslint-disable-next-line no-undef
    window.SBFileHelper.handleFileDrop(mockEvent, onDropCallback);
    return files
  }

  // We use this to get the raw drop event so we can use SBFileHelper to upload the files
  const eventHandler = (e) => {
    console.log('eventHandler', e)
    console.log(Object.assign({}, e))
    if (e.type === 'dragenter') {
      return true;
    }

    const files = [];
    // eslint-disable-next-line no-undef
    console.log((dragAccept && !draggReject) || e[0] instanceof FileSystemHandle || e?.type === 'change')
    // eslint-disable-next-line no-undef
    if ((dragAccept && !draggReject) || e[0] instanceof FileSystemHandle || e?.type === 'change') {
      // eslint-disable-next-line no-undef
      if (e[0] instanceof FileSystemHandle) {

        return getFilesFromFileSystemHandle(e);
      } else {
        const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
        if (e.type === 'drop' || e.type === 'change') {
          for (var i = 0; i < fileList.length; i++) {
            const file = fileList.item(i);
            files.push(file);

          }
          // eslint-disable-next-line no-undef
          window.SBFileHelper.handleFileDrop(e.nativeEvent, onDropCallback);
        }
      }
    } else {
      const fileList = e.dataTransfer ? e.dataTransfer.files : e.target.files;
      if (e.type === 'drop' || e.type === 'change') {
        for (var x = 0; x < fileList.length; x++) {
          const file = fileList.item(x);
          files.push(file);

        }
      }
    }

    onDragLeave()
    return files;

  }


  //This is where we would want to do something with the files when they are uploaded
  //https://mozilla.github.io/pdf.js/examples/
  // const onDropZone = useCallback(onDropCallback, [previewOpen, selectFiles])


  return (
    <Dropzone id={elementId} ref={dzRef} onDropRejected={onRejected} onError={onError} noClick noKeyboard accept={{ 'image/*': [] }} maxFiles={maxFiles} getFilesFromEvent={eventHandler} onDragEnter={onDragEnter} onDragLeave={onDragLeave}>

      {({ getRootProps, getInputProps, isFocused }) => {
        const style = {
          ...baseStyle,
          ...(isFocused ? focusedStyle : {}),
          ...(dragAccept ? acceptStyle : {}),
          ...(draggReject ? rejectStyle : {}),
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
