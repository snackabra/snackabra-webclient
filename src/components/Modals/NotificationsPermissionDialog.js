import React from "react"
import ResponsiveDialog from "../ResponsiveDialog.js";
import { Grid, Typography, Button } from "@mui/material";


const NotificationsPermissionDialog = (props) => {
  const [open, setOpen] = React.useState(props.open);


  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const submit = async () => {
    if(typeof Notification !== 'undefined' ){
      const permission = await Notification.requestPermission()
      console.log('Notification.requestPermission', Notification.permission)
      if (permission === 'granted') {
        console.log('Notification.permission', Notification.permission)
      }else{
        console.log('Notification.permission', Notification.permission)
        return;
      }
      props.onClose();
    }

  }

  const cancel = () => {
    props.onClose();
  }

  const onClose = () => {
    cancel()
  }

  return (
    <ResponsiveDialog
      title={'Enable Notifications'}
      onClose={onClose}
      showActions
      open={open}>
      <Grid container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start">
        <Grid item xs={12}>
          <Typography variant={'body1'}>
            Enable notifications for a rich expierence, we will let you know when you have new messages!
          </Typography>
        </Grid>

      </Grid>
      <Grid container
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start">
        <Button variant={'outlined'} onClick={cancel}>No thanks</Button>
        <Button variant={'contained'} onClick={submit}>Ok</Button>
      </Grid>
    </ResponsiveDialog>
  )

}

export default NotificationsPermissionDialog