import React from "react";
import ResponsiveDialog from "../ResponsiveDialog.js";
import ImportRoomKeys from "../Rooms/ImportRoomKeys.js";

export default function ImportDialog(props){
  const [open, setOpen] = React.useState(props.open);

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  return (
    <ResponsiveDialog title={'Import Keys'} open={open} onClose={props.onClose} showActions>
      <ImportRoomKeys/>
    </ResponsiveDialog>
  )

}
