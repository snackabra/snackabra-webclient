import * as React from "react"


const NavBarActionContext = React.createContext(undefined);


export class NavBarActionProvider  extends React.Component{
  state = {
    menuOpen: false
  }

  setMenuOpen = (state) => {
    this.setState({ menuOpen: state })
  }

  render = () => {
    return (<NavBarActionContext.Provider value={{ ...this }}>{this.props.children} </NavBarActionContext.Provider>)
  }

}

export default NavBarActionContext;

