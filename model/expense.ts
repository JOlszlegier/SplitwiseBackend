import * as mongoose from 'mongoose';

const Expense = new mongoose.Schema({
    from:[String],
    to:String,
    amount:[Number],
    currencyMultiplier:Number,
    description:String
})

module.exports = mongoose.model(`expense`,Expense,'Expenses');
