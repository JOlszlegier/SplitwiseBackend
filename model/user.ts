import * as mongoose from 'mongoose';

const User = new mongoose.Schema({
    name:String,
    email:String,
    password:String,
    income:Number,
    outcome:Number
})

module.exports = mongoose.model(`user`,User,'users');
