import * as React from "react"


const NotificationContext = React.createContext(undefined);


export const NotificationProvider = ({ children }) => {

  const [open, setOpen] = React.useState(false);
  const [severity, setSeverity] = React.useState("info");
  const [message, setMessage] = React.useState("");
  const [action, setAction] = React.useState("");
  const [autoHideDuration, setAutoHideDuration] = React.useState(6000);

  const error = (message) =>{
    setSeverity("error");
    setMessage(message)
    setOpen(true)
  }

  const info = (message) =>{
    setSeverity("info");
    setMessage(message)
    setOpen(true)
  }

  const warn = (message) =>{
    setSeverity("warning");
    setMessage(message)
    setOpen(true)
  }

  return (<NotificationContext.Provider value={{
    error,
    warn,
    info,
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

