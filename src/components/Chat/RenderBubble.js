import React from 'react'
import { Grid, Typography } from "@mui/material";
import { areKeysSame } from "../../utils/crypto";
import { Bubble } from "react-native-gifted-chat";
import ActiveChatContext from "../../contexts/ActiveChatContext";
import { useContext } from "react";

const RenderBubble = (props) => {

  let newProps = {}
  let current_user_key
  try {
    current_user_key = JSON.parse(props.currentMessage.user._id);
  } catch (error) {
    // onsole.log(props.currentMessage.user._id)
  }
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

  try {
    if (props.currentMessage.whispered) {
      newProps = {
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
      }
    } else if (props.currentMessage.verified === false) {
      newProps = {
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
      }
    } else if (props.currentMessage.info) {
      newProps = {
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
      }
    }
    // else if (props.currentMessage.user._id === JSON.stringify(state.keys.exportable_room_pubKey)) {
    else if (areKeysSame(current_user_key, props.keys.exportable_owner_pubKey)) {
      newProps = {
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
      }
    }
    //else if (props.currentMessage.user._id === JSON.stringify(state.keys.exportable_verifiedGuest_pubKey)) {
    else if (areKeysSame(current_user_key, props.keys.exportable_verifiedGuest_pubKey)) {
      newProps = {
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
      }
    }
  } catch (e) {
    console.log(e);
  }
  // For username on top
  return (
    <Grid style={{ width: '90%' }}>
      {(isSameUser(props.currentMessage, props.previousMessage) && isSameDay(props.currentMessage, props.previousMessage)) || areKeysSame(current_user_key, props.keys.exportable_pubKey)
        ? null
        : <Typography variant={'body1'} style={{
          width: '50vw',
          paddingBottom: 3,
          left: 0,
          fontSize: 12,
          backgroundColor: 'transparent',
          color: '#aaa'
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
