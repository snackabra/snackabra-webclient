import * as React from "react"


const SharedRoomStateContext = React.createContext(undefined);


export class SharedRoomStateProvider  extends React.Component{
  state = {
    openImageGallery: false,
    activeRoom: null
  }

  setActiveRoom = (roomId) => {
    this.setState({ activeRoom: roomId })
  }

  setOpenImageGallery = (state) => {
    this.setState({ openImageGallery: state })
  }

  render = () => {
    return (<SharedRoomStateContext.Provider value={{ ...this }}>{this.props.children} </SharedRoomStateContext.Provider>)
  }

}

export default SharedRoomStateContext;

