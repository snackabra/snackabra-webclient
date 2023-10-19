import * as React from 'react';
import { observer } from 'mobx-react';
import { Badge, Tooltip, CircularProgress } from '@mui/material';
import { Refresh as RefreshIcon } from '@mui/icons-material';
import SnackabraContext from "../../contexts/SnackabraContext.js";

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
            case 'LOADING':
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
                channel.status !== 'LOADING' ?
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
                    : <CircularProgress size={24} />
                :
                <Tooltip title={`Connection Status (${channel.status || 'CLOSED'})`}>
                    <RefreshIcon onClick={reload} color="error" />
                </Tooltip>

            }

        </>
    );
})

export default ConnectionStatus