import * as React from 'react';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import { observer } from 'mobx-react';
import SnackabraContext from "../../contexts/SnackabraContext";

const ConnectionStatus = observer((props) => {
    const sbContext = React.useContext(SnackabraContext)
    const channel = sbContext.channels[props.roomId];
    const [status, setStatus] = React.useState('error')
    const [statusMessage, setStatusMessage] = React.useState('CLOSED')

    React.useEffect(() => {
        let iterator
        if (iterator) {
            clearInterval(iterator)
        }

        document.addEventListener('visibilitychange', () => {
            setStatusMessage(channel.status)
          });
    }, [channel.status])

    React.useEffect(() => {
        console.log('channel.status', channel.status)
        switch (channel.status) {
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

    }, [channel.status])

    const reload = (e) => {
        e.stopPropagation()
        window.location.reload();
    }

    return (
        <>
            {status !== 'error' ?
                <>
                    <Badge
                        sx={{ position: 'absolute', top: 8, right: 8 }}
                        badgeContent=""
                        color={status}
                        variant="dot"
                    />
                    <Tooltip title={`Connection Status (${statusMessage})`}>

                        {props.children}
                    </Tooltip>
                </>
                :
                <Tooltip title={`Connection Status (${sbContext.status || 'CLOSED'})`}>
                    <RefreshIcon onClick={reload} color="error" />
                </Tooltip>

            }

        </>
    );
})

export default ConnectionStatus