import React from 'react'
import { Grid, Typography } from "@mui/material";
import { Bubble } from "react-native-gifted-chat";
import useMediaQuery from '@mui/material/useMediaQuery';
const SB = require('snackabra')
const sbCrypto = new SB.SBCrypto();

const RenderBubble = (props) => {
  const smDown = useMediaQuery((theme) => theme.breakpoints.down('sm'));
  const lgDown = useMediaQuery((theme) => theme.breakpoints.down('lg'));
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
    if (props.currentMessage.whispered) {
      setNewProps({
        wrapperStyle: {
          left: {
            backgroundColor: "#FEE251",
            flexGrow: 1,
            marginRight: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
          },
          right: {
            backgroundColor: "#FEE251",
            flexGrow: 1,
            marginLeft: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
          }
        },
        textStyle: {
          left: {
            fontStyle: "italic",
            color: "#000",
          },
          right: {
            fontStyle: "italic",
            color: "#000",
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
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
          },
          right: {
            borderColor: "red",
            borderStyle: "solid",
            borderWidth: "4px",
            flexGrow: 1,
            marginLeft: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
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
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
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
            flexGrow: 1,
            marginRight: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
          },
          right: {
            borderColor: "gray",
            borderStyle: "solid",
            borderWidth: "4px",
            flexGrow: 1,
            marginLeft: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
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
            flexGrow: 1,
            marginRight: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
          },
          right: {
            borderColor: "#2ECC40",
            borderStyle: "solid",
            borderWidth: "4px",
            flexGrow: 1,
            marginLeft: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
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
            marginRight: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
          },
          right: {
            borderColor: "#B10DC9",
            borderStyle: "solid",
            borderWidth: "4px",
            marginLeft: 0,
            width: props.currentMessage.image !== "" ? "80%" : "inherit"
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
        }}>
          {props.currentMessage.user.name}
        </Typography>}
      <Bubble
        textStyle={{
          right: {
            color: props.currentMessage.whispered ? '#aaa' : 'white',
          },
          left: {
            color: props.currentMessage.whispered ? '#aaa' : 'black'
          }
        }}
        {...props}
        {...newProps} />
    </Grid>
  )
}

export default RenderBubble;
