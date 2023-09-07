import * as React from "react"
import ResponsiveDialog from "../ResponsiveDialog";
import { Grid, Typography } from "@mui/material";
import { StyledButton } from "../../styles/Buttons";
import VoipContext, { VoipComponent } from '../../contexts/Voip/VoipContext';
import SnackabraContext from "../../contexts/SnackabraContext";

const CallWindow = (props) => {

    const voipContext = React.useContext(VoipContext)
    const sbContext = React.useContext(SnackabraContext);
    const [open, setOpen] = React.useState(props.open);

    React.useEffect(() => {
        setOpen(props.open)
        if(props.open){
            voipContext.sbContext = sbContext
            voipContext.initVideoCallClick(props.keys,props.room)
        }
    }, [props.keys, props.open, props.room, sbContext, voipContext])

    return (
        <ResponsiveDialog
            title={'VOIP'}
            onClose={() => props.onClose()}
            open={open}>
            <Grid container
                direction="row"
                justifyContent="flex-start"
                alignItems="flex-start">
                <Grid item xs={12}>
                    <VoipComponent />
                </Grid>
            </Grid>
        </ResponsiveDialog>
    )
}

export default CallWindow;

