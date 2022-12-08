import * as React from 'react';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import ListItemIcon from "@mui/material/ListItemIcon";
import ListItemText from "@mui/material/ListItemText";
import PhotoLibraryOutlinedIcon from '@mui/icons-material/PhotoLibraryOutlined';
import CameraAltOutlinedIcon from '@mui/icons-material/CameraAltOutlined';
import FolderOpenOutlinedIcon from '@mui/icons-material/FolderOpenOutlined';
import Divider from "@mui/material/Divider";
import { Hidden } from "@mui/material";


export default function AttachMenu(props) {
  const [open, setOpen] = React.useState(false);
  const [file, setFile] = React.useState('No file selected');
  const anchorEl = document.getElementById('attach-menu');

  let fileReader;

  React.useEffect(() => {
    if (props.open) {
      selectPhoto();
    }
  }, [props.open])

  const selectPhoto = (e) => {
    try {
      const photo = e.target.files[0];
      fileReader = new FileReader();
      fileReader.onloadend = handleFileRead;
      fileReader.readAsText(photo);
      // activeChatContext.previewImage(photo, e.target.files[0])
      props.handleClose()
    } catch (e) {
      console.log(e)
    }
  }

  const handleFileRead = (e) => {
    const content = fileReader.result;
    setFile(content)
  };

  return (
    <Menu
      anchorEl={anchorEl}
      open={open}
      onClose={props.handleClose}
      anchorOrigin={{
        vertical: 'top',
        horizontal: 'right',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'left',
      }}
    >
      <div style={{ width: 260 }}>
        <MenuItem component="label">
          <ListItemText>Photo Library</ListItemText>
          <ListItemIcon>
            <PhotoLibraryOutlinedIcon />
          </ListItemIcon>
          <input
            id='fileInput'
            onChange={selectPhoto}
            type="file"
            hidden
          />
        </MenuItem>
      </div>
    </Menu>
  );
}
