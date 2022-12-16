import React from 'react'
import { Grid, CircularProgress, Paper, IconButton, LinearProgress } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { restrictPhoto, getFileData, SBImage } from "../../utils/ImageProcessor";

const RenderChatFooter = (props) => {

  const [files, setFiles] = React.useState([])
  const [loading, setLoading] = React.useState(props.loading)
  const [containerHeight, setContainerHeight] = React.useState(50)
  const [uploading, setUploading] = React.useState(props.uploading)

  React.useEffect(() => {
    const getImageUrls = () => {
      setFiles(props.files)
      let filesPromises = [];

      for (let x in props.files) {
        let file = props.files[x]
        // setHeight(file)
        filesPromises.push(file.processThumbnail())
      }
      // Does all image processing 15kb thumbnail, 2MB Preview and 16MB Fullsize
      Promise.all(filesPromises).then((files) => {
        files.forEach((file) => {
          file.processImage()
        })
        props.setFiles(files)
      })
    }
    if (props.files.length > 0 && props.files.length !== files.length) {
      getImageUrls()
    } else {
      setFiles(props.files)
    }

  }, [props.files])

  React.useEffect(() => {
    setLoading(props.loading)
  }, [props.loading])

  React.useEffect(() => {
    setUploading(props.uploading)
  }, [props.uploading])

  /** @param {SBImage} file */
  const setHeight = (file) => {
    const imageElement = document.getElementsByClassName("previewImage");
    const height = imageElement.width / file.aspect;
    // file.aspectRatio.then(())
    if (height > containerHeight) {
      setContainerHeight(height)
    }
  }

  const removeFiles = () => {
    for(let x in files){
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

  if (files.length > 0) {
    return (
      <Grid item>
        <Paper sx={{
          minHeight: containerHeight
        }}>
          <Grid
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
          >
            {files.map((file, index) => {
              if (file.url || file.thumbnail) {
                return (
                  <img key={index + 'img'} className='previewImage'
                    width='150px'
                    style={{ padding: 8 }}
                    src={file.url ? file.url : file.thumbnail}
                    alt='Thumbnail Preview' />
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

            <IconButton sx={{ position: "absolute", right: 0 }} onClick={removeFiles} aria-label="close">
              <CloseIcon />
            </IconButton>
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
