import styled from "styled-components";
import {Button} from '@mui/material'

export const StyledButton = styled(Button).attrs({disableRipple: true})`

cursor: pointer;
border-radius: 0px;
height: 36px;
box-sizing: border-box;
box-shadow: none;

color: white;

&:hover{
  background-color: gray;
  color: white;
  box-shadow: none;
}

&.MuiButton-outlined{
  border: 1px solid rgba(0, 0, 0, 0.12);
  background: gray;
  color: white;
  &:hover{
    border-color: gray;
    color: darkgray;
  }
}

&.MuiButton-contained{
  color: #ffffff;
  background-color: gray;
  &:hover{
    background-color: gray;
  }
}

&[disabled]{
  color: gray;
  background: lightgray;
}
`
