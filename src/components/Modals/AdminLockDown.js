import * as React from "react"
import { Grid, Typography, Button } from "@mui/material";
import ResponsiveDialog from "../ResponsiveDialog.js";
import ActiveChatContext from "../../contexts/ActiveChatContext.js";


//TODO see if we can do this in a popper
export default function LockedInfoDialog(props) {
  const activeChatContext = React.useContext(ActiveChatContext)

  const [open, setOpen] = React.useState(props.open);
  const [text, setText] = React.useState('');

  React.useEffect(() => {
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

  return (
    <ResponsiveDialog
      title={props.roomName}
      open={open}>
      <Grid container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start">
        <Grid item xs={12}>
          <Typography variant={'body1'}>
            {activeChatContext.locked && "The green 'lock' icon indicates this room is ‘restricted’ by the Owner. Only accepted participants can send and receive chats. Remember to make sure you don’t lose your locally stored keys, because if you do, the Owner will have to accept you again."}
          </Typography>
        </Grid>
        <StyledButton variant={'outlined'} onClick={sendWhisper}>Send</StyledButton>
      </Grid>
    </ResponsiveDialog>
  )

}
