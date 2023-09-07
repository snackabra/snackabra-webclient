import * as React from "react"
import WorkerE2EE from "./Worker";
import { Button, Divider, FormControl, Grid, IconButton, InputLabel, Select } from "@mui/material";
import StopScreenShareIcon from '@mui/icons-material/StopScreenShare';
import ScreenShareIcon from '@mui/icons-material/ScreenShare';
import VideocamOffIcon from '@mui/icons-material/VideocamOff';
import VideocamIcon from '@mui/icons-material/Videocam';
import MicIcon from '@mui/icons-material/Mic';
import MicOffIcon from '@mui/icons-material/MicOff';
import CallEndIcon from '@mui/icons-material/CallEnd';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import MenuItem from '@mui/material/MenuItem';
import MenuList from '@mui/material/MenuList';
import ListItemText from '@mui/material/ListItemText';
import SnackabraContext from "../../contexts/SnackabraContext";

const VoipContext = React.createContext(undefined);

let webRTCconfig = {
  'iceServers': [{
    'urls': 'stun:216.228.192.76:3478'
  }],
  encodedInsertableStreams: true
};

const worker = WorkerE2EE.toString();
const blob = new Blob([`(${worker})()`]);

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

  state = {
    open: false,
    connected: false,
    screenShared: false,
  }
  componentDidMount = () => {
    this.worker.onmessage = (e) => {
      if (e.data.operation === 'log') {
        console.log(JSON.parse(e.data.args))
      }else{
        console.log(e)
      }
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

  initVideoCallClick = async (key, channel) => {
    // initVideoCallButton.disabled = true;
    // joinButton.disabled = true;
    // hangupButton.disabled = false;
    // videoControls.classList.remove('d-none')
    // videoControls.classList.add('d-flex');
    this.setState({ connected: true })
    await this.connect(key, channel)
    this.joinPeers()
  }

  joinCallClick = async (joinKey, channel) => {
    // initVideoCallButton.disabled = true;
    // joinButton.disabled = true;
    // hangupButton.disabled = false;
    // videoControls.classList.remove('d-none')
    // videoControls.classList.add('d-flex');
    await this.connect(joinKey, channel)
    this.joinPeers()
  }

  hangupClick = async () => {
    this.hangup(this.myId);
    this.sendMessage({ type: 'bye' });
    // localVideo.classList.remove('shrink')
  }

  // selectMicrophone = () => {
  //   this.audioCFG = { audio: { deviceId: { exact: select.value } } };
  //   var constraints = { audio: this.audioCFG, video: this.videoCFG };
  //   navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
  //     this.localStream = stream;
  //     localVideo.srcObject = this.localStream;
  //     this.reInit();
  //   });
  // }

  // selectCamera = () => {
  //   this.videoCFG = { deviceId: { exact: select.value } };
  //   var constraints = { audio: this.audioCFG, video: this.videoCFG };
  //   navigator.mediaDevices.getUserMedia(constraints).then(function (stream) {
  //     this.localStream = stream;
  //     this.localVideo.srcObject = this.localStream;
  //     this.reInit();
  //   });
  // }

  shareScreenClick = async () => {
    // shareButton.classList.add('d-none')
    // stopButton.classList.add('d-block')
    // stopButton.classList.remove('d-none')

    this.hangup(this.myId);
    navigator.mediaDevices.getDisplayMedia({ audio: this.audioCFG, video: this.videoCFG }).then(async (stream) => {
      this.localStream = stream;
      this.localVideo.srcObject = this.localStream;
      // Use the screen stream with WebRTC
      this.createPeerConnection();

      const offer = await this.pc.createOffer();
      this.sendMessage({ type: 'offer', sdp: offer.sdp });
      await this.pc.setLocalDescription(offer);
    }).catch(function (error) {
      if (error.name === 'NotAllowedError') {
        console.error('Screen sharing was canceled by the user.');
        // stopButton.click()
      } else {
        console.error('Could not share the screen: ', error);
      }
    })

  }

  stopClick = async () => {
    // videoControls.classList.remove('d-flex')
    // videoControls.classList.add('d-none');
    // stopButton.classList.add('d-none')
    // shareButton.classList.add('d-block')
    // shareButton.classList.remove('d-none')
    this.reInit()
  }

  // muteVideoClick = async () => {
  //   const videoIcon = muteVideoButton.querySelector('#fa-video');
  //   const videoSlashIcon = muteVideoButton.querySelector('#fa-video-slash');

  //   if (this.toggleMuteVideo()) {
  //     videoIcon.classList.remove('d-none')
  //     videoSlashIcon.classList.add('d-none')
  //     muteVideoButton.classList.remove('btn-danger')
  //   } else {
  //     videoIcon.classList.add('d-none')
  //     videoSlashIcon.classList.remove('d-none')
  //     muteVideoButton.classList.add('btn-danger')
  //   }
  // }

  // muteAudioClick = async () => {
  //   const micIcon = muteButton.querySelector('#fa-microphone');
  //   const micSlashIcon = muteButton.querySelector('#fa-microphone-slash');

  //   if (this.toggleMuteAudio()) {
  //     micIcon.classList.remove('d-none')
  //     micSlashIcon.classList.add('d-none')
  //     muteButton.classList.remove('btn-danger')
  //   } else {
  //     micIcon.classList.add('d-none')
  //     micSlashIcon.classList.remove('d-none')
  //     muteButton.classList.add('btn-danger')
  //   }
  // }

  receiveMessage = async (message) => {

    if (message.messageType !== this.messageType) return
    this.lastMessage = message
    this.messages.push(message);
    console.log('Client received message:', message);
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
    const originalRecieveMessage = this.channel._messageCallback
    this.channel._messageCallback = (message) => {
      this.receiveMessage(message)
      originalRecieveMessage(message)
    }
    console.log(this.channel)
    this.worker.postMessage({
      operation: 'setCryptoKey',
      currentCryptoKey: this.channel.socket.keys,
      // useCryptoOffset,
    });
    this.setState({ connected: true })
  }

  emit = (message) => {
    console.log('Client sending message: ', this.channel.socket);

    const sbm = this.channel.newMessage(message);
    console.log(sbm)
    // const message = {
    //   createdAt: new Date(),
    //   text: "",
    //   messageType: messageTypes.SIMPLE_CHAT_MESSAGE,
    //   image: value.sbImage.thumbnail,
    //   user: sbContext.getContact(channel.key),
    //   _id: 'sending_' + giftedMessage[0]._id + Date.now()
    // }
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

  sendMessage(message) {
    console.log('Client sending message: ', message);
    message.sender = this.sbContext.getContact(this.myKey)._id
    this.emit(JSON.stringify(message));
  }

  signalingMessageCallback = data => {
    if (!this.localStream) {
      console.log('not ready yet');
      return;
    }
    switch (data.type) {
      case 'offer':
        this.handleOffer(data);
        break;
      case 'answer':
        this.handleAnswer(data);
        break;
      case 'candidate':
        this.handleCandidate(data);
        break;
      case 'ready':
        // A second tab joined. This tab will initiate a call unless in a call already.
        if (this.pc[data._id]) {
          console.log('already in call, ignoring');
          return;
        }
        this.makeCall();
        break;
      case 'bye':
        if (this.pc[data._id]) {
          this.hangup(data._id);
          this.setState({ connected: false })
          // localVideo.classList.remove('shrink')
        }
        break;
      default:
        console.log('unhandled', data);
        break;
    }
  };

  reInit = () => {
    this.hangup(this.myId);
    setTimeout(() => {
      this.joinPeers().then(() => {
        console.log('joined peers')
        this.makeCall();
      }).catch((err) => {
        console.log(err)
      })
    }, 1000)
  }

  hangup = (_id) => {
    if (this.pc[_id]) {
      this.pc[_id].close();
      delete this.pc[_id];
    }
    this.localStream.getTracks().forEach(track => track.stop());
    this.localStream = null;
    // initVideoCallButton.disabled = false;
    // joinButton.disabled = false;
    // hangupButton.disabled = true;
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

  createPeerConnection = (_id) => {
    this.pc[_id] = new RTCPeerConnection(webRTCconfig);
    this.pc[_id].onicecandidate = e => {
      const message = {
        type: 'candidate',
        candidate: null,
      };
      if (e.candidate) {
        message.candidate = e.candidate.candidate;
        message.sdpMid = e.candidate.sdpMid;
        message.sdpMLineIndex = e.candidate.sdpMLineIndex;
      }
      this.sendMessage(message);
    };
    this.localStream.getTracks().forEach(track => this.pc[_id].addTrack(track, this.localStream));
    this.pc[_id].getSenders().forEach(this.setupSenderTransform);
    this.pc[_id].ontrack = e => {
      this.setupReceiverTransform(e.receiver);
      this.remoteVideo.srcObject = e.streams[0]
    }
  }

  makeCall = async (_id) => {
    console.log('Setting crypto keys to ', this.channel.socket.keys);

    this.createPeerConnection(_id);

    const offer = await this.pc[_id].createOffer();
    this.sendMessage({ type: 'offer', sdp: offer.sdp });
    await this.pc[_id].setLocalDescription(offer);
  }

  handleOffer = async (offer) => {
    if (this.pc[offer._id]) {
      console.warn('existing peerconnection, replacing');
      // return;
    }
    await this.createPeerConnection();
    await this.pc[offer._id].setRemoteDescription(offer);

    const answer = await this.pc[offer._id].createAnswer();
    this.sendMessage({ type: 'answer', sdp: answer.sdp });
    await this.pc[offer._id].setLocalDescription(answer);
  }

  handleAnswer = async (answer) => {
    if (!this.pc[answer._id]) {
      console.error('no peerconnection');
      return;
    }
    await this.pc[answer._id].setRemoteDescription(answer);
  }

  handleCandidate = async (candidate) => {
    if (!this.pc[candidate._id]) {
      console.error('no peerconnection');
      return;
    }
    if (!candidate.candidate) {
      await this.pc[candidate._id].addIceCandidate(null);
    } else {
      await this.pc[candidate._id].addIceCandidate(candidate);
    }
  }

  setupSenderTransform = (sender) => {
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
  }

  setupReceiverTransform = (receiver) => {
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
  }

  toggleMuteAudio = () => {
    const audioTrack = this.localStream.getAudioTracks()[0];
    if (audioTrack) {
      audioTrack.enabled = !audioTrack.enabled;
    }
    console.log(audioTrack.enabled)
    return audioTrack.enabled;
  }

  toggleMuteVideo = () => {
    const videoTrack = this.localStream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.enabled = !videoTrack.enabled;
    }
    console.log(videoTrack.enabled)
    return videoTrack.enabled;
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


export const VoipComponent = () => {
  const voipContext = React.useContext(VoipContext);
  const [audioDevices, setAudioDevices] = React.useState([])
  const [audioDevice, setAudioDevice] = React.useState('')
  const [videoDevices, setVideoDevices] = React.useState([])
  const [videoDevice, setVideoDevice] = React.useState('')
  const [audioMuted, setAudioMuted] = React.useState(false)
  const [videoMuted, setVideoMuted] = React.useState(false)
  const [screenShared, setScreenShared] = React.useState(false)
  const [connected, setConnected] = React.useState(false)
  const [anchorEl, setAnchorEl] = React.useState(null);
  const sbContext = React.useContext(SnackabraContext);
  const open = Boolean(anchorEl);
  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };
  const handleClose = () => {
    setAnchorEl(null);
  };

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

    if (!voipContext.state.connected && connected) {
      setConnected(false)
      voipContext.hangupClick()

    }

  }, [connected, voipContext, voipContext.state.connected])


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

  const endCall = () => {
    voipContext.hangupClick()
  }

  const toggleMuteAudio = () => {
    setAudioMuted(!audioMuted)
    voipContext.toggleMuteAudio()
  }

  const toggleMuteVideo = () => {
    setVideoMuted(!videoMuted)
    voipContext.toggleMuteVideo()
  }

  const toggleShareScreen = () => {
    setScreenShared(!screenShared)
    voipContext.shareScreenClick()
  }


  return (
    <Grid container>
      <Grid item xs={12}>
        {

        }
        <video id="remoteVideo" style={{ width: "100%", backgroundColor: 'black' }} playsInline autoPlay></video>
        {/* <video id="localVideo" playsInline autoPlay></video> */}
      </Grid>
      <Grid item xs={12}>
        {/* <video id="remoteVideo" playsInline autoPlay></video> */}
        <video style={{ width: "100%", backgroundColor: 'blue' }} id="localVideo" playsInline autoPlay muted></video>
      </Grid>
      <Grid id="video-control-container" container>
        <IconButton id="call-end" onClick={endCall}>
          <CallEndIcon />
        </IconButton>
        <IconButton id="mic-mute" onClick={toggleMuteAudio}>
          {audioMuted ? <MicIcon /> : <MicOffIcon />}
        </IconButton>
        <IconButton id="camera-mute" onClick={toggleMuteVideo}>
          {videoMuted ? <VideocamIcon /> : <VideocamOffIcon />}
        </IconButton>
        <IconButton id="share-screen">
          {screenShared ? <StopScreenShareIcon /> : <ScreenShareIcon />}
        </IconButton>
        <IconButton
          aria-label="more"
          id="long-button"
          aria-controls={open ? 'long-menu' : undefined}
          aria-expanded={open ? 'true' : undefined}
          aria-haspopup="true"
          onClick={handleClick}
        >
          <MoreVertIcon />
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
  )
}