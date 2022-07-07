import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useContext, useState, useEffect } from "react";
import ActiveChatContext from "../../contexts/ActiveChatContext";

export default function WhisperUserDialog(props) {
  const activeChatContext = useContext(ActiveChatContext)

  const [open, setOpen] = useState(props.open);

  const [text, setText] = useState('');

  useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateWhisperText = (e) => {
    setText(e.target.value)
  }

  const sendWhisper = () => {
    activeChatContext.sendMessage(text, true);
    setText('')
    setOpen(false)
  }

  const getWhisperText = () => {
    return activeChatContext?.replyTo ? activeChatContext.getWhisperToText() : '';
  }

  return (
    <ResponsiveDialog
      title={`Send a whisper`}
      open={open}>
      <Grid container
            direction="row"
            justifyContent="space-between"
            alignItems="flex-start">
        <Grid item xs={12} sx={{pb:1,pt:1}}>
          <TextField
            id="whisper-text"
            placeholder="Whisper"
            onChange={updateWhisperText}
            multiline
            fullWidth
            rows={4}
            value={text}
          />
        </Grid>
        <StyledButton variant={'outlined'} onClick={sendWhisper}>Send</StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

}
