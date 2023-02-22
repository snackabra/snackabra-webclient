import React from 'react';
import { GiftedChat, MessageContainer, Message } from "react-native-gifted-chat";
import { View, KeyboardAvoidingView, } from 'react-native';


class MessageContainerCustom extends MessageContainer {
    constructor(props) {
        super(props);
        this.renderRow = ({ item, index }) => {
            if (!item._id && item._id !== 0) {
                console.warn('GiftedChat: `_id` is missing for message', JSON.stringify(item));
            }
            if (!item.user) {
                if (!item.system) {
                    console.warn('GiftedChat: `user` is missing for message', JSON.stringify(item));
                }
                item.user = { _id: 0 };
            }
            const { messages, user, inverted, ...restProps } = this.props;
            if (messages && user) {
                let previousMessage = (inverted ? messages[index + 1] : messages[index - 1]) || {};
                let nextMessage = (inverted ? messages[index - 1] : messages[index + 1]) || {};
                let messageProps = {
                    ...restProps,
                    user,
                    key: item._id,
                    currentMessage: item,
                    previousMessage,
                    inverted,
                    nextMessage,
                    position: item.user._id === user._id ? 'right' : 'left',
                };
                try {
                    const _m_u_id = JSON.parse(item.user._id)
                    const _u_id = JSON.parse(user._id)
                    messageProps = {
                        ...restProps,
                        user,
                        key: item._id,
                        currentMessage: item,
                        previousMessage,
                        inverted,
                        nextMessage,
                        position: _m_u_id.x + ' ' + _m_u_id.y === _u_id.x + ' ' + _u_id.y ? 'right' : 'left',
                    };
                } catch (e) {
                    console.warn(e)
                }
                if (this.props.renderMessage) {
                    return this.props.renderMessage(messageProps);
                }

                return <Message {...messageProps} />;
            }
            return null;
        };
    }


}

class GiftedChatCustom extends GiftedChat {
    constructor(props) {
        super(props);
    }

    componentDidMount() {
        const { messages, text } = this.props;
        this.setIsMounted(true);
        this.initLocale();
        this.setMessages(messages || []);
        this.setTextFromProp(text);
    }

    componentDidUpdate(prevProps = {}) {

        const { messages, text, inverted } = this.props;

        if (this.props !== prevProps) {
            this.setMessages(messages || []);
        }

        if (inverted === false &&
            messages &&
            prevProps.messages &&
            messages.length !== prevProps.messages.length) {
            setTimeout(() => this.scrollToBottom(true), 200);
        }
        if (text !== prevProps.text) {
            this.setTextFromProp(text);
        }
        if (messages &&
            prevProps.messages &&
            messages.length !== prevProps.messages.length) {
            setTimeout(() => this.scrollToBottom(false), 300);
        }
    }
    renderMessages() {
        const { messagesContainerStyle, ...messagesContainerProps } = this.props;
        const fragment = (<View style={[
            {
                height: this.state.messagesContainerHeight,
            },
            messagesContainerStyle,
        ]}>
            <MessageContainerCustom {...messagesContainerProps} invertibleScrollViewProps={this.invertibleScrollViewProps} messages={this.getMessages()} forwardRef={this._messageContainerRef} isTyping={this.props.isTyping} />
            {this.renderChatFooter()}
        </View>);
        return this.props.isKeyboardInternallyHandled ? (<KeyboardAvoidingView enabled>{fragment}</KeyboardAvoidingView>) : (fragment);
    }

    render() {
        return super.render();
    }
}

export default GiftedChatCustom