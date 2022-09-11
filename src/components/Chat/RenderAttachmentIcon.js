import * as React from 'react';
import { IconButton } from "@mui/material";
import AttachmentIcon from '@mui/icons-material/Attachment';
import ActiveChatContext from "../../contexts/ActiveChatContext";

function RenderAttachmentIcon(props) {
  const activeChatContext = React.useContext(ActiveChatContext)
  const [file, setFile] = React.useState(''); // TODO - why is 'file' not used?

  let fileReader;

  const selectPhoto = (e) => {
    try {
      const t0 = new Date().getTime();
      const photo = e.target.files[0];
      console.log("Asked to preview file:");
      console.log(photo);
      fileReader = new FileReader();
      fileReader.onloadend = handleFileRead;
      fileReader.readAsText(photo);
      activeChatContext.previewImage(photo, e.target.files[0]); // psm ... hm they are the same?
      const t1 = new Date().getTime();
      console.log(`... done load/preview ... took ${t1 - t0} milliseconds`);
      if(typeof props.handleClose === 'function'){
        props.handleClose()
      }
      setFile('')
    } catch (e) {
      console.log(e)
    }
  }

  const handleFileRead = (e) => {
    const content = fileReader.result;
    setFile(content)
  };

  return (
    <IconButton component="label" id={'attach-menu'} aria-label="attach" size="large">
      <AttachmentIcon />
      <input
        onChange={selectPhoto}
        type="file"
        hidden
      />
    </IconButton>
  )
}

export default RenderAttachmentIcon;
