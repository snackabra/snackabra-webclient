import * as React from "react"
import { Trans } from "@lingui/macro";
import { FormControl, Grid, IconButton, InputAdornment, InputLabel, OutlinedInput, TextField, Typography } from "@mui/material";
import DownloadIcon from '@mui/icons-material/Download';
import { StyledButton } from "../../styles/Buttons";
import { useState } from "react"
import * as utils from '../../utils/utils';
import {observer} from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";


//TODO: optimize this component it is slowing down the loading of the homepage
const ExportRoomKeys = observer(() => {
  const sbContext = React.useContext(SnackabraContext);
  const [fileName, setFilename] = useState('SnackabraData');
  const getData = (pem) => {
    return { roomData: sbContext.rooms, contacts: sbContext.contacts, roomMetadata: sbContext.rooms, pem: pem }
  }

  const exportPemKeys = async () => {
    const _rooms = {};
    console.log(localStorage)
    for (let key of Object.keys(localStorage)) {
      if (key !== 'rooms' && key !== 'contacts') {
        const _roomName = key.slice(0, 64);
        const _type = key.length > 64 ? key.slice(65) : 'key';
        _rooms[_roomName] = { ..._rooms[_roomName] };
        if (_type === 'key') {
          _rooms[_roomName][_type] = await exportPrivateCryptoKey(
            await window.crypto.subtle.importKey("jwk", JSON.parse(localStorage.getItem(key)), { name: 'ECDH', namedCurve: 'P-384' }, true, ["deriveKey"])
          );
        } else {
          _rooms[_roomName][_type] = localStorage.getItem(key);
        }
      }
    }
    if (document.getElementById("key_export_ta") !== null) {
      document.getElementById("key_export_ta").value = JSON.stringify(getData(true), undefined, 2)
    }
  }

  const exportPrivateCryptoKey = async (key) => {
    const exported = await window.crypto.subtle.exportKey(
      "pkcs8",
      key
    );
    const exportedAsString = utils.ab2str(exported);
    const exportedAsBase64 = utils.partition(window.btoa(exportedAsString), 64).join('\n');
    return `-----BEGIN PRIVATE KEY-----\n${exportedAsBase64}\n-----END PRIVATE KEY-----`;
  }

  return (
    <Grid id="key_export"
          container
          direction="row"
          justifyContent="flex-start"
          alignItems="flex-start">

      {Object.keys(sbContext.rooms).length > 0
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
                      onClick={() => utils.downloadFile(JSON.stringify(getData(false)), fileName + '.txt')}
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
          <Grid xs={12} item>
            <StyledButton variant="contained" onClick={() => exportPemKeys()}><Trans id='Convert to PEM button'>Convert to PEM</Trans></StyledButton>
          </Grid>
          <Grid xs={12} item>
            <Typography variant={'body1'} gutterBottom><Trans id='copy paste ls message'>You can also copy-paste the following:</Trans></Typography>
          </Grid>
          <Grid xs={12} item>
            <TextField
              id="key_import_ta"
              fullWidth
              multiline
              rows={10}
              value={JSON.stringify(getData(false), undefined, 2)}
            />
          </Grid>

        </Grid>
        : <Typography variant={'body1'} gutterBottom><Trans id='key export ls empty message'>Your localstorage does not have any data to export!</Trans></Typography>}
    </Grid>
  )
})

export default ExportRoomKeys
