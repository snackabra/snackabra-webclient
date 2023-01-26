import * as React from "react"
import { Trans } from "@lingui/macro";
import { Grid } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import CircularProgress from '@mui/material/CircularProgress';
import { useState, useContext } from "react"
import NotificationContext from "../../contexts/NotificationContext";
import FirstVisitDialog from "../Modals/FirstVisitDialog";
import Visibility from '@mui/icons-material/Visibility';
import VisibilityOff from '@mui/icons-material/VisibilityOff';
import InputAdornment from '@mui/material/InputAdornment';
import FormControl from '@mui/material/FormControl';
import OutlinedInput from '@mui/material/OutlinedInput';
import IconButton from '@mui/material/IconButton';
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";


const CreateRoom = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = useContext(NotificationContext);
  const isFirefox = typeof InstallTrigger !== 'undefined';
  const [secret, setSecret] = useState('');
  const [roomId, setRoomId] = useState('');
  const [creating, setCreating] = useState(false);
  const [openFirstVisit, setOpenFirstVisit] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [errored, setError] = useState(false);

  React.useEffect(() => {
    document.getElementById('sb-wc-server-secret').focus()
  }, [])

  const success = (roomId) => {
    if (typeof props?.onClose === 'function') {
      props.onClose()
    }
    Notifications.setMessage('Room Created!');
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
    setCreating(false)
    setTimeout(() => {
      window.location.href = window.location.origin + `/${roomId}`
    }, 750)

  }

  const error = () => {
    Notifications.setMessage('Error creating the room');
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
  }


  const createRoom = async () => {
    setCreating(true)
    sbContext.createRoom(secret).then((channel) => {
      setRoomId(channel)
      setOpenFirstVisit(true)
    }).catch((e) => {
      console.error(e)
      setCreating(false)
      setError(true)
      error()
    })
  }

  const saveUsername = (newUsername) => {
    return new Promise((resolve) => {
      const _id = sbContext.user._id;
      sbContext.username = newUsername;
      const contacts = {}
      const user_pubKey = JSON.parse(_id);
      contacts[user_pubKey.x + ' ' + user_pubKey.y] = newUsername === '' ? 'Unnamed' : newUsername;
      sbContext.contacts = contacts;
      resolve(true)

    })

  }

  const handleMouseDownPassword = (event) => {
    event.preventDefault();
  };

  const handleClickShowPassword = () => {
    setShowPassword(!showPassword)
  };

  return (
    <Grid spacing={2}
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start">

      <Grid xs={12} item>
        <FormControl fullWidth variant="outlined">
          <OutlinedInput
            placeholder={'Server Secret'}
            id="sb-wc-server-secret"
            type={!isFirefox ? 'text' : showPassword ? 'text' : 'password'}
            value={secret}
            error={errored}
            inputProps={{ autoFocus: true, autoComplete: "off",className: showPassword ? 'text-field' : 'password-field' }}
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                createRoom()
              }
            }}
            onChange={(e) => {
              setSecret(e.target.value)
            }}
            endAdornment={
              <InputAdornment position="end">
                <IconButton
                  aria-label="toggle password visibility"
                  onClick={handleClickShowPassword}
                  onMouseDown={handleMouseDownPassword}
                  edge="end"
                >
                  {showPassword ? <VisibilityOff /> : <Visibility />}
                </IconButton>
              </InputAdornment>
            }
          />
        </FormControl>
      </Grid>
      <Grid xs={12} item>
        {creating ?
          <StyledButton disabled variant={'outlined'}>
            <CircularProgress color={"success"} size={20} />
            &nbsp;Creating
          </StyledButton>

          :
          <StyledButton variant="contained" onClick={createRoom}><Trans id='new room header'>Create New
            Room</Trans></StyledButton>
        }

      </Grid>
      <FirstVisitDialog open={openFirstVisit} sbContext={sbContext} onClose={(username) => {
        saveUsername(username).then(() => {
          setOpenFirstVisit(false)
          success(roomId);
        })

      }} roomId={roomId} />
    </Grid>
  )
})

export default CreateRoom
