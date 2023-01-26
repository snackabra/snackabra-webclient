import * as React from 'react';
import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import { green, red } from '@mui/material/colors';
import Fab from '@mui/material/Fab';
import CheckIcon from '@mui/icons-material/Check';
import ClearIcon from '@mui/icons-material/Clear';

export default function DownloadButton(props) {
    const { ButtonComponent, action, id } = props
    const [loading, setLoading] = React.useState(false);
    const [success, setSuccess] = React.useState(false);
    const [errored, setErrored] = React.useState(false);

    const onError = () => {
        setErrored(true)
        setLoading(false);
        setTimeout(() => {
            setSuccess(false);
            setErrored(false);
        }, 1500);
    }


    const onSuccess = () => {
        setSuccess(true)
        setLoading(false);
        setTimeout(() => {
            setSuccess(false);
            setErrored(false);
        }, 1500);
    }

    const buttonSx = {
        ...(success && {
            bgcolor: green[500],
            '&:hover': {
                bgcolor: green[700],
            },
        }),
        ...(errored && {
            bgcolor: red[500],
            '&:hover': {
                bgcolor: red[700],
            },
        }),
    };

    const fabSx = {
        ...((!props.size || props.size === 'large') && {
            size: 68,
            color: errored ? red[500] : green[500],
            position: 'absolute',
            top: -6,
            left: -6,
            zIndex: 1,
        }),
        ...((props.size && props.size === 'medium') && {
            size: 58,
            color: errored ? red[500] : green[500],
            position: 'absolute',
            top: -5,
            left: -5,
            zIndex: 1,
        }),
        ...((props.size && props.size === 'small') && {
            size: 48,
            color: errored ? red[500] : green[500],
            position: 'absolute',
            top: -4,
            left: -4,
            zIndex: 1,
        }),
    }

    const handleButtonClick = () => {
        if (!loading) {
            setLoading(true)
            action(id, onSuccess, onError)
            // handleClick()
            // timer.current = window.setTimeout(() => {
            //     setSuccess(true);
            //     setLoading(false);
            // }, 20000);
        }
    };

    return (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
            <Box sx={{ m: 1, position: 'relative' }}>
                <Fab
                    aria-label="save"
                    color="background.paper"
                    size={props.size ? props.size : "large"}
                    sx={buttonSx}
                    onClick={handleButtonClick}
                >
                    {success ? <CheckIcon /> : errored ? <ClearIcon /> : <ButtonComponent />}
                </Fab>
                {loading && (
                    <CircularProgress
                        size={fabSx.size}
                        sx={fabSx}
                    />
                )}
            </Box>
        </Box>
    );
}