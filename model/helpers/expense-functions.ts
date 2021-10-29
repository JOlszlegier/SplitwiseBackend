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

function expenseSearch(expenses,expensesUserIsOwed:[{description:String,amount:number}]){
    for(let expense in expenses){
        let description = expenses[expense].description;
        let amount = 0;
        for(let user in expenses[expense].eachUserExpense){
            amount= amount + expenses[expense].eachUserExpense[user].value;
        }
        expensesUserIsOwed.push({description,amount});
    }
}

export function expensesInfoNormalMode(req:express.Request,res:express.Response,expensesUserIsOwed:[{description:String,amount:number}]) {
    Expense.find({to:req.body.userId},async(error,expenses)=>{
        expenseSearch(expenses,expensesUserIsOwed)
        expensesUserIsOwed.splice(0,1);
        res.send({expensesArray:expensesUserIsOwed});
    })
}

export function expensesInfoRecent(req:express.Request,res:express.Response,expensesUserIsOwed:[{description:String,amount:number}]){
    Expense.find({to:req.body.userId},async(error,expenses)=>{
        expenseSearch(expenses,expensesUserIsOwed)
        expensesUserIsOwed.splice(0,1);
        expensesUserIsOwed.splice(3,expensesUserIsOwed.length-1);
        res.send({expensesArray:expensesUserIsOwed});
    })
}

export function expensesInfoGroup(req:express.Request,res:express.Response,expensesUserIsOwed:[{description:String,amount:number}]){
    Expense.find({$and:[{to:req.body.userId},{groupName:req.body.groupName}]},async(error,expenses)=>{
        expenseSearch(expenses,expensesUserIsOwed)
        expensesUserIsOwed.splice(0,1);
        res.send({expensesArray:expensesUserIsOwed});
    })
}
