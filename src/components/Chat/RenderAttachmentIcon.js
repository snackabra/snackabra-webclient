import * as React from 'react';
import { IconButton } from "@mui/material";
import AttachmentIcon from '@mui/icons-material/Attachment';
import { SBImage } from "../../utils/ImageProcessor";

const getSbImage = (file, props) => {
  return new Promise((resolve) => {
    const sbImage = new SBImage(file);
    sbImage.img.then((i)=>{
      sbImage.url = i.src
      queueMicrotask(() => {
        const SBImageCanvas = document.createElement('canvas');
        sbImage.loadToCanvas(SBImageCanvas).then((c) => {
          sbImage.aspectRatio.then((r) => {
            sbImage.aspectRatio = r
            props.showLoading(false)
            resolve(sbImage)
          });
        });
      });
    })
  })
}

function RenderAttachmentIcon(props) {
  const selectFiles = async (e) => {
    props.showLoading(true)
    try {
      const files = []
      for (let i in e.target.files) {
        if (typeof e.target.files[i] === 'object') {
          const attachment = await getSbImage(e.target.files[i], props)
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
}

export default RenderAttachmentIcon;
