/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import * as React from "react"
import { useContext, useState } from 'react';
import { Trans } from '@lingui/macro';
import RoomContext from "../contexts/RoomContext";
import { Grid, Typography } from "@mui/material";
import Welcome from "../components/Welcome";
import RoomAdmin from "../components/Rooms/RoomAdmin";
import ImportRoomKeys from "../components/Rooms/ImportRoomKeys";
import ExportRoomKeys from "../components/Rooms/ExportRoomKeys";

const Home = (props) => {
  const roomContext = useContext(RoomContext)
  const [rooms, setRooms] = useState({ ...roomContext.rooms });
  const [renameRoom, setRenameRoom] = useState('');

  const rooms_found = roomContext.rooms !== null && Object.keys(roomContext.rooms).length > 0;

  return (
    <Grid container>


      <div className={"landingPage " + props.className}>
        <Welcome />
        <Grid xs={12} item>
          <Typography variant={'h3'} gutterBottom><Trans id='key export header'>Export Keys</Trans></Typography>
        </Grid>
        <ExportRoomKeys/>
        <Grid xs={12} item>
          <Typography variant={'h3'} gutterBottom><Trans id='key import header'>Import Keys</Trans></Typography>
        </Grid>
        <ImportRoomKeys/>
        <RoomAdmin/>
      </div>
    </Grid>
  )
}

export default Home;
