import * as React from "react"
import { Grid, OutlinedInput, Button } from "@mui/material";
import ResponsiveDialog from "../ResponsiveDialog.js";


const ChangeNameDialog = (props) => {
  const [open, setOpen] = React.useState(props.open);
  const [username, setUsername] = React.useState(props.name || "");

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  React.useEffect(() => {
    if (props.name) {
      setUsername(props.name)
    }

  }, [props.name])

  const updateUsername = (e) => {
    setUsername(e.target.value)
  }

  const checkForEnter = (e) => {
    if (e.keyCode === 13) {
      saveUserName()
    }
  }

  const setMe = () => {
    setUsername('Me')
    props.onClose('Me', props._id)
  }

  const saveUserName = () => {
    props.onClose(username, props._id)
  }

  const close = () => {
    props.onClose()
  }
  
  return (
    <ResponsiveDialog title={'Change Username'} open={open} onClose={close} showActions>
      <Grid container
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start">
        <Grid item xs={12} sx={{ pb: 1 }}>
          <OutlinedInput placeholder="Please enter text"
            value={username}
            onKeyUp={checkForEnter}
            onChange={updateUsername} fullWidth />
        </Grid>
        <Button variant={'outlined'} onClick={saveUserName}>Save</Button>
        <Button variant={'outlined'} onClick={setMe}>Me</Button>
      </Grid>
    </ResponsiveDialog>
  )

}

export default ChangeNameDialog