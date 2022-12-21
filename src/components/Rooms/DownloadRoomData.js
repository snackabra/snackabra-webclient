import * as React from "react"
import Grid from '@mui/material/Grid';
import InputIcon from '@mui/icons-material/Input';
import { StyledButton } from "../../styles/Buttons";
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";

const DownloadRoomData = observer(() => {
    const sbContext = React.useContext(SnackabraContext);


    const getRoomData = (roomId) => {
        sbContext.downloadRoomData().then((data) => {
            downloadFile(JSON.stringify(data.storage), sbContext.rooms[roomId].name + "_storage.txt")
            downloadFile(JSON.stringify(data.channel), sbContext.rooms[roomId].name + "_data.txt");
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
        <Grid id="key_export"
            container
            direction="row"
            justifyContent="flex-start"
            alignItems="flex-start"
            spacing={2}>
            {Object.keys(sbContext.rooms).map((room) => {
                return <Grid item key={room}>
                    <StyledButton
                        onClick={() => {
                            getRoomData(room)
                        }}
                        variant="contained"
                        endIcon={<InputIcon style={{
                            transform: 'rotate(90deg)'
                        }} />}>
                        {sbContext.rooms[room].name}
                    </StyledButton>
                </Grid>
            })

            }

        </Grid>
    )
})

export default DownloadRoomData
