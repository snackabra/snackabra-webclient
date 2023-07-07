import * as React from "react"
import Grid from '@mui/material/Grid';
import RoomDataTable from "./RoomDataTable"
import { observer } from "mobx-react"
import SnackabraContext from "../../contexts/SnackabraContext";
import NotificationContext from "../../contexts/NotificationContext";
import { downloadFile } from "../../utils/misc"

const DownloadRoomData = observer(() => {
    const sbContext = React.useContext(SnackabraContext);
    const notify = React.useContext(NotificationContext);
    const [channelList, setChannelList] = React.useState([]);

    const getRoomData = React.useCallback(async (roomId, onSuccess, onError) => {
        try {
            const room = sbContext.channels[roomId]
            room.downloadData(roomId, room.key).then((data) => {
                downloadFile(btoa(JSON.stringify(data.channel, null, 2)), room.alias + "_data.txt", 'text/plain;charset=utf-8')
                onSuccess(roomId + 'room')
            }).catch((e) => {
                console.error(e)
                notify.error('Error downloading file')
            })
        } catch (e) {
            console.error(e)
            notify.error('Error downloading file')
        }

    }, [notify, sbContext])

    const getRoomStorage = React.useCallback(async (roomId, onSuccess, onError) => {
        try {
            const room = sbContext.channels[roomId]
            room.downloadData(roomId, room.key).then((data) => {
                downloadFile(btoa(JSON.stringify(data.storage, null, 2)), room.alias + "_shards.txt", 'text/plain;charset=utf-8')
                onSuccess(roomId + 'shard')
            }).catch((e) => {
                console.error(e)
                notify.error('Error downloading file')
            })
        } catch (e) {
            console.error(e)
            notify.error('Error downloading file')
        }

    }, [notify, sbContext])

    React.useEffect(() => {
        let _c = []
        for (let x in sbContext.channels) {
            _c.push({ name: sbContext.channels[x].name, type: 'room', _id: sbContext.channels[x]._id, action: getRoomData })
            _c.push({ name: sbContext.channels[x].name, type: 'shard', _id: sbContext.channels[x]._id, action: getRoomStorage })
        }
        setChannelList(_c)
    }, [getRoomData, getRoomStorage, sbContext.channels])

    return (
        <Grid id="sb_room_data"
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
        >
            <RoomDataTable items={channelList ? channelList : []} />
        </Grid>
    )
})

export default DownloadRoomData
