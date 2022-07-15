import * as React from "react"


const NotificationContext = React.createContext(undefined);


export const NotificationProvider = ({ children }) => {

  const [open, setOpen] = React.useState(false);
  const [severity, setSeverity] = React.useState("info");
  const [message, setMessage] = React.useState("");
  const [action, setAction] = React.useState("");
  const [autoHideDuration, setAutoHideDuration] = React.useState(6000);

  return (<NotificationContext.Provider value={{
    open,
    setOpen,
    severity,
    setSeverity,
    message,
    setMessage,
    action,
    setAction,
    autoHideDuration,
    setAutoHideDuration
  }}>{children} </NotificationContext.Provider>)
};

export default NotificationContext;

