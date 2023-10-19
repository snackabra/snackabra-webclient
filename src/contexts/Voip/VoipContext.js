import * as React from "react"
import { isMobile } from "react-device-detect";
import { Divider, FormControl, Grid, IconButton, InputLabel, Select, Menu, MenuItem, MenuList, ListItemText } from "@mui/material";
import { StopScreenShare, ScreenShare, Videocam, VideocamOff, Mic, MicOff, CallEnd, MoreVert, Call, Close } from '@mui/icons-material/';
import WorkerE2EE from "./Worker.js";
import SnackabraContext from "../../contexts/SnackabraContext.js";

const VoipContext = React.createContext(undefined);

let webRTCconfig = {
  'iceServers': [{
    'urls': 'stun:216.228.192.76:3478'
  }],
  encodedInsertableStreams: true
};

// const worker = WorkerE2EE.toString();
const blob = new Blob([`${WorkerE2EE}`]);


export class VoipProvider extends React.Component {
  messageType = '7a962646710f4aefb44a709aaa04ba41' // DO NOT CHANGE THIS
  lastMessage;
  messages = []
  pc = {};
  localStream;
  Crypto;
  myKey;
  myId;
  sbContext;
  channel;
  channelId;
  videoCFG = true;
  audioCFG = true;
  worker = new Worker(URL.createObjectURL(blob), { name: '384 E2EE worker', writable: true, readable: true });
  preferredVideoCodecMimeType = 'video/VP8';
  localVideo;
  remoteVideo = {};
  srdAnswerPending = false;
  ignoreOffer = false;
  makingOffer = false;

  state = {
    open: false,
    connected: false,
    screenShared: false,
  }
  componentDidMount = () => {
    this.worker.onmessage = (e) => {
      if (e.data.operation === 'log') {
        console.log(JSON.parse(e.data.args))
      } else {
        console.log(e)
      }
    }
    this.worker.onerror = (e) => {
      console.error(e)
    }
  }

  openCallWindow = (key, channelId) => {
    this.myKey = key
    this.channelId = channelId
    console.log('openCallWindow', key, channelId)
    this.setState({ open: true })
  }

  setLocalVideo = (video) => {
    this.localVideo = video
  }

  setRemoteVideo = (video) => {
    this.remoteVideo = video
  }

  addRemoteVideo = (_id) => {
    // this.remoteVideo[_id] = document.getElementById(_id)
  }

  addEventListeners = () => {

  }

  initVideoCallClick = async (key, channel) => {
    this.connect(key, channel)
    await this.joinPeers()
    this.createPeerConnection()
  }

  joinCallClick = async (joinKey, channel) => {
    await this.connect(joinKey, channel)
    this.joinPeers()
  }

  hangupClick = async () => {
    this.hangup(this.myId);
    this.sendMessage({ type: 'bye' });
  }

  shareScreenClick = async () => {

    this.hangup(this.myId);
    navigator.mediaDevices.getDisplayMedia({ audio: this.audioCFG, video: this.videoCFG }).then(async (stream) => {
      this.localStream = stream;
      this.localVideo.srcObject = this.localStream;
      // Use the screen stream with WebRTC


      const offer = await this.pc.createOffer();
      this.sendMessage({ type: 'offer', sdp: offer.sdp });
      await this.pc.setLocalDescription(offer);
    }).catch(function (error) {
      if (error.name === 'NotAllowedError') {
        console.error('Screen sharing was canceled by the user.');
      } else {
        console.error('Could not share the screen: ', error);
      }
    })

  }

  stopClick = async () => {
    this.reInit()
  }

  receiveMessage = async (message) => {

    if (message.messageType !== this.messageType) return
    this.lastMessage = message
    this.messages.push(message);
    if (message.sender_pubKey.x + ' ' + message.sender_pubKey.y !== this.myKey.x + ' ' + this.myKey.y) {
      const rtcMessage = JSON.parse(message.text)
      console.log(rtcMessage)
      this.signalingMessageCallback(rtcMessage)
    }

  }


  connect = (key, channel) => {
    this.myKey = key
    this.myId = this.sbContext.getContact(key)._id
    this.Crypto = new window.SB.SBCrypto()
    this.channel = this.sbContext.channels[channel]
    // const originalRecieveMessage = this.channel._messageCallback
    // this.channel._messageCallback = (message) => {
    //   this.receiveMessage(message)
    //   originalRecieveMessage(message)
    // }
    // console.log(this.channel)
    this.channel.workerPort.port2.onmessage = (e) => {
      console.log('asdasdlksadhfaskldfbaslkfdsaf', e)
      switch (e.data.method) {
        case 'addMessage':
          this.receiveMessage(e.data.data)
          break;
        default:
          console.warn('unknown worker message', e.data)
      }
    }
    this.worker.postMessage({
      operation: 'setCryptoKey',
      currentCryptoKey: this.channel.socket.keys,
    });
  }

  emit = (message) => {
    console.log('Client sending message: ', this.channel.socket);

    const sbm = this.channel.newMessage(message);
    console.log(sbm)
    console.log(this.sbContext.getContact(this.myKey))
    sbm.contents.user = this.sbContext.getContact(this.myKey)
    sbm.contents.sendingId = 'voip_' + Date.now()
    sbm.contents.messageType = this.messageType
    sbm
      .send()
      .then((m) => {
        console.log(`test message sent! (${m})`)
      })
  }

  sendMessage = (message) => {
    // console.log('Client sending message: ', message);
    message.sender = this.sbContext.getContact(this.myKey)._id
    this.emit(JSON.stringify(message));
  }

  signalingMessageCallback = async (message) => {
    const { description, candidate } = message;
    console.log(this.pc, description, message)
    try {
      if (message?.type === 'bye') {
        // this.hangup();
        // this.setState({ connected: false })
      }
      if (description) {
        // If we have a setRemoteDescription() answer operation pending, then
        // we will be "stable" by the time the next setRemoteDescription() is
        // executed, so we count this being stable when deciding whether to
        // ignore the offer.
        const isStable =
          this.pc.signalingState === 'stable' ||
          (this.pc.signalingState === 'have-local-offer' && this.srdAnswerPending);
        this.ignoreOffer =
          description.type === 'offer' && !true && (this.makingOffer || !isStable);
        if (this.ignoreOffer) {
          console.log('glare - ignoring offer');
          return;
        }
        this.srdAnswerPending = description.type === 'answer';
        console.log(`SRD(${description.type})`);
        await this.pc.setRemoteDescription(description);
        this.srdAnswerPending = false;
        if (description.type === 'offer') {
          this.assert_equals(this.pc.signalingState, 'have-remote-offer', 'Remote offer');
          this.assert_equals(this.pc.remoteDescription.type, 'offer', 'SRD worked');
          console.log('SLD to get back to stable');
          await this.pc.setLocalDescription();
          this.assert_equals(this.pc.signalingState, 'stable', 'onmessage not racing with negotiationneeded');
          this.assert_equals(this.pc.localDescription.type, 'answer', 'onmessage SLD worked');
          if (this.pc.iceConnectionState !== 'connected' && this.pc.iceConnectionState !== 'completed') {
            console.log(this.pc)
            this.sendMessage({ description: this.pc.localDescription });
          }
        } else {
          this.assert_equals(this.pc.remoteDescription.type, 'answer', 'Answer was set');
          this.assert_equals(this.pc.signalingState, 'stable', 'answered');

          this.pc.dispatchEvent(new Event('negotiated'));
        }
      } else if (candidate) {
        try {
          if (this.pc) {
            const c_ = new RTCIceCandidate(candidate)
            await this.pc.addIceCandidate(c_);
          }
        } catch (e) {
          if (!this.ignoreOffer) throw e;
        }
      }
    } catch (e) {
      console.error(e);
    }
  };

  // signalingMessageCallback = data => {
  //   if (!this.localStream) {
  //     console.log('not ready yet');
  //     return;
  //   }

  //   console.log('Client received message:', data)
  //   // TODO : fix this
  //   data._id = data.sender
  //   // const isStable = this.pc[data._id] && (
  //   //   this.pc[data._id].signalingState === 'stable' ||
  //   //   (this.pc[data._id].signalingState === 'have-local-offer' && this.srdAnswerPending));
  //   // this.ignoreOffer =
  //   //   data.type === 'offer' && (this.makingOffer || !isStable);
  //   // if (this.ignoreOffer) {
  //   //   console.log('glare - ignoring offer');
  //   //   return;
  //   // }
  //   switch (data.type) {
  //     case 'offer':
  //       this.handleOffer(data);
  //       break;
  //     case 'answer':
  //       this.handleAnswer(data);
  //       break;
  //     case 'candidate':
  //       this.handleCandidate(data);
  //       break;
  //     // case 'ready':
  //     //   if (this.pc[data._id]) {
  //     //     console.log('already in call, ignoring');
  //     //     return;
  //     //   }
  //     //   this.makeCall(data._id);
  //     //   break;
  //     case 'bye':
  //       if (this.pc[data._id]) {
  //         this.hangup(data._id);
  //         this.setState({ connected: false })
  //       }
  //       break;
  //     default:
  //       console.log('unhandled', data);
  //       break;
  //   }
  // };

  reInit = () => {
    this.hangup(this.myId);
    setTimeout(() => {
      this.joinPeers().then(() => {
        console.log('joined peers')
        // this.makeCall();
      }).catch((err) => {
        console.log(err)
      })
    }, 1000)
  }

  hangup = (_id) => {
    if (this.pc) {
      try {
        this.pc.close();
        this.pc = null;
      } catch (e) {
        console.log(e)
        if (this.pc) this.pc = null
      }

    }
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    // this.pc = {};
    this.localStream = null;
  };

  joinPeers = () => {
    return new Promise(async (resolve, reject) => {
      try {
        this.localStream = await navigator.mediaDevices.getUserMedia({ audio: this.audioCFG, video: this.videoCFG });
        this.localVideo.srcObject = this.localStream;
        this.sendMessage({ type: 'ready' });
        resolve()
      } catch (e) {
        reject(e)
      }
    })
  }

  assert_equals = (a, b, msg) => {
    if (a !== b) {
      new Error(`${msg} expected ${b} but got ${a}`)
    }
  }

  createPeerConnection = (_id) => {
    try {
      if (this.pc) {
        this.pc.close()
        this.pc = null
      }
    } catch (e) {
      console.warn(e)
      if (this.pc) this.pc = null
    }


    this.pc = new RTCPeerConnection(webRTCconfig);

    this.pc.onnegotiationneeded = async () => {
      try {
        console.log('SLD due to negotiationneeded');
        this.assert_equals(this.pc.signalingState, 'stable', 'negotiationneeded always fires in stable state');
        this.assert_equals(this.makingOffer, false, 'negotiationneeded not already in progress');
        this.makingOffer = true;
        await this.pc.setLocalDescription();
        this.assert_equals(this.pc.signalingState, 'have-local-offer', 'negotiationneeded not racing with onmessage');
        this.assert_equals(this.pc.localDescription.type, 'offer', 'negotiationneeded SLD worked');
        console.log('onnegotiationneeded', this.pc)
        this.sendMessage({ description: this.pc.localDescription });
      } catch (e) {
        console.error(e)
      } finally {
        this.makingOffer = false;
      }
    };
    this.makingOffer = false;
    this.ignoreOffer = false;
    this.srdAnswerPending = false;
    this.pc.onicecandidate = e => {
      const message = {
        type: 'candidate',
        candidate: null,
      };
      console.log('onicecandidate', e)
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      console.log(e.candidate)
      this.sendMessage({ candidate: e.candidate });
    };
    this.localStream.getTracks().forEach(track => this.pc.addTrack(track, this.localStream));
    this.pc.getSenders().forEach(this.setupSenderTransform);
    // console.trace('lskdafsdkfhalskdjbfaslkjf',_id)
    this.pc.ontrack = e => {
      this.setState({ connected: true })

      this.setupReceiverTransform(e.receiver);
      const updatedEvent = new CustomEvent('remoteJoin', {
        detail: {
          type: 'remoteJoin',
          _id: _id,
        },
      });
      document.dispatchEvent(updatedEvent);
      this.remoteVideo.srcObject = e.streams[0]
    }

    this.pc.onconnectionstatechange = this.connStateCallback
  }

  connStateCallback = () => {
    if (this.pc) {
      const { connectionState } = this.pc;
      console.log(`pc1 connection state change callback, state: ${connectionState}`);
      if (connectionState === 'disconnected') {
        if (!this.makingOffer) {
          this.setState({ connected: false })
          this.hangup()
        }
      }
    }
  }

  makeCall = async (_id) => {
    console.log('Setting crypto keys to ', this.channel.socket.keys);
    try {
      this.createPeerConnection(_id);
      this.assert_equals(this.pc.signalingState, 'stable', 'negotiationneeded always fires in stable state');
      this.assert_equals(this.makingOffer, false, 'negotiationneeded not already in progress');
      this.makingOffer = true;
      // const offer = await this.pc.createOffer();
      // await this.pc.setLocalDescription(offer);
      this.assert_equals(this.pc.signalingState, 'have-local-offer', 'negotiationneeded not racing with onmessage');
      this.assert_equals(this.pc.localDescription.type, 'offer', 'negotiationneeded SLD worked');
      this.sendMessage(this.pc.localDescription);
    } catch (e) {
      console.error(e)
    } finally {
      this.makingOffer = false;
    }

  }

  handleOffer = async (offer) => {


    if (this.pc) {
      console.warn('existing peerconnection, replacing');
      // return;
    }

    await this.pc.setRemoteDescription(offer);
    this.assert_equals(this.pc.signalingState, 'have-remote-offer', 'Remote offer');
    this.assert_equals(this.pc.remoteDescription.type, 'offer', 'SRD worked');
    await this.pc.setLocalDescription();
    this.assert_equals(this.pc.signalingState, 'stable', 'onmessage not racing with negotiationneeded');
    this.assert_equals(this.pc.localDescription.type, 'answer', 'onmessage SLD worked');
    // const answer = await this.pc.createAnswer();
    this.sendMessage(this.pc.localDescription);

  }

  handleAnswer = async (answer) => {
    if (!this.pc[answer._id]) {
      console.error('no peerconnection');
      return;
    }
    this.srdAnswerPending = true;
    await this.pc[answer._id].setRemoteDescription(answer);
    this.srdAnswerPending = false;
  }

  handleCandidate = async (candidate) => {
    if (!this.pc) {
      console.error('no peerconnection');
      return;
    }
    if (!candidate.candidate) {
      await this.pc.addIceCandidate(null);
    } else {
      await this.pc.addIceCandidate(candidate);
    }
  }

  setupSenderTransform = (sender) => {
    try {
      if (window.RTCRtpScriptTransform) {
        // eslint-disable-next-line no-param-reassign
        sender.transform = new window.RTCRtpScriptTransform(this.worker, { operation: 'encode' });
        return;
      }

      const senderStreams = sender.createEncodedStreams();

      const { readable, writable } = senderStreams;
      this.worker.postMessage({
        operation: 'encode',
        readable,
        writable,
      }, [readable, writable]);
    } catch (e) {
      console.error(e)
    }

  }

  setupReceiverTransform = (receiver) => {
    try {
      if (window.RTCRtpScriptTransform) {
        receiver.transform = new window.RTCRtpScriptTransform(this.worker, { operation: 'decode' });
        return;
      }

      const receiverStreams = receiver.createEncodedStreams();
      const { readable, writable } = receiverStreams;
      this.worker.postMessage({
        operation: 'decode',
        readable,
        writable,
      }, [readable, writable]);
    } catch (e) {
      console.error(e)
    }
  }

  toggleMuteAudio = () => {
    try {
      if (!this.localStream) return
      const audioTrack = this.localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
      }
      console.log(audioTrack.enabled)
      return audioTrack.enabled;
    } catch (e) {
      console.error(e)
    }

  }

  toggleMuteVideo = () => {
    try {
      if (!this.localStream) return
      const videoTrack = this.localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
      }
      console.log(videoTrack.enabled)
      return videoTrack.enabled;
    } catch (e) {
      console.error(e)
    }
  }

  render = () => {
    return (
      <VoipContext.Provider value={this}>
        {this.props.children}
      </VoipContext.Provider>
    )

  }

};

export default VoipContext;


export const VoipComponent = (props) => {
  const voipContext = React.useContext(VoipContext);
  const [audioDevices, setAudioDevices] = React.useState([])
  const [audioDevice, setAudioDevice] = React.useState('')
  const [videoDevices, setVideoDevices] = React.useState([])
  const [videoDevice, setVideoDevice] = React.useState('')
  const [audioMuted, setAudioMuted] = React.useState(false)
  const [videoMuted, setVideoMuted] = React.useState(false)
  const [screenShared, setScreenShared] = React.useState(false)
  const [connected, setConnected] = React.useState(false)
  const [remoteVideoIds, setRemoteVideoIds] = React.useState([])
  const [anchorEl, setAnchorEl] = React.useState(null);
  const [myVideoClassState, setMyVideoClassState] = React.useState('local-video');
  const sbContext = React.useContext(SnackabraContext);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleAudioDeviceChange = (value) => {
    console.log('change', value)
    setAudioDevice(value)
    voipContext.audioCFG = { audio: { deviceId: { exact: value } } };
    const constraints = { audio: voipContext.audioCFG, video: voipContext.videoCFG };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      voipContext.localStream = stream;
      voipContext.localVideo.srcObject = voipContext.localStream;
      voipContext.reInit();
    });
  }

  const handleVideoDeviceChange = (value) => {
    console.log('change', value)
    setVideoDevice(value)
    voipContext.videoCFG = { deviceId: { exact: value } };
    const constraints = { audio: voipContext.audioCFG, video: voipContext.videoCFG };
    navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
      voipContext.localStream = stream;
      voipContext.localVideo.srcObject = voipContext.localStream;
      voipContext.reInit();
    });
  }

  const toggleMuteAudio = React.useCallback(() => {
    setAudioMuted(!audioMuted)
    voipContext.toggleMuteAudio()
  }, [audioMuted, voipContext])

  const toggleMuteVideo = React.useCallback(() => {
    setVideoMuted(!videoMuted)
    voipContext.toggleMuteVideo()
  }, [videoMuted, voipContext])


  const endCall = React.useCallback(() => {
    if (!videoMuted) toggleMuteVideo()

    if (!audioMuted) toggleMuteAudio()

    voipContext.hangupClick()
    setMyVideoClassState('local-video')
    const remoteVideo = document.getElementById('remoteVideo')
    if (remoteVideo) {
      remoteVideo.srcObject = null
    }
    props.closeCallWindow()
  }, [audioMuted, props, toggleMuteAudio, toggleMuteVideo, videoMuted, voipContext])


  const toggleShareScreen = () => {

    setScreenShared(!screenShared)
    if(!screenShared){
      voipContext.shareScreenClick()
    }else{
      voipContext.reInit()
    }

  }

  const setVideoSrcObject = (id, stream) => {
    const video = document.getElementById(id)
    if (video) {
      video.srcObject = stream
    } else {
      console.log('no video')
    }
  }

  const startCall = () => {
    voipContext.initVideoCallClick(voipContext.myKey, voipContext.channelId)
  }
  /*
  background-color: blue;
    position: absolute;
    width: 240px;
    right: 0px;
    bottom: 47px;
    border: 1px solid;
    */

  React.useEffect(() => {
    document.addEventListener('remoteJoin', (e) => {
      setMyVideoClassState('local-video minimized')
    })
  }, [])

  React.useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(function (devices) {

      // Filter out non-audio devices
      const audioDevices = devices.filter(function (device) {
        return device.kind === 'audioinput';
      });

      let audioDeviceArray = []
      audioDevices.forEach(function (device) {
        audioDeviceArray.push({
          deviceId: device.deviceId,
          label: device.label || 'Microphone ' + (audioDeviceArray.length + 1)
        })
      });
      setAudioDevices(audioDeviceArray)
    });

    // Get the list of available video devices
    navigator.mediaDevices.enumerateDevices().then(function (devices) {

      // Filter out non-video devices
      var videoDevices = devices.filter(function (device) {
        return device.kind === 'videoinput';
      });

      let videoDeviceArray = []
      videoDevices.forEach(function (device) {
        videoDeviceArray.push({
          deviceId: device.deviceId,
          label: device.label || 'Camera ' + (videoDeviceArray.length + 1)
        })
      });

      setVideoDevices(videoDeviceArray)
    });

    voipContext.setLocalVideo(document.getElementById('localVideo'))
    voipContext.setRemoteVideo(document.getElementById('remoteVideo'))

  }, [voipContext, sbContext])

  React.useEffect(() => {
    document.addEventListener('remoteJoin', (e) => {
      console.log('remoteJoin', e)
      setRemoteVideoIds([...remoteVideoIds, e.detail])
      // voipContext.addRemoteVideo(e.detail._id)
    })
  }, [remoteVideoIds])

  React.useEffect(() => {

    if (!voipContext.state.connected && connected) {
      setConnected(false)
      endCall()

    }

    if (voipContext.state.connected && !connected) {
      setMyVideoClassState('local-video minimized')
      setConnected(true)
    }

  }, [connected, endCall, voipContext, voipContext.state.connected])

  return (
    <Grid container>
      <IconButton
        edge="start"
        color="inherit"
        onClick={endCall}
        aria-label="close"
        sx={
          {
            top: '8px',
            right: '24px',
            position: 'absolute',
          }
        }
      >
        <Close />
      </IconButton>
      <Grid style={{ width: '100%', position: 'relative' }} item>
        <video id="remoteVideo" style={{ maxHeight: 'calc(100vh - 132px)', width: "100%", backgroundColor: 'black', position: 'relative', height: isMobile ? 'calc(100vh - 172px)' : 'calc(100% - 47px)' }} playsInline autoPlay></video>
        <video className={myVideoClassState} style={{ zIndex: 999999 }} id="localVideo" playsInline autoPlay muted></video>
        <Grid id="video-control-container" style={{ width: '100%' }} container justifyContent={'center'}>
          <IconButton id="call-end" onClick={connected ? endCall : startCall}>
            {connected ? <CallEnd /> : <Call />}
          </IconButton>
          <IconButton id="mic-mute" onClick={toggleMuteAudio}>
            {audioMuted ? <Mic /> : <MicOff />}
          </IconButton>
          <IconButton id="camera-mute" onClick={toggleMuteVideo}>
            {videoMuted ? <Videocam /> : <VideocamOff />}
          </IconButton>
          <IconButton id="share-screen" onClick={toggleShareScreen}>
            {screenShared ? <StopScreenShare /> : <ScreenShare />}
          </IconButton>
          <IconButton
            aria-label="more"
            id="long-button"
            aria-controls={open ? 'long-menu' : undefined}
            aria-expanded={open ? 'true' : undefined}
            aria-haspopup="true"
            onClick={handleClick}
          >
            <MoreVert />
          </IconButton>
          <Menu
            id="long-menu"
            MenuListProps={{
              'aria-labelledby': 'long-button',
            }}
            anchorEl={anchorEl}
            open={open}
            onClose={handleClose}
          >
            <MenuList>
              <MenuItem >
                <ListItemText>Select Microphone</ListItemText>
                <ListItemText>
                  <FormControl fullWidth>
                    <InputLabel id="mic-select-label">Input</InputLabel>
                    <Select
                      labelId="mic-select-label"
                      id="mic-select"
                      value={audioDevice}
                      label="Input"
                      onChange={handleAudioDeviceChange}
                    >
                      {
                        audioDevices.map((device, index) => {
                          return <MenuItem key={index} value={device.deviceId}>{device.label}</MenuItem>
                        })
                      }
                    </Select>

                  </FormControl>
                </ListItemText>
              </MenuItem>
              <Divider />
              <MenuItem>
                <ListItemText>Select Camera</ListItemText>
                <FormControl fullWidth>
                  <InputLabel id="camera-select-label">Input</InputLabel>
                  <Select
                    labelId="camera-select-label"
                    id="camera-select"
                    value={videoDevice}
                    label="Input"
                    onChange={handleVideoDeviceChange}
                  >
                    {
                      videoDevices.map((device, index) => {
                        return <MenuItem key={index} value={device.deviceId}>{device.label}</MenuItem>
                      })
                    }
                  </Select>
                </FormControl>
              </MenuItem>
            </MenuList>
          </Menu>
          {/* <!-- <button id="call-settings" class="btn btn-warning btn-circle btn-lg">
          <i class="fa-solid fa-gear"></i>
        </button> --> */}
        </Grid>
      </Grid>
      {/* <video id="localVideo" playsInline autoPlay></video> */}


    </Grid>
  )
}