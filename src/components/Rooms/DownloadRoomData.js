import * as React from "react"
import Grid from '@mui/material/Grid';
import RoomDataTable from "./RoomDataTable"
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";
import NotificationContext from "../../contexts/NotificationContext";

const DownloadRoomData = observer(() => {
    const sbContext = React.useContext(SnackabraContext);
    const notify = React.useContext(NotificationContext);
    const [channelList, setChannelList] = React.useState([]);

    const getRoomData = React.useCallback(async (roomId, onSuccess, onError) => {
        const room = await sbContext.getChannel(roomId)
        sbContext.downloadRoomData(roomId, room.key).then((data) => {
            delete data.channel.SERVER_SECRET
            downloadFile(JSON.stringify(data.channel), sbContext.rooms[roomId].name + "_data.txt");
            onSuccess(roomId+'room')
        }).catch((e) => {
            console.error(e)
            notify.error(e.message)
            onError(roomId+'room')

        })
    }, [notify, sbContext])

    const getRoomStorage = React.useCallback(async (roomId, onSuccess, onError) => {
        const room = await sbContext.getChannel(roomId)
        sbContext.downloadRoomData(roomId, room.key).then((data) => {
            downloadFile(JSON.stringify(data.storage), sbContext.rooms[roomId].name + "_shards.txt")
            onSuccess(roomId+'shard')
        }).catch((e) => {
            console.error(e)
            notify.error(e.message)
            onError(roomId+'shard')

        })
    }, [notify, sbContext])

    React.useEffect(() => {
        let _c = []
        for (let x in sbContext.channels) {
            _c.push({ name: sbContext.channels[x].name, type: 'room', _id: sbContext.channels[x]._id, action: getRoomData })
            _c.push({ name: sbContext.channels[x].name, type: 'shard', _id: sbContext.channels[x]._id, action: getRoomStorage })
        }
        setChannelList(_c)
    }, [getRoomData, getRoomStorage, sbContext.channels])

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
