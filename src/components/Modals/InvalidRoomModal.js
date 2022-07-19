import * as React from "react"

const InvalidRoomModal = () => {
  return (
    <div>
      <h2 style={{ textAlign: 'center' }}>You tried to open room {window.location.pathname.slice(1)} which is not a proper room name. Room names are always a 64 character b-64 string.</h2>
    </div>
  )
}

export default InvalidRoomModal;
