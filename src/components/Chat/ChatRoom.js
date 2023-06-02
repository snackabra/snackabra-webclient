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

const q = new Queue()
const _r = new Queue()
let SB = require(process.env.NODE_ENV === 'development' ? 'snackabra/dist/snackabra' : 'snackabra')
console.log("SB Version: ", SB.version)


@observer
class ChatRoom extends React.PureComponent {
  sbContext = this.props.sbContext
  sending = {}
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
    messages: this.sbContext.rooms[this.props.roomId]?.messages ? toJS(this.sbContext.rooms[this.props.roomId].messages) : [],
    controlMessages: [],
    roomId: this.props.roomId || 'offline',
    files: [],
    images: [],
    loading: false,
    uploading: false,
    user: this.sbContext.rooms[this.props.roomId]?.userName && this.sbContext.rooms[this.props.roomId]?.key ? { _id: JSON.stringify(this.sbContext.rooms[this.props.roomId]?.key), name: this.sbContext.rooms[this.props.roomId]?.userName } : {},
    height: 0,
    visibility: 'visible',
    replyTo: null,
    dzRef: null,
    to: null
  }


  componentDidMount() {
    const handleResize = (e) => {
      const { height } = Dimensions.get('window')
      this.setState({ height: height })
    }
    window.saveUsername = this.saveUsername
    window.addEventListener('resize', handleResize)
    window.addEventListener('orientationchange', handleResize)
    window.addEventListener('touchmove', (e) => {
      setTimeout(() => {
        handleResize(e)
      }, 400)

    });
    handleResize();

    // reconnect when window comes into focus and the state of the socket is not opened
    document.addEventListener("visibilitychange", () => {
      if (this.state.visibility === 'hidden' && document.visibilityState === 'visible' && this.sbContext.socket?.status !== 'OPEN') {
        this.connect();
      }
      this.setState({ visibility: document.visibilityState })
    })
    this.sbContext.getChannel(this.props.roomId).then((data) => {
      if (!data?.key) {
        this.setState({ openFirstVisit: true })
      } else {
        this.connect();
      }
    })
    this.processQueue()
    this.processSQueue()
    this.subscribeToNotifications()
  }

  componentDidUpdate(prevProps) {

    // Typical usage (don't forget to compare props):
    if (this.props.openAdminDialog !== prevProps.openAdminDialog) {
      this.setOpenAdminDialog(this.props.openAdminDialog);
    }
    if (prevProps.roomId !== this.props.roomId) {
      this.sbContext.getChannel(this.props.roomId).then((data) => {
        if (!data?.key) {
          this.setState({ openFirstVisit: true })
        } else {

          this.connect();

        }
      })
    }
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
      messages: this.sbContext.rooms[this.props.roomId]?.messages ? toJS(this.sbContext.rooms[this.props.roomId].messages) : [],
      controlMessages: [],
      roomId: this.props.roomId || 'offline',
      files: [],
      images: [],
      loading: false,
      uploading: false,
      user: this.sbContext.rooms[this.props.roomId]?.userName && this.sbContext.rooms[this.props.roomId]?.key ? { _id: JSON.stringify(this.sbContext.rooms[this.props.roomId]?.key), name: this.sbContext.rooms[this.props.roomId]?.userName } : {},
      height: 0,
      visibility: 'visible',
      replyTo: null,
      dzRef: null,
      to: null
    })
  }

  subscribeToNotifications = () => {
    setTimeout(async () => {

      console.log(window.sw_registration)
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
 * when sending multiple images gifted chat sees that a single message 
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
    const room = await this.sbContext.getChannel(this.props.roomId)
    const options = {
      roomId: this.props.roomId,
      username: username ? username : 'Unnamed',
      key: room?.key ? room?.key : null,
      secret: null,
      messageCallback: this.recieveMessages
    }
    this.sbContext.connect(options).then(() => {
      this.setState({ user: this.sbContext.user })
      this.sbContext.getOldMessages(0).then((r) => {
        let controlMessages = [];
        let messages = [];
        r.forEach((m, i) => {
          if (!m.control) {
            const user_pubKey = m.user._id;
            m.user._id = JSON.stringify(m.user._id);
            m.user.name = this.sbContext.contacts[user_pubKey.x + ' ' + user_pubKey.y] !== undefined ? this.sbContext.contacts[user_pubKey.x + ' ' + user_pubKey.y] : m.user.name;
            m.sender_username = m.user.name;
            m.createdAt = new Date(parseInt(m.timestampPrefix, 2));
            messages.push(m)
          } else {
            controlMessages.push(m)
          }

        })
        this.setState({ controlMessages: controlMessages })
        if (this.sbContext.motd !== '') {
          this.sendSystemInfo('MOTD: ' + this.props.sbContext.motd, (systemMessage) => {
            this.sbContext.messages = messages
            this.setState({ messages: [...messages, systemMessage] })
          })
        } else {
          this.sbContext.messages = messages
          this.setState({ messages: this.sbContext.messages })
        }
        setTimeout(() => {

          this.openImageGallery()
        }, 1000)

      })

    }).catch((e) => {
      if (e.match(/^No such channel on this server/)) {
        this.notify(e + ` Channel ID: ${this.props.roomId}}`, 'error')

        setTimeout(() => {
          this.setState({ to: "/" })
        }, 5000)
      }
    })
  }

  recieveMessages = (msg) => {
    if (msg) {
      console.log("==== here is the message: (ChatRoom.js)")
      console.warn(msg)
      if (!msg.control) {
        const messages = this.state.messages.reduce((acc, curr) => {
          const msg_id = curr._id.toString()
          if (!msg_id.match(/^sending/)) {
            acc.push(curr);
          } else {
            delete this.sending[curr._id]
          }
          return acc;
        }, []);
        this.setState({ messages: [...messages, msg] }) // merges old messages with new (PSM learning)
      } else {
        this.setState({ controlMessages: [...this.state.controlMessages, msg] })
      }
    } else {
      console.warn("this.recieveMessages() called with empty message")
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

  loadFiles = async (loaded) => {
    this.setState({ loading: false, files: loaded })
  }
  //TODO: for images render in chat and then replace with received message
  sendFiles = async (giftedMessage) => {
    this.setState({ uploading: true })
    const filesArray = [];
    const _files = this.state.files;
    this.setState({ files: [] }, () => {
      _files.forEach((file, i) => {
        const message = {
          createdAt: new Date(),
          text: "",
          image: file.url,
          user: this.sbContext.user,
          _id: 'sending_' + giftedMessage[0]._id + Date.now()
        }
        _r.enqueue(message)
        filesArray.push(file)
      })

      // from snackabra interfaces:

      // interface ImageMetaData {
      //   imageId?: string,
      //   previewId?: string,
      //   imageKey?: string,
      //   previewKey?: string,
      //   // nonce and salt not needed, but if it's there, we do extra checks
      //   previewNonce?: string,
      //   previewSalt?: string
      // }

      // interface SBMessageContents {
      //   sender_pubKey?: JsonWebKey,
      //   sender_username?: string,
      //   encrypted: boolean,
      //   isVerfied: boolean,
      //   contents: string,
      //   sign: string,
      //   image: string,
      //   image_sign?: string,
      //   imageMetadata_sign?: string,
      //   imageMetaData?: ImageMetaData,
      // }

      for (let x in filesArray) {
        const sbImage = filesArray[x]
        sbImage.thumbnailReady.then(async () => {
          const storePromises = await sbImage.getStorePromises(this.sbContext.activeroom)
          const imageMetaData = {
            imageId: sbImage.objectMetadata.full.id,
            imageKey: sbImage.objectMetadata.full.key,
            previewId: sbImage.objectMetadata.preview.id,
            previewKey: sbImage.objectMetadata.preview.key,
          }
          const _contents = {
            image: _files[x].thumbnail,
            imageMetaData: imageMetaData,
          }
          let sbm = this.sbContext.newMessage(_contents)
          q.enqueue(sbm)
          Promise.all([storePromises.previewStorePromise]).then((previewVerification) => {
            console.log('Preview image uploaded')
            previewVerification[0].verification.then((verification) => {
              // now the preview (up to 2MiB) has been safely stored
              // let controlMessage = new SB.SBMessage(this.sbContext.socket);
              // controlMessage.imageMetaData = imageMetaData;
              const controlMessageContents = {
                control: true,
                verificationToken: verification,
                id: imageMetaData.previewId
              }
              let controlMessage = this.sbContext.newMessage(controlMessageContents)
              // controlMessage.contents.control = true;
              // controlMessage.contents.verificationToken = verification;
              // controlMessage.contents.id = imageMetaData.previewId;
              q.enqueue(controlMessage)
              queueMicrotask(() => {
                storePromises.fullStorePromise.then((verificationPromise) => {
                  console.log(verificationPromise)
                  verificationPromise.verification.then((_f_verification) => {
                    console.log('Full image uploaded')
                    // let _f_controlMessage = new SB.SBMessage(this.sbContext.socket);
                    let _f_controlMessageContents = {
                      control: true,
                      verificationToken: _f_verification,
                      id: imageMetaData.imageId
                    }
                    let _f_controlMessage = this.sbContext.newMessage(_f_controlMessageContents)
                    // _f_controlMessage.contents.control = true;
                    // _f_controlMessage.contents.verificationToken = _f_verification;
                    // _f_controlMessage.contents.id = imageMetaData.imageId;
                    q.enqueue(_f_controlMessage)
                  });
                });
              })
            })
          }).finally(() => {
            if (Number(x) === filesArray.length - 1) {
              this.setState({ uploading: false })
              this.removeInputFiles()
            }
          })
        })
      }
    })
  }

  sendMessages = async (giftedMessage) => {
    await new Promise(resolve => setTimeout(resolve, 0)); // JS breathing room
    if (giftedMessage[0].text === "") {
      if (this.state.files.length > 0) {
        this.sendFiles(giftedMessage)
      }
    } else {
      giftedMessage[0]._id = 'sending_' + giftedMessage[0]._id;
      const msg_id = giftedMessage[0]._id;
      console.log("==== here is the context:")
      console.log(this.sbContext)
      console.log("==== here is the channel:")
      console.log(this.sbContext.socket)
      giftedMessage[0].user = { _id: JSON.stringify(this.sbContext.socket.exportable_pubKey), name: this.sbContext.username }
      this.setState({ messages: [...this.state.messages, giftedMessage[0]] })
      this.sending[msg_id] = msg_id
      // let sbm = new SB.SBMessage(this.sbContext.socket, giftedMessage[0].text)
      let sbm = this.sbContext.newMessage(giftedMessage[0].text)
      sbm.send();

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
    this.setState({ files: [] })
  }

  showLoading = (bool) => {
    this.setState({ loading: bool })
  }

  saveUsername = (newUsername, _id) => {
    if (_id === this.sbContext.user._id) {
      console.log('its me!!!')
      this.sbContext.username = newUsername;
    }
    const contacts = this.sbContext.contacts
    const user_pubKey = JSON.parse(_id);
    contacts[user_pubKey.x + ' ' + user_pubKey.y] = newUsername;
    this.sbContext.contacts = contacts;
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

  setFiles = (files) => {
    this.setState({ files: [...files, ...this.state.files] })
  }

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
    let messages = this.state.messages


    return (

      <SafeAreaView id={'sb_chat_area'} style={{
        flexGrow: 1,
        flexBasis: 'fit-content',
        height: isMobile && !this.state.typing ? this.state.height - 36 : this.state.height,
        width: '100%',
        paddingTop: 48
      }}>
        <DropZone notify={this.notify} dzRef={this.setDropzoneRef} addFile={this.loadFiles} showLoading={this.showLoading} overlayOpen={this.state.openPreview}>
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
            isKeyboardInternallyHandled={false}
            wrapInSafeArea={false}
            className={'sb_chat_container'}
            style={{
              width: '100%'
            }}
            messages={messages}
            onSend={this.sendMessages}
            // timeFormat='L LT'
            user={this.state.user}
            inverted={false}
            alwaysShowSend={true}
            loadEarlier={this.props.sbContext.moreMessages}
            isLoadingEarlier={this.props.sbContext.loadingMore}
            onLoadEarlier={this.getOldMessages}
            renderMessage={RenderMessage}
            renderActions={(props) => {
              return <RenderAttachmentIcon
                {...props}
                dzRef={this.state.dzRef}
                openAttachMenu={this.openAttachMenu}
                showLoading={this.showLoading} />
            }}
            //renderUsernameOnMessage={true}
            // infiniteScroll={true}   // This is not supported for web yet
            renderAvatar={RenderAvatar}
            renderMessageImage={(props) => {
              return <RenderImage
                {...props}
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
              return <RenderChatFooter removeInputFiles={this.removeInputFiles}
                files={this.state.files}
                setFiles={this.setFiles}
                uploading={this.state.uploading}
                loading={this.state.loading} />
            }}
            renderBubble={(props) => {
              // PSM TODO: what does this need channel keys for?
              return <RenderBubble {...props} keys={{ /* ...this.props.sbContext.socket.keys, */ ...this.props.sbContext.userKey }}
                socket={this.props.sbContext.socket}
                SB={this.SB} />
            }}
            renderSend={(props) => {
              return <RenderSend {...props} inputError={this.state.inputError} />
            }}
            renderComposer={(props) => {
              return <RenderComposer {...props}
                inputErrored={this.inputErrored}
                onFocus={() => {
                  this.setState({ typing: true })
                }}
                onBlur={() => {
                  this.setState({ typing: false })
                }}
                setFiles={this.setFiles}
                filesAttached={this.state.files.length > 0}
                showLoading={this.showLoading} />
            }}
            onLongPress={() => false}
            keyboardShouldPersistTaps='always'
            renderTime={RenderTime}
            parsePatterns={(linkStyle) => [
              { type: 'phone', style: {}, onPress: undefined }
            ]}
          />
        </DropZone>
      </SafeAreaView>
    )
  }
}

export default ChatRoom;