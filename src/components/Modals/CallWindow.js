import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid } from "@mui/material";
import VoipContext, { VoipComponent } from '../../contexts/Voip/VoipContext';
import SnackabraContext from "../../contexts/SnackabraContext";

const CallWindow = (props) => {

    const voipContext = React.useContext(VoipContext)
    const sbContext = React.useContext(SnackabraContext);
    const [open, setOpen] = React.useState(props.open);

    React.useEffect(() => {
        setOpen(props.open)
        if (props.open) {
            voipContext.sbContext = sbContext
            voipContext.initVideoCallClick(props.keys, props.room)
        }
    }, [props.keys, props.open, props.room, sbContext, voipContext])

    const closeCallWindow = () => {
        if (voipContext.state.connected) {
            voipContext.toggleMuteAudio()
            voipContext.toggleMuteVideo()
            setTimeout(() => {
                voipContext.hangupClick()
            }, 1000)
        }
        props.onClose()
    }

    return (
        <ResponsiveDialog
            title={'VOIP'}
            onClose={closeCallWindow}
            open={open}
            fullScreen>
            <Grid container
                direction="row"
                justifyContent="flex-start"
                alignItems="flex-start">
                <Grid item xs={12}>
                    <VoipComponent closeCallWindow={closeCallWindow}/>
                </Grid>
            </Grid>
        </ResponsiveDialog>
    )
}

export default CallWindow;

