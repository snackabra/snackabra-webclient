import * as React from 'react';
import { IconButton } from "@mui/material";
import AttachmentIcon from '@mui/icons-material/Attachment';
import { observer } from "mobx-react"

const RenderAttachmentIcon = observer((props) => {

  const openDropZone = ()=>{
    props.dzRef.open()
  }

  return (
    <IconButton component="label" id={'attach-menu'} aria-label="attach" size="large" onClick={openDropZone}>
      <AttachmentIcon />
      {/* <input
        id="fileInput"
        onChange={selectFiles}
        type="file"
        hidden
        multiple
        accept="image/*"
      /> */}
    </IconButton>
  )
})

export default RenderAttachmentIcon;