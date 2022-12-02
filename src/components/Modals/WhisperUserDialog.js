import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useContext, useState, useEffect } from "react";

export default function WhisperUserDialog(props) {

  const [open, setOpen] = useState(props.open);

  const [text, setText] = useState('');
  const [error, setError] = useState(false);

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateWhisperText = (e) => {
    setText(e.target.value)
  }

  const sendWhisper = () => {
    if(text.length > 0){
      // activeChatContext.sendMessage(text, true);
      setText('')
      setError(false)
      props.onClose()
    }else{
      setError(true)
    }

  }

  const getWhisperText = () => {
    // return activeChatContext?.replyTo ? activeChatContext.getWhisperToText() : '';
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

}
