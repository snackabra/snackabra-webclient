import * as React from 'react';
import { AppBar, Avatar, Box, Grid, Hidden, IconButton, InputAdornment, TextField, Typography } from "@mui/material";
import AccountCircleRoundedIcon from '@mui/icons-material/AccountCircleRounded';
import WhisperUserDialog from "./Modals/WhisperUserDialog";
import { observer } from "mobx-react"
import SnackabraContext from "../contexts/SnackabraContext";
import { Menu, Close } from '@mui/icons-material';
import NavBarActionContext from "../contexts/NavBarActionContext";
import RoomMenu from "../components/Rooms/RoomMenu";

const NavAppBar = observer(() => {
  const NavAppBarContext = React.useContext(NavBarActionContext)
  const sbContext = React.useContext(SnackabraContext);
  const [openWhisper, setOpenWhisper] = React.useState(false);
  const [editingRoomId, setEditingRoomId] = React.useState(false);
  const [updatedName, setUpdatedName] = React.useState(false);

  const closeWhisper = () => {
    setOpenWhisper(false)
  }

  const openMenu = () => {
    NavAppBarContext.setMenuOpen(true)
  }

  const editRoom = (roomId) => {
    setEditingRoomId(roomId)
    setTimeout(() => {
      document.getElementById('nav_' + roomId).focus()
    }, 250);
  }

  const submitName = (e) => {
    if (e.keyCode === 13) {
      sbContext.updateChannelName({ name: updatedName, channelId: editingRoomId }).then(() => {
        setEditingRoomId(false)
      })
    }
  }

  const updateName = (e) => {
    setUpdatedName(e.target.value)
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
            <Hidden smUp>
              <IconButton sx={{ width: 48, height: 48, bgcolor: 'transparent' }} onClick={openMenu} color="inherit">
                <Menu />
              </IconButton>
            </Hidden>
          </Grid>
          <Hidden smUp>
            <Grid xs={5} item>
              {sbContext.activeRoom && sbContext.channels[sbContext.activeRoom]?
                <Grid
                  container
                  direction="row"
                  justifyContent="center"
                  alignItems="center">
                  {editingRoomId ?
                    <TextField
                      id={'nav_' + editingRoomId}
                      value={updatedName}
                      style={{marginTop: 6}}
                      onKeyDown={submitName}
                      inputProps={{ style: { color: "#fff" } }}
                      onFocus={() => {
                        setUpdatedName(sbContext.channels[sbContext.activeRoom].name)
                      }}
                      onChange={updateName}
                      variant="standard"
                      autoComplete="false"
                      InputProps={{
                        endAdornment:
                          <InputAdornment position="end">
                            <IconButton
                              aria-label="cancel room rename"
                              onClick={() => { setEditingRoomId(false) }}
                              onMouseDown={() => { setEditingRoomId(false) }}
                              edge="end"
                            >
                              <Close sx={{ color: "#fff" }} />
                            </IconButton>
                          </InputAdornment>
                      }}
                      autoFocus /> : <Typography noWrap>{sbContext.channels[sbContext.activeRoom].name}</Typography>

                  }
                  {!editingRoomId && 
                    <RoomMenu
                      socket={sbContext.socket}
                      sbContext={sbContext}
                      selected={sbContext.activeRoom}
                      roomId={sbContext.activeRoom}
                      editRoom={() => {
                        editRoom(sbContext.activeRoom)
                      }}
                    />
                    }
                </Grid>
                : ''}

            </Grid>
          </Hidden>
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
