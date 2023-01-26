import * as React from "react"
import { red } from '@mui/material/colors';
import BugReportIcon from "@mui/icons-material/BugReport";
import { Fab } from "@mui/material";
import DebugOverlay from "../components/Modals/DebugOverlay";
import NavBarActionContext from "./NotificationContext";
const LogContext = React.createContext(undefined);

let log = console.log;
let warn = console.warn;
let info = console.info;
let error = console.error;

const fabRedStyle = {
  color: 'common.white',
  position: 'absolute',
  bottom: 64,
  right: 16,
  bgcolor: red[500],
  '&:hover': {
    bgcolor: red[600],
  },
};

export const LogProvider = ({children }) => {
  const notify = React.useContext(NavBarActionContext)
  const [logs, setLogs] = React.useState([])
  const [enabled, setEnabled] = React.useState(false)
  const [open, setOpened] = React.useState(false)

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    const hasParam = (params.get('debug') === 'true' || params.get('debug') === '1' || params.get('debug') === 'on')
    if (hasParam) {
      setEnabled(true)


      console.log = function () {

        const args = Array.from(arguments);
        let stringified;
        if (typeof args === "object") {
          stringified = JSON.stringify(args)
        }
        logs.push(<span style={{ color: 'white' }}>{stringified ? stringified : args}</span>)
        setLogs(logs)
        log.apply(console, args);
      }
      console.warn = function () {

        const args = Array.from(arguments);
        let stringified;
        if (typeof args === "object") {
          stringified = JSON.stringify(args)
        }
        logs.push(<span style={{ color: 'orange' }}>{stringified ? stringified : args}</span>)
        setLogs(logs)
        warn.apply(console, args);
      }
      console.info = function () {

        const args = Array.from(arguments);
        let stringified;
        if (typeof args === "object") {
          stringified = JSON.stringify(args)
        }
        logs.push(<span style={{ color: 'white' }}>{stringified ? stringified : args}</span>)
        setLogs(logs)
        info.apply(console, args);
      }
      console.error = function () {

        const args = Array.from(arguments);
        let stringified;
        if (typeof args === "object") {
          stringified = JSON.stringify(args)
        }
        logs.push(<span style={{ color: 'darkred' }}>{stringified ? stringified : args}</span>)
        setLogs(logs)
        error.apply(console, args);
      }
    }
    if (process.env.REACT_APP_LOG_LEVEL && !hasParam) {
      const level = process.env.REACT_APP_LOG_LEVEL
      if (level === 'development') {
      }
      if (level === 'stage') {
        console.log = function () { }
        console.assert = function () { }
        console.count = function () { }
        console.debug = function () { }
        console.dir = function () { }
        console.dirxml = function () { }
        console.group = function () { }
        console.table = function () { }
        console.tine = function () { }
        console.timeEnd = function () { }
        console.timeLog = function () { }
        console.trace = function () { }
      }
      if (level === 'production') {
        console.log = function () { }
        console.warn = function () { }
        console.assert = function () { }
        console.count = function () { }
        console.debug = function () { }
        console.dir = function () { }
        console.dirxml = function () { }
        console.group = function () { }
        console.table = function () { }
        console.tine = function () { }
        console.timeEnd = function () { }
        console.timeLog = function () { }
        console.trace = function () { }
      }
      // Object.keys(window).forEach(key => {
      //   if (/./.test(key)) {
      //     window.addEventListener(key.slice(2), event => {
      //       console.log(key, event)
      //     })
      //   }
      // })

      window.onunhandledrejection = (error) =>{
        if(notify){
          console.log(notify)
          notify.setMessage("An uncaught exception has occured, view the console for details");
          notify.setSeverity("error");
          notify.setOpen(true)
          console.trace(error)
        }
        
      }

    }
  }, [])

  const toggleDebugger = () => {
    setOpened(!open)
  }

  return (
    <LogContext.Provider value={{ logs, enabled }}>
      {enabled ?
        <>
          <Fab onClick={toggleDebugger} sx={{ ...fabRedStyle }}>
            <BugReportIcon />
          </Fab>
          <DebugOverlay open={open} onClose={toggleDebugger} />
        </> : ''
      }
      {children}
    </LogContext.Provider>
  )
};

export default LogContext;

