import React from 'react';
import { observer } from "mobx-react"
import { StyleSheet, View, } from 'react-native';
import { getColorFromId } from "../../utils/misc.js"
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
const RenderAvatar = observer((props) => {
  const { renderAvatarOnTop, showAvatarForEveryMessage, containerStyle, position, currentMessage, renderAvatar, previousMessage, nextMessage, imageStyle, } = props;
  const messageToCompare = renderAvatarOnTop ? previousMessage : nextMessage;
  const computedStyle = renderAvatarOnTop ? 'onTop' : 'onBottom';
  const user = {
    name: props.currentMessage.user._id !== "system" ? props.currentMessage.user.name : 'system',
    _id: props.currentMessage.user._id !== "system" ? props.currentMessage.user._id : { x: "system", y: "system" }
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
        { height: 36, width: 36, borderRadius: 18, backgroundColor: getColorFromId(user._id)},
        props.imageStyle && props.imageStyle[props.position],
      ]
      const textStyle = {color: '#FFF', fontWeight: '500', 'text-shadow': '1px 1px 20px rgb(0, 0, 0, 0.7)'}
      return (<GiftedAvatar avatarStyle={avatarStyle} textStyle={textStyle} user={user} onPress={() => { var _a; return (_a = props.onPressAvatar) === null || _a === void 0 ? void 0 : _a.call(props, props.currentMessage.user); }} onLongPress={() => { var _a; return (_a = props.onLongPressAvatar) === null || _a === void 0 ? void 0 : _a.call(props, props.currentMessage.user); }} />);
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