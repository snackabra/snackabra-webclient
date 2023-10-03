import * as React from 'react';
import { useParams } from "react-router-dom";
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import CallIcon from '@mui/icons-material/Call';
import MenuList from '@mui/material/MenuList';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import CollectionsIcon from '@mui/icons-material/Collections';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import NotificationContext from "../../contexts/NotificationContext";
import ConnectionStatus from "./ConnectionStatus"
import SharedRoomStateContext from "../../contexts/SharedRoomState";
import { observer } from "mobx-react"
import SnackabraContext from "../../contexts/SnackabraContext";
import { downloadFile } from "../../utils/misc"
import CallWindow from '../Modals/CallWindow';


const ITEM_HEIGHT = 48;

const RoomMenu = observer((props) => {
  let { room_id } = useParams();
  const sbContext = React.useContext(SnackabraContext);
  const notify = React.useContext(NotificationContext);
  const roomState = React.useContext(SharedRoomStateContext);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [openCallWindow, setOpenCallWindow] = React.useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const copy = async () => {
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(window.location.origin + '/' + props.roomId);
    } else {
      document.execCommand('copy', true, window.location.origin + '/' + props.roomId);
    }
    notify.setMessage('Room URL copied to clipboard!');
    notify.setSeverity('success');
    notify.setOpen(true)
    handleClose()

  }

  const getRoomData = React.useCallback(async (roomId) => {
    try {
      const room = sbContext.channels[roomId]
      room.downloadData(roomId, room.key).then((data) => {
        downloadFile(btoa(JSON.stringify(data.channel, null, 2)), room.alias + "_data.txt", 'text/plain;charset=utf-8')
      }).catch((e) => {
        console.error(e)
        notify.error('Error downloading file')
      })
    } catch (e) {
      console.error(e)
      notify.error('Error downloading file')
    }

  }, [notify, sbContext])

  const getRoomStorage = React.useCallback(async (roomId) => {
    try {
      const room = sbContext.channels[roomId]
      room.downloadData(roomId, room.key).then((data) => {
        downloadFile(btoa(JSON.stringify(data.storage, null, 2)), room.alias + "_shards.txt", 'text/plain;charset=utf-8')
      }).catch((e) => {
        console.error(e)
        notify.error('Error downloading file')
      })
    } catch (e) {
      console.error(e)
      notify.error('Error downloading file')
    }

  }, [notify, sbContext])

  const startOrJoinCall = () => {
    setOpenCallWindow(true)
  }

  const closeCallWindow = () => {
    setOpenCallWindow(false)
  }
  console.log(props.selected)
  return (
    <div style={{ position: 'relative' }}>
      <CallWindow open={openCallWindow} onClose={closeCallWindow} room={props.roomId} keys={sbContext.channels[props.roomId].key} />

      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        {((room_id === props.roomId || (!room_id && props.roomId)) && props.selected) ?
          <ConnectionStatus roomId={props.roomId} >
            <MoreVertIcon sx={{ color: props.selected ? '#fff' : 'inherit' }} />
          </ConnectionStatus>
          : <MoreVertIcon sx={{ color: props.selected ? '#fff' : 'inherit' }} />
        }
      </IconButton>

      <Menu
        id="long-menu"
        MenuListProps={{
          'aria-labelledby': 'long-button',
        }}
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        PaperProps={{
          style: {
            maxHeight: ITEM_HEIGHT * 6,
            width: '20ch',
          },
        }}
      >
        <MenuList>
          <MenuItem onClick={() => {
            handleClose()
            props.editRoom()
          }}>
            <ListItemIcon>
              <EditOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Edit Name</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            roomState.setOpenImageGallery(true)
            handleClose()
          }}>
            <ListItemIcon>
              <CollectionsIcon />
            </ListItemIcon>
            <ListItemText>Images</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            handleClose()
            getRoomData(props.roomId)
          }}>
            <ListItemIcon>
              <FileDownloadOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Get Channel</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => {
            handleClose()
            getRoomStorage(props.roomId)
          }}>
            <ListItemIcon>
              <FileDownloadOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Get Shards</ListItemText>
          </MenuItem>
          <MenuItem onClick={copy}>
            <ListItemIcon>
              <IosShareOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
      <IconButton
        aria-label="cancel room rename"
        edge="end"
      >
        <CallIcon sx={{ color: "#fff" }} onClick={startOrJoinCall} />
      </IconButton>
    </div>
  );
})



export default RoomMenu