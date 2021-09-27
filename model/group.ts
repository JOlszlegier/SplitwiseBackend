import * as mongoose from 'mongoose';

const Group = new mongoose.Schema({
    name:String,
    usersEmails:[String],
})

module.exports = mongoose.model(`group`,Group,'groups');
