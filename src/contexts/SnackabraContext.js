import * as React from "react"
import SnackabraStore from "../stores/Snackabra.Store"

// React context for the SB object
const SnackabraContext = React.createContext(undefined);

export class SnackabraProvider extends React.Component {
  state = {
    sbContext: {}, // the reference to mobx store
    ready: false
  }

  componentDidMount() {
    // this is the one global SB object for the app
    const sbContext = new SnackabraStore(this.props.config)
    sbContext.ready.then(() => {
      this.setState({ sbContext: sbContext, ready: true }, () => {
        console.log("==== SB (Context) Store is ready")
      })
    })
  }

  render() {
    return (<>
      {
        this.state.ready ?
          <SnackabraContext.Provider value={this.state.sbContext}>
            {this.props.children}
          </SnackabraContext.Provider>
          : null
      }
    </>)

  }

};

export default SnackabraContext;