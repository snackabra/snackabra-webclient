import React from 'react'
import { Grid, CircularProgress, Paper, IconButton, LinearProgress, ImageList, ImageListItem } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { restrictPhoto, getFileData, SBImage } from "../../utils/ImageProcessor";
import { restrictPhoto, getFileData, SBImage } from "../../utils/ImageProcessor";

const RenderChatFooter = (props) => {

  const [files, setFiles] = React.useState([])
  const [loading, setLoading] = React.useState(props.loading)
  const [containerHeight, setContainerHeight] = React.useState(50)
  const [uploading, setUploading] = React.useState(props.uploading)
  const [columns, setColumns] = React.useState(3)

  React.useEffect(()=>{    
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    window.addEventListener('touchmove', (e) => {
      setTimeout(() => {
        handleResize(e)
      }, 400)

    });
  }, [])

  const handleResize = (e) => {
    const el = document.getElementById("preview-container");
    if(el){
      setColumns(Math.floor(el.offsetWidth / 150))
    }

  }

  React.useEffect(() => {
    const getImageUrls = () => {
      setFiles(props.files)
      let filesPromises = [];

      for (let x in props.files) {
        let file = props.files[x]
        // setHeight(file)
        filesPromises.push(file.processThumbnail())
        handleResize()
      }
      // Does all image processing 15kb thumbnail, 2MB Preview and 16MB Fullsize
      Promise.all(filesPromises).then((files) => {
        handleResize()
        files.forEach((file) => {
          file.processImage()
        })
        // props.setFiles(files)
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

  if (files.length > 0) {
    return (
      <Grid item>
        <Paper 
        id='preview-container'
        style={{
          height: '30vh',
          overflow: 'hidden',
          position: 'absolute',
          bottom: 0,
          width: '100%'
        }}>
          <ImageList sx={{ width: '100%',  height: '30vh',overflow: 'scroll',}} cols={columns} rowHeight={164}>
            {files.map((file, index) => {
              if (file.url || file.thumbnail) {
                return (
                  <ImageListItem key={index + 'img'}>
                    <img className='previewImage'
                      width='150px'
                      style={{ padding: 8 }}
                      src={`${file.url ? file.url : file.thumbnail}`}
                      srcSet={`${file.url ? file.url : file.thumbnail}`}
                      alt='Thumbnail Preview'
                      loading="lazy"
                    />
                  </ImageListItem>
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
          </ImageList>
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
