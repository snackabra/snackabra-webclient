import * as React from "react"
import Grid from '@mui/material/Grid';
import DownloadIcon from '@mui/icons-material/Download';
import { StyledButton } from "../../styles/Buttons";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";

const DownloadRoomData = observer(() => {
    const sbContext = React.useContext(SnackabraContext);


    const getRoomData = (roomId) => {
        sbContext.downloadRoomData().then((data) => {
            delete data.channel.SERVER_SECRET
            downloadFile(JSON.stringify(data.channel), sbContext.rooms[roomId].name + "_data.txt");
        })
    }

    const getRoomStorage = (roomId) => {
        sbContext.downloadRoomData().then((data) => {
            downloadFile(JSON.stringify(data.storage), sbContext.rooms[roomId].name + "_storage.txt")
        })
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


    return (
        <Grid id="sb_room_data"
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            >
            {Object.keys(sbContext.rooms).map((room) => {
                return <Grid item key={room}>
                    <StyledButton 
                    sx={{mr: 1}}
                    onClick={()=>{
                        getRoomData(room)
                    }}
                    variant="contained" 
                    endIcon={<DownloadIcon />}>
                        {sbContext.rooms[room].name} Channel
                    </StyledButton>
                    <StyledButton 
                    sx={{mr: 1}}
                    onClick={()=>{
                        getRoomStorage(room)
                    }}
                    variant="contained" 
                    endIcon={<DownloadIcon />}>
                        {sbContext.rooms[room].name} Shards
                    </StyledButton>
                </Grid>
            })

            }

        </Grid>
    )
})

export default DownloadRoomData
