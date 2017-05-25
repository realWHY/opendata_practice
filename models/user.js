// hold the user model

var mongoose = require('mongoose');
var bcrypt = require('bcrypt-nodejs');


var userSchema = mongoose.Schema({
    fullname:{type:String, required:true},
    email: {type:String, required:true},
    password:{type:String},
    passwordResetToken:{type:String, default: ''},
    passwordResetExpires:{type: Date, default: Date.now}
});

//encrypt the password to avoid it is saved as plain text
userSchema.methods.encryptPassword = (password)=>{
    return bcrypt.hashSync(password, bcrypt.genSaltSync(10),null);
}

userSchema.methods.ValidPassword = function(password){
    return bcrypt.compareSync(password, this.password);
}

module.exports = mongoose.model('User',userSchema); //('name','schema')  modelize, this has the ability to operate db      