import React from "react"
import { Trans } from "@lingui/macro";
import { observer } from "mobx-react"
import ResponsiveDialog from "../ResponsiveDialog.js";
import { Grid, TextField, Typography, Button } from "@mui/material";


const FirstVisitDialog = observer((props) => {
  const [open, setOpen] = React.useState(props.open);
  const [text, setText] = React.useState('');

  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateText = (e) => {
    setText(e.target.value)
  }

  const submit = () => {
    props.onClose(text);
  }

  const onClose = () => {
    submit()
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
            id="sb-username"
            placeholder="Username"
            fullWidth
            autoFocus
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                submit()
              }
            }}
            onChange={updateText}
          />
        </Grid>
        <Button variant={'outlined'} onClick={submit}><Trans id='ok button text'>Ok</Trans></Button>
      </Grid>
    </ResponsiveDialog>
  )

})

export default FirstVisitDialog