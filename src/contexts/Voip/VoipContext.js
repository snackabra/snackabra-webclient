import * as React from "react"
import WorkerE2EE from "./Worker";
import { Divider, FormControl, Grid, IconButton, InputLabel, Select } from "@mui/material";
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
  srdAnswerPending = false;
  ignoreOffer = false;


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
    this.remoteVideo[_id] = document.getElementById(_id)
  }

  addEventListeners = () => {

  }

  initVideoCallClick = async (key, channel) => {
    this.setState({ connected: true })
    await this.connect(key, channel)
    this.joinPeers()
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
      this.createPeerConnection();

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
    const originalRecieveMessage = this.channel._messageCallback
    this.channel._messageCallback = (message) => {
      this.receiveMessage(message)
      originalRecieveMessage(message)
    }
    console.log(this.channel)
    this.worker.postMessage({
      operation: 'setCryptoKey',
      currentCryptoKey: this.channel.socket.keys,
    });
    this.setState({ connected: true })
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

    console.log('Client received message:', data)
    // TODO : fix this
    data._id = data.sender
    // const isStable = this.pc[data._id] && (
    //   this.pc[data._id].signalingState === 'stable' ||
    //   (this.pc[data._id].signalingState === 'have-local-offer' && this.srdAnswerPending));
    // this.ignoreOffer =
    //   data.type === 'offer' && (this.makingOffer || !isStable);
    // if (this.ignoreOffer) {
    //   console.log('glare - ignoring offer');
    //   return;
    // }
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
        if (this.pc[data._id]) {
          console.log('already in call, ignoring');
          return;
        }
        this.makeCall(data._id);
        break;
      case 'bye':
        if (this.pc[data._id]) {
          this.hangup(data._id);
          this.setState({ connected: false })
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
    if (this.localStream) {
      this.localStream.getTracks().forEach(track => track.stop());
    }
    this.pc = {};
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
    this.pc[_id] = new RTCPeerConnection(webRTCconfig);

    // this.pc[_id].onnegotiationneeded = async () => {
    //   try {
    //     console.log('SLD due to negotiationneeded');
    //     this.assert_equals(this.pc[_id].signalingState, 'stable', 'negotiationneeded always fires in stable state');
    //     this.assert_equals(this.makingOffer, false, 'negotiationneeded not already in progress');
    //     this.makingOffer = true;
    //     await this.pc[_id].setLocalDescription();
    //     this.assert_equals(this.pc[_id].signalingState, 'have-local-offer', 'negotiationneeded not racing with onmessage');
    //     this.assert_equals(this.pc[_id].localDescription.type, 'offer', 'negotiationneeded SLD worked');
    //     console.log(this.pc[_id].localDescription)
    //     this.sendMessage({description: this.pc[_id].localDescription});
    //   } catch (e) {
    //     console.error(e)
    //   } finally {
    //     this.makingOffer = false;
    //   }
    // };

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
    // console.trace('lskdafsdkfhalskdjbfaslkjf',_id)
    this.pc[_id].ontrack = e => {

      this.setupReceiverTransform(e.receiver);
      const updatedEvent = new CustomEvent('remoteJoin', {
        detail: {
          type: 'remoteJoin',
          _id: _id,
          stream: e.streams[0]
        },
      });
      document.dispatchEvent(updatedEvent);
      // this.remoteVideo.srcObject = e.streams[0]
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
    await this.createPeerConnection(offer._id);
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
    this.srdAnswerPending = true;
    await this.pc[answer._id].setRemoteDescription(answer);
    this.srdAnswerPending = false;
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
  const [remoteVideoIds, setRemoteVideoIds] = React.useState([])
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
    // voipContext.setRemoteVideo(document.getElementById('remoteVideo'))

  }, [voipContext, sbContext])

  React.useEffect(() => {
    document.addEventListener('remoteJoin', (e) => {
      console.log('remoteJoin', e)
      setRemoteVideoIds([...remoteVideoIds, e.detail])
      // voipContext.addRemoteVideo(e.detail._id)
    })
  }, [])

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

  const setVideoSrcObject = (id, stream) => {
    const video = document.getElementById(id)
    if (video) {
      video.srcObject = stream
    } else {
      console.log('no video')
    }
  }

  return (
    <Grid container>

      {remoteVideoIds.map((video, index) => {
        setTimeout(() => {
          setVideoSrcObject(video._id, video.stream)
        }, 250)
        return <Grid key={index} item xs={12}>
          <video style={{ width: "100%", backgroundColor: 'black' }} id={video._id} playsInline autoPlay></video>
        </Grid>
      })
      }
      {/* <video id="remoteVideo" style={{ width: "100%", backgroundColor: 'black' }} playsInline autoPlay></video> */}
      {/* <video id="localVideo" playsInline autoPlay></video> */}

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