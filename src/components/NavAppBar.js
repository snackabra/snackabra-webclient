import * as React from 'react';
import { useLocation } from "react-router-dom";
import { AppBar, Avatar, Box, Button, Grid, Hidden, IconButton, } from "@mui/material";
import { AppBarTab, AppBarTabLink, AppBarTabs } from "../styles/AppBarTabs";
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import RoomContext from "../contexts/RoomContext";
import WhisperUserDialog from "./Modals/WhisperUserDialog";

export default function NavAppBar() {

  const roomContext = React.useContext(RoomContext)
  const [value, setValue] = React.useState(0);
  const [openWhisper, setOpenWhisper] = React.useState(false);
  const location = useLocation();

  const handleChange = (event, newValue) => {
    setValue(newValue);
  };

  React.useEffect(() => {
    switch (location.pathname) {
      case '/':
        setValue(0);
        break;
      case '/guide':
        setValue(1);
        break;
      default:
        setValue(2);
        break;

    }
  }, [location]);

  return (
    <Box sx={{ flexGrow: 1 }}>
      <WhisperUserDialog open={openWhisper} />
      <AppBar position="fixed" sx={{ backgroundColor: 'black', textTransform: 'none' }}>
        <Grid
          container
          justifyContent="space-between"
        >
          <Grid>
            <AppBarTabs
              value={value}
              onChange={handleChange}
            >
              <AppBarTabLink to={'/'}>
                <AppBarTab
                  label="Home"
                  sx={{ mr: { lg: 1, xl: 6 } }}
                />
              </AppBarTabLink>
              <AppBarTabLink to={'/guide'}>
                <AppBarTab
                  label="Guide"

                  sx={{ mr: { lg: 1, xl: 6 } }}
                />
              </AppBarTabLink>
              <AppBarTabLink to={'/rooms'}>
                <AppBarTab
                  label="Rooms"

                  sx={{ mr: { lg: 1, xl: 6 } }}
                />
              </AppBarTabLink>
            </AppBarTabs>
          </Grid>
          <Grid>
            <Hidden xsUp={roomContext.showAdminTab}>
              <Avatar onClick={()=>{setOpenWhisper(true)}} sx={{ width: 48, height: 48, bgcolor: 'transparent' }}>
                <IconButton color="inherit" component="span">
                  <AccountCircleRoundedIcon />
                </IconButton>
              </Avatar>
            </Hidden>
          </Grid>
        </Grid>
      </AppBar>
    </Box>
  );
}


