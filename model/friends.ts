import * as mongoose from 'mongoose';

const Friends = new mongoose.Schema({
    user:String,
    friends:[String]
})

module.exports = mongoose.model(`friends`,Friends,'friends');
