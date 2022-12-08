import * as React from "react"

const LogContext = React.createContext(undefined);

let log = console.log;
let warn = console.warn;
let info = console.info;
let error = console.error;


export const LogProvider = ({ children }) => {
  const [logs, setLogs] = React.useState([])
  const [enabled, setEnabled] = React.useState(false)

  React.useEffect(() => {
    const url = new URL(window.location.href);
    const params = new URLSearchParams(url.search);
    if (params.get('debug') === 'true') {


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
  }, [])

  return (
    <LogContext.Provider value={{ logs, enabled }}>
      {children}
    </LogContext.Provider>
  )
};

export default LogContext;

