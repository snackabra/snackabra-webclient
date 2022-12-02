import React from 'react'
import { Grid, Typography } from "@mui/material";
import { Bubble } from "react-native-gifted-chat";
const SB = require('snackabra')
const sbCrypto = new SB.SBCrypto();

const RenderBubble = (props) => {

  const [isVerifiedGuest, setVerifiedGuest] = React.useState(false)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [isMe, setMe] = React.useState(false)
  const [newProps, setNewProps] = React.useState({})


  React.useEffect(() => {
    let current_user_key = props.currentMessage.user._id !== 'system' ? JSON.parse(props.currentMessage.user._id) : {};
    const init = async () => {
      //TODO: this is breaking the server for some reason
      // const verified = await props.socket.api.postPubKey(current_user_key)
      setVerifiedGuest(true);
      setIsAdmin(sbCrypto.compareKeys(props.socket.exportable_owner_pubKey, current_user_key))
      setMe(sbCrypto.compareKeys(props.socket.exportable_pubKey, current_user_key))
    }
    init();
  }, [props.currentMessage.user._id, props.socket.api, props.socket.exportable_owner_pubKey, props.socket.exportable_pubKey])

  React.useEffect(() => {
    if (props.currentMessage.encrypted) {
      setNewProps({
        wrapperStyle: {
          left: {
            backgroundColor: "yellow",
          },
          right: {
            backgroundColor: "yellow",
          }
        },
        textStyle: {
          left: {
            fontStyle: "italic",
            color: "Black",
          },
          right: {
            fontStyle: "italic",
            color: "black",
          }
        }
      })
    } else if (!isAdmin && !isVerifiedGuest) {
      setNewProps({
        wrapperStyle: {
          left: {
            borderColor: "red",
            borderStyle: "solid",
            borderWidth: "4px",
          },
          right: {
            borderColor: "red",
            borderStyle: "solid",
            borderWidth: "4px",
          }
        }
      })
    } else if (props.currentMessage.info) {
      setNewProps({
        wrapperStyle: {
          left: {
            borderColor: "black",
            borderStyle: "solid",
            borderWidth: "2px",
          }
        },
        textStyle: {
          left: {
            fontStyle: "italic",
            color: "Black",
          },
        }
      })
    } else if (props.currentMessage._id.match(/^sending_/)) {
      setNewProps({
        wrapperStyle: {
          left: {
            borderColor: "gray",
            borderStyle: "solid",
            borderWidth: "4px",
          },
          right: {
            borderColor: "gray",
            borderStyle: "solid",
            borderWidth: "4px",
          }
        }
      })
    }
    // else if (props.currentMessage.user._id === JSON.stringify(state.keys.exportable_room_pubKey)) {
    else if (isAdmin) {
      setNewProps({
        wrapperStyle: {
          left: {
            borderColor: "#2ECC40",
            borderStyle: "solid",
            borderWidth: "4px",
          },
          right: {
            borderColor: "#2ECC40",
            borderStyle: "solid",
            borderWidth: "4px",
          }
        }
      })
    }
    //else if (props.currentMessage.user._id === JSON.stringify(state.keys.exportable_verifiedGuest_pubKey)) {
    else if (isVerifiedGuest) {
      setNewProps({
        wrapperStyle: {
          left: {
            borderColor: "#B10DC9",
            borderStyle: "solid",
            borderWidth: "4px",
          },
          right: {
            borderColor: "#B10DC9",
            borderStyle: "solid",
            borderWidth: "4px",
          }
        }
      })
    }
  }, [isVerifiedGuest, isAdmin, props.currentMessage.encrypted, props.currentMessage.info, props.currentMessage._id])


  const isSameDay = (currentMessage, diffMessage) => {
    if (!currentMessage || !diffMessage || (!currentMessage.createdAt && !diffMessage.createdAt)) {
      return false;
    }
    let currDt = new Date(currentMessage.createdAt);
    let diffDt = new Date(diffMessage.createdAt);
    return (currDt.getDate() - diffDt.getDate() === 0) && (currDt.getMonth() - diffDt.getMonth() === 0) && (currDt.getFullYear() - diffDt.getFullYear() === 0);
  }

  const isSameUser = (currentMessage, diffMessage) => {
    return (diffMessage &&
      diffMessage.user &&
      currentMessage &&
      currentMessage.user &&
      diffMessage.user._id === currentMessage.user._id);
  }
  if (isMe && props.currentMessage.sender_username === 'Unnamed') {
    props.currentMessage.user.name = 'Me'
    console.log('here')
  }
  return (
    <Grid style={{ width: '50%' }}>
      {(isSameUser(props.currentMessage, props.previousMessage) && isSameDay(props.currentMessage, props.previousMessage))
        ? ''
        : <Typography variant={'body1'} style={{
          width: '50vw',
          paddingBottom: 3,
          left: 0,
          fontSize: 12,
          backgroundColor: 'transparent',
          color: props.currentMessage.whispered || props.position === 'left' ? '#aaa' : 'white'
        }}>
          {props.currentMessage.user.name}
        </Typography>}
      <Bubble
        textStyle={{
          right: {
            color: 'white',
          },
          left: {
            color: 'black'
          }
        }}
        {...props}
        {...newProps} />
    </Grid>
  )
}

export default RenderBubble;
