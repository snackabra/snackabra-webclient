import * as React from "react"
import { Trans } from "@lingui/macro";
import { TextField, Grid, IconButton, InputAdornment, Checkbox, OutlinedInput, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import { useState, useContext } from "react"
import NotificationContext from "../../contexts/NotificationContext";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";

const ImportRoomKeys = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const Notifications = useContext(NotificationContext)
  const [key, setKey] = useState('');
  const [data, setData] = useState(false);
  const [existing, setExisting] = useState({});
  const [toSave, setToSave] = useState({ roomData: {}, contacts: {}, roomMetadata: {} });
  const [toMerge, setToMerge] = useState({});
  const [selected, setSelected] = useState([]);

  React.useEffect(() => {
    if (data) {
      try {
        if (Object.keys(JSON.parse(data).roomData).length !== 0) {
          setKey(data)
        }
      } catch (e) {
        console.warn(e)
      }

    }
  }, [data])

  React.useEffect(() => {
    const metadata = { roomData: {}, contacts: {}, roomMetadata: {} }
    sbContext.getAllChannels().then((rooms) => {
      for (let x in rooms) {
        let roomId = rooms[x].id
        metadata.roomData[roomId] = {
          key: rooms[roomId].key,
          lastSeenMessage: rooms[roomId].lastSeenMessage
        }
        metadata.contacts = Object.assign(rooms[roomId].contacts, metadata.contacts)
        metadata.roomMetadata[roomId] = {
          name: rooms[roomId].name,
          lastMessageTime: rooms[roomId].lastMessageTime,
          unread: false
        }
      }
      metadata.pem = false;
      console.log(metadata)
      setExisting(metadata)
    })

  }, [])

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
      const merge = []
      const s = []
      const newKeyData = content ? JSON.parse(content) : JSON.parse(key);
      console.log(JSON.stringify(newKeyData))
      const existingRooms = Object.keys(existing?.roomData)
      if (existingRooms) {
        console.log(existingRooms)
        for (let r in existingRooms) {
          if (typeof newKeyData.roomData[existingRooms[r]] !== 'undefined') {
            const hash = existingRooms[r];
            merge.push({
              0: {
                roomData: {
                  [`${hash}`]: existing.roomData[hash]
                },
                roomMetadata: {
                  [`${hash}`]: existing.roomMetadata[hash]
                }
              },
              1: {
                roomData: {
                  [`${hash}`]: newKeyData.roomData[hash]
                },
                roomMetadata: {
                  [`${hash}`]: newKeyData.roomMetadata[hash]
                }
              }
            })
            s.push({ selected: 0 })
            delete newKeyData.roomData[hash]
            delete newKeyData.roomMetadata[hash]

          }
        }
      }
      if (merge.length > 0) {
        setToMerge(merge)
        setSelected(s)
        const roomData = Object.keys(newKeyData.roomData)
        console.log(roomData)
        console.log(Object.assign(existing.contacts, newKeyData.contacts))
        newKeyData.contacts = Object.assign(newKeyData.contacts, existing.contacts)
        setToSave(newKeyData)
      } else {
        await sbContext.importKeys(content ? JSON.parse(content) : JSON.parse(key))
        Notifications.setMessage('Key file imported!');
        Notifications.setSeverity('success');
        Notifications.setOpen(true)
        if (typeof props.onDone === 'function') {
          props.onDone()
        }
      }

    } catch (error) {
      console.log(content)
      console.log(key)
      console.log(error)
      Notifications.setMessage('Key file failed to import, check your console for details');
      Notifications.setSeverity('error');
      Notifications.setOpen(true)
    }
  }

  const setItemSelected = (index, item) => {
    const s = selected;
    s[index].selected = item
    console.log(s)
    setSelected(s)
    const tm = toMerge;
    setToMerge({})
    setTimeout(() => {
      setToMerge(tm)
    }, 1)

  }

  const saveConflicts = () => {
    console.log(toSave)
    console.log(toMerge)
    const saving = toSave;
    for (let x in selected) {
      saving.roomData = Object.assign(saving.roomData, toMerge[x][selected[x].selected].roomData)
      saving.roomMetadata = Object.assign(saving.roomMetadata, toMerge[x][selected[x].selected].roomMetadata)
    }
    sbContext.importKeys(saving).then(()=>{
      Notifications.setMessage('Key file imported!');
      Notifications.setSeverity('success');
      Notifications.setOpen(true)
      if (typeof props.onDone === 'function') {
        props.onDone()
      }
    }).catch((e)=>{
      console.error(e)
      Notifications.setMessage(e.message);
      Notifications.setSeverity('error');
      Notifications.setOpen(true)
    })

  }

  console.log(toMerge)
  return (
    <Grid id="key_import"
      spacing={2}
      container
      direction="row"
      justifyContent="flex-start"
      alignItems="flex-start">
      {Object.keys(toMerge).length === 0 ?
        <>

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
            <StyledButton variant="contained" onClick={() => { importKeys() }}><Trans id='key import header'>Import Keys</Trans></StyledButton>
          </Grid>

        </> :
        <Grid
          container
          direction="row"
          justifyContent="center"
          alignItems="flex-start"
          xs={12}
          sx={{ mt: 2, p: 1 }}
        >
          <Grid xs={12} item>
            <Typography color={'error'} variant="h5">Key Conflicts</Typography>
            <Typography color={'error'} variant="body1">Select the keys you would like to keep for each conflict</Typography>
          </Grid>
          <Grid xs={6} item>
            <Typography variant="h6">Existing Key</Typography>
          </Grid>
          <Grid xs={6} sx={{ pl: 1 }} item>
            <Typography variant="h6">Imported Key</Typography>
          </Grid>

          {toMerge.map((_m_item, index) => {
            console.log(_m_item, selected)
            return (<Grid
              container
              direction="row"
              justifyContent="center"
              alignItems="flex-start"
              xs={12}
              key={index}
            >
              <Grid xs={6} sx={{ pr: 1 }} item>
                <OutlinedInput
                  id="key_import_ta"
                  fullWidth
                  multiline
                  rows={10}
                  value={JSON.stringify(_m_item[0], null, 2)}
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
                        onClick={() => { setItemSelected(index, 0) }}
                        edge="end"
                      >
                        <Checkbox checked={selected[index].selected === 0} />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </Grid>
              <Grid xs={6} sx={{ pl: 1 }} item>
                <OutlinedInput
                  id="key_import_ta"
                  fullWidth
                  multiline
                  rows={10}
                  value={JSON.stringify(_m_item[1], null, 2)}
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
                        onClick={() => { setItemSelected(index, 1) }}
                        edge="end"
                      >
                        <Checkbox checked={selected[index].selected === 1} />
                      </IconButton>
                    </InputAdornment>
                  }
                />
              </Grid>
            </Grid>)

          })

          }
          <Grid xs={12} sx={{ pt: 1 }} item>
            <StyledButton variant="contained" onClick={() => { saveConflicts() }}>Submit</StyledButton>
          </Grid>
        </Grid>
      }
    </Grid>
  )
})

export default ImportRoomKeys