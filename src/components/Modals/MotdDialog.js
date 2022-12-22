import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useEffect } from "react";
import { Trans } from "@lingui/macro";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";

const MotdDialog = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const [open, setOpen] = useState(props.open);
  const [text, setText] = useState('');

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateWhisperText = (e) => {
    setText(e.target.value)
  }

  const sendWhisper = () => {
    sbContext.sendMessage(text, true);
    setText('')
    setOpen(false)
  }

  return (
    <ResponsiveDialog
      title={typeof sbContext.roomName === 'string' ? sbContext.roomName : 'MotdDialog'}
      open={open}>
      <Grid container
        direction="row"
        justifyContent="flex-start"
        alignItems="flex-start">
        <Grid item xs={12}>
          <Typography variant={'body1'}>
            {sbContext.motd !== '' &&
              <Trans id='motd text'>Message of the day: {sbContext.motd}</Trans>}
          </Typography>
        </Grid>
        {!sbContext.owner ?
          <>
            <TextField
              id="sb-whisper-text"
              label="Whisper"
              onChange={updateWhisperText}
              multiline
              fullWidth
              rows={4}
              value={text}
              variant="filled"
            />
            <StyledButton variant={'outlined'} onClick={sendWhisper}>Send</StyledButton>
          </>
          : null
        }
      </Grid>
    </ResponsiveDialog>
  )

})

export default MotdDialog