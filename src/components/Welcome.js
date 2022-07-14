import * as React from "react"
import { Trans } from "@lingui/macro";
import { Grid, Typography } from "@mui/material";
import { StyledButton } from "../styles/Buttons";


const Welcome = (props) => {

  const clearStorage = () => {
    Object.keys(localStorage).forEach((key) => {
      localStorage.removeItem(key)

    });
    window.location.reload()
  }

  return (
    <Grid container>
      <Grid xs={12} item>
        <Typography variant={'h2'}><Trans id='welcome header'>Welcome to Snackabra!</Trans></Typography>
      </Grid>
      <Grid xs={12} item>
        <Typography variant={"body1"}><Trans id='member message'>If you are a <a href='https://privacy.app/member'>Privacy.App
          Member</a>, you can log in on your membership page, which will manage your rooms for you.</Trans></Typography>
      </Grid>
      <Grid xs={6} item>
        <StyledButton variant={'contained'} onClick={clearStorage}>Clear Storage</StyledButton>
      </Grid>
    </Grid>

  )
}

export default Welcome
