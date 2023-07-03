import * as React from 'react';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';
import { observer } from 'mobx-react';
import SnackabraContext from "../../contexts/SnackabraContext";

const ConnectionStatus = observer((props) => {
    const sbContext = React.useContext(SnackabraContext)
    const socketStatus = sbContext.channels[props.roomId].status;
    const [status, setStatus] = React.useState('error')
    React.useEffect(() => {
        // console.warn('sbContext.status', socketStatus)

        switch (socketStatus) {
            case 'CONNECTING':
                setStatus('warning')
                break;
            case 'OPEN':
                setStatus('success')
                break;
            case 'CLOSING':
                setStatus('warning')
                break;
            default:
                setStatus('error')
                break;
        }

    }, [props.roomId, socketStatus])

    const reload = () => {
        window.location.reload();
    }

    return (
        <>
            {status !== 'error' ?
                <Tooltip title={`Connection Status (${socketStatus})`}>
                    <Badge
                        sx={{ pl: 2 }}
                        badgeContent=""
                        color={status}
                        variant="solid"
                    />
                </Tooltip>
                :
                <Tooltip title={`Connection Status (${sbContext.status})`}>
                    <IconButton onClick={reload} aria-label="reload" color="secondary" >
                        <RefreshIcon color="error" />
                    </IconButton>
                </Tooltip>

            }

        </>
    );
})

export default ConnectionStatus