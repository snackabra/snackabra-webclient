import * as React from 'react';
import { AppBar, Avatar, Box, Grid, IconButton, Typography } from "@mui/material";
import { AppBarTabs } from "../styles/AppBarTabs";
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import WhisperUserDialog from "./Modals/WhisperUserDialog";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";


const NavAppBar = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const [value, setValue] = React.useState(0);
  const [openWhisper, setOpenWhisper] = React.useState(false);

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  const closeWhisper = () => {
    setOpenWhisper(false)
  }

  return (
    <Box sx={{ flexGrow: 1 }}>
      <WhisperUserDialog open={openWhisper} onClose={closeWhisper} />
      <AppBar position="fixed" sx={{ backgroundColor: 'black', textTransform: 'none' }}>
        <Grid
          container
          justifyContent="space-between"
        >
          <Grid item>
            <AppBarTabs
              value={value}
              onChange={handleChange}
            >

            </AppBarTabs>
          </Grid>
          <Grid item>
            <Grid
              container
              direction="row"
              justifyContent="center"
              alignItems="center"
            >
              <Grid item>
                <Typography variant='body2'>v{process.env.REACT_APP_CLIENT_VERSION}</Typography>
              </Grid>
              {!sbContext.admin && sbContext.socket?.status === "OPEN" ?
                <Avatar onClick={() => { setOpenWhisper(true) }} sx={{ width: 48, height: 48, bgcolor: 'transparent' }}>
                  <IconButton color="inherit" component="span">
                    <AccountCircleRoundedIcon />
                  </IconButton>
                </Avatar>
                :
                <Avatar sx={{ width: 48, height: 48, bgcolor: 'transparent', color: "#000" }} />
              }
            </Grid>
          </Grid>
        </Grid>
      </AppBar>
    </Box>
  );
})

export default NavAppBar
