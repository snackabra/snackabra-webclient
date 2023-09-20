import React from 'react'
import { Grid, CircularProgress, Paper, IconButton, LinearProgress } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DeleteForever from '@mui/icons-material/DeleteForever';
import Fab from '@mui/material/Fab';
import { TouchableOpacity } from 'react-native';
import ConfirmationDialog from '../Modals/ConfirmationDialog';
import { isMobile } from 'react-device-detect';
import { set } from 'mobx';
import { _ } from 'core-js';



const RenderChatFooter = (props) => {
  // eslint-disable-next-line no-undef
  const FileHelper = SBFileHelper;
  const elementId = `preview-${props.roomId}`
  const incomingFiles = props.files
  const [files, setFiles] = React.useState([])
  const [loading, setLoading] = React.useState(props.loading)
  const [uploading, setUploading] = React.useState(props.uploading)
  const [isShown, setIsShown] = React.useState('')
  const [toRemove, setToRemove] = React.useState('')
  const [showConfirm, setShowConfirm] = React.useState(false)
  const [thumbnailReadyPromises, setThumbnailReadyPromises] = React.useState([])

  const containerHeight = 50

  React.useEffect(() => {
    setToRemove('')
    setShowConfirm(false)
  }, [])


  React.useEffect(() => {
    if (incomingFiles) {
      let _files = []

      for (const [key, value] of FileHelper.finalFileList.entries()) {
        if (value.sbImage) {
          console.warn('value.sbImage', value)
          _files.push(value)
        }

      }
      console.log('_files', _files)
      setFiles(_files)
    }

  }, [FileHelper.finalFileList, files.length, incomingFiles])

  React.useEffect(() => {
    setLoading(props.loading)
  }, [props.loading])

  React.useEffect(() => {
    setUploading(props.uploading)
    if (!props.uploading) {
      setFiles([])
    }
  }, [props.uploading])

  // This helps the component wait for the thumbnail to be ready before rendering it, while not blocking on the thumbnail to be ready
  React.useEffect(() => {
    let promises = []
    if (thumbnailReadyPromises.length > 0) {
      for (let i = 0; i < thumbnailReadyPromises.length; i++) {
        const promise = thumbnailReadyPromises[i].promise
        promises.push(promise)
      }
      Promise.all(promises).then(() => {
        setThumbnailReadyPromises([])
      })
    }
  }, [thumbnailReadyPromises])

  const waitForThumbnail = (file) => {
    const foundItem = thumbnailReadyPromises.find(item => item.hash === file.hash);
    if (foundItem) {
      return
    }
    setThumbnailReadyPromises(_thumbnailReadyPromises => [..._thumbnailReadyPromises, { promise: file.sbImage.thumbnailReady, hash: file.hash }])
  }

  const removeItem = (index, uniqueShardId) => {
   
    for (const [key, value] of FileHelper.finalFileList.entries()) {
      if (value.uniqueShardId === uniqueShardId) {
        FileHelper.globalBufferMap.delete(value.sbImage.previewDetails.uniqueShardId)
        FileHelper.globalBufferMap.delete(value.sbImage.thumbnailDetails.uniqueShardId)
        FileHelper.globalBufferMap.delete(value.uniqueShardId)
        FileHelper.finalFileList.delete(value.sbImage.previewDetails.fullName)
        FileHelper.finalFileList.delete(value.sbImage.thumbnailDetails.fullName)
        FileHelper.finalFileList.delete(key)
      }
    }

    const newFiles = files.filter(function (el) {
      return el.uniqueShardId !== uniqueShardId;
    });

    setFiles(newFiles)
    setIsShown('')
    if (newFiles.length === 0) {
      props.removeInputFiles()
    }
  }

  const removeFiles = () => {
    for (const [key, value] of FileHelper.finalFileList.entries()) {
      FileHelper.globalBufferMap.delete(value.sbImage.previewDetails.uniqueShardId)
      FileHelper.globalBufferMap.delete(value.sbImage.thumbnailDetails.uniqueShardId)
      FileHelper.globalBufferMap.delete(value.uniqueShardId)
      FileHelper.finalFileList.delete(value.sbImage.previewDetails.fullName)
      FileHelper.finalFileList.delete(value.sbImage.thumbnailDetails.fullName)
      FileHelper.finalFileList.delete(key)
    }
    for (let x in files) {
      delete files[x]
    }
    setFiles([])
    props.removeInputFiles()
  }

  if (loading) {
    return (
      <Grid sx={{ width: '100%', minHeight: "50px" }}
        direction="row"
        justifyContent="center"
        alignItems="center"
        container>
        <Grid item>
          <CircularProgress color="inherit" />
        </Grid>
      </Grid>
    );
  }

  if (uploading) {
    return (
      <Grid sx={{ width: '100%', minHeight: "15px" }}
        direction="row"
        justifyContent="center"
        alignItems="center"
        container>
        <LinearProgress sx={{ width: '100%' }} color="success" />
      </Grid>
    );
  }

  const onLongPress = (i) => {
    setToRemove(i)
    setShowConfirm(true)
  }
  if (files.length > 0) {

    return (
      <Grid item>
        <ConfirmationDialog
          text={'Are you sure you want to remove this image?'}
          onConfirm={() => {
            removeItem(toRemove)
            setToRemove('')
            setShowConfirm(false)
          }}
          onCancel={() => {
            setToRemove('')
            setShowConfirm(false)
          }}
          open={showConfirm} />
        <Paper
          id={elementId}
          style={{
            flexGrow: '1',
            maxHeight: 200,
            overflow: 'hidden',
            overflowY: "auto",
            position: 'relative',
            bottom: 0,
            width: '100%',
            paddingTop: 32
          }}>
          <IconButton sx={{ position: "absolute", right: 0, top: 0 }} size={'small'} onClick={removeFiles} aria-label="close">
            <CloseIcon />
          </IconButton>
          <Grid className='gallery-container'>
            {files.map((file, index) => {
              if (file.sbImage.thumbnail) {
                return (
                  <Grid key={index + 'img'} style={{ position: "relative" }} onMouseEnter={() => setIsShown(index + 'img')} onMouseLeave={() => setIsShown('')}>
                    <Fab onClick={() => { removeItem(index, file.uniqueShardId) }} sx={{ cursor: "pointer !important", position: 'absolute', top: 11, left: 11, opacity: isShown === index + 'img' && !isMobile ? 1 : 0 }} size="small" color="#AAA" aria-label="add">
                      <DeleteForever />
                    </Fab>
                    <TouchableOpacity style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }} disabled={!isMobile} onPress={() => { onLongPress(index) }} accessibilityRole='image'>
                      <img className='previewImage'
                        src={`${file.sbImage.thumbnail}`}
                        srcSet={`${file.sbImage.thumbnail}`}
                        alt='Thumbnail Preview'
                        loading="lazy"
                      />
                    </TouchableOpacity>
                  </Grid>
                )
              } else {
                console.log('file.sbImage', file.sbImage)
                // we make sure the thumbnail is ready before we render it
                waitForThumbnail(file)
                return (<Grid key={index + 'grid'} className='previewImage' sx={{ width: containerHeight - 8, minHeight: containerHeight - 8, padding: 8 }}
                  direction="row"
                  justifyContent="center"
                  alignItems="center"
                  container>
                  <Grid item>
                    <CircularProgress color="inherit" />
                  </Grid>
                </Grid>)
              }

            })

            }
          </Grid>
        </Paper>
      </Grid>)
  }
  return (
    <Grid sx={{ width: '100%', minHeight: "5px" }}
      direction="row"
      justifyContent="center"
      alignItems="center"
      container />
  );
}

export default RenderChatFooter