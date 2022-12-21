import * as React from "react"
import { Trans } from "@lingui/macro";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useContext } from "react"
import NotificationContext from "../../contexts/NotificationContext";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";

const ImportRoomKeys = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = useContext(NotificationContext)
  const [key, setKey] = useState('');
  const [data, setData] = useState(JSON.stringify({}));

  React.useEffect(() => {
    try {
      if (Object.keys(JSON.parse(data).roomData).length !== 0) {
        setKey(data)
      }
    } catch (e) {
      console.warn(e)
    }

  }, [data])

  let fileReader;

  const success = () => {
    Notifications.setMessage('File uploaded!');
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
  }

  const error = () => {
    Notifications.setMessage('File failed to upload, check your console for details');
    Notifications.setSeverity('error');
    Notifications.setOpen(true)
  }

  const handleFileRead = (e) => {
    const content = fileReader.result;
    setKey(content)
    success()
    importKeys(content)
  };

  const importKeyFile = (e) => {
    try {
      const file = e.target.files[0];
      fileReader = new FileReader();
      fileReader.onloadend = handleFileRead;
      fileReader.readAsText(file);
    } catch (e) {
      console.log(e)
      error()
    }
  }

  const importKeys = async (content) => {
    try {
      await sbContext.importKeys(content ? JSON.parse(content) : JSON.parse(key))
      Notifications.setMessage('Key file imported!');
      Notifications.setSeverity('success');
      Notifications.setOpen(true)
      if (typeof props.onDone === 'function') {
        props.onDone()
      }
    } catch (error) {
      console.log(key)
      console.log(error)
      Notifications.setMessage('Key file failed to import, check your console for details');
      Notifications.setSeverity('error');
      Notifications.setOpen(true)
    }
  }

  return (
    <Grid id="key_import"
      spacing={2}
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start">

      <Grid xs={12} item>
        <StyledButton
          variant="contained"
          component="label"
        >
          Upload File
          <input
            onChange={importKeyFile}
            type="file"
            hidden
          />
        </StyledButton>
      </Grid>
      <Grid xs={12} item>
        <Typography variant={'body1'} gutterBottom><Trans id='key import paste message'>Or paste the keys you want to import</Trans></Typography>
      </Grid>
      <Grid xs={12} item>
        <TextField
          id="key_import_ta"
          placeholder="Select a file or paste json"
          fullWidth
          multiline
          rows={10}
          value={key}
          onChange={(e) => {
            try {
              if (Object.keys(JSON.parse(e.target.value).roomData).length !== 0) {
                setData(e.target.value)
              }
            } catch (e) {
              console.warn(e)
              setKey('')
            }

          }}
        />
      </Grid>
      <Grid xs={12} item>
        <StyledButton variant="contained" onClick={importKeys}><Trans id='key import header'>Import Keys</Trans></StyledButton>
      </Grid>

    </Grid>
  )
})

export default ImportRoomKeys
