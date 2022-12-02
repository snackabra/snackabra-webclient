import * as React from 'react';
import Badge from '@mui/material/Badge';
import Tooltip from '@mui/material/Tooltip';
import RefreshIcon from '@mui/icons-material/Refresh';
import IconButton from '@mui/material/IconButton';

const ConnectionStatus = (props) => {
    const [status, setStatus] = React.useState('error')
    React.useEffect(() => {
        switch (props.socket?.status) {
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
    }, [props])

    const reload = () =>{
        window.location.reload();
    }

    return (
        <>
            {status !== 'error' ?
                <Tooltip title={`Connection Status (${props.socket?.status})`}>
                    <Badge
                        sx={{ pl: 2 }}
                        badgeContent=""
                        color={status}
                        variant="solid"
                    />
                </Tooltip>
                :
                <Tooltip title={`Connection Status (${props.socket?.status})`}>
                    <IconButton onClick={reload} aria-label="reload" color="secondary" >
                        <RefreshIcon color="error" />
                    </IconButton>
                </Tooltip>

            }

        </>
    );
}

export default ConnectionStatus