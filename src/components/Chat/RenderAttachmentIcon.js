import * as React from 'react';
import { observer } from "mobx-react"
import { IconButton } from "@mui/material";
import { Attachment } from '@mui/icons-material';

const RenderAttachmentIcon = observer((props) => {
  const elementId = `attach-button-${props.roomId}`
  const openDropZone = () => {
    props.dzRef.open()
  }

  return (
    <IconButton disabled={!props.connected} component="label" id={elementId} aria-label="attach" size="large" onClick={openDropZone}>
      <Attachment />
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