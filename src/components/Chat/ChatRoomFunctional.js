import * as React from 'react';
import RenderBubble from "./RenderBubble";
import RenderAvatar from "./RenderAvatar";
import RenderAttachmentIcon from "./RenderAttachmentIcon";
import ImageOverlay from "../Modals/ImageOverlay";
import ImageGallery from "../Modals/ImageGallery";
import RenderImage from "./RenderImage";
import ChangeNameDialog from "../Modals/ChangeNameDialog";
import RenderChatFooter from "./RenderChatFooter";
import RenderMessage from "./RenderMessage";
import RenderMessageText from "./RenderMessageText";
import RenderTime from "./RenderTime";
import { Dimensions } from "react-native";
import AdminDialog from "../Modals/AdminDialog";
import FirstVisitDialog from "../Modals/FirstVisitDialog";
import RenderSend from "./RenderSend";
import WhisperUserDialog from "../Modals/WhisperUserDialog";
import RenderComposer from "./RenderComposer";
import DropZone from "../DropZone";
import Queue from "../../utils/Queue";
import { observer } from "mobx-react"
import { SafeAreaView } from 'react-native-safe-area-context';
import { isMobile } from 'react-device-detect';
import SharedRoomStateContext from "../../contexts/SharedRoomState";
import { GiftedChat } from "react-native-gifted-chat";
import * as _ from 'lodash';



const ChatRoom = observer((props) => {
  const shardRoomContext = React.useContext(SharedRoomStateContext)
  const giftedRef = React.useRef(null)
  giftedRef.current?.scrollToOffset({
    offset: 0,
    animated: true
  });
  // eslint-disable-next-line no-undef
  const FileHelper = window.SBFileHelper;
  const fileMetadata = new Map();
  const q = new Queue()
  const _r = new Queue()
  let SB = require('snackabra/dist/snackabra')

  let messageTypes = {
    SIMPLE_CHAT_MESSAGE: 'd341ca8645f94dc0adb1772865d973fc',
    FILE_SHARD_METADATA: 'ac9ce10755b647849d8596011979e018',
    IMAGE_MESSAGE: '2ef77f64d6b94a4ba677dcd1f20c08f2',
    VOIP_SIGNAL: '7a962646710f4aefb44a709aaa04ba41',
    'reserved3': 'ce59be06bd304102b55a731474758075',
    'reserved4': 'cedda653151e4110abd81cf55c8884a6',
    'reserved5': '5c4bec993da94bd5999fe7ea08f1cbce',
    'reserved6': '721595ae2b6448cf8549d9fdac00151b',
    'reserved7': '59c4fd9325cf4b37950ac15b040b8e01',
  }
  const sbContext = props.sbContext
  const channel = sbContext.channels[props.roomId];
  const sending = {}
  let toUpload = []
  let uploaded = []

  const [messages, setMessages] = React.useState(new Map());
  const [giftedMessages, setGiftedMessages] = React.useState([]);
  const [user, setUser] = React.useState({});
  const [height, setHeight] = React.useState(0);
  const [visibility, setVisibility] = React.useState('visible');
  const [openAdminDialog, setOpenAdminDialog] = React.useState(props.openAdminDialog);
  const [openWhisper, setOpenWhisper] = React.useState(false);
  const [openPreview, setOpenPreview] = React.useState(false);
  const [openChangeName, setOpenChangeName] = React.useState(false);
  const [openFirstVisit, setOpenFirstVisit] = React.useState(false);
  const [changeUserNameProps, setChangeUserNameProps] = React.useState({});
  const [img, setImg] = React.useState('');
  const [imgLoaded, setImgLoaded] = React.useState(false);
  const [roomId, setRoomId] = React.useState(props.roomId || 'offline');
  const [files, setFiles] = React.useState(0);
  const [images, setImages] = React.useState([]);
  const [loading, setLoading] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [replyTo, setReplyTo] = React.useState(null);
  const [dzRef, setDzRef] = React.useState(null);
  const [inputErrored, setInputErrored] = React.useState(false);
  const [typing, setTyping] = React.useState(false);
  const [controlMessages, setControlMessages] = React.useState({});

  React.useEffect(() => {
    props.messageContainerRef(giftedRef)
  }, [props])


  const addMessage = React.useCallback((message) => {
    let _m = []
    setGiftedMessages(previousMessages => {
      _m = GiftedChat.append(previousMessages, [message])
      return _m

    })
    return _m
  }, [])

  const replaceMessage = React.useCallback((msg) => {
    let _m = []
    console.log('replaceMessage', msg)
    setGiftedMessages(previousMessages => {
      const updatedMessages = previousMessages.map(message => {
        return message._id === msg.sendingId ? msg : message
      });
      _m = updatedMessages
      return _m
    })
    return _m
  }, [])

  React.useEffect(() => {
    let resizeTimeout = null;
    const handleResize = (e) => {
      if (resizeTimeout) clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(() => {
        const { height } = Dimensions.get('window');
        setHeight(height);
      }, 250);
    };
    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);
    window.addEventListener('touchmove', handleResize);
    handleResize();

    // document.addEventListener('visibilitychange', () => {
    //   let socketStatus = channel.checkSocketStatus();
    //   if (
    //     document.visibilityState === 'visible' &&
    //     socketStatus !== 'OPEN'
    //   ) {
    //     if (props.activeRoom === props.roomId) {
    //       connect();
    //     }
    //   }
    //   setVisibility(document.visibilityState);
    // });

    if (!channel) {
      const room = props.sbContext.join(props.roomId);
      if (!room) {
        throw new Error('Could not join room');
      }
    }

    init();

    return () => {
      setMessages(new Map());
      setOpenAdminDialog(false);
      setOpenWhisper(false);
      setOpenPreview(false);
      setOpenChangeName(false);
      setOpenFirstVisit(false);
      setChangeUserNameProps({});
      setImg('');
      setImgLoaded(false);
      setRoomId(props.roomId || 'offline');
      setFiles(0);
      setImages([]);
      setLoading(false);
      setUploading(false);
      setUser({});
      setHeight(0);
      setVisibility('visible');
      setReplyTo(null);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  React.useEffect(() => {
    if (props.openAdminDialog !== openAdminDialog) {
      setOpenAdminDialog(props.openAdminDialog)
    }
  }, [openAdminDialog, props.openAdminDialog])

  React.useEffect(() => {
    if (props.activeRoom === props.roomId) {
      connect()
    }
  }, [props.roomId, props.activeRoom])

  const init = () => {
    const keys = channel.key
    const contact = sbContext.getContact(keys)

    if (!contact) {
      setOpenFirstVisit(true)
    } else {
      if (props.activeRoom === props.roomId) {
        connect();
      }
    }

    processQueue()
    processSQueue()
    subscribeToNotifications()
  }

  const subscribeToNotifications = () => {
    setTimeout(async () => {

      try {


        if (!window.sw_registration || !('pushManager' in window.sw_registration)) {
          console.log('pushManager not found in registration object...')
          return;
        }
        console.dir(window.sw_registration)

        console.log('Registering push')
        const subscription = await window.sw_registration.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: SB.base64ToArrayBuffer(process.env.REACT_APP_PUBLIC_VAPID_KEY),
        })

        await fetch(process.env.REACT_APP_NOTIFICATION_SERVER + '/subscription', {
          method: 'POST',
          body: JSON.stringify({
            channel_id: props.roomId,
            subscription: subscription
          }),
          headers: {
            'Content-Type': 'application/json',
          },
        })
      } catch (e) {
        console.error(e)
      }
    }, 1000)
  }

  /**
   * Queue helps with order outgoing messages
   * when sending many images, some were getting lost
   * this tiny bit of extra time helps ensure messages are sent
   */
  const processQueue = () => {
    setInterval(() => {
      while (!q.isEmpty && !q.isMaxed) {
        q.processing++
        const msg = q.dequeue()
        msg.send().then(() => {
          q.processing--
        })
      }
    }, 25)
  }

  /**
 * Queue helps ensure each message gets a unique ID for Images
 * when sending multiple images gifted chat sees that as a single message
 * we need to add on to the message id to render the chat container properly
 */
  const processSQueue = () => {
    setInterval(() => {
      while (!_r.isEmpty && !_r.isMaxed) {
        _r.processing++
        const msg = _r.dequeue()
        msg._id = msg._id + Date.now()
        sending[msg._id] = msg._id
        setMessages(_messages => new Map(_messages).set(msg._id, msg))
        _r.processing--
      }
    }, 25)
  }

  const connect = async (username) => {
    try {
      await channel.connect(receiveMessages)
      if (username) sbContext.createContact(username, channel.key)
      setUser(sbContext.getContact(channel.key))

      console.log('a channel', channel)
      // setMessages(channel.messages)
      channel.getOldMessages(0).then(() => {
        if (channel.motd !== '') {
          sendSystemInfo('MOTD: ' + channel.motd)
        }
      })

    } catch (e) {
      notify('Error connecting to channel', 'error')
      console.error(e)
    }
  }

  const receiveMessages = (m) => {
    try {

      console.warn("Received message: ", JSON.parse(JSON.stringify(m)))
      const userId = `${m?.sender_pubKey?.x} ${m?.sender_pubKey?.y}`;
      m.user._id = userId;
      console.log(JSON.stringify(sbContext.getContact(userId)))
      m.user.name = sbContext.getContact(userId).name === 'Unamed' && m.sender_username ? m.sender_username : sbContext.getContact(userId).name;
      m.sender_username = m.sender_username ? m.sender_username : m.user.name;

      switch (m.messageType) {
        case messageTypes.SIMPLE_CHAT_MESSAGE:
          console.log('SIMPLE_CHAT_MESSAGE')
          handleSimpleChatMessage(m);
          break;
        case messageTypes.FILE_SHARD_METADATA:
          console.log('FILE_SHARD_METADATA')
          const obj = JSON.parse(m.contents)
          setControlMessages(_controlMessages => {
            _controlMessages[obj.hash] = obj.handle
            return _controlMessages
          })
          // Tracks progress
          if (toUpload.length > 0) {
            if (toUpload.includes(obj.hash)) {
              uploaded.push(obj.hash)
              // setProgressBarWidth(Math.ceil(uploaded.length / toUpload.length * 100));
            }

          }
          if (uploaded.length === toUpload.length) {
            setUploading(false)
            toUpload = []
            uploaded = []
          }
          console.log('FILE_SHARD_METADATA', obj.hash, obj.handle)
          FileHelper.knownShards.set(obj.hash, obj.handle)
          break;
        case messageTypes.IMAGE_MESSAGE:
          console.log('IMAGE_MESSAGE', m)
          for (let x in m.fileMetadata) {
            fileMetadata.set(x, m.fileMetadata)
          }
          handleSimpleChatMessage(m);
          break;
        case messageTypes.VOIP_SIGNAL:
          console.log('VOIP_SIGNAL', m)
          break;
        default:
          console.warn("Unknown message type received: ", m);
          console.warn("Attempting to process as a legacy chat message... this will be deprecated soon.");
          receiveMessagesLegacy(m);
      }
    } catch (e) {
      console.error(e)
    }
  }

  const getGiftedMessages = () => {
    return giftedMessages;
  }

  const handleSimpleChatMessage = (msg) => {

    setGiftedMessages(previousMessages => {
      if (previousMessages && msg.hasOwnProperty('sendingId') && previousMessages.some(message => message._id === msg.sendingId)) {
        return replaceMessage(msg)
      } else {
        return addMessage(msg)
      }
    })


    setMessages(_messages => {
      const _n_messages = new Map(_messages).set(msg._id, msg)
      if (msg.hasOwnProperty('sendingId')) {
        _n_messages.delete(msg.sendingId)
      }
      return _n_messages
    })
  }

  // For backaward compatibility with older versions of the chat app
  const receiveMessagesLegacy = (msg) => {
    if (msg) {
      console.log("==== here is the message: (ChatRoom.js)")
      if (!msg.control) {
        [...messages.entries()].reduce((acc, curr) => {
          const msg_id = curr._id.toString()
          if (!msg_id.match(/^sending/)) {
            acc.push(curr);
            setMessages(_messages => new Map(_messages).set(msg_id, curr))
          } else {
            delete sending[curr._id]
          }
          return acc;
        }, []);
        const userId = `${msg.user._id.x} ${msg.user._id.y}`;
        msg.user._id = userId;
        msg.user.name = sbContext.getContact(msg.user._id) !== undefined ? sbContext.contacts[userId] : msg.user.name;
        msg.sender_username = msg.user.name;
        setMessages(_messages => new Map(_messages).set(msg._id, msg))
      } else {
        setControlMessages(_controlMessages => {
          _controlMessages[msg.hash] = msg.handle
          return _controlMessages
        })
      }
    } else {
      console.warn("receiveMessages() called with empty message")
    }
  }

  const notify = (message, severity) => {
    props.Notifications.setMessage(message);
    props.Notifications.setSeverity(severity);
    props.Notifications.setOpen(true)
  }

  const openImageOverlay = (message) => {

    props.inhibitSwipe(1)
    let _images = [];
    for (const [key, value] of messages.entries()) {
      console.log(`MESSAGES `, key, value)
      if (value.hasOwnProperty('image') && value.image.length > 0) {
        _images.push(value)
      }
    }
    setImg(message)
    setOpenPreview(true)
    setImages(_images)
  }

  const imageOverlayClosed = () => {
    props.inhibitSwipe(0)
    setOpenPreview(false)
    setImgLoaded(false)
  }

  const promptUsername = (context) => {
    setOpenChangeName(true)
    setChangeUserNameProps(context)
  }

  const handleReply = (toUser) => {
    try {
      if (sbContext.owner) {
        setReplyTo(toUser._id)
        setOpenWhisper(true)
      } else {
        notify('Whisper is only for room owners.', 'info')
      }
    } catch (e) {
      console.log(e);
      notify(e.message, 'error')
    }
  }

  const loadFiles = () => {
    setLoading(false)
    setFiles(true)
  }

  const incrementFiles = () => {
    setFiles(files + 1)
  }

  const decrementFiles = () => {
    setFiles(files - 1)
  }

  const sendFiles = async (giftedMessage) => {
    // let toUpload = []
    setFiles(0)
    setUploading(true)
    for (const [key, value] of FileHelper.finalFileList.entries()) {

      if (value.sbImage) {
        console.log('key', key)
        console.log('value', value)
        const message = {
          createdAt: new Date(),
          text: "",
          messageType: messageTypes.SIMPLE_CHAT_MESSAGE,
          image: value.sbImage.thumbnail,
          user: sbContext.getContact(channel.key),
          sender_username: sbContext.getContact(channel.key).name,
          _id: 'sending_' + giftedMessage[0]._id + Date.now()
        }
        // addMessage(message)
        _r.enqueue(message)
        value.sbImage.thumbnailReady.then(() => {
          let sbm = channel.newMessage('')
          sbm.contents.image = value.sbImage.thumbnail
          const imageMetaData = {
            fullImageHash: value.uniqueShardId,
            thumbnailHash: value.sbImage.thumbnailDetails.uniqueShardId,
            previewHash: value.sbImage.previewDetails.uniqueShardId,
          }
          sbm.contents.sendingId = message._id
          sbm.contents.messageType = messageTypes.IMAGE_MESSAGE
          sbm.contents.fileMetadata = imageMetaData;
          channel.sendMessage(sbm)
        })
      }
    }

    for (const [key, value] of FileHelper.finalFileList.entries()) {
      const fileHash = value.uniqueShardId;

      console.log(`---- uploading file ${key} with hash ${fileHash} ...`)
      const buffer = FileHelper.globalBufferMap.get(fileHash)
      console.log('buffer', buffer)
      if (!buffer) {
        console.error(`**** failed to find buffer for ${fileHash} (should not happen)`)
      } else {
        toUpload.push(fileHash)
        FileHelper.uploadBuffer(props.roomId, buffer).then((handle) => {
          const obj = { hash: fileHash, handle: handle }
          const sbm = channel.newMessage(JSON.stringify(obj))
          sbm.contents.messageType = messageTypes.FILE_SHARD_METADATA;
          channel.sendMessage(sbm)
          removeFileFromSBFileHelper(fileHash)
        })
      }
    }
    removeInputFiles()
  }

  const removeFileFromSBFileHelper = (uniqueShardId) => {
    for (const [key, value] of FileHelper.finalFileList.entries()) {
      if (value.uniqueShardId === uniqueShardId) {
        try {
          FileHelper.globalBufferMap.delete(value.sbImage.previewDetails.uniqueShardId)
          FileHelper.globalBufferMap.delete(value.sbImage.thumbnailDetails.uniqueShardId)
          FileHelper.globalBufferMap.delete(value.uniqueShardId)
          FileHelper.finalFileList.delete(value.sbImage.previewDetails.fullName)
          FileHelper.finalFileList.delete(value.sbImage.thumbnailDetails.fullName)
          FileHelper.finalFileList.delete(key)
          FileHelper.ignoreProcessing.delete(value.sbImage.previewDetails.uniqueShardId)
          FileHelper.ignoreProcessing.delete(value.sbImage.thumbnailDetails.uniqueShardId)
          decrementFiles()
        } catch (e) {
          console.warn(e)
        }

      }
    }

  }

  const sendMessages = (giftedMessage) => {
    if (giftedMessage[0].text === "") {
      if (files > 0) {
        sendFiles(giftedMessage)
      }
    } else {
      giftedMessage[0]._id = 'sending_' + giftedMessage[0]._id;
      const msg_id = giftedMessage[0]._id;
      giftedMessage[0].user = user
      // giftedMessage[0].pending = true
      console.log('giftedMessage', giftedMessages)
      // addMessage(giftedMessage[0])
      setMessages(_messages => new Map(_messages).set(giftedMessage[0]._id, giftedMessage[0]))
      let sbm = channel.newMessage(giftedMessage[0].text)
      sbm.contents.sender_username = sbContext.getContact(channel.key).name;
      sbm.contents.sendingId = msg_id;
      sbm.contents.messageType = messageTypes.SIMPLE_CHAT_MESSAGE;
      channel.sendMessage(sbm)
    }
  }

  const sendSystemInfo = (msg_string, callback) => {
    const systemMessage = {
      _id: `${messages.length}_${Date.now()}`,
      text: msg_string,
      createdAt: new Date(),
      user: { _id: 'system', name: 'System Message' },
      whispered: false,
      verified: true,
      info: true
    }

    setMessages(_messages => new Map(_messages).set(systemMessage._id, systemMessage))

    if (callback) {
      callback(systemMessage)
    }

  }

  const sendSystemMessage = (message) => {
    setMessages(_messages => new Map(_messages).set(message._id, {
      _id: `${messages.length}_${Date.now()}`,
      user: { _id: 'system', name: 'System Message' },
      createdAt: new Date(),
      text: message + '\n\n Details in console'
    }))
  }

  const removeInputFiles = () => {
    if (document.getElementById('fileInput')) {

      document.getElementById('fileInput').value = '';
    }
    setFiles(0)
  }

  const saveUsername = (newUsername, _id) => {
    if (newUsername && _id) {
      sbContext.createContact(newUsername, _id)
      const _m = Object.assign(messages)
      _m.forEach((_message, i) => {
        console.log(_message, i)
        if (_message.user._id === _id) {
          _message.user.name = newUsername;
          _message.sender_username = newUsername;
          _m[i] = _message;
        }
      })
      setMessages(_m)
      channel.messages = _m
    }
    setOpenChangeName(false)
    setChangeUserNameProps({})
  }

  const setDropzoneRef = (ref) => {
    if (!ref || dzRef) return
    setDzRef(ref)
  }
  console.log('activeRoom', props.activeRoom)
  return (

    <SafeAreaView id={'sb_chat_area'} style={{
      flexGrow: 1,
      flexBasis: 'fit-content',
      height: isMobile && !typing ? height - 36 : height,
      width: '100%',
      paddingTop: 48
    }}>
      <DropZone notify={notify} dzRef={setDropzoneRef} showFiles={loadFiles} showLoading={(bool) => { setLoading(bool) }} openPreview={openPreview} roomId={roomId} incrementFiles={incrementFiles}>
        <AdminDialog
          roomId={roomId}
          motd={channel.motd}
          capacity={channel.capacity}
          open={openAdminDialog}
          sendSystemInfo={sendSystemInfo}
          onClose={() => {
            setOpenAdminDialog(false)
            props.onCloseAdminDialog()
          }} />
        <WhisperUserDialog replyTo={replyTo} open={openWhisper} onClose={() => {
          setOpenWhisper(false)
        }} />
        <ImageOverlay
          sbContext={sbContext}
          images={images}
          open={openPreview}
          img={img}
          controlMessages={controlMessages}
          imgLoaded={imgLoaded}
          onClose={imageOverlayClosed} />
        <ImageGallery
          sbContext={sbContext}
          images={images}
          open={shardRoomContext.state.openImageGallery}
          img={img}
          controlMessages={controlMessages}
          imgLoaded={imgLoaded}
          onClose={() => {
            shardRoomContext.setOpenImageGallery(false)
          }} />
        <ChangeNameDialog {...changeUserNameProps} open={openChangeName} onClose={(userName, _id) => {
          saveUsername(userName, _id)
        }} />
        {/* <AttachMenu open={attachMenu} handleClose={handleClose} /> */}
        <FirstVisitDialog open={openFirstVisit} onClose={(username) => {
          setOpenFirstVisit(false)
          connect(username)
        }} />
        <GiftedChat
          id={`sb_chat_${roomId}`}
          messageContainerRef={giftedRef}
          isKeyboardInternallyHandled={false}
          // wrapInSafeArea={true}
          className={'sb_chat_container'}
          style={{
            width: '100%'
          }}
          messages={_.uniqBy(giftedMessages, '_id')}
          onSend={sendMessages}

          user={user}
          inverted={true}
          alwaysShowSend={true}
          renderMessage={RenderMessage}
          renderActions={(props) => {
            return <RenderAttachmentIcon
              {...props}
              roomId={roomId}
              dzRef={dzRef}
              showLoading={loading} />
          }}

          renderAvatar={RenderAvatar}
          renderMessageImage={(props) => {
            return <RenderImage
              {...props}
              roomId={roomId}
              openImageOverlay={openImageOverlay}
              controlMessages={controlMessages}
              sendSystemMessage={sendSystemMessage}
              notify={notify}
              sbContext={sbContext} />
          }}
          renderMessageText={RenderMessageText}
          scrollToBottom={true}
          showUserAvatar={true}
          onPressAvatar={promptUsername}
          onLongPressAvatar={(context) => {
            return handleReply(context)
          }}
          renderChatFooter={() => {
            return <RenderChatFooter
              roomId={roomId}
              removeInputFiles={removeInputFiles}
              files={files}
              incrementFiles={incrementFiles}
              decrementFiles={decrementFiles}
              // setFiles={setFiles}
              uploading={uploading}
              loading={loading} />
          }}
          renderBubble={(props) => {
            // PSM TODO: what does this need channel keys for?
            return <RenderBubble {...props} keys={{ /* ...sbContext.socket.keys, */ ...channel.key }}
              socket={channel.socket}
              SB={SB} />
          }}
          renderSend={(props) => {
            return <RenderSend {...props}
              roomId={roomId}
              inputError={inputErrored} />
          }}
          renderComposer={(props) => {
            return <RenderComposer {...props}

              showFiles={loadFiles}
              showLoading={setLoading}
              roomId={roomId}
              inputErrored={(errored) => {
                setInputErrored(errored)
              }}
              onFocus={() => {
                setTyping(true)
              }}
              onBlur={() => {
                setTyping(false)
              }}
              incrementFiles={incrementFiles}
              decrementFiles={decrementFiles}
              // setFiles={setFiles}
              filesAttached={files}
            />
          }}
          onLongPress={() => false}
          keyboardShouldPersistTaps='always'
          renderTime={RenderTime}
          parsePatterns={() => [
            { type: 'phone', style: {}, onPress: undefined }
          ]}
        />
      </DropZone>
    </SafeAreaView>
  )
})

export default ChatRoom;