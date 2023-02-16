import * as React from "react"


const SharedRoomStateContext = React.createContext(undefined);


export class SharedRoomStateProvider  extends React.Component{
  state = {
    openImageGallery: false
  }

  setOpenImageGallery = (state) => {
    this.setState({ openImageGallery: state })
  }

  render = () => {
    return (<SharedRoomStateContext.Provider value={{ ...this }}>{this.props.children} </SharedRoomStateContext.Provider>)
  }

}

export default SharedRoomStateContext;

