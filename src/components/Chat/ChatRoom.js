/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

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
import { toJS } from "mobx"
import { observer } from "mobx-react"
import { SafeAreaView } from 'react-native-safe-area-context';
import { isMobile } from 'react-device-detect';
import { Navigate } from "react-router-dom";
import SharedRoomStateContext from "../../contexts/SharedRoomState";
import { GiftedChat } from "react-native-gifted-chat";

// eslint-disable-next-line no-undef
const FileHelper = window.SBFileHelper;


const q = new Queue()
const _r = new Queue()
let SB = require('snackabra')
console.log("SB Version: ", SB.version)

let messageTypes = {
  SIMPLE_CHAT_MESSAGE: 'd341ca8645f94dc0adb1772865d973fc',
  FILE_SHARD_METADATA: 'ac9ce10755b647849d8596011979e018',
  IMAGE_MESSAGE: '2ef77f64d6b94a4ba677dcd1f20c08f2',
  'reserved2': '7a962646710f4aefb44a709aaa04ba41',
  'reserved3': 'ce59be06bd304102b55a731474758075',
  'reserved4': 'cedda653151e4110abd81cf55c8884a6',
  'reserved5': '5c4bec993da94bd5999fe7ea08f1cbce',
  'reserved6': '721595ae2b6448cf8549d9fdac00151b',
  'reserved7': '59c4fd9325cf4b37950ac15b040b8e01',
}


@observer
class ChatRoom extends React.PureComponent {
  sbContext = this.props.sbContext
  sending = {}
  knownShards = new Map()
  toUpload = []
  uploaded = []
  updateMessagesTimeout = null
  state = {
    openAdminDialog: false,
    openWhisper: false,
    openPreview: false,
    openChangeName: false,
    openFirstVisit: false,
    changeUserNameProps: {},
    openMotd: false,
    anchorEl: null,
    img: '',
    imgLoaded: false,
    messages: [],
    controlMessages: [],
    roomId: this.props.roomId || 'offline',
    files: false,
    images: [],
    loading: false,
    uploading: false,
    user: {},
    height: 0,
    visibility: 'visible',
    replyTo: null,
    dzRef: null,
    to: null
  }


  componentDidMount() {
    let resizeTimeout = null
    const handleResize = (e) => {

      if (resizeTimeout) clearTimeout(resizeTimeout)

      resizeTimeout = setTimeout(() => {
        const { height } = Dimensions.get('window')
        this.setState({ height: height })
      }, 250)
    }
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    window.addEventListener('touchmove', handleResize);
    handleResize();

    // reconnect when window comes into focus and the state of the socket is not opened
    document.addEventListener("visibilitychange", () => {
      if (this.state.visibility === 'hidden' && document.visibilityState === 'visible' && this.sbContext.socket?.status !== 'OPEN') {
        this.connect();
      }
      this.setState({ visibility: document.visibilityState })
    })
    if (!this.channel) {
      const room = this.sbContext.join(this.props.roomId);
      if (!room) {
        throw new Error('Could not join room')
      }

    }
    this.init()
  }

  componentDidUpdate(prevProps) {
    // // Typical usage (don't forget to compare props):
    // if (this.props.openAdminDialog !== prevProps.openAdminDialog) {
    //   this.setOpenAdminDialog(this.props.openAdminDialog);
    // }
    // if (prevProps.roomId !== this.props.roomId) {
    //   this.sbContext.getChannel(this.props.roomId).then((data) => {
    //     if (!data?.key) {
    //       this.setState({ openFirstVisit: true })
    //     } else {

    //       this.connect();

    //     }
    //   })
    // }
  }

  componentWillUnmount() {
    this.setState({
      openAdminDialog: false,
      openWhisper: false,
      openPreview: false,
      openChangeName: false,
      openFirstVisit: false,
      changeUserNameProps: {},
      openMotd: false,
      anchorEl: null,
      img: '',
      imgLoaded: false,
      messages: this.channel?.messages ? toJS(this.channel.messages) : [],
      controlMessages: [],
      roomId: this.props.roomId || 'offline',
      files: false,
      images: [],
      loading: false,
      uploading: false,
      user: {},
      height: 0,
      visibility: 'visible',
      replyTo: null,
      dzRef: null,
      to: null
    })
  }

  init = () => {
    const keys = this.channel.key
    const contact = this.sbContext.getContact(keys)

    if (!contact) {
      this.setState({ openFirstVisit: true })
    } else {
      this.connect();
    }

    this.processQueue()
    this.processSQueue()
    this.subscribeToNotifications()
  }

  get channel() {
    return this.sbContext.channels[this.props.roomId]
  }

  subscribeToNotifications = () => {
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
            channel_id: this.props.roomId,
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
  processQueue = () => {
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
  processSQueue = () => {
    setInterval(() => {
      while (!_r.isEmpty && !_r.isMaxed) {
        _r.processing++
        const msg = _r.dequeue()
        msg._id = msg._id + Date.now()
        this.sending[msg._id] = msg._id
        this.setState({ messages: [...this.state.messages, msg] }, () => {
          _r.processing--
        })
      }
    }, 25)
  }



  connect = async (username) => {
    try {
      console.log('connecting')
      console.log(this.channel)
      await this.channel.connect(this.receiveMessages)
      if (username) this.sbContext.createContact(username, this.channel.key)
      this.setState({ user: this.sbContext.getContact(this.channel.key) })
      this.getOldMessages()
      if (this.channel.motd !== '') {
        this.sendSystemInfo('MOTD: ' + this.props.channel.motd)
      }

    } catch (e) {
      console.error(e)
    }
  }

  getOldMessages = () => {
    this.channel.getOldMessages(0).then((r) => {
      let controlMessages = [];
      let messages = [];
      for (let i in r) {
        const m = r[i]
        this.receiveMessages(m)
      }
      this.updateMessageState()
      // this.setState({ controlMessages: controlMessages })
      // if (this.channel.motd !== '') {
      //   this.sendSystemInfo('MOTD: ' + this.props.channel.motd, (systemMessage) => {
      //     this.channel.messages = messages
      //     this.setState({ messages: [...messages, systemMessage] })
      //   })
      // } else {
      //   this.channel.messages = messages
      //   this.setState({ messages: this.channel.messages })
      // }
      setTimeout(() => {

        this.openImageGallery()
      }, 1000)

    })
  }

  updateMessageState = () => {

    if (this.updateMessagesTimeout) {
      clearTimeout(this.updateMessagesTimeout)
    }
    this.updateMessagesTimeout = setTimeout(() => {
      this.setState({ messages: this.channel.messages }, () => {
        console.log('updated message state')
        console.log(this.state.messages)
      })
    }, 1000)

  }

  receiveMessages = (m) => {
    try {

      console.warn("Received message: ", m)
      const userId = `${m.sender_pubKey.x} ${m.sender_pubKey.y}`;
      m.user._id = userId;
      m.user.name = this.sbContext.getContact(userId) !== undefined ? this.sbContext.contacts[userId] : m.user.name;
      m.sender_username = m.user.name;


      if (!m.messageType) {
        // an 'app' like this will only process messages that it SPECIFICALLY understands
        // We will attempt to do a legacy processing of the message, but this will be deprecated soon.

        console.warn("Unknown message type received: ", m);
        console.warn("Attempting to process as a legacy chat message... this will be deprecated soon.");
        this.receiveMessagesLegacy(m);
        return
      }
      console.warn(m)
      switch (m.messageType) {
        case messageTypes.SIMPLE_CHAT_MESSAGE:
          console.log('SIMPLE_CHAT_MESSAGE')
          this.handleSimpleChatMessage(m);
          break;
        case messageTypes.FILE_SHARD_METADATA:
          console.log('FILE_SHARD_METADATA')
          const obj = JSON.parse(m.contents)
          this.setState({ controlMessages: [...this.state.controlMessages, m] })
          // Tracks progress
          if (this.toUpload.length > 0) {
            if (this.toUpload.includes(obj.hash)) {
              this.uploaded.push(obj.hash)
              // setProgressBarWidth(Math.ceil(this.uploaded.length / this.toUpload.length * 100));
            }

          }
          if (this.uploaded.length === this.toUpload.length) {
            this.setState({ uploading: false })
          }

          this.knownShards.set(obj.hash, obj.handle)
          break;
        case messageTypes.IMAGE_MESSAGE:
          console.log('IMAGE_MESSAGE')
          this.handleSimpleChatMessage(m);
          break;
        default:
          console.info('---- Ignoring message with unsupported message type');
      }
    } catch (e) {
      console.error(e)
    }
  }

  handleSimpleChatMessage = (msg) => {
    const _messages = JSON.parse(JSON.stringify(this.channel.messages));
    this.channel.messages = _messages.reduce((acc, curr) => {
      const msg_id = curr._id.toString()
      if (!msg_id.match(/^sending/)) {
        acc.push(curr);
      } else {
        delete this.sending[curr._id]
      }
      return acc;
    }, []);
  }

  // For backaward compatibility with older versions of the chat app
  receiveMessagesLegacy = (msg) => {
    const _messages = JSON.parse(JSON.stringify(this.state.messages));
    if (msg) {
      console.log("==== here is the message: (ChatRoom.js)")
      if (!msg.control) {
        const messages = _messages.reduce((acc, curr) => {
          const msg_id = curr._id.toString()
          if (!msg_id.match(/^sending/)) {
            acc.push(curr);
          } else {
            delete this.sending[curr._id]
          }
          return acc;
        }, []);
        const userId = `${msg.user._id.x} ${msg.user._id.y}`;
        msg.user._id = userId;
        msg.user.name = this.sbContext.getContact(msg.user._id) !== undefined ? this.sbContext.contacts[userId] : msg.user.name;
        msg.sender_username = msg.user.name;
        this.setState({ messages: [...messages, msg] }) // merges old messages with new (PSM learning)
      } else {
        this.setState({ controlMessages: [...this.state.controlMessages, msg] })
      }
    } else {
      console.warn("this.receiveMessages() called with empty message")
    }
  }

  notify = (message, severity) => {
    this.props.Notifications.setMessage(message);
    this.props.Notifications.setSeverity(severity);
    this.props.Notifications.setOpen(true)
  }

  openImageOverlay = (message) => {
    this.props.inhibitSwipe(1)
    let _images = [];
    for (let x in this.state.messages) {
      if (this.state.messages[x].image !== '') {
        _images.push(this.state.messages[x])
      }
    }
    this.setState({ img: message, openPreview: true, images: _images })
  }

  imageOverlayClosed = () => {
    this.props.inhibitSwipe(0)
    this.setState({ openPreview: false, img: '', imgLoaded: false })
  }

  openImageGallery = () => {
    this.props.inhibitSwipe(1)
    let _images = [];
    for (let x in this.state.messages) {
      if (this.state.messages[x].image !== '') {
        _images.push(this.state.messages[x])
      }
    }
    this.setState({ openGallery: true, images: _images })
  }

  imageGalleryClosed = () => {
    this.props.inhibitSwipe(0)
    this.setState({ openGallery: false, img: '', imgLoaded: false })
  }

  promptUsername = (context) => {
    this.setState({ openChangeName: true, changeUserNameProps: context })
  }

  handleReply = (user) => {
    try {
      if (this.sbContext.owner) {
        this.setState({ replyTo: user._id, openWhisper: true })
      } else {
        this.notify('Whisper is only for room owners.', 'info')
      }
    } catch (e) {
      console.log(e);
      this.notify(e.message, 'error')
    }
  }

  loadFiles = () => {
    this.setState({ loading: false, files: true })
  }
  //TODO: for images render in chat and then replace with received message
  sendFiles = async (giftedMessage) => {
    // let this.toUpload = []
    this.setState({ files: false, uploading: true }, () => {
      for (const [key, value] of FileHelper.finalFileList.entries()) {

        if (value.sbImage) {
          console.log('key', key)
          console.log('value', value)
          const message = {
            createdAt: new Date(),
            text: "",
            messageType: messageTypes.SIMPLE_CHAT_MESSAGE,
            image: value.sbImage.thumbnail,
            user: this.sbContext.getContact(this.channel.key),
            _id: 'sending_' + giftedMessage[0]._id + Date.now()
          }
          _r.enqueue(message)
          value.sbImage.thumbnailReady.then(() => {
            let sbm = this.channel.newMessage('')
            sbm.contents.image = value.sbImage.thumbnail
            const imageMetaData = {
              fullImageHash: value.uniqueShardId,
              thumbnailHash: value.sbImage.thumbnailDetails.uniqueShardId,
              previewHash: value.sbImage.previewDetails.uniqueShardId,
            }
            sbm.contents.messageType = messageTypes.IMAGE_MESSAGE
            sbm.contents.fileMetadata = imageMetaData;
            q.enqueue(sbm)
          })
        }
      }
    })

    FileHelper.finalFileList.forEach((value, key) => {
      // TODO (matt): this loop spins up a promise for every file that needs to be this.uploaded,
      //              so we need some sort of progress feedback etc. especially since it's
      //              a data room.  we could add a little progress icon next to each line of a
      //              file that "spins" and then becomes a check mark when it's confirmed, note
      //              that it is not FULLY confirmed until it "echoes" back to us!
      const fileHash = value.uniqueShardId;

      console.log(`---- uploading file ${key} with hash ${fileHash} ...`)
      const buffer = FileHelper.globalBufferMap.get(fileHash)
      if (!buffer) {
        console.error(`**** failed to find buffer for ${fileHash} (should not happen)`)
      } else {
        this.toUpload.push(fileHash)
        FileHelper.uploadBuffer(this.props.roomId, buffer).then((handle) => {
          // the return value is of type Interfaces.SBObjectHandle
          // now we add it to the set of known hash->handle mappings
          // we *synchronously* know all fileHash values, but the returned handles are asynch outcomes
          // knownShards.set(fileHash, handle)
          // .. TODO: we need to track every new 'fileHash' like we do with 'ack's to make sure they are echoed back
          // our mapping object
          const obj = { hash: fileHash, handle: handle }
          // and we separately send a message with the specific shard/file info (eg hash -> SBObjectHandle mapping)
          const sbm = this.channel.newMessage(JSON.stringify(obj))
          sbm.contents.messageType = messageTypes.FILE_SHARD_METADATA;
          this.channel.sendMessage(sbm)
        })
      }
    })


  }

  sendMessages = (giftedMessage) => {
    console.log(giftedMessage)
    // await new Promise(resolve => setTimeout(resolve, 0)); // JS breathing room
    if (giftedMessage[0].text === "") {
      if (this.state.files) {
        this.sendFiles(giftedMessage)
      }
    } else {
      giftedMessage[0]._id = 'sending_' + giftedMessage[0]._id;
      const msg_id = giftedMessage[0]._id;
      console.log("==== here is the context:")
      console.log(this.sbContext)
      console.log("==== here is the channel:")
      console.log(this.sbContext.socket)
      giftedMessage[0].user = this.state.user
      this.setState({ messages: [...this.state.messages, giftedMessage[0]] })
      this.sending[msg_id] = msg_id
      let sbm = this.channel.newMessage(giftedMessage[0].text)
      sbm.contents.messageType = messageTypes.SIMPLE_CHAT_MESSAGE;
      this.channel.sendMessage(sbm)
    }
  }

  sendSystemInfo = (msg_string, callback) => {
    const systemMessage = {
      _id: this.state.messages.length,
      text: msg_string,
      createdAt: new Date(),
      user: { _id: 'system', name: 'System Message' },
      whispered: false,
      verified: true,
      info: true
    }
    this.setState({
      messages: [...this.state.messages, systemMessage]
    }, () => {
      if (callback) {
        callback(systemMessage)
      }
    })
  }

  sendSystemMessage = (message) => {
    this.setState({
      messages: [...this.state.messages, {
        _id: `${this.state.messages.length}_${Date.now()}`,
        user: { _id: 'system', name: 'System Message' },
        createdAt: new Date(),
        text: message + '\n\n Details in console'
      }]
    })
  }

  openAttachMenu = (e) => {
    this.setState({ anchorEl: e.currentTarget });
  }

  handleClose = () => {
    this.setState({ anchorEl: null });
  };

  removeInputFiles = () => {
    if (document.getElementById('fileInput')) {

      document.getElementById('fileInput').value = '';
    }
    this.setState({ files: false })
  }

  showLoading = (bool) => {
    this.setState({ loading: bool })
  }

  saveUsername = (newUsername, _id) => {
    this.sbContext.createContact(newUsername, _id)
    const _m = Object.assign(this.state.messages)
    _m.forEach((_message, i) => {
      console.log(_message, i)
      if (_message.user._id === _id) {
        _message.user.name = newUsername;
        _message.sender_username = newUsername;
        _m[i] = _message;
      }
    })

    this.setState({ messages: _m, changeUserNameProps: {}, openChangeName: false }, () => {
      this.sbContext.messages = _m;
    });

  }

  // setFiles = (files) => {
  //   this.setState({ files: [...files, ...this.state.files] })
  // }

  closeWhisper = () => {
    this.setState({ openWhisper: false })
  }

  setOpenAdminDialog = (opened) => {
    this.setState({ openAdminDialog: opened })
  }

  setDropzoneRef = (ref) => {

    if (ref && !this.state.dzRef) {
      console.log(ref)
      this.setState({ dzRef: ref })
    }

  }

  inputErrored = (errored) => {
    this.setState({ inputError: errored })
  }

  render() {
    if (this.state.to) {
      return (<Navigate to={this.state.to} />)
    }
    // let inverted = false;

    return (

      <SafeAreaView id={'sb_chat_area'} style={{
        flexGrow: 1,
        flexBasis: 'fit-content',
        height: isMobile && !this.state.typing ? this.state.height - 36 : this.state.height,
        width: '100%',
        paddingTop: 48
      }}>
        <DropZone notify={this.notify} dzRef={this.setDropzoneRef} showFiles={this.loadFiles} showLoading={this.showLoading} openPreview={this.state.openPreview} roomId={this.state.roomId}>
          <AdminDialog open={this.state.openAdminDialog} sendSystemInfo={this.sendSystemInfo} onClose={() => {
            this.setOpenAdminDialog(false)
            this.props.onCloseAdminDialog()
          }} />
          <WhisperUserDialog replyTo={this.state.replyTo} open={this.state.openWhisper} onClose={this.closeWhisper} />
          <ImageOverlay
            sbContext={this.sbContext}
            images={this.state.images}
            open={this.state.openPreview}
            img={this.state.img}
            controlMessages={this.state.controlMessages}
            imgLoaded={this.state.imgLoaded}
            onClose={this.imageOverlayClosed} />
          <SharedRoomStateContext.Consumer>
            {(roomState) => (
              <ImageGallery
                sbContext={this.sbContext}
                images={this.state.images}
                open={roomState.state.openImageGallery}
                img={this.state.img}
                controlMessages={this.state.controlMessages}
                imgLoaded={this.state.imgLoaded}
                onClose={() => {
                  roomState.setOpenImageGallery(false)
                }} />
            )}
          </SharedRoomStateContext.Consumer>

          <ChangeNameDialog {...this.state.changeUserNameProps} open={this.state.openChangeName} onClose={(userName, _id) => {
            this.saveUsername(userName, _id)
            // this.setState({ openChangeName: false })
          }} />
          {/* <AttachMenu open={attachMenu} handleClose={this.handleClose} /> */}
          <FirstVisitDialog open={this.state.openFirstVisit} sbContext={this.sbContext} messageCallback={this.recieveMessages} onClose={(username) => {
            this.setState({ openFirstVisit: false })
            this.connect(username)
          }} roomId={this.state.roomId} />
          <GiftedChat
            id={`sb_chat_${this.state.roomId}`}
            isKeyboardInternallyHandled={false}
            wrapInSafeArea={false}
            className={'sb_chat_container'}
            style={{
              width: '100%'
            }}
            messages={this.state.messages}
            onSend={this.sendMessages}

            user={this.state.user}
            inverted={false}
            alwaysShowSend={true}
            loadEarlier={this.sbContext.moreMessages}
            isLoadingEarlier={this.sbContext.loadingMore}
            onLoadEarlier={this.getOldMessages}
            renderMessage={RenderMessage}
            renderActions={(props) => {
              return <RenderAttachmentIcon
                {...props}
                roomId={this.state.roomId}
                dzRef={this.state.dzRef}
                openAttachMenu={this.openAttachMenu}
                showLoading={this.showLoading} />
            }}

            renderAvatar={RenderAvatar}
            renderMessageImage={(props) => {
              return <RenderImage
                {...props}
                roomId={this.state.roomId}
                openImageOverlay={this.openImageOverlay}
                downloadImage={this.downloadImage}
                controlMessages={this.state.controlMessages}
                sendSystemMessage={this.sendSystemMessage}
                notify={this.notify}
                sbContext={this.sbContext} />
            }}
            renderMessageText={RenderMessageText}
            scrollToBottom={true}
            showUserAvatar={true}
            onPressAvatar={this.promptUsername}
            onLongPressAvatar={(context) => {
              return this.handleReply(context)
            }}
            renderChatFooter={() => {
              return <RenderChatFooter
                roomId={this.state.roomId}
                removeInputFiles={this.removeInputFiles}
                files={this.state.files}
                // setFiles={this.setFiles}
                uploading={this.state.uploading}
                loading={this.state.loading} />
            }}
            renderBubble={(props) => {
              // PSM TODO: what does this need channel keys for?
              return <RenderBubble {...props} keys={{ /* ...this.sbContext.socket.keys, */ ...this.channel.key }}
                socket={this.channel.socket}
                SB={this.SB} />
            }}
            renderSend={(props) => {
              return <RenderSend {...props}
                roomId={this.state.roomId}
                inputError={this.state.inputError} />
            }}
            renderComposer={(props) => {
              return <RenderComposer {...props}
                roomId={this.state.roomId}
                inputErrored={this.inputErrored}
                onFocus={() => {
                  this.setState({ typing: true })
                }}
                onBlur={() => {
                  this.setState({ typing: false })
                }}
                // setFiles={this.setFiles}
                filesAttached={this.state.files}
                showLoading={this.showLoading} />
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
  }
}

export default ChatRoom;