import * as mongoose from 'mongoose';

const Expense = new mongoose.Schema({
    to:String,
    eachUserExpense:[{from:String,value:Number}],
    description:String
})

module.exports = mongoose.model(`expense`,Expense,'Expenses');
