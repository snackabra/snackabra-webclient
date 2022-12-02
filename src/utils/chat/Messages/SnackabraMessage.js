export default class SBMessage {
  _id
  encrypted
  contents
  sender_pubKey
  sign
  image_sign
  imageMetaData
  imageMetaData_sign
  sender_username

  constructor(_id, messageBody) {
    this._id = _id;
    console.log(messageBody)
    for (let x in messageBody) {

      if (this.hasOwnProperty(x)) {
        this[x] = messageBody[x]
      }
    }

    return this;
  }


}
