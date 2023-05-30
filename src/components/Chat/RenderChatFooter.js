import React from 'react'
import { Grid, CircularProgress, Paper, IconButton, LinearProgress } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import DeleteForever from '@mui/icons-material/DeleteForever';
import Fab from '@mui/material/Fab';
import { TouchableOpacity } from 'react-native';
import ConfirmationDialog from '../Modals/ConfirmationDialog';
import { isMobile } from 'react-device-detect';

const RenderChatFooter = (props) => {
  const incomingFiles = props.files
  const [files, setFiles] = React.useState([])
  const [loading, setLoading] = React.useState(props.loading)
  const [uploading, setUploading] = React.useState(props.uploading)
  const [isShown, setIsShown] = React.useState('')
  const [toRemove, setToRemove] = React.useState('')
  const [showConfirm, setShowConfirm] = React.useState(false)

  const containerHeight = 50

  React.useEffect(() => {
    setToRemove('')
    setShowConfirm(false)
  }, [])


  React.useEffect(() => {
    const getImageUrls = () => {
      setFiles(incomingFiles)
      let filesPromises = [];

      for (let x in incomingFiles) {
        let file = incomingFiles[x]
        // setHeight(file)
        filesPromises.push(file.processThumbnail())
      }
      // Does all image processing 15kb thumbnail, 2MB Preview and 16MB Fullsize
      Promise.all(filesPromises).then((files) => {
        files.forEach((file) => {
          file.processImage()
        })
        // props.setFiles(files)
      })
    }
    if (incomingFiles.length > 0 && incomingFiles.length !== files.length) {
      getImageUrls()
    } else {
      setFiles(incomingFiles)
    }

  }, [files.length, incomingFiles])

  React.useEffect(() => {
    setLoading(props.loading)
  }, [props.loading])

  React.useEffect(() => {
    setUploading(props.uploading)
  }, [props.uploading])


  const removeItem = (index) => {
    const newFiles = Object.assign(files)
    console.log(newFiles.splice(index, 1))
    console.log(newFiles)
    setFiles(newFiles)
    setIsShown('')
  }

  const removeFiles = () => {
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
          id='preview-container'
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
              if (file.url) {
                return (
                  <Grid key={index + 'img'} style={{ position: "relative" }} onMouseEnter={() => setIsShown(index + 'img')} onMouseLeave={() => setIsShown('')}>
                    <Fab onClick={() => { removeItem(index) }} sx={{ cursor: "pointer !important", position: 'absolute', top: 11, left: 11, opacity: isShown === index + 'img' && !isMobile ? 1 : 0 }} size="small" color="#AAA" aria-label="add">
                      <DeleteForever />
                    </Fab>
                    <TouchableOpacity style={{
                      width: "100%",
                      height: "100%",
                      objectFit: "cover"
                    }} disabled={!isMobile} onPress={() => { onLongPress(index) }} accessibilityRole='image'>
                      <img className='previewImage'
                        src={`${file.url}`}
                        srcSet={`${file.url}`}
                        alt='Thumbnail Preview'
                        loading="lazy"
                      />
                    </TouchableOpacity>
                  </Grid>
                )
              } else {
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