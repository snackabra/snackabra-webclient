import React from "react"
import { observer } from "mobx-react"
import { Trans } from "@lingui/macro";
import { FormControl, Grid, IconButton, InputAdornment, InputLabel, OutlinedInput, Typography } from "@mui/material";
import {Download as DownloadIcon, ContentCopy} from '@mui/icons-material';
import SnackabraContext from "../../contexts/SnackabraContext.js";
import NotificationContext from "../../contexts/NotificationContext.js";

const ExportRoomKeys = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = React.useContext(NotificationContext)
  const [fileName, setFilename] = React.useState('SnackabraData');
  const [data, setData] = React.useState(JSON.stringify({}));

  React.useEffect(() => {
    const parseData = async () => {
      const metadata = { roomData: {}, contacts: sbContext.contacts, roomMetadata: {} }
      const rooms = await sbContext.channels
      console.log(rooms)
      for (let x in rooms) {
        let roomId = rooms[x].id
        metadata.roomData[roomId] = {
          key: rooms[roomId].key,
          lastSeenMessage: rooms[roomId].lastSeenMessage
        }
        console.log(rooms[roomId])
        metadata.roomMetadata[roomId] = {
          alias: rooms[roomId].alias,
          lastMessageTime: rooms[roomId].lastMessageTime,
          unread: false
        }
      }
      metadata.pem = false;
      console.log(metadata)
      setData(JSON.stringify(metadata, null, 2))
    }
    parseData()
  }, [sbContext])



  const downloadKeys = () => {
    downloadFile(data, fileName + ".txt");
  }

  const downloadFile = (text, file) => {
    try {
      let element = document.createElement('a');
      element.setAttribute('href', 'data:text/plain;charset=utf-8, ' + encodeURIComponent(text));
      element.setAttribute('download', file);
      document.body.appendChild(element);
      element.click();
      document.body.removeChild(element);
    } catch (error) {
      console.log(error);
    }
  }

  const copy = async () => {
    console.log(window.location)
    if ('clipboard' in navigator) {
      await navigator.clipboard.writeText(data);
    } else {
      document.execCommand('copy', true, data);
    }
    Notifications.setMessage('Keys copied to clipboard!');
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
    if (typeof props.onDone === 'function') {
      props.onDone()
    }

  }

  return (
    <Grid id="key_export"
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start">

      {data
        ? <Grid spacing={2}
          container
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start">
          <Grid xs={12} item>
            <label htmlFor='keyFile_name' style={{ fontSize: "16px" }}><Trans id='key export filename label'>Enter filename you want to save as</Trans></label>
          </Grid>
          <Grid xs={12} item>
            <FormControl sx={{ width: '25ch' }} variant="outlined">
              <InputLabel htmlFor="outlined-adornment-download">File Name</InputLabel>
              <OutlinedInput
                id="outlined-adornment-download"
                type={'text'}
                value={fileName}
                onChange={(e) => {
                  setFilename(e.target.value)
                }}
                endAdornment={
                  <InputAdornment position="end">
                    <IconButton
                      aria-label="download file"
                      onClick={downloadKeys}
                      edge="end"
                    >
                      <DownloadIcon />
                    </IconButton>
                  </InputAdornment>
                }
                label="File Name"
              />
            </FormControl>
          </Grid>
          {/* <Grid xs={12} item>
            <StyledButton variant="contained" onClick={togglePem}>{`Convert to ${asPem ? "JWK" : "PEM"}`}</StyledButton>
          </Grid> */}
          <Grid xs={12} item>
            <Typography variant={'body1'} gutterBottom><Trans id='copy paste ls message'>You can also copy-paste the following:</Trans></Typography>
          </Grid>
          <Grid xs={12} item>
            <OutlinedInput
              id="key_import_ta"
              fullWidth
              multiline
              rows={10}
              value={data}
              endAdornment={
                <InputAdornment
                  style={{
                    position: 'absolute',
                    right: 25,
                    top: 35
                  }}
                  position="end">
                  <IconButton
                    aria-label="copy key text"
                    onClick={copy}
                    edge="end"
                  >
                    <ContentCopy />
                  </IconButton>
                </InputAdornment>
              }
            />
          </Grid>

        </Grid>
        : <Typography variant={'body1'} gutterBottom><Trans id='key export ls empty message'>Your localstorage does not have any data to export!</Trans></Typography>}
    </Grid>
  )
})

export default ExportRoomKeys
