import * as React from 'react';
import { useParams, useNavigate } from "react-router-dom";
import { observer } from "mobx-react"
import { Dimensions } from "react-native";
import { isMobile } from 'react-device-detect';
import {
  Box, Grid, useTheme, IconButton, TextField, Typography,
  CssBaseline, Divider, Drawer, List, ListItem, ListItemButton, ListItemIcon,
  ListItemText, InputAdornment, Toolbar, Hidden, AppBar
} from '@mui/material';
import {
  AddComment as AddCommentIcon,
  Folder as FileUploadIcon,
  AddCircleOutlined as AddCircleOutlinedIcon,
  AdminPanelSettings as AdminPanelSettingsIcon,
  Close as CloseIcon,
} from '@mui/icons-material';
import ChatRoom from "../components/Chat/ChatRoomFunctional.js";
import CreateRoomDialog from "../components/Modals/CreateRoomDialog.js";
import JoinDialog from "../components/Modals/JoinDialog.js";
import NotificationContext from "../contexts/NotificationContext.js";
import ImportDialog from "../components/Modals/ImportDialog.js";
import DataOperationsDialog from "../components/Modals/DataOperationsDialog.js";
import RoomMenu from "../components/Rooms/RoomMenu.js"
import NavBarActionContext from "../contexts/NavBarActionContext.js";
import SnackabraContext from "../contexts/SnackabraContext.js";
import SharedRoomStateContext from "../contexts/SharedRoomState.js";
import NotificationsPermissionDialog from '../components/Modals/NotificationsPermissionDialog.js';


function TabPanel(props) {
  const { children, value, index, ...other } = props;
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`vertical-tabpanel-${index}`}
      aria-labelledby={`vertical-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}
const drawerWidth = 240;

const ResponsiveDrawer = observer((props) => {
  const NavAppBarContext = React.useContext(NavBarActionContext)
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = React.useContext(NotificationContext)
  const roomState = React.useContext(SharedRoomStateContext)

  let { room_id } = useParams();

  const navigate = useNavigate()
  const { window } = props;
  const theme = useTheme();
  const [value, setValue] = React.useState(-1);
  const [roomId, setRoomId] = React.useState('');
  const [openImportDialog, setOpenImportDialog] = React.useState(false);
  const [openDataOperations, setOpenDataOperations] = React.useState(false);
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [openAdminDialog, setOpenAdminDialog] = React.useState(false);
  const [openJoinDialog, setOpenJoinDialog] = React.useState(false);
  const [editingRoomId, setEditingRoomId] = React.useState(false);
  const [updatedName, setUpdatedName] = React.useState(false);
  const [joinRoomId, setJoinRoomId] = React.useState(false);
  const [openNotificationDialog, setOpenNotificationDialog] = React.useState(false);

  React.useEffect(() => {
    if (typeof Notification !== 'undefined') {
      if (Notification.permission === 'default') {
        setOpenNotificationDialog(true)
      }
    }
    if (theme.breakpoints.values.sm && !room_id) {
      NavAppBarContext.setMenuOpen(true)
    }

  }, [])

  React.useEffect(() => {
    if (room_id && !room_id.match(/\w{64}/)) {
      navigate('/404')
      return;
    }
    console.log(room_id && room_id !== roomId)
    console.log(room_id, roomId)
    if (room_id && room_id !== roomId) {


      if (!sbContext.channels[room_id]) {
        setJoinRoomId(room_id)
        setOpenJoinDialog(true)
      } else {
        roomState.setActiveRoom(room_id)
      }
      setRoomId(room_id)
    }

  }, [navigate, roomId, room_id, sbContext.channels, roomState])

  React.useEffect(() => {
    const listenForMessages = (event) => {
      if (event.data && event.data.type === "focus") {
        const to = event.data.channel_id
        // const index = Object.keys(sbContext.channels).findIndex((x) => x.id === to)
        // window.location.replace('/' + to)
        navigate('/' + to)
        // setRoomId(to)
        // roomState.setActiveRoom(to)
        // setValue(index);
      }

      if (event.data && event.data.type === "notification") {
        if (event.data.channel_id !== roomId && roomId !== '') {
          navigator.serviceWorker.controller.postMessage({
            type: 'NOTIFICATION_RESPOND',
            channel_id: event.data.channel_id,
            notification: event.data.notification
          });
        }
      }
    }

    navigator.serviceWorker.addEventListener("message", listenForMessages);
    return () => {
      navigator.serviceWorker.removeEventListener("message", listenForMessages);
    }
  }, [sbContext.channels, navigate, roomId, roomState])

  React.useEffect(() => {

    let i = 0
    for (let x in sbContext.channels) {
      if (room_id === sbContext.channels[x]._id) {
        setValue(i)
      }
      i++
    }
  }, [room_id, sbContext, sbContext.channels])

  const handleDrawerToggle = () => {
    NavAppBarContext.setMenuOpen(!NavAppBarContext.state.menuOpen)
  };

  const editRoom = (roomId) => {
    setEditingRoomId(roomId)
    setTimeout(() => {
      document.getElementById(roomId).focus()
    }, 250);
  }

  const submitName = (e) => {
    if (e.keyCode === 13) {
      console.log(updatedName)
      console.log(sbContext.channels[editingRoomId])
      sbContext.channels[editingRoomId].alias = updatedName
      setEditingRoomId(false)
    }
  }

  const updateName = (e) => {
    setUpdatedName(e.target.value)
  }

  const handleChangeIndex = (index) => {
    const to = Object.keys(sbContext.channels)[index];
    navigate('/' + to)
    setRoomId(to)
    roomState.setActiveRoom(to)
    setValue(index);
  };

  const onCloseAdminDialog = () => {
    setOpenAdminDialog(false)
  }


  const drawer = (
    <div>
      <Hidden smDown>
        <Toolbar />
      </Hidden>
      <Hidden smUp>
        <AppBar position="fixed" sx={{ backgroundColor: 'black', textTransform: 'none'}}>
          <Grid
            container
            alignContent={'center'}
            justifyContent="flex-end"
            sx={{height: '48px'}}
          >
            <Grid item>
              <Typography sx={{mr:4}} variant='body2'>v{process.env.REACT_APP_CLIENT_VERSION}</Typography>
            </Grid>
          </Grid>
        </AppBar>
      </Hidden>
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenJoinDialog(true)
            NavAppBarContext.setMenuOpen(false)
          }}>
            <ListItemIcon>
              <AddCircleOutlinedIcon />
            </ListItemIcon>
            <ListItemText primary={'Join a room'} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenCreateDialog(true)
            NavAppBarContext.setMenuOpen(false)
          }}>
            <ListItemIcon>
              <AddCommentIcon />
            </ListItemIcon>
            <ListItemText primary={'Create a room'} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenDataOperations(true)
            NavAppBarContext.setMenuOpen(false)
          }}>
            <ListItemIcon>
              <FileUploadIcon />
            </ListItemIcon>
            <ListItemText primary={'Data Management'} />
          </ListItemButton>
        </ListItem>
        {sbContext.channels[roomId]?.owner &&
          <ListItem disablePadding>
            <ListItemButton onClick={() => {
              setOpenAdminDialog(true)
              NavAppBarContext.setMenuOpen(false)
            }}>
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary={'Administration'} />
            </ListItemButton>
          </ListItem>
        }


        <Divider />
        {Object.keys(sbContext.channels).map((_d, index) => {
          const room = _d
          const bgColor = room === roomId ? '#ff5c42' : 'inherit';
          const color = room === roomId ? '#fff' : 'inherit';
          return (
            <ListItem key={index} disablePadding sx={{ backgroundColor: bgColor, color: color, textAlign: "left" }}>
              <ListItemButton onClick={() => {
                if (index !== value) {
                  handleChangeIndex(index)
                }
                NavAppBarContext.setMenuOpen(false)
              }}>
                <Grid container
                  direction="row"
                  justifyContent={'flex-start'}
                  alignItems={'center'}
                >
                  <Grid xs={7} item>
                    {editingRoomId !== room ?

                      <Typography sx={{ color: color }} className='sb-tab-link' noWrap>{sbContext.channels[_d].alias || 'Unamed'}</Typography>
                      :
                      <TextField
                        id={editingRoomId}
                        value={updatedName}
                        onKeyDown={submitName}
                        onFocus={() => {
                          setUpdatedName('')
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
                                <CloseIcon sx={{ color: "#fff" }} />
                              </IconButton>
                            </InputAdornment>
                        }}
                        autoFocus />
                    }
                  </Grid>
                  <Grid xs={5} item>
                    <Hidden smDown>
                      <RoomMenu
                        socket={sbContext.socket}
                        sbContext={sbContext}
                        selected={room === roomId}
                        roomId={room}
                        editRoom={() => {
                          editRoom(room)
                        }}

                      />
                    </Hidden>
                  </Grid>
                </Grid>
              </ListItemButton>
            </ListItem>
          )
        })}
      </List>
    </div>
  );

  const container = window !== undefined ? () => window().document.body : undefined;
  const { height } = Dimensions.get('window')
  return (
    <div sx={{ display: 'flex', p: 0 }}>
      <CssBaseline />
      <NotificationsPermissionDialog open={openNotificationDialog} onClose={() => {
        setOpenNotificationDialog(false)
      }} />
      <DataOperationsDialog open={openDataOperations} onClose={() => {
        setOpenDataOperations(false)
      }} />
      <ImportDialog open={openImportDialog} onClose={() => {
        setOpenImportDialog(false)
      }} />
      <CreateRoomDialog open={openCreateDialog} onClose={() => {
        setOpenCreateDialog(false)
      }} />
      <JoinDialog open={openJoinDialog} joinRoomId={joinRoomId} onClose={(to, index) => {
        setOpenJoinDialog(false)
        if (typeof to === 'string' && index >= 0) {
          navigate('/' + to)
          setRoomId(to)
          roomState.setActiveRoom(to)
          setValue(index);
        }
      }} />
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        {/* For future implementation on mobile */}
        <Drawer
          container={container}
          variant="temporary"
          open={NavAppBarContext.state.menuOpen}
          onClose={handleDrawerToggle}
          ModalProps={{
            keepMounted: true, // Better open performance on mobile.
          }}
          sx={{
            display: { xs: 'block', sm: 'none' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: '100%' },
          }}
        >
          {drawer}
        </Drawer>
        <Drawer
          variant="permanent"
          sx={{
            display: { xs: 'none', sm: 'block' },
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, pt: '48px', zIndex: 100 },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 0,
          ml: {
            sm: `${drawerWidth}px`,
            md: `${drawerWidth}px`,
            lg: `${drawerWidth}px`,
            xl: `${drawerWidth}px`,
          },
          width: {
            xs: '100%',
            sm: `calc(100% - ${drawerWidth}px)`,
            md: `calc(100% - ${drawerWidth}px)`,
            lg: `calc(100% - ${drawerWidth}px)`,
            xl: `calc(100% - ${drawerWidth}px)`
          }
        }}
        style={{
          borderBottom: isMobile ? 36 : 0,
          borderLeft: 0,
          borderRight: 0,
          borderColor: "black",
          borderStyle: "solid"
        }}
      >
        {!roomId && (<Grid style={{ height: height }}>
          <Toolbar />
          <Typography textAlign={'center'} variant={'h6'}>Select a room or create a new one to get started.</Typography>
        </Grid>)
        }

        {Object.keys(sbContext.channels).map((item, index) => {
          if (!sbContext.channels[item].key) return (<div key={`${item}-tab-panel`}></div>)
          return (
            <TabPanel
              key={`${item}-tab-panel`}
              value={value}
              index={index}
              component={'div'}
              dir={theme.direction}
              className="RoomSwipable">
              <ChatRoom
                activeRoom={roomState.state.activeRoom}
                roomId={item}
                sbContext={sbContext}
                Notifications={Notifications}
                openAdminDialog={openAdminDialog}
                onCloseAdminDialog={onCloseAdminDialog} />
            </TabPanel>
          )
        })}
      </Box>
    </div >
  );
})


export default ResponsiveDrawer;