import * as React from "react"
import { Trans } from "@lingui/macro";
import { Grid, TextField, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useContext } from "react"
import NotificationContext from "../../contexts/NotificationContext";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";
const SB = require("snackabra")

const ImportRoomKeys = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = useContext(NotificationContext)
  const [key, setKey] = useState('');
  const [data, setData] = useState(JSON.stringify({}));
  const [asPem, setAsPem] = useState(false);

  React.useEffect(() => {
    try{
      if(Object.keys(JSON.parse(data).roomData).length !== 0){
        setKey(data)
      }
    }catch(e){
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

  const importPem = (json) =>{
    setData(json);
    setAsPem(true)
  }

  const importKeys = async () =>{
    try {
      await sbContext.importKeys(asPem ? await parseData(key) : JSON.parse(key))
      Notifications.setMessage('Key file imported!');
      Notifications.setSeverity('success');
      Notifications.setOpen(true)
    } catch (error) {
      console.log(error)
      Notifications.setMessage('Key file failed to import, check your console for details');
      Notifications.setSeverity('error');
      Notifications.setOpen(true)
    }
  }
  const parseData = async (keyData) => {
    const metadata = JSON.parse(keyData)
    Object.keys(metadata.roomData).forEach(async (roomId)=> {
      metadata.roomData[roomId] = {
        key: await exportPrivateCryptoKey(metadata.roomData[roomId].key),
        lastSeenMessage: metadata.roomData[roomId].lastSeenMessage
      }
    })
    metadata.pem = false;
    return metadata
  }
  const exportPrivateCryptoKey = async (pem) => {
    const pemHeader = '-----BEGIN PUBLIC KEY-----';
    const pemFooter = '-----END PUBLIC KEY-----';
    const start = pem.indexOf(pemHeader);
    const end = pem.indexOf(pemFooter);
    const pemContents = pem.slice(start + pemHeader.length, end);
    const binaryDer = SB.base64ToArrayBuffer(pemContents.replace(/\n/, ''));
    return crypto.subtle.importKey('spki', binaryDer, { name: 'RSA-OAEP', hash: 'SHA-256' }, true, ['encrypt']);
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
            try{
              if(Object.keys(JSON.parse(e.target.value).roomData).length !== 0){
                if(!JSON.parse(e.target.value).pem){
                  setData(e.target.value)
                }else{
                  importPem(e.target.value)
                }
                
              }
            }catch(e){
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
