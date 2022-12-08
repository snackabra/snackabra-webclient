export default class GiftedMessage {
  _id
  createdAt
  text
  image
  user

  constructor(message, pending) {
    if(pending){
      this._id = 'sending_' + message._id
    }
    this._id = message._id
    this.createdAt = new Date().toString()
    this.text = message.text
    this.image = message.image ? message.image : '';
    this.user = message.user
    return this;
  }

  fromSBMessage(SBMessage){

  }
}
