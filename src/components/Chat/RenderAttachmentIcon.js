import * as React from 'react';
import { IconButton } from "@mui/material";
import AttachmentIcon from '@mui/icons-material/Attachment';
import { SBImage } from "../../utils/ImageProcessor";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";

const getSbImage = (file, props, sbContext) => {
  return new Promise((resolve) => {
    const sbImage = new SBImage(file, sbContext.SB);
    sbImage.img.then((i) => {
      sbImage.url = i.src
      props.showLoading(false)
      resolve(sbImage)
      queueMicrotask(() => {
        const SBImageCanvas = document.createElement('canvas');
        sbImage.loadToCanvas(SBImageCanvas).then((c) => {

        });
      });
    })
  })
}

const RenderAttachmentIcon = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const selectFiles = async (e) => {
    props.showLoading(true)
    try {
      const files = []
      for (let i in e.target.files) {
        if (typeof e.target.files[i] === 'object') {
          const attachment = await getSbImage(e.target.files[i], props, sbContext)
          files.push(attachment)

        }
      }
      props.addFile(files)
    } catch (e) {
      console.log(e)
    }
  }

  return (
    <IconButton component="label" id={'attach-menu'} aria-label="attach" size="large">
      <AttachmentIcon />
      <input
        id="fileInput"
        onChange={selectFiles}
        type="file"
        hidden
        multiple
      />
    </IconButton>
  )
})

export default RenderAttachmentIcon;
