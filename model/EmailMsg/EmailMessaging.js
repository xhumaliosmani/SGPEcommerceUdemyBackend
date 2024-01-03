const { default: mongoose } = require("mongoose");

const emailMsgSchema = new mongoose.Schema(
  {
    fromEmail: {
      type: String,
      required: true,
    },
    toEmail: {
      type: String,
      required: true,
    },
    recipientEmail: {
      type: String,
      required: true,
    },
    message: {
      type: String,
      required: true,
    },
    subject: {
      type: String,
      required: true,
    },
    sendBy: {
      type: String,
      required: true,
    },
    isFlagged: {
      type: String,
    },
  },
  {
    timestamps: true,
  }
);

const EmailMsg = mongoose.model("EmailMsg", emailMsgSchema);

module.exports = EmailMsg;