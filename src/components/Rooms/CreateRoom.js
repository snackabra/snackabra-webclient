import React from "react"
import { observer } from "mobx-react"
import { useNavigate } from "react-router-dom";
import { Trans } from "@lingui/macro";
import { Grid, Button, CircularProgress, InputAdornment, IconButton, OutlinedInput, FormControl } from "@mui/material";
import {Visibility, VisibilityOff} from '@mui/icons-material';
import FirstVisitDialog from "../Modals/FirstVisitDialog.js";
import NotificationContext from "../../contexts/NotificationContext.js";
import NavBarActionContext from "../../contexts/NavBarActionContext.js";
import SnackabraContext from "../../contexts/SnackabraContext.js";


const CreateRoom = observer((props) => {
  const NavAppBarContext = React.useContext(NavBarActionContext)
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = React.useContext(NotificationContext);
  const navigate = useNavigate();
  const isFirefox = typeof InstallTrigger !== 'undefined';
  const [secret, setSecret] = React.useState('');
  const [roomName, setRoomName] = React.useState('');
  const [roomId, setRoomId] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [openFirstVisit, setOpenFirstVisit] = React.useState(false);
  const [showPassword, setShowPassword] = React.useState(false);
  const [errored, setError] = React.useState(false);

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
    NavAppBarContext.setMenuOpen(false)
    navigate("/" + roomId);

  }

  const error = (message = 'Error creating the room') => {
    Notifications.setMessage(message);
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
  }


  const createRoom = async () => {
    setCreating(true)
    let alias = roomName || `Room ${Object.keys(sbContext.channels).length + 1}`
    sbContext.create(secret, alias).then((channel) => {
      setRoomId(channel.id)
      setOpenFirstVisit(true)
    }).catch((e) => {
      console.error(e)
      setCreating(false)
      setError(true)
      error(e.error || e.message)
    })
  }

  const saveUsername = (newUsername) => {
    const key = sbContext.channels[roomId].key;
    sbContext.createContact(newUsername || 'Unamed', key)
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
            inputProps={{ autoFocus: true, autoComplete: "off", className: showPassword ? 'text-field' : 'password-field' }}
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
        <FormControl fullWidth variant="outlined">
          <OutlinedInput
            placeholder={'Room Name (optional)'}
            id="sb-wc-server-name"
            type={'text'}
            value={roomName}
            inputProps={{ autoFocus: false, autoComplete: "on", className: 'text-field' }}
            onKeyUp={(e) => {
              if (e.keyCode === 13) {
                createRoom()
              }
            }}
            onChange={(e) => {
              setRoomName(e.target.value)
            }}
          />
        </FormControl>
      </Grid>
      <Grid xs={12} item>
        {creating ?
          <Button disabled variant={'outlined'}>
            <CircularProgress color={"success"} size={20} />
            &nbsp;Creating
          </Button>

          :
          <Button variant="contained" onClick={createRoom}><Trans id='new room header'>Create New
            Room</Trans></Button>
        }

      </Grid>
      <FirstVisitDialog open={openFirstVisit} sbContext={sbContext} onClose={(username) => {
        saveUsername(username)
        setOpenFirstVisit(false)
        success(roomId);
      }} roomId={roomId} />
    </Grid>
  )
})

export default CreateRoom
