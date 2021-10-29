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

function expenseOwedSearch(expenses,expensesUserIsOwed:[{description:String,amount:number}]){
    for(let expense in expenses){
        let description = expenses[expense].description;
        let amount = 0;
        for(let user in expenses[expense].eachUserExpense){
            amount= amount + expenses[expense].eachUserExpense[user].value;
        }
        expensesUserIsOwed.push({description,amount});
    }
}

export function expensesToUserInfoNormalMode(req:express.Request,res:express.Response,expensesUserIsOwed:[{description:String,amount:number}]) {
    Expense.find({to:req.body.userId},async(error,expenses)=>{
        expenseOwedSearch(expenses,expensesUserIsOwed)
        expensesUserIsOwed.splice(0,1);
        res.send({expensesArray:expensesUserIsOwed});
    })
}

export function expensesToUserInfoRecent(req:express.Request,res:express.Response,expensesUserIsOwed:[{description:String,amount:number}]){
    Expense.find({to:req.body.userId},async(error,expenses)=>{
        expenseOwedSearch(expenses,expensesUserIsOwed)
        expensesUserIsOwed.splice(0,1);
        expensesUserIsOwed.splice(3,expensesUserIsOwed.length-1);
        res.send({expensesArray:expensesUserIsOwed});
    })
}

export function expensesToUserInfoGroup(req:express.Request,res:express.Response,expensesUserIsOwed:[{description:String,amount:number}]){
    Expense.find({$and:[{to:req.body.userId},{groupName:req.body.groupName}]},async(error,expenses)=>{
        expenseOwedSearch(expenses,expensesUserIsOwed)
        expensesUserIsOwed.splice(0,1);
        res.send({expensesArray:expensesUserIsOwed});
    })
}

function expenseBorrowedSearch(expenses,expensesUserIsOwing:[{description:String,amount:number}],req:express.Request){
    for (const expense in expenses) {
        for (const user in expenses[expense].eachUserExpense) {
            if (expenses[expense].eachUserExpense[user].from === req.body.userId) {
                expensesUserIsOwing.push({description:expenses[expense].description,amount:expenses[expense].eachUserExpense[user].value})
            }
        }
    }
}

export function expensesFromUserInfoNormalMode(req:express.Request,res:express.Response,expensesUserIsOwing:[{description:String,amount:number}]){
    Expense.find({'eachUserExpense.from':req.body.userId},async(error,expenses)=>{
        expenseBorrowedSearch(expenses,expensesUserIsOwing,req);
        expensesUserIsOwing.splice(0,1);
        res.send({expensesArray:expensesUserIsOwing});
    })
}

export function expensesFromUserRecentMode(req:express.Request,res:express.Response,expensesUserIsOwing:[{description:String,amount:number}]){
    Expense.find({'eachUserExpense.from':req.body.userId},async(error,expenses)=>{
        expenseBorrowedSearch(expenses,expensesUserIsOwing,req);
        expensesUserIsOwing.splice(0,1);
        expensesUserIsOwing.splice(3,expensesUserIsOwing.length-3);
        res.send({expensesArray:expensesUserIsOwing});
    })
}

export function expensesFromUserGroupMode(req:express.Request,res:express.Response,expensesUserIsOwing:[{description:String,amount:number}]){
    Expense.find({$and:[{'eachUserExpense.from':req.body.userId},{groupName:req.body.groupName}]},async(error,expenses)=>{
        expenseBorrowedSearch(expenses,expensesUserIsOwing,req);
        expensesUserIsOwing.splice(0,1);
        res.send({expensesArray:expensesUserIsOwing});
    })
}
