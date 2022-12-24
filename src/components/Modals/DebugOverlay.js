import * as React from 'react';
import Dialog from '@mui/material/Dialog';
import AppBar from '@mui/material/AppBar';
import Toolbar from '@mui/material/Toolbar';
import IconButton from '@mui/material/IconButton';
import CloseIcon from '@mui/icons-material/Close';
import Slide from '@mui/material/Slide';
import DialogContent from "@mui/material/DialogContent";
import Grid from "@mui/material/Grid";
import LogContext from "../../contexts/LogContext";
import { Divider } from "@mui/material";

const Transition = React.forwardRef(function Transition(props, ref) {
  return <Slide direction="up" ref={ref} {...props} />;
});

export default function DebugOverlay(props) {
  const debug = React.useContext(LogContext)

  return (
    <div>
      <Dialog
        fullScreen
        open={props.open}
        onClose={props.onClose}
        TransitionComponent={Transition}
      >
        <AppBar sx={{ position: 'relative', backgroundColor: 'black', textTransform: 'none' }}>
          <Toolbar>
            <Grid
              container
              direction="row"
              justifyContent="space-between"
              alignItems="center"
            >
              <IconButton
                edge="end"
                color="inherit"
                onClick={props.onClose}
                aria-label="close"
              >
                <CloseIcon />
              </IconButton>
            </Grid>
          </Toolbar>
        </AppBar>
        <DialogContent sx={{ p: 0, backgroundColor: '#3d3d3d' }}>
          {debug.logs.map((item, index) => {
            return (
              <pre key={index} style={{ padding: '0px 64px', whiteSpace: 'break-spaces' }}>
                {item}
                <Divider />
            </pre>
            )
          })

          }
        </DialogContent>
      </Dialog>
    </div>
  );
}
