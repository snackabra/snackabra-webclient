import * as React from "react"
import { Trans } from "@lingui/macro";
import { Grid, Hidden, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import config from "../../config";
import CreateRoom from "./CreateRoom";
import NotificationContext from "../../contexts/NotificationContext";


const RoomAdmin = (props) => {
  let ROOM_SERVER = config.ROOM_SERVER;
  let STORAGE_SERVER = config.STORAGE_SERVER;
  const Notifications = React.useContext(NotificationContext);

  const [roomSecret, setRoomSecret] = React.useState('')
  const [roomId, setRoomID] = React.useState('')
  const [ownerPublicKey, setOwnerPublicKey] = React.useState('')
  const [formError, setFormError] = React.useState(false)

  const success = (message) => {
    Notifications.setMessage(message);
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
  }

  const error = (message) => {
    Notifications.setMessage(message);
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
  }


  const uploadRoomData = async () => {
    const reader = new FileReader()
    let roomId = null;
    reader.onload = async event => {
      try {
        const dataJSON = JSON.parse(event.target.result);
        if (document.getElementById("serverSecretInput") !== null) {
          dataJSON["SERVER_SECRET"] = document.getElementById("serverSecretInput").value;
        }
        if (dataJSON.hasOwnProperty("roomId")) {
          roomId = dataJSON["roomId"];
          console.log(roomId);
          let data = new TextEncoder().encode(JSON.stringify(dataJSON));
          let req = await fetch(ROOM_SERVER + roomId + "/uploadRoom", {
            method: "POST",
            body: data
          });
          //TODO these should be notifications
          req.json().then((j) => {
            /*
            if (j.hasOwnProperty('error')) JwModal.open('landing-response', 'Error from room server: ' + j['error']);
            else JwModal.open('landing-response', 'Room has been imported! Room <id> is ' + roomId);

             */
          });
        } else {
          //JwModal.open('landing-response', 'That room id is not present in the file');
        }
      } catch (error) {
        //JwModal.open('landing-response', 'Error loading room (' + error.message + ')');
      }
    }// desired file content
    reader.onerror = error => {
      console.log(error)
    }
    if (document.getElementById('uploadRoomFile').files.length > 0) {
      reader.readAsText(document.getElementById('uploadRoomFile').files[0]);
    }
  }


  const uploadStorageData = async () => {
    console.log("In function")
    const reader = new FileReader()
    reader.onload = async event => {
      try {
        const dataJSON = JSON.parse(event.target.result);
        if (document.getElementById("storageServerSecretInput") !== null) {
          dataJSON["SERVER_SECRET"] = document.getElementById("storageServerSecretInput").value;
        }
        let data = new TextEncoder().encode(JSON.stringify(dataJSON));
        let req = await fetch(STORAGE_SERVER + "/migrateStorage", {
          method: "POST",
          body: data
        });
      } catch (error) {
        console.log(error)
      }
    }// desired file content
    reader.onerror = error => {
      console.log(error)
    }
    if (document.getElementById('uploadStorageFile').files.length > 0) {
      reader.readAsText(document.getElementById('uploadStorageFile').files[0]);
    }
  }

  const authorizeRoom = async () => {
    if (roomId.length !== 64 || roomSecret.length < 4 || ownerPublicKey.length < 200) {
      setFormError(true)
      error('Please fix the form before submitting')
      return;
    } else {
      setFormError(false)

      await fetch(ROOM_SERVER + roomId + "/authorizeRoom", {
        method: "POST",
        body: { roomId: roomId, SERVER_SECRET: roomSecret, ownerKey: ownerPublicKey }
      }).then((r) => {
        console.log(r)
        if(r.status === 200) {
          success('Room Authorized!!!')
        }else{
          console.log(r)
          error('Something happened when submitting the form!')
        }
      }).catch((e) => {
        console.log(e)
        error('Something happened when submitting the form!')
      })

    }
  }

  return (
    <Grid id="server_admin" container>
      <Hidden xsUp>
        <Typography variant={'h3'}><Trans id='room upload header'>Upload Room</Trans></Typography>
        <Grid id="uploadRoom"
              xs={12}
              container
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start">

          <Typography variant={'body1'}><Trans id='room upload message'>You can upload room data for a previously
            generated room by selecting a file to upload and then entering your room server secret and pressing the
            button
            below. </Trans></Typography>

          <br /> <br />
          <Grid xs={12} item>
            <StyledButton
              variant="contained"
              component="label"
            >
              Upload Room Data
              <input
                onChange={uploadRoomData}
                type="file"
                hidden
              />
            </StyledButton>
          </Grid>

          <input type="file" id="uploadRoomFile" name="file-input" />
          <br /> <br />
          <label htmlFor='serverSecretInput'>Enter Room Server Secret: </label>
          <input type="text" id="serverSecretInput"></input>
          <br />
          <button className='admin-button gray-btn' onClick={props.uploadRoomData}><Trans id='room upload button'>Upload
            Room Data</Trans></button>
        </Grid>
      </Hidden>
      <hr />
      <Grid xs={12}
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start">
        <Grid xs={12} item>
          <Typography variant={'h3'}><Trans id='new room header'>Create New Room</Trans></Typography>
        </Grid>
        <Grid xs={12} item>
          <Typography variant={'body1'} gutterBottom><Trans id='new room message'>Create a new room by entering your
            room server
            secret
            and pressing 'Create'. This will generate the necessary keys for the new room and initialize the room for
            you
            on your server.</Trans></Typography>
        </Grid>

        <Grid xs={12} md={6}>
          <CreateRoom />
        </Grid>
      </Grid>
      <hr />
      <Hidden xsUp>
        <Grid id="uploadStorage"
              xs={12}
              container
              direction="row"
              justifyContent="flex-start"
              alignItems="flex-start">
          <Typography variant={'h3'}><Trans id='storage upload header'>Upload Storage Data</Trans></Typography>
          <Typography variant={'body1'}><Trans id='storage upload message'>You can upload storage data for a previously
            generated room by entering your storage server secret and pressing the button below.</Trans></Typography>
          <br /> <br />
          <input type="file" id="uploadStorageFile" name="file-input" />
          <br /> <br />
          <label htmlFor='storageServerSecretInput'>Enter Storage Server Secret: </label>
          <input type="text" id="storageServerSecretInput"></input>
          <br />
          <button className='admin-button gray-btn' onClick={props.uploadStorageData}><Trans id='storage upload button'>Upload
            Storage Data</Trans></button>
        </Grid>
      </Hidden>
      <Grid id="authorizeRoom"
            xs={12}
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start">
        <Typography variant={'h3'}><Trans id='room authorize header'>Authorize Room</Trans></Typography>
        <Typography variant={'body1'}><Trans id='room authorize message'>You can authorize a room to be made available
          on your server. To do that, enter the roomId, the public key of the room owner and your server secret and
          press Authorize Room.</Trans></Typography>
        <Grid xs={12} item sx={{ pb: 1, pt: 1 }}>
          <TextField
            fullWidth
            onChange={(e) => {
              setRoomSecret(e.target.value)
            }}
            placeholder={'Room Secret'}
            value={roomSecret}
            error={formError} />
        </Grid>
        <Grid xs={12} item sx={{ pb: 1, pt: 1 }}>
          <TextField
            fullWidth
            onChange={(e) => {
              setRoomID(e.target.value)
            }}
            placeholder={'Room ID'}
            value={roomId}
            error={formError} />
        </Grid>
        <Grid xs={12} item sx={{ pb: 1, pt: 1 }}>
          <TextField
            fullWidth
            onChange={(e) => {
              setOwnerPublicKey(e.target.value)
            }}
            placeholder={'Owner Public Key'}
            value={ownerPublicKey}
            error={formError} />
        </Grid>
        <Grid xs={12} item sx={{ pb: 1, pt: 1 }}>
          <StyledButton variant={'contained'} onClick={authorizeRoom}>
            <Typography variant={'button'}>Authorize Room</Typography>
          </StyledButton>
        </Grid>
      </Grid>
    </Grid>

  )
}

export default RoomAdmin
