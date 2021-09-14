import * as mongoose from 'mongoose';

const User = new mongoose.Schema({
    name:String,
    email:String,
    password:String
})

module.exports = mongoose.model(`user`,User);
