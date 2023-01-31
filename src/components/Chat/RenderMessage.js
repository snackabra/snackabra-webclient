import React from 'react';
import { View, StyleSheet } from 'react-native';
import {Avatar,Bubble,SystemMessage,Day, isSameUser } from "react-native-gifted-chat"

const styles = {
    left: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-start',
            marginLeft: 8,
            marginRight: 0,
        },
    }),
    right: StyleSheet.create({
        container: {
            flexDirection: 'row',
            alignItems: 'flex-end',
            justifyContent: 'flex-end',
            marginLeft: 0,
            marginRight: 8,
        },
    }),
};
class Message extends React.Component {


    renderDay() {
        if (this.props.currentMessage && this.props.currentMessage.createdAt) {
            const { containerStyle, onMessageLayout, ...props } = this.props;
            if (this.props.renderDay) {
                return this.props.renderDay(props);
            }
            return <Day {...props}/>;
        }
        return null;
    }
    renderBubble() {
        const { containerStyle, onMessageLayout, ...props } = this.props;
        if (this.props.renderBubble) {
            return this.props.renderBubble(props);
        }
        // @ts-ignore
        return <Bubble {...props}/>;
    }
    renderSystemMessage() {
        const { containerStyle, onMessageLayout, ...props } = this.props;
        if (this.props.renderSystemMessage) {
            return this.props.renderSystemMessage(props);
        }
        return <SystemMessage {...props}/>;
    }
    renderAvatar() {
        const { user, currentMessage, showUserAvatar } = this.props;
        if (user &&
            user._id &&
            currentMessage &&
            currentMessage.user &&
            user._id === currentMessage.user._id &&
            !showUserAvatar) {
            return null;
        }
        if (currentMessage &&
            currentMessage.user &&
            currentMessage.user.avatar === null) {
            return null;
        }
        const { containerStyle, onMessageLayout, ...props } = this.props;
        return <Avatar {...props}/>;
    }
    render() {
        const { currentMessage, onMessageLayout, nextMessage, position, containerStyle, } = this.props;
        if (currentMessage) {
            const sameUser = isSameUser(currentMessage, nextMessage);
            return (<View onLayout={onMessageLayout}>
          {this.renderDay()}
          {currentMessage.system ? (this.renderSystemMessage()) : (<View style={[
                        styles[position].container,
                        { marginBottom: sameUser ? 2 : 10 },
                        !this.props.inverted && { marginBottom: 2 },
                        containerStyle && containerStyle[position],
                    ]}>
              {this.props.position === 'left' ? this.renderAvatar() : null}
              {this.renderBubble()}
              {this.props.position === 'right' ? this.renderAvatar() : null}
            </View>)}
        </View>);
        }
        return null;
    }
}

function MessageWrapper(props){
    return <Message {...props} />
}

export default MessageWrapper;