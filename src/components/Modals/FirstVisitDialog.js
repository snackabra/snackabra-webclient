import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useContext, useState } from "react";
import ActiveChatContext from "../../contexts/ActiveChatContext";
import { Trans } from "@lingui/macro";

const page = window.location;

export default function FirstVisitDialog(props) {
  const activeChatContext = useContext(ActiveChatContext)

  const [open, setOpen] = useState(props.open);
  const [text, setText] = useState('');
  const [submitClick, setSubmitClick] = useState(false);



  React.useEffect(() => {
    setOpen(props.open)
  }, [props.open])

  const updateText = (e) => {
    setText(e.target.value)
  }

  const submit = () => {
    setSubmitClick(true)
    localStorage.setItem(props.roomId + '_username', text)
    activeChatContext.selectRoom(props.roomId);
    props.onClose();
    setTimeout(()=> {
      //page.reload();
    }, 1000)

  }

  const onClose = () => {
    if (!submitClick) {
      setOpen(true)
    }else{
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
            <Trans id='first visit modal message'>Welcome! If this is the first time you’ve been to this room, enter
              your username for this room and press ‘Ok’ and we we will generate fresh cryptographic keys that are
              unique to you and to this room. If you have already been here, then you might want to load your keys from
              your backup - press ‘Cancel’ and go to the ‘Home’ tab.</Trans>
          </Typography>
        </Grid>
        <Grid item xs={12} sx={{pb:2, pt: 2}}>
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

}

/*
          <JwModal id='lastvisit-empty'>
            <br />
            <br />
            <input type="text" id='public-username-input' placeholder="Enter Username Here" onFocus={(event) => event.target.select()} autoFocus />
            <br />
            <button className='admin-button green-btn' id='acknowledge-localstorage-btn' onClick={(e) => {
              localStorage.setItem(this.roomId + '_username', document.getElementById('public-username-input') && document.getElementById('public-username-input').value)
              JwModal.close('lastvisit-empty')(e);
              this.selectRoom(this.roomId);
            }}><Trans id='ok button text'>Ok</Trans></button>
            <button className='admin-button green-btn' id='cancel-localstorage-btn' onClick={(e) => {
              window.location.href = '{ process.env.PUBLIC_URL }'
            }}><Trans id='cancel button text'>Cancel</Trans></button>
          </JwModal>

 */
