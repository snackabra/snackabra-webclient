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

  const updateProps = React.useCallback(({ both, left, right }) => {
    both = both || {}
    left = left || {}
    right = right || {}

    const width = props.currentMessage.image !== "" ? "min(80%, 18rem)" : "inherit"
    const defaultWrapperStyle = {
      left: {
        overflow: "hidden",
        borderColor: "black",
        borderStyle: "solid",
        overflowWrap: "break-word",
        borderWidth: "3px",
        flexGrow: 1,
        maxWidth:"max(55%, 18rem)",
        width: width,
        ...both,
        ...left
      },
      right: {
        overflow: "hidden",
        overflowWrap: "break-word",
        borderColor: "black",
        borderStyle: "solid",
        borderWidth: "3px",
        flexGrow: 1,
        maxWidth:"max(55%, 18rem)",
        width: width,
        ...both,
        ...right
      }
    }

    setNewProps({
      wrapperStyle: defaultWrapperStyle
    })
  }, [props.currentMessage.image])

  React.useEffect(() => {

    if (props.currentMessage.whispered) {
      updateProps({ both: { backgroundColor: "#FEE251" } })
    } else if (!isAdmin && !isVerifiedGuest) {
      updateProps({
        both: {
          borderColor: "red",
        }
      })
    } else if (props.currentMessage._id.match(/^sending_/)) {
      updateProps({
        both: {
          borderColor: "gray",
        }
      })
    } else if (isAdmin) {
      updateProps({
        both: {
          borderColor: "#2ECC40",
        }
      })
    } else if (isVerifiedGuest && !isAdmin) {
      updateProps({
        both: {
          borderColor: getColor(props.currentMessage.user.name),
        }
      })
    }
  }, [isVerifiedGuest, isAdmin, props.currentMessage.encrypted, props.currentMessage.info, props.currentMessage._id, props.currentMessage.whispered, props.currentMessage.user.name, updateProps])


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
    <Grid style={{maxWidth: "55%"}}>
      {(isSameUser(props.currentMessage, props.previousMessage) && isSameDay(props.currentMessage, props.previousMessage))
        ? ''
        : <Typography variant={'body1'} style={{
          width: '50vw',
          paddingBottom: 3,
          left: 0,
          fontSize: 12,
          backgroundColor: 'transparent',
          color: props.position === 'left' ? '#aaa' : 'white'
        }}>
          {props.currentMessage.user.name}
        </Typography>}
      <Bubble
        {...props}
        {...newProps} />
    </Grid>
  )
}

export default RenderBubble;