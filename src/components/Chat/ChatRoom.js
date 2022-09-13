/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import * as React from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import RenderBubble from "./RenderBubble";
import { useContext, useState } from "react";
import ActiveChatContext from "../../contexts/ActiveChatContext";
import RenderAttachmentIcon from "./RenderAttachmentIcon";
import ImageOverlay from "../Modals/ImageOverlay";
import RenderImage from "./RenderImage";
import { retrieveData } from "../../utils/ImageProcessor";
import ChangeNameDialog from "../Modals/ChangeNameDialog";
import MotdDialog from "../Modals/MotdDialog";
import NotificationContext from "../../contexts/NotificationContext";
import { deriveKey, importKey } from "../../utils/crypto";
import RenderChatFooter from "./RenderChatFooter";
import RenderTime from "./RenderTime";
import { Dimensions, View } from "react-native";
import AttachMenu from "./AttachMenu";
import RoomContext from "../../contexts/RoomContext";
import config from "../../config";
import FirstVisitDialog from "../Modals/FirstVisitDialog";
import { orderBy, uniqBy } from "lodash";

const ChatRoom = (props) => {
  const activeChatContext = useContext(ActiveChatContext)
  const roomContext = useContext(RoomContext)
  const Notifications = useContext(NotificationContext)

  const [openPreview, setOpenPreview] = useState(false);
  const [openChangeName, setOpenChangeName] = useState(false);
  const [openFirstVisit, setOpenFirstVisit] = useState(false);
  const [openMotd, setMotdDialog] = useState(false);
  const [anchorEl, setAnchorEl] = React.useState(null);
  const attachMenu = Boolean(anchorEl);
  const [img, setImg] = useState('');
  const [imgLoaded, setImgLoaded] = useState(false);
  const [messages, setMessages] = useState([]);
  const [controlMessages, setControlMessages] = useState([]);

  React.useEffect(() => {
    const _roomMetadata = JSON.parse(localStorage.getItem('rooms')) || {}
    if (!_roomMetadata.hasOwnProperty(props.roomId)) {
      _roomMetadata[props.roomId] = { name: `Room ${Object.keys(_roomMetadata).length + 1}` };
      roomContext.updateRoomNames(_roomMetadata)
    }
  }, [])

  React.useEffect(() => {

    const mergedMesssages = orderBy(
      uniqBy([...messages, ...activeChatContext.messages], '_id'),
      ['_id'],
      ['asc']);
    setMessages(mergedMesssages)
  }, [activeChatContext.messages]);

  React.useEffect(() => {
    const updatedControlMessages = [...controlMessages, ...activeChatContext.controlMessages];
    setControlMessages(updatedControlMessages)
  }, [activeChatContext.controlMessages]);

  React.useEffect(() => {
    roomContext.goToRoom(props.roomId)
    activeChatContext.changeRoomId(props.roomId)
    window.onmessage = async (e) => {
      //console.log(e)
      if (e.origin !== 'https://privacy.app') {
        return;
      }
      try {
        // TODO lets discuss whats going on here
        let payload = JSON.parse(e.data);
        if (payload.hasOwnProperty('localStorage')) {
          e.source.postMessage(JSON.stringify(localStorage));
        }
        for (let room in payload) {
          if (room.split('.')[1] === 'name') {
            let rooms = roomContext.getRooms();
            rooms[room.split('.')[0]] = { name: payload[room] };
            roomContext.updateRoomNames(rooms, room);
          } else if (room.split('.')[1] === 'keyRotation') {
            fetch(config.ROOM_SERVER + props.roomId + "/ownerKeyRotation", { credentials: 'include' });
          } else {
            localStorage.setItem(room, JSON.stringify(payload[room]));
          }
        }
      } catch (e) {
        console.log(e);
      }
    }
    if (localStorage.getItem(props.roomId) === null && props.roomId !== '') {
      setOpenFirstVisit(true);
    } else {
      activeChatContext.joinRoom(props.roomId)
    }
  }, [])


  const notify = (message, severity) => {
    Notifications.setMessage(message);
    Notifications.setSeverity(severity);
    Notifications.setOpen(true)
  }

  const openImageOverlay = (message) => {
    setImg(message.image);
    setOpenPreview(true)
    try {

      retrieveData(message, controlMessages).then((data) => {
        if (data.hasOwnProperty('error')) {
          activeChatContext.sendSystemMessage('Could not open image: ' + data['error']);
        } else {
          setImgLoaded(true);
          setImg(data['url']);
        }
      })
    } catch (error) {
      console.log('openPreview() exception: ' + error.message);
      activeChatContext.sendSystemMessage('Could not open image (' + error.message + ')');
      setOpenPreview(false)
    }
  }

  const imageOverlayClosed = () => {
    setImg('')
    setImgLoaded(false);
    setOpenPreview(false)
  }

  const promptUsername = () => {
    setOpenChangeName(true)
  }


  const handleReply = async (user) => {
    try {
      if (activeChatContext.roomOwner) {

        const recipient_pubKey = await importKey("jwk", JSON.parse(user._id), "ECDH", true, []);
        const reply_encryptionKey = await deriveKey(activeChatContext.keys.privateKey, recipient_pubKey, "AES", false, ["encrypt", "decrypt"])
        activeChatContext.setReplyTo(user)
        activeChatContext.setReplyEncryptionKey(reply_encryptionKey)
      } else {
        notify('Whisper is only for room owners.', 'info')
      }
    } catch (e) {
      console.log(e);
      notify(e.message, 'error')
    }
  }

  const getOldMessages = () => {
    activeChatContext.getOldMessages()
  }

  const sendMessages = (messages) => {
    activeChatContext.sendMessage(messages);
    removeInputFiles();
  }

  const getExportablePubKey = () => {
    return activeChatContext.keys.exportable_pubKey;
  }

  const openAttachMenu = (e) => {
    setAnchorEl(e.currentTarget);
  }

  const handleClose = () => {
    setAnchorEl(null);
  };

  const removeInputFiles = () => {
    activeChatContext.removeInputFiles()
    activeChatContext.setImgUrl(null)
  }
  const { height } = Dimensions.get('window')
  return (
    <View style={{ flexGrow: 1, flexBasis: 'fit-content', height: height - 160 }}>
      <ImageOverlay open={openPreview} img={img} imgLoaded={imgLoaded} onClose={imageOverlayClosed} />
      <ChangeNameDialog open={openChangeName} />
      <MotdDialog open={openMotd} roomName={props.roomName} />
      <AttachMenu open={attachMenu} handleClose={handleClose} />
      <FirstVisitDialog open={openFirstVisit} onClose={() => {
        setOpenFirstVisit(false)
      }} roomId={props.roomId} />
      <GiftedChat
        messages={messages}
        onSend={sendMessages}
        // timeFormat='L LT'
        user={{ _id: JSON.stringify(getExportablePubKey()) }}
        inverted={false}
        alwaysShowSend={true}
        loadEarlier={activeChatContext.moreMessages}
        isLoadingEarlier={activeChatContext.loadingMore}
        onLoadEarlier={getOldMessages}
        renderActions={(props) => {
          return <RenderAttachmentIcon {...props} openAttachMenu={openAttachMenu} />
        }}
        // renderUsernameOnMessage={true}
        // infiniteScroll={true}   // This is not supported for web yet
        renderMessageImage={(props) => {
          return <RenderImage {...props} openImageOverlay={openImageOverlay} />
        }}
        scrollToBottom={true}
        showUserAvatar={true}
        onPressAvatar={promptUsername}
        onLongPressAvatar={(context) => {
          return handleReply(context)
        }}
        renderChatFooter={() => {
          return <RenderChatFooter removeInputFiles={removeInputFiles} imgUrl={activeChatContext.imgUrl} />
        }}
        renderBubble={(props) => {
          return <RenderBubble {...props} keys={activeChatContext.getKeys()} />
        }}
        onLongPress={() => false}
        renderTime={RenderTime}

      />
    </View>
  )

}

export default ChatRoom;
