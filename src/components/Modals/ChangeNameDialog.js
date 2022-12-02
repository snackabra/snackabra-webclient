import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, OutlinedInput } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useEffect } from "react";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";


const ChangeNameDialog = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const [open, setOpen] = useState(props.open);
  const [username, setUsername] = useState(props.name);

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  useEffect(() => {
    setUsername(props.name)
  }, [props.name])

  const updateUsername = (e) => {
    setUsername(e.target.value)
  }

  const setMe = () => {
    setUsername('Me')
    sbContext.username = username
    props.onClose()
  }

  const saveUserName = () => {
    props.onClose(username, props._id)
  }

  return (
    <ResponsiveDialog title={'Change Username'} open={open} onClose={props.onClose}>
      <Grid container
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start">
        <Grid item xs={12} sx={{ pb: 1 }}>
          <OutlinedInput placeholder="Please enter text"
            value={username}
            onChange={updateUsername} fullWidth />
        </Grid>
        <StyledButton variant={'outlined'} onClick={saveUserName}>Save</StyledButton>
        <StyledButton variant={'outlined'} onClick={setMe}>Me</StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

})

export default ChangeNameDialog