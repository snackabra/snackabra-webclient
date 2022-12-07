import * as React from "react"
import NotificationContext from "./NotificationContext";
import * as serviceWorkerRegistration from "../serviceWorkerRegistration";
import IconButton from "@mui/material/IconButton";
import SystemUpdateIcon from "@mui/icons-material/SystemUpdate";
import { Typography } from "@mui/material";

const ServiceWorkerContext = React.createContext(undefined);

let registration, queue = {};
export const ServiceWorkerProvider = ({ children }) => {
  const Notifications = React.useContext(NotificationContext);

  React.useEffect(() => {
    serviceWorkerRegistration.register({
      onSuccess: reg => onSuccess(reg),
      onUpdate: reg => onUpdate(reg),
      onLoad: reg => onLoad(reg),
    });
  }, [])

  const onLoad = (reg) => {
    registration = reg;
    console.log('SW Loaded')
  }

  const onSuccess = (reg) => {
    registration = reg;
    Notifications.setMessage('Snackabra has successfully updated!!');
    Notifications.setSeverity('success');
    Notifications.setOpen(true)
  }

  const onUpdate = (reg) => {
    registration = reg;
    Notifications.setMessage(
      <Typography variant={'body1'}>Click to update!<IconButton
        edge="end"
        color="inherit"
        onClick={updateServiceWorker}
        aria-label="close"
      >
        <SystemUpdateIcon />
      </IconButton>
      </Typography>);
    Notifications.setSeverity('info');
    Notifications.setAutoHideDuration(null);
    Notifications.setOpen(true)
  }

  const updateServiceWorker = () => {
    registration.waiting.postMessage({ type: 'SKIP_WAITING' });

  };

  return (<ServiceWorkerContext.Provider value={{}}>{children} </ServiceWorkerContext.Provider>)
};

export default ServiceWorkerContext;
