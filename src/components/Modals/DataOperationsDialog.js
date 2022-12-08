import * as React from "react";
import ResponsiveDialog from "../ResponsiveDialog";
import ImportRoomKeys from "../Rooms/ImportRoomKeys";
import ExportRoomKeys from "../Rooms/ExportRoomKeys";
import DownloadRoomData from "../Rooms/DownloadRoomData";
import { Divider, Typography } from "@mui/material";

export default function DataOperationsDialog(props){
  const [open, setOpen] = React.useState(props.open);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  return (
    <ResponsiveDialog title={'Data Operations'} open={open} onClose={props.onClose} showActions>
      <Divider sx={{mt:2, mb:2}}/>
      <Typography variant={'h6'} gutterBottom>Download Room Data</Typography>
      <DownloadRoomData/>
      <Divider sx={{mt:2, mb:2}}/>
      <Typography variant={'h6'} gutterBottom>Export Keys</Typography>
      <ExportRoomKeys/>
      <Divider sx={{mt:2, mb:2}}/>
      <Typography variant={'h6'} gutterBottom>Import Keys</Typography>
      <ImportRoomKeys/>
    </ResponsiveDialog>
  )

}
