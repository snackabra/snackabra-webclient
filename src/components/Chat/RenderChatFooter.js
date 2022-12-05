//@ts-check

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
    const getImageUrls = async () => {
      setFiles(props.files)
      let filesPromises = [];

      for (let x in props.files) {
        let file = props.files[x]
        setHeight(file)
        filesPromises.push(file.processImage())
      }
      Promise.all(filesPromises).then((files) => {
        console.log(files)
        setFiles(files)
        props.setFiles(files)
      })
    }
    if (files.length !== props.files.length && props.files.length !== 0) {
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
      const height = imageElement.width / file.aspectRatio;
      // file.aspectRatio.then(())
      if (height > containerHeight) {
        setContainerHeight(height)
      }
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
              if (file.url) {
                return (
                  <img key={index + 'img'} className='previewImage'
                    width='150px'
                    style={{ padding: 8 }}
                    src={file.url}
                    alt='Image preview' />
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

            <IconButton sx={{ position: "absolute", right: 0 }} onClick={props.removeInputFiles} aria-label="close">
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
