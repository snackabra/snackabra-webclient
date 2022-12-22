import React from 'react'
import { Grid, Typography } from "@mui/material";
import { Bubble } from "react-native-gifted-chat";
const SB = require('snackabra')
const sbCrypto = new SB.SBCrypto();

const RenderBubble = (props) => {
  const [isVerifiedGuest, setVerifiedGuest] = React.useState(false)
  const [isAdmin, setIsAdmin] = React.useState(false)
  const [newProps, setNewProps] = React.useState({})


  React.useEffect(() => {
    let current_user_key = props.currentMessage.user._id !== 'system' ? JSON.parse(props.currentMessage.user._id) : {};
    const init = async () => {
      //TODO: this is breaking the server for some reason
      // const verified = await props.socket.api.postPubKey(current_user_key)
      setVerifiedGuest(true);
      setIsAdmin(sbCrypto.compareKeys(props.socket.exportable_owner_pubKey, current_user_key))
    }
    init();
  }, [props.currentMessage.user._id, props.socket.api, props.socket.exportable_owner_pubKey, props.socket.exportable_pubKey])
  const getColor = (username) => {
    let sumChars = 0;
    for (let i = 0; i < username.length; i++) {
      sumChars += username.charCodeAt(i);
    }

    const colors = [
      '#e67e22', // carrot
      '#2ecc71', // emerald
      '#3498db', // peter river
      '#8e44ad', // wisteria
      '#e74c3c', // alizarin
      '#1abc9c', // turquoise
      '#2c3e50', // midnight blue
    ];
    return colors[sumChars % colors.length];
  }

  React.useEffect(() => {
    const width = props.currentMessage.image !== "" ? "min(80%, 18rem)" : "inherit"

    if (props.currentMessage.whispered) {
      setNewProps({
      setNewProps({
        wrapperStyle: {
          left: {
            backgroundColor: "#FEE251",
            flexGrow: 1,
            marginRight: 0,
            width: width
          },
          right: {
            backgroundColor: "#FEE251",
            flexGrow: 1,
            marginLeft: 0,
            width: width
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
            flexGrow: 1,
            marginRight: 0,
            width: width
          },
          right: {
            borderColor: "red",
            borderStyle: "solid",
            borderWidth: "4px",
            flexGrow: 1,
            marginLeft: 0,
            width: width
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
            flexGrow: 1,
            marginRight: 0,
            width: width
          }
        }
      })
    } else if (props.currentMessage.user._id === 'system') {

      setNewProps({
        wrapperStyle: {
          left: {
            borderColor: "black",
            borderStyle: "solid",
            borderWidth: "2px",
            flexGrow: 1,
            marginRight: 0,
          },
          right: {
            borderColor: "black",
            borderStyle: "solid",
            borderWidth: "2px",
            flexGrow: 1,
            marginRight: 0,
          }
        }
      })
    } else if (props.currentMessage._id.match(/^sending_/)) {
      setNewProps({
        wrapperStyle: {
          right: {
            borderColor: "gray",
            borderStyle: "solid",
            borderWidth: "4px",
            flexGrow: 1,
            marginLeft: 0,
            width: width
          }
        }
      })
    }
    // else if (props.currentMessage.user._id === JSON.stringify(state.keys.exportable_room_pubKey)) {
    else if (isAdmin) {
      setNewProps({
    else if (isAdmin) {
      setNewProps({
        wrapperStyle: {
          left: {
            borderColor: "#2ECC40",
            borderStyle: "solid",
            borderWidth: "4px",
            flexGrow: 1,
            marginRight: 0,
            width: width
          },
          right: {
            borderColor: "#2ECC40",
            borderStyle: "solid",
            borderWidth: "4px",
            flexGrow: 1,
            marginLeft: 0,
            width: width
          }
        }
      })
      })
    }
    //else if (props.currentMessage.user._id === JSON.stringify(state.keys.exportable_verifiedGuest_pubKey)) {
    else if (isVerifiedGuest && !isAdmin) {
      setNewProps({
        wrapperStyle: {
          left: {
            borderColor: getColor(props.currentMessage.user.name),
            borderStyle: "solid",
            borderWidth: "4px",
            marginRight: 0,
            width: width
          },
          right: {
            borderColor: getColor(props.currentMessage.user.name),
            borderStyle: "solid",
            borderWidth: "4px",
            marginLeft: 0,
            width: width
          }
        }
      })
    }
  }, [isVerifiedGuest, isAdmin, props.currentMessage.encrypted, props.currentMessage.info, props.currentMessage._id, props.currentMessage.whispered])


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
  return (
    <Grid style={{ width: '60%' }}>
      {(isSameUser(props.currentMessage, props.previousMessage) && isSameDay(props.currentMessage, props.previousMessage))
        ? ''
        : <Typography variant={'body1'} style={{
          width: '50vw',
          paddingBottom: 3,
          left: 0,
          fontSize: 12,
          backgroundColor: 'transparent',
          color: props.position === 'left' ? '#aaa' : 'white'
          color: props.position === 'left' ? '#aaa' : 'white'
        }}>
          {props.currentMessage.user.name}
        </Typography>}
      <Bubble
        textStyle={{
          right: {
            color: props.currentMessage.whispered ? '#aaa' : 'white',
            wordBreak: 'break-all',
          },
          left: {
            color: props.currentMessage.whispered ? '#aaa' : 'black',
            wordBreak: 'break-all',
          }
        }}
        {...props}
        {...newProps} />
    </Grid>
  )
}

export default RenderBubble;