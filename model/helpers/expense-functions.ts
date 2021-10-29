import {updateBalanceMinus, updateBalancePlus, usersSearch} from "./user-functions";
const Expense = require("../expense.ts")
import * as express from 'express';


export async function usersEmailsToId(usersEmails:string[],usersId,totalAmount:number,currentDate:Date,req:express.Request,res:express.Response){
    for(const userEmail of usersEmails){
        const newElement = await usersSearch(userEmail)
        usersId.push(newElement);
    }
    for(const user in usersId){
        req.body.eachUserExpense[user].from = usersId[user];
        await updateBalanceMinus(req.body.eachUserExpense[user].from,req.body.eachUserExpense[user].value)
        totalAmount=totalAmount+req.body.eachUserExpense[user].value;
    }
    req.body.to = await usersSearch(req.body.to);
    await updateBalancePlus(req.body.to,totalAmount);
    const newExpense = new Expense(req.body);
    newExpense.date = currentDate.getTime().toString();
    res.send({expenseAdded:true})
    await newExpense.save();
}
