import React from 'react'
import { Grid, IconButton, Paper, Divider } from "@mui/material";
import CloseIcon from '@mui/icons-material/Close';
import ActiveChatContext from "../../contexts/ActiveChatContext";

const RenderChatFooter = (props) => {
  // if (typeof props.imgUrl === 'string') {
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
	    <canvas id='previewSBImage' width='400px'>Preview of shared image</canvas>
            <IconButton onClick={props.removeInputFiles} aria-label="close">
              <CloseIcon />
            </IconButton>
          </Grid>
        </Paper>
      </Grid>)
  // }
  return null;
}

export default RenderChatFooter
