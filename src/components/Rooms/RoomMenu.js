import * as React from 'react';
import IconButton from '@mui/material/IconButton';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import MenuList from '@mui/material/MenuList';
import ListItemText from '@mui/material/ListItemText';
import ListItemIcon from '@mui/material/ListItemIcon';
import EditOutlinedIcon from '@mui/icons-material/EditOutlined';
import FileDownloadOutlinedIcon from '@mui/icons-material/FileDownloadOutlined';
import IosShareOutlinedIcon from '@mui/icons-material/IosShareOutlined';
import NotificationContext from "../../contexts/NotificationContext";
import ConnectionStatus from "./ConnectionStatus"

const ITEM_HEIGHT = 48;

const RoomMenu = (props) => {
  const Notifications = React.useContext(NotificationContext)
  const [anchorEl, setAnchorEl] = React.useState(null);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const copy = async () => {
    console.log(window.location)
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(window.location.origin + '/' + props.roomId);
    } else {
      document.execCommand('copy', true, window.location.origin + '/' + props.roomId);
    }
    Notifications.setMessage('Room URL copied to clipboard!');
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
    handleClose()

  }

  const getRoomData = (roomId) => {
    props.sbContext.downloadRoomData().then((data) => {
      delete data.channel.SERVER_SECRET
      downloadFile(JSON.stringify(data.channel), props.sbContext.rooms[props.roomId].name + "_data.txt");
    })
  }

  const getRoomStorage = (roomId) => {
    props.sbContext.downloadRoomData().then((data) => {
      downloadFile(JSON.stringify(data.storage), props.sbContext.rooms[props.roomId].name + "_storage.txt")
    })
  }

  const downloadFile = (text, file) => {
    try {
      let element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(text));
      element.setAttribute('download', file);
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.log(error);
    }
  }

  return (
    <div>
      <IconButton
        aria-label="more"
        id="long-button"
        aria-controls={open ? 'long-menu' : undefined}
        aria-expanded={open ? 'true' : undefined}
        aria-haspopup="true"
        onClick={handleClick}
      >
        <MoreVertIcon sx={{ color: props.selected ? '#fff' : 'inherit' }} />
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
            maxHeight: ITEM_HEIGHT * 4.5,
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
          {props.socket?.status === 'OPEN' && props.selected ?
            <MenuItem onClick={() => {
              handleClose()
              getRoomData()
            }}>
              <ListItemIcon>
                <FileDownloadOutlinedIcon />
              </ListItemIcon>
              <ListItemText>Get Data</ListItemText>
            </MenuItem> : ''
          }
          {props.socket?.status === 'OPEN' && props.selected ?
            <MenuItem onClick={() => {
              handleClose()
              getRoomStorage()
            }}>
              <ListItemIcon>
                <FileDownloadOutlinedIcon />
              </ListItemIcon>
              <ListItemText>Get Storage</ListItemText>
            </MenuItem> : ''
          }

          {/* {props.socket?.status === 'OPEN' && props.selected ?
            <MenuItem onClick={() => {
              handleClose()
              props.exportKeys()
            }}>
              <ListItemIcon>
                <FileDownloadOutlinedIcon />
              </ListItemIcon>
              <ListItemText>Export Keys</ListItemText>
            </MenuItem> : ''
          } */}
          <MenuItem onClick={copy}>
            <ListItemIcon>
              <IosShareOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
      {props.selected ?
        <ConnectionStatus />
        : ''

      }

    </div>
  );
}

export default RoomMenu