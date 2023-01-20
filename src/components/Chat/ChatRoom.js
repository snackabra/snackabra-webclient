/* Copyright (c) 2021 Magnusson Institute, All Rights Reserved */

import * as React from 'react';
import { GiftedChat } from 'react-native-gifted-chat';
import RenderBubble from "./RenderBubble";
import RenderAvatar from "./RenderAvatar";
import RenderAttachmentIcon from "./RenderAttachmentIcon";
import ImageOverlay from "../Modals/ImageOverlay";
import RenderImage from "./RenderImage";
import ChangeNameDialog from "../Modals/ChangeNameDialog";
import MotdDialog from "../Modals/MotdDialog";
import RenderChatFooter from "./RenderChatFooter";
import RenderMessage from "./RenderMessage";
import RenderTime from "./RenderTime";
import { Dimensions } from "react-native";
// import AttachMenu from "./AttachMenu";
import FirstVisitDialog from "../Modals/FirstVisitDialog";
import RenderSend from "./RenderSend";
import WhisperUserDialog from "../Modals/WhisperUserDialog";
import RenderComposer from "./RenderComposer";
import Queue from "../../utils/Queue";
import { observer } from "mobx-react"
import { SafeAreaView } from 'react-native-safe-area-context';
import { isMobile } from 'react-device-detect';

const q = new Queue()
const _r = new Queue()
const SB = require('snackabra')

@observer
class ChatRoom extends React.Component {
  sending = {}
  state = {
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
    files: [],
    images: [],
    loading: false,
    uploading: false,
    user: {},
    height: 0,
    visibility: 'visible',
    replyTo: null
  }
  sbContext = this.props.sbContext

  componentDidMount() {

    const handleResize = (e) => {
      const { height } = Dimensions.get('window')
      this.setState({ height: height })
    }

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
      this.setState({ messages: this.sbContext.messages }, () => {
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
            this.setState({ messages: [...messages] })
          }

        })
      })
    }).catch((e) => {
      if (e.match(/^No such channel on this server/)) {
        let i = 5
        setInterval(() => {
          this.notify(e + ` Channel ID: ${this.props.roomId}} redirecting you in ${i} seconds`, 'error')
          i--
        }, 1000)

        setTimeout(() => {
          window.location.replace(window.location.origin)
        }, 5000)
      }
    })
  }

  recieveMessages = (msg) => {
    if (msg) {
      if (!msg.control) {
        const messages = this.state.messages.reduce((acc, curr) => {
          if (!curr._id.match(/^sending/)) {
            acc.push(curr);
          } else {
            delete this.sending[curr._id]
          }
          return acc;
        }, []);
        this.setState({ messages: [...messages, msg] })
      } else {
        this.setState({ controlMessages: [...this.state.controlMessages, msg] })
      }

    }
  }

  notify = (message, severity) => {
    this.props.Notifications.setMessage(message);
    this.props.Notifications.setSeverity(severity);
    this.props.Notifications.setOpen(true)
  }

  openImageOverlay = (message) => {
    this.setState({ img: message.image, openPreview: true })
    console.log(this.sbContext)
    console.log("image metadata")
    console.log(message.imageMetaData)
    this.sbContext.SB.storage.retrieveImage(message.imageMetaData, this.state.controlMessages).then((data) => {
      console.log(data)
      if (data.hasOwnProperty('error')) {
        console.error(data['error'])
        this.notify('Could not load full size image', 'warning')
      } else {
        this.setState({ img: data['url'], imgLoaded: true })
      }
    }).catch((error) => {
      console.error('openPreview() exception: ' + error.message);
      this.notify('Could not load full size image', 'warning')
      this.setState({ openPreview: false })
    })

  }

  imageOverlayClosed = () => {
    this.setState({ openPreview: false, img: '', imgLoaded: false })
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
          createdAt: new Date().toString(),
          text: "",
          image: file.url,
          user: this.sbContext.user,
          _id: 'sending_' + giftedMessage[0]._id + Date.now()
        }
        _r.enqueue(message)
        filesArray.push(file)
      })

      for (let x in filesArray) {
        const sbImage = filesArray[x]
        sbImage.thumbnailReady.then(async () => {
          const storePromises = await sbImage.getStorePromises(this.sbContext.activeroom)
          let sbm = new SB.SBMessage(this.sbContext.socket)
          // populate
          sbm.contents.image = _files[x].thumbnail
          const imageMetaData = {
            imageId: sbImage.objectMetadata.full.id,
            imageKey: sbImage.objectMetadata.full.key,
            previewId: sbImage.objectMetadata.preview.id,
            previewKey: sbImage.objectMetadata.preview.key,
          }
          sbm.contents.imageMetaData = imageMetaData;
          q.enqueue(sbm)
          Promise.all([storePromises.previewStorePromise]).then((previewVerification) => {
            console.log()
            console.log('Preview image uploaded')
            previewVerification[0].verification.then((verification) => {
              // now the preview (up to 2MiB) has been safely stored
              let controlMessage = new SB.SBMessage(this.sbContext.socket);
              // controlMessage.imageMetaData = imageMetaData;
              controlMessage.contents.control = true;
              controlMessage.contents.verificationToken = verification;
              controlMessage.contents.id = imageMetaData.previewId;
              q.enqueue(controlMessage)
              queueMicrotask(() => {
                storePromises.fullStorePromise.then((verificationPromise) => {
                  console.log(verificationPromise)
                  verificationPromise.verification.then((verification) => {
                    console.log('Full image uploaded')
                    let controlMessage = new SB.SBMessage(this.sbContext.socket);
                    controlMessage.contents.control = true;
                    controlMessage.contents.verificationToken = verification;
                    controlMessage.contents.id = imageMetaData.imageId;
                    q.enqueue(controlMessage)
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
    if (giftedMessage[0].text === "") {
      if (this.state.files.length > 0) {
        this.sendFiles(giftedMessage)
      }
    } else {
      giftedMessage[0]._id = 'sending_' + giftedMessage[0]._id;
      const msg_id = giftedMessage[0]._id;

      giftedMessage[0].user = { _id: JSON.stringify(this.sbContext.socket.exportable_pubKey), name: this.sbContext.username }
      this.setState({ messages: [...this.state.messages, giftedMessage[0]] })
      this.sending[msg_id] = msg_id
      let sbm = new SB.SBMessage(this.sbContext.socket, giftedMessage[0].text)
      sbm.send();

    }
  }

  sendSystemInfo = (msg_string, callback) => {
    const systemMessage = {
      _id: this.state.messages.length,
      text: msg_string,
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
    this.setState({ files: [], images: [] })
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
    const _messages = this.state.messages.map((message) => {
      if (message.user._id === _id) {
        message.user.name = newUsername;
        message.sender_username = newUsername;
      }
      return message;
    });
    this.setState({ messages: [] }, () => {
      this.setState({ messages: _messages, changeUserNameProps: {} })
      this.sbContext.messages = _messages;
    });
  }

  setFiles = (files) => {
    this.setState({ files: files })
  }

  setImageFiles = (files) => {
    this.setState({ images: files })
  }

  closeWhisper = () => {
    this.setState({ openWhisper: false })
  }
  render() {
    return (

      <SafeAreaView style={{
        flexGrow: 1,
        flexBasis: 'fit-content',
        height: isMobile && !this.state.typing ? this.state.height - 36 : this.state.height,
        paddingTop: 48
      }}>
        <WhisperUserDialog replyTo={this.state.replyTo} open={this.state.openWhisper} onClose={this.closeWhisper} />
        <ImageOverlay open={this.state.openPreview} img={this.state.img} imgLoaded={this.state.imgLoaded}
          onClose={this.imageOverlayClosed} />
        <ChangeNameDialog {...this.state.changeUserNameProps} open={this.state.openChangeName} onClose={(userName, _id) => {
          this.saveUsername(userName, _id)
          this.setState({ openChangeName: false })
        }} />
        <MotdDialog open={this.state.openMotd} roomName={this.props.roomName} />
        {/* <AttachMenu open={attachMenu} handleClose={this.handleClose} /> */}
        <FirstVisitDialog open={this.state.openFirstVisit} sbContext={this.sbContext} messageCallback={this.recieveMessages} onClose={(username) => {
          this.setState({ openFirstVisit: false })
          this.connect(username)
        }} roomId={this.state.roomId} />
          <GiftedChat
            messages={this.state.messages}
            onSend={this.sendMessages}
            // timeFormat='L LT'
            user={this.sbContext.user}
            inverted={false}
            alwaysShowSend={true}
            loadEarlier={this.props.sbContext.moreMessages}
            isLoadingEarlier={this.props.sbContext.loadingMore}
            onLoadEarlier={this.getOldMessages}
            renderActions={(props) => {
              return <RenderAttachmentIcon
                {...props}
                addFile={this.loadFiles}
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
            renderMessageText={RenderMessage}
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
              return <RenderBubble {...props} keys={{ ...this.props.sbContext.socket.keys, ...this.props.sbContext.userKey }}
                socket={this.props.sbContext.socket}
                SB={this.SB} />
            }}
            renderSend={RenderSend}
            renderComposer={(props) => {
              return <RenderComposer {...props}
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
      </SafeAreaView>


    )
  }
}

export default ChatRoom;