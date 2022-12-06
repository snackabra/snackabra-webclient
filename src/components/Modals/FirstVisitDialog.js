import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState } from "react";
import { Trans } from "@lingui/macro";
import { observer } from "mobx-react"

const FirstVisitDialog = observer((props) => {
  const [open, setOpen] = useState(props.open);
  const [text, setText] = useState('');
  const [submitClick, setSubmitClick] = useState(false);



  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateText = (e) => {
    setText(e.target.value)
  }

  const submit = async () => {
    setSubmitClick(true)
    // localStorage.setItem(props.roomId + '_username', text)
    //activeChatContext.selectRoom(props.roomId);
    props.onClose(text);
    setTimeout(() => {
      //page.reload();
    }, 1000)

  }

  const onClose = () => {
    if (!submitClick) {
      setOpen(true)
    } else {
      setOpen(false)
    }
  }

  return (
    <ResponsiveDialog
      title={typeof props.roomName === 'string' ? props.roomName : 'First Visit'}
      onClose={onClose}
      open={open}>
      <Grid container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start">
        <Grid item xs={12}>
          <Typography variant={'body1'}>
            Welcome! If this is the first time you've been to this room, enter
              your username (optional) for this room and press 'Ok' and we we will generate fresh cryptographic keys that are
              unique to you and to this room.
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{ pb: 2, pt: 2 }}>
          <TextField
            id="Username"
            placeholder="Username"
            fullWidth
            onChange={updateText}
          />
        </Grid>
        <StyledButton variant={'outlined'} onClick={submit}><Trans id='ok button text'>Ok</Trans></StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

})

export default FirstVisitDialog
