import React from 'react';
import { StyleSheet, View, } from 'react-native';
import { getColorFromId } from "../../utils/misc"
import { isSameUser, isSameDay, GiftedAvatar } from 'react-native-gifted-chat';
import { observer } from "mobx-react"
import { SnackabraContext } from "mobx-snackabra-store";
const styles = {
  left: StyleSheet.create({
    container: {
      marginRight: 0,
    },
    onTop: {
      alignSelf: 'flex-start',
    },
    onBottom: {},
    image: {
      height: 36,
      width: 36,
      borderRadius: 18,
    },
  }),
  right: StyleSheet.create({
    container: {
      marginLeft: 0,
    },
    onTop: {
      alignSelf: 'flex-start',
    },
    onBottom: {},
    image: {
      height: 36,
      width: 36,
      borderRadius: 18,
    },
  }),
};
const RenderAvatar = observer((props) => {
  const sbContext = React.useContext(SnackabraContext);
  const { renderAvatarOnTop, showAvatarForEveryMessage, containerStyle, position, currentMessage, renderAvatar, previousMessage, nextMessage, imageStyle, } = props;
  const messageToCompare = renderAvatarOnTop ? previousMessage : nextMessage;
  const computedStyle = renderAvatarOnTop ? 'onTop' : 'onBottom';
  const _id = props.currentMessage.user._id !== "system" ? JSON.parse(props.currentMessage.user._id) : { x: "system", y: "system" }
  const user = {
    name: sbContext.contacts[_id.x + ' ' + _id.y],
    _id: props.currentMessage.user._id
  }
  if (renderAvatar === null) {
    return null;
  }
  if (!showAvatarForEveryMessage &&
    currentMessage &&
    messageToCompare &&
    isSameUser(currentMessage, messageToCompare) &&
    isSameDay(currentMessage, messageToCompare)) {
    return (<View style={[
      styles[position].container,
      containerStyle && containerStyle[position],
    ]}>
      <GiftedAvatar avatarStyle={[
        styles[position].image,
        imageStyle && imageStyle[position],
      ]} />
    </View>);
  }
  const renderAvatarComponent = () => {
    if (props.renderAvatar) {
      const { renderAvatar, ...avatarProps } = props;
      return props.renderAvatar(avatarProps);
    }
    if (props.currentMessage) {
      const avatarStyle = [
        { height: 36, width: 36, borderRadius: 18, backgroundColor: getColorFromId(user._id) },
        props.imageStyle && props.imageStyle[props.position],
      ]
      return (<GiftedAvatar avatarStyle={avatarStyle} user={user} onPress={() => { var _a; return (_a = props.onPressAvatar) === null || _a === void 0 ? void 0 : _a.call(props, props.currentMessage.user); }} onLongPress={() => { var _a; return (_a = props.onLongPressAvatar) === null || _a === void 0 ? void 0 : _a.call(props, props.currentMessage.user); }} />);
    }
    return null;
  };
  return (<View style={[
    styles[position].container,
    styles[position][computedStyle],
    containerStyle && containerStyle[position],
  ]}>
    {renderAvatarComponent()}
  </View>);
})

function renderAvatarWrapper(props) {
  return <RenderAvatar {...props} />
}

export default renderAvatarWrapper