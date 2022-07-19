const config = {
  ROOM_SERVER: "https://" + process.env.REACT_APP_ROOM_SERVER + "/api/room/",
  ROOM_API: "https://" + process.env.REACT_APP_ROOM_SERVER + "/api",
  ROOM_SERVER_WS: "wss://" + process.env.REACT_APP_ROOM_SERVER + "/api/room/",
  STORAGE_SERVER: "https://" + process.env.REACT_APP_STORAGE_SERVER + "/api/v1"
}

export default config;
