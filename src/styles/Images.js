import styled from "styled-components";
import * as React from "react";
import {Grid } from "@mui/material";

export const ImageContainer = styled(Grid)((props) => {
  console.log(props)
  return {
    position: "absolute",
    width: '100%',
    height: '100%',
    display: props.hidden ? 'none' : 'flex',
    transition: 'display  2s linear 1s'
  }
});
