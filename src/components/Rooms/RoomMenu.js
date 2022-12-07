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
import ShareDialog from "../Modals/ShareDialog"
import ConnectionStatus from "./ConnectionStatus"

const ITEM_HEIGHT = 48;

const RoomMenu = (props) => {
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const toggle = () => {
    console.log('toggling')
    setDialogOpen(!dialogOpen)
  }

  return (
    <div>
      <ShareDialog open={dialogOpen} roomId={props.roomId} onClose={toggle} />
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
              props.getRoomData()
            }}>
              <ListItemIcon>
                <FileDownloadOutlinedIcon />
              </ListItemIcon>
              <ListItemText>Download Data</ListItemText>
            </MenuItem> : ''
          }

          {props.socket?.status === 'OPEN' && props.selected ?
            <MenuItem onClick={() => {
              handleClose()
              props.exportKeys()
            }}>
              <ListItemIcon>
                <FileDownloadOutlinedIcon />
              </ListItemIcon>
              <ListItemText>Export Keys</ListItemText>
            </MenuItem> : ''
          }
          <MenuItem onClick={toggle}>
            <ListItemIcon>
              <IosShareOutlinedIcon />
            </ListItemIcon>
            <ListItemText>Share</ListItemText>
          </MenuItem>
        </MenuList>
      </Menu>
      {props.selected ?
        <ConnectionStatus socket={props.socket} />
        : ''

      }

    </div>
  );
}

export default RoomMenu