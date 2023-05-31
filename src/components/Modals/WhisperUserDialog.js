import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useEffect } from "react";
import { observer } from "mobx-react"
import SnackabraContext from "../../contexts/SnackabraContext";
let SB = require(process.env.NODE_ENV === 'development' ? 'snackabra/dist/snackabra' : 'snackabra')

const WhisperUserDialog = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const [open, setOpen] = useState(props.open);

  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateWhisperText = (e) => {
    setText(e.target.value)
  }

  const sendWhisper = async () => {
    if (text.length > 0) {
      const sbCrypto = new SB.SBCrypto();
      console.log(sbContext)
      const shared_key = props.replyTo ? await sbContext.replyEncryptionKey(props.replyTo) : sbContext.sharedKey
      const cipherText = await sbCrypto.wrap(shared_key, text)
      // let sbm = new SB.SBMessage(sbContext.socket)
      // sbm.contents.whisper = cipherText
      // sbm.contents.encrypted = true;
      // sbm.contents.whispered = true;
      let newMessageContents = {
        whisper: cipherText,
        encrypted: true,
        whispered: true
      }
      if (props.replyTo) {
        // sbm.contents.reply_to = JSON.parse(props.replyTo);
        newMessageContents.reply_to = JSON.parse(props.replyTo)
      }
      let sbm = this.sbContext.newMessage(newMessageContents)
      sbm.send();
      setText('')
      setError(false)
      props.onClose()
    } else {
      setError(true)
    }
  }

  return (
    <ResponsiveDialog
      title={`Send a whisper`}
      open={open}>
      <Grid container
        direction="row"
        justifyContent="space-between"
        alignItems="flex-start">
        <Grid item xs={12} sx={{ pb: 1, pt: 1 }}>
          <TextField
            id="whisper-text"
            placeholder="Whisper"
            error={error}
            onChange={updateWhisperText}
            multiline
            fullWidth
            rows={4}
            value={text}
          />
        </Grid>
        <StyledButton variant={'contained'} onClick={sendWhisper}>Send</StyledButton>
        <StyledButton variant={'contained'} onClick={props.onClose}>Cancel</StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

})

export default WhisperUserDialog