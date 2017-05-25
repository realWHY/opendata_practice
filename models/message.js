var mongoose = require('mongoose');

var messageSchema = mongoose.Schema({
    body: {type: String, required:true}, // if user not input any text, it won't be saved in db
    userFrom: {type: mongoose.Schema.Types.ObjectId, ref: 'User'},
    userFromName: {type: String, required: true},
    createdAt: {type: Date, required: true, default: Date.now}
});

module.exports = mongoose.model('Message',messageSchema);