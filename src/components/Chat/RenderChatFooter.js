import React from 'react'
import { Grid, IconButton, Paper } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import { useContext } from "react";
import ActiveChatContext from "../../contexts/ActiveChatContext";

const RenderChatFooter = (props) => {


  if (typeof props.imgUrl === 'string') {
    return (
      <Grid item>
        <Paper sx={{
          minHeight: "50px"
        }}>
          <Grid
            container
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start"
          >
            <img id='previewImage' width='150px' src={props.imgUrl} alt='Image preview'></img>
            <IconButton onClick={props.removeInputFiles} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Grid>
        </Paper>
      </Grid>)
  }
  return null;
}

export default RenderChatFooter
