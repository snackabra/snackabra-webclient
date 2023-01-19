import React from 'react';
import { StyleSheet, View, } from 'react-native';
import { getColorFromId } from "../../utils/misc"
import { isSameUser, isSameDay, GiftedAvatar } from 'react-native-gifted-chat';
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
function RenderAvatar(props) {
  const { renderAvatarOnTop, showAvatarForEveryMessage, containerStyle, position, currentMessage, renderAvatar, previousMessage, nextMessage, imageStyle, } = props;
  const messageToCompare = renderAvatarOnTop ? previousMessage : nextMessage;
  const computedStyle = renderAvatarOnTop ? 'onTop' : 'onBottom';
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
      console.log(avatarProps)
      return props.renderAvatar(avatarProps);
    }
    if (props.currentMessage) {
      const avatarStyle = [
        {height: 36, width: 36, borderRadius: 18, backgroundColor: getColorFromId(props.currentMessage.user._id)},
        props.imageStyle && props.imageStyle[props.position],
      ]
      console.log(avatarStyle[0])
      return (<GiftedAvatar avatarStyle={avatarStyle} user={props.currentMessage.user} onPress={() => { var _a; return (_a = props.onPressAvatar) === null || _a === void 0 ? void 0 : _a.call(props, props.currentMessage.user); }} onLongPress={() => { var _a; return (_a = props.onLongPressAvatar) === null || _a === void 0 ? void 0 : _a.call(props, props.currentMessage.user); }} />);
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
}

export default RenderAvatar