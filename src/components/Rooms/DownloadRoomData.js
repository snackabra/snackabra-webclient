import React from "react"
import { observer } from "mobx-react"
import {Grid} from '@mui/material';
import RoomDataTable from "./RoomDataTable.js"
import SnackabraContext from "../../contexts/SnackabraContext.js";
import NotificationContext from "../../contexts/NotificationContext.js";
import { downloadFile } from "../../utils/misc.js"


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
            const storage = []
            for (let i in room.messages) {
                const value = room.messages[i]
                console.warn("Received message: ", JSON.parse(JSON.stringify(value)))
                const message = JSON.parse(JSON.stringify(value))
                if (message.messageType === 'ac9ce10755b647849d8596011979e018') {
                    const content = JSON.parse(message.contents)
                    console.log(content);
                    if (content.hasOwnProperty('hash') && content.hasOwnProperty('handle')) {
                        console.log(`Key: ${i}, Value: `, content);
                        storage.push(content)
                    }
                }
            }
            room.downloadData(roomId, room.key).then((data) => {
                console.log("Room data: ", data)
                const fileData = {
                    target: data.storage.target,
                    shards: storage
                }
                downloadFile(btoa(JSON.stringify(fileData, null, 2)), room.alias + "_shards.txt", 'text/plain;charset=utf-8')
                onSuccess(roomId + 'shard')
            }).catch((e) => {
                console.error(e)
                notify.error('Error downloading file')
            })
        } catch (e) {
            console.error(e)
            notify.error('Error downloading file')
            onSuccess(roomId + 'shard')
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
