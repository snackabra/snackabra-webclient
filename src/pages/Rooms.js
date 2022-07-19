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
import FileUploadIcon from '@mui/icons-material/FileUpload';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import Toolbar from '@mui/material/Toolbar';
import { useContext } from "react";
import RoomContext from "../contexts/RoomContext";
import ImportDialog from "../components/Modals/ImportDialog";
import { useParams } from "react-router-dom";
import { Grid, Hidden, IconButton, TextField, Typography } from "@mui/material";
import ChatRoom from "../components/Chat/ChatRoom";
import CreateRoomDialog from "../components/Modals/CreateRoomDialog";
import AdminDialog from "../components/Modals/AdminDialog";
import { downloadRoomData } from "../utils/utils";
import Fab from '@mui/material/Fab';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';

const drawerWidth = 240;

const page = window.location;

function ResponsiveDrawer(props) {
  const roomContext = useContext(RoomContext)
  let { room_id } = useParams();
  const { window } = props;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [openImportDialog, setOpenImportDialog] = React.useState(false);
  const [openCreateDialog, setOpenCreateDialog] = React.useState(false);
  const [openAdminDialog, setOpenAdminDialog] = React.useState(false);
  const [rooms, setRooms] = React.useState(roomContext.rooms);
  const [editingRoomId, setEditingRoomId] = React.useState(false);
  const [updatedName, setUpdatedName] = React.useState(false);

  React.useEffect(() => {
    setRooms(roomContext.rooms)
    //roomContext.updateRoomNames(roomContext.rooms)
  }, [roomContext.rooms])

  const handleDrawerToggle = () => {
    setMobileOpen(!mobileOpen);
  };

  const getRoomData = (roomId) => {
    console.log(roomContext.roomMetadata)
    downloadRoomData(roomId, roomContext.roomMetadata)
  }

  const editRoom = (roomId) => {
    setEditingRoomId(roomId)
  }

  const submitName = (e) => {
    if (e.keyCode === 13) {

      if (rooms.hasOwnProperty(editingRoomId)) {
        const _roomMetadata = localStorage.hasOwnProperty('rooms') ? JSON.parse(localStorage.getItem('rooms')) : {}
        _roomMetadata[editingRoomId] = { name: updatedName };
        roomContext.updateRoomNames(_roomMetadata)
        setEditingRoomId(false)
      }
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
            setOpenCreateDialog(true)
          }}>
            <ListItemIcon>
              <AddCommentIcon />
            </ListItemIcon>
            <ListItemText primary={'Create a room'} />
          </ListItemButton>
        </ListItem>
        <ListItem disablePadding>
          <ListItemButton onClick={() => {
            setOpenImportDialog(true)
          }}>
            <ListItemIcon>
              <FileUploadIcon />
            </ListItemIcon>
            <ListItemText primary={'Import a room'} />
          </ListItemButton>
        </ListItem>
        <Hidden xsUp={!roomContext.showAdminTab}>
          <ListItem disablePadding>
            <ListItemButton onClick={() => {
              setOpenAdminDialog(true)
            }}>
              <ListItemIcon>
                <AdminPanelSettingsIcon />
              </ListItemIcon>
              <ListItemText primary={'Administration'} />
            </ListItemButton>
          </ListItem>
        </Hidden>
        <Divider />
        {Object.keys(roomContext.roomMetadata).map((room, index) => {
          const bgColor = room === room_id ? '#ff5c42' : 'inherit';
          const color = room === room_id ? '#fff' : 'inherit';
          const roomName = roomContext.roomMetadata[room]?.name || `Room ${index + 1}`
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
                      <a href={`/rooms/${room}`}>
                        <ListItemText primary={roomName} />
                      </a> :
                      <TextField value={updatedName}
                                 onKeyDown={submitName}
                                 onFocus={() => {
                                   setUpdatedName(roomName)
                                 }}
                                 onChange={updateName}
                                 variant="standard"
                                 focused autoComplete={false} autoFocus />
                    }
                  </Grid>
                  <Grid xs={5}
                        direction="row"
                        justifyContent="flex-end"
                        alignItems="center"
                        container>
                    <IconButton onClick={() => {
                      editRoom(room)
                    }}>
                      <EditOutlinedIcon sx={{ cursor: 'pointer', color: color }} />
                    </IconButton>
                    <IconButton onClick={() => {
                      getRoomData(room)
                    }}>
                      <FileDownloadOutlinedIcon sx={{ cursor: 'pointer', color: color }} />
                    </IconButton>
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

  return (
    <Box sx={{ display: 'flex', p: 0 }}>
      <CssBaseline />
      <ImportDialog open={openImportDialog} onClose={() => {
        setOpenImportDialog(false)
      }} />
      <CreateRoomDialog open={openCreateDialog} onClose={() => {
        setRooms(roomContext.getRooms())
        setOpenCreateDialog(false)
        page.reload();
      }} />
      <AdminDialog open={openAdminDialog} onClose={() => {
        setOpenAdminDialog(false)
      }} />
      <Box
        component="nav"
        sx={{ width: { sm: drawerWidth }, flexShrink: { sm: 0 } }}
      >
        <Fab color="#ff5c42"
             variant="extended"
             onClick={handleDrawerToggle}
             sx={{ mt: 2, position: 'absolute',display: { xs: 'flex-inline', sm: 'none' }, }}>
          <Typography variant={'body2'}>Menu</Typography>
          <KeyboardArrowRightIcon />
        </Fab>
        {/* For future implementation on mobile */}
        <Drawer
          container={container}
          variant="temporary"
          open={mobileOpen}
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
            '& .MuiDrawer-paper': { boxSizing: 'border-box', width: drawerWidth, mt: '48px' },
          }}
          open
        >
          {drawer}
        </Drawer>
      </Box>
      <Box
        component="main"
        sx={{ flexGrow: 1, p: 3, width: { xs: '100%', sm: `calc(100% - ${drawerWidth}px)` } }}
      >
        <Toolbar />
        {!room_id && (<Grid>
          <Typography variant={'h6'}>Select a room or create a new one to get started.</Typography>
        </Grid>)
        }
        {room_id &&
          (<ChatRoom roomId={room_id} />)
        }
      </Box>
    </Box>
  );
}


export default ResponsiveDrawer;
