import * as React from 'react';
import Box from '@mui/material/Box';
import CssBaseline from '@mui/material/CssBaseline';
import Divider from '@mui/material/Divider';
import Drawer from '@mui/material/Drawer';
import List from '@mui/material/List';
import ListItem from '@mui/material/ListItem';
import ListItemButton from '@mui/material/ListItemButton';
import ListItemIcon from '@mui/material/ListItemIcon';
import ListItemText from '@mui/material/ListItemText';
import AddCommentIcon from '@mui/icons-material/AddComment';
import FileUploadIcon from '@mui/icons-material/Folder';
import AddCircleOutlinedIcon from '@mui/icons-material/AddCircleOutlined';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import InputAdornment from '@mui/material/InputAdornment';
import CloseIcon from '@mui/icons-material/Close';
import Toolbar from '@mui/material/Toolbar';
import { useParams } from "react-router-dom";
import { Grid, IconButton, TextField, Typography } from "@mui/material";
import ChatRoom from "../components/Chat/ChatRoom";
import CreateRoomDialog from "../components/Modals/CreateRoomDialog";
import JoinDialog from "../components/Modals/JoinDialog";
import AdminDialog from "../components/Modals/AdminDialog";
import NotificationContext from "../contexts/NotificationContext";
import ImportDialog from "../components/Modals/ImportDialog";
import DataOperationsDialog from "../components/Modals/DataOperationsDialog";
import RoomMenu from "../components/Rooms/RoomMenu"
import NavBarActionContext from "../contexts/NavBarActionContext";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";
import { isMobile } from 'react-device-detect';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Dimensions } from "react-native";

const drawerWidth = 240;
const ResponsiveDrawer = observer((props) => {
  const NavAppBarContext = React.useContext(NavBarActionContext)
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = React.useContext(NotificationContext)
  let { room_id } = useParams();
  const { window } = props;
  const [roomId, setRoomId] = React.useState(false);
  const [openImportDialog, setOpenImportDialog] = React.useState(false);
  const [openDataOperations, setOpenDataOperations] = React.useState(false);
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [openAdminDialog, setOpenAdminDialog] = React.useState(false);
  const [openJoinDialog, setOpenJoinDialog] = React.useState(false);
  const [editingRoomId, setEditingRoomId] = React.useState(false);
  const [updatedName, setUpdatedName] = React.useState(false);
  const [channelList, setChannelList] = React.useState([]);

  React.useEffect(() => {
    setRoomId(room_id)
  }, [room_id])

  React.useEffect(() => {
    let _c = []
    for (let x in sbContext.channels) {
      _c.push(sbContext.channels[x])
    }
    setChannelList(_c)
  }, [sbContext.channels])

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
      sbContext.updateChannelName({ name: updatedName, channelId: editingRoomId }).then(() => {
        setEditingRoomId(false)
      })
    }
  }

  const updateName = (e) => {
    setUpdatedName(e.target.value)
  }
  const drawer = (
    <div>
      <Toolbar />
      <Divider />
      <List>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenJoinDialog(true)
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
          }}>
            <ListItemIcon>
              <AddCommentIcon />
            </ListItemIcon>
            <ListItemText primary={'Create a room'} />
          </ListItemButton>
        </ListItem>
        {/* <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenImportDialog(true)
          }}>
            <ListItemIcon>
              <FileUploadIcon />
            </ListItemIcon>
            <ListItemText primary={'Import a room'} />
          </ListItemButton>
        </ListItem> */}
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenDataOperations(true)
          }}>
            <ListItemIcon>
              <FileUploadIcon />
            </ListItemIcon>
            <ListItemText primary={'Data Management'} />
          </ListItemButton>
        </ListItem>

        <ListItem sx={{ display: !sbContext.admin ? 'none' : 'inherit' }} disablePadding>
          <ListItemButton onClick={() => {
            setOpenAdminDialog(true)
          }}>
            <ListItemIcon>
              <AdminPanelSettingsIcon />
            </ListItemIcon>
            <ListItemText primary={'Administration'} />
          </ListItemButton>
        </ListItem>

        <Divider />
        {channelList.map((item, index) => {
          const room = item._id
          const roomName = item.name
          const bgColor = room === roomId ? '#ff5c42' : 'inherit';
          const color = room === roomId ? '#fff' : 'inherit';
          return (
            <ListItem key={index} disablePadding sx={{ backgroundColor: bgColor, color: color }}>
              <ListItemButton>
                <Grid container
                  direction="row"
                  justifyContent={'space-between'}
                  alignItems={'center'}
                >
                  <Grid xs={7} item>
                    {editingRoomId !== room ?

                      <a href={`/${room}`}>
                        <Typography noWrap>{roomName}</Typography>
                      </a> :
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
                    <RoomMenu
                      socket={sbContext.socket}
                      sbContext={sbContext}
                      selected={room === roomId}
                      roomId={room}
                      editRoom={() => {
                        editRoom(room)
                      }}
                    />
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
    <SafeAreaView sx={{ display: 'flex', p: 0 }}>
      <CssBaseline />
      <DataOperationsDialog open={openDataOperations} onClose={() => {
        setOpenDataOperations(false)
      }} />
      <ImportDialog open={openImportDialog} onClose={() => {
        setOpenImportDialog(false)
      }} />
      <CreateRoomDialog open={openCreateDialog} onClose={() => {
        setOpenCreateDialog(false)
      }} />
      <AdminDialog open={openAdminDialog} onClose={() => {
        setOpenAdminDialog(false)
      }} />
      <JoinDialog open={openJoinDialog} onClose={() => {
        setOpenJoinDialog(false)
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth },
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
        {(!roomId || !sbContext.activeroom) && (<Grid style={{height: height}}>
          <Toolbar />
          <Typography variant={'h6'}>Select a room or create a new one to get started.</Typography>
        </Grid>)
        }
        {(roomId && sbContext) &&
          (<ChatRoom roomId={roomId ? roomId : sbContext.activeroom} sbContext={sbContext} Notifications={Notifications} />)
        }
      </Box>
    </SafeAreaView >
  );
})


export default ResponsiveDrawer;