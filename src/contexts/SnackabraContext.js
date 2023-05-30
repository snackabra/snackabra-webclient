import * as React from "react"
import SnackabraStore from "../stores/Snackabra.Store"

const SnackabraContext = React.createContext(undefined);

export class SnackabraProvider extends React.Component {
  state = {
    sbContext: {},
    ready: false
  }

  componentDidMount() {
    const sbContext = new SnackabraStore(this.props.config)
    sbContext.ready.then(() => {
      this.setState({ sbContext: sbContext, ready: true }, () => {
        console.log("SB Store is ready")
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