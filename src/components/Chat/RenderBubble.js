import React from 'react'
import { Grid, Typography } from "@mui/material";
import { isSameUser, isSameDay, Bubble } from "react-native-gifted-chat";
import { getColorFromId } from "../../utils/misc"

const RenderBubble = (props) => {
  const { currentMessage, previousMessage } = props
  const [isVerifiedGuest, setVerifiedGuest] = React.useState(false)
  const [newProps, setNewProps] = React.useState({})
  const isAdmin = props.socket.admin

  React.useEffect(() => {
    const init = async () => {
      //TODO: this is breaking the server for some reason
      // const verified = await props.socket.api.postPubKey(current_user_key)
      setVerifiedGuest(true);
      // console.log(JSON.stringify(props.socket), current_user_key)
    }
    init();
  }, [currentMessage.user._id, props.socket.admin, props.socket.api, /* PSM: props.socket.exportable_owner_pubKey, */ props.socket.exportable_pubKey])

  const updateProps = React.useCallback(({ both, left, right }) => {
    both = both || {}
    left = left || {}
    right = right || {}

    const width = currentMessage.image !== "" ? "min(80%, 18rem)" : "inherit"
    const defaultWrapperStyle = {
      left: {
        // overflow: "hidden",
        borderColor: "black",
        borderStyle: "solid",
        overflowWrap: "break-word",
        borderWidth: "3px",
        flexGrow: 1,
        // maxWidth:"max(55%, 18rem)",
        width: width,
        ...both,
        ...left
      },
      right: {
        // overflow: "hidden",
        overflowWrap: "break-word",
        borderColor: "black",
        borderStyle: "solid",
        borderWidth: "3px",
        flexGrow: 1,
        // maxWidth:"max(55%, 18rem)",
        width: width,
        ...both,
        ...right
      }
    }

    setNewProps({
      wrapperStyle: defaultWrapperStyle
    })
  }, [currentMessage.image])

  React.useEffect(() => {

    if (currentMessage.whispered) {
      updateProps({ both: { backgroundColor: "#FEE251" } })
    } else if (!isAdmin && !isVerifiedGuest) {
      updateProps({
        both: {
          borderColor: "red",
        }
      })
    } else if (currentMessage.user._id === 'system' || currentMessage._id.match(/^sending_/)) {
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
          borderColor: getColorFromId(currentMessage.user._id),
        }
      })
    }
  }, [isVerifiedGuest, isAdmin, currentMessage, updateProps])

  return (
    <Grid style={{ maxWidth: "55%" }}>
      {(isSameUser(currentMessage, previousMessage) && isSameDay(currentMessage, previousMessage))
        ? ''
        : <Typography variant={'body1'} style={{
          width: '50vw',
          paddingBottom: 3,
          left: 0,
          fontSize: 12,
          backgroundColor: 'transparent',
          color: props.position === 'left' ? '#aaa' : 'white'
        }}>
          {currentMessage.user.name}
        </Typography>}
      <Bubble
        {...props}
        {...newProps} />
    </Grid>
  )
}

export default RenderBubble;