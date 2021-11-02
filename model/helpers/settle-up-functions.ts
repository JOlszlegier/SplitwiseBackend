import {userIdToName} from "./user-functions";
const Expense = require("../expense.ts")
import * as express from 'express';
const User  = require("../user.ts");

export async function SettleUpInfo(req: express.Request, res: express.Response, holder, thisUserOwes,
                                   finalResponseArray, userNames, insideExpensesId: string[], expenses) {
    for (const expense in expenses) {
        for (const user in expenses[expense].eachUserExpense) {
            if (expenses[expense].eachUserExpense[user].from === req.body.userId) {
                thisUserOwes.push({
                    to: expenses[expense].to,
                    value: expenses[expense].eachUserExpense[user].value,
                    userName: ''
                })
                insideExpensesId.push(expenses[expense].eachUserExpense[user]._id)
            }
        }
    }
    thisUserOwes.forEach((d) => {
        if (holder.hasOwnProperty(d.to)) {
            holder[d.to] = holder[d.to] + d.value
        } else {
            holder[d.to] = d.value
        }
    })
    for (let prop in holder) {
        finalResponseArray.push({to: prop, value: holder[prop]})
    }
    for (const user in finalResponseArray) {
        const newElem = await userIdToName(finalResponseArray[user].to)
        userNames.push(newElem);
    }

    res.send({valueOwedToUser: finalResponseArray, expensesId: insideExpensesId, userNames: userNames});
}

export function settleUpNormalMode(req:express.Request, res:express.Response, expensesToDeleteId:number[])    {
    Expense.find({'eachUserExpense.from':req.body.userId},async (error, expenses) => {
            for (const expense in expenses) {
                for (const user in expenses[expense].eachUserExpense) {
                    if (expenses[expense].eachUserExpense[user].from === req.body.userId) {
                        expenses[expense].eachUserExpense.splice(Number(user), 1);
                        if (expenses[expense].eachUserExpense.length === 0) {
                            expensesToDeleteId.push(expenses[expense]._id.toString())
                        } else {
                            await expenses[expense].save();
                        }
                    }
                }
            }
            for (const expense of expensesToDeleteId) {
                await Expense.findOneAndDelete({_id: expense});
            }
        }
    )
    User.findOne({_id:req.body.userId},async (error, user) => {
        user.outcome = 0;
        await user.save();
    })
    for(const userIndex in req.body.valueOwedToUser){
        User.findOne({_id:req.body.valueOwedToUser[userIndex].to},async (error, user) => {
            user.income = user.income - req.body.valueOwedToUser[userIndex].value;
            await user.save();
            res.send({settleUpFinished:true});
        })
    }
}

export function settleUpInGroup(req:express.Request, res:express.Response, expensesToDeleteId:number[], amountUserAfterFork:number){
    let body = req.body;
    Expense.find({$and:[{'eachUserExpense.from':body.userId}, {groupName:body.groupName}]},async (error, expenses) => {
            for (const expense in expenses) {
                for (const user in expenses[expense].eachUserExpense) {
                    if (expenses[expense].eachUserExpense[user].from === body.userId) {
                        amountUserAfterFork = amountUserAfterFork + expenses[expense].eachUserExpense[user].value;
                        expenses[expense].eachUserExpense.splice(Number(user), 1);
                        if (expenses[expense].eachUserExpense.length === 0) {
                            expensesToDeleteId.push(expenses[expense]._id.toString())
                        } else {
                            await expenses[expense].save();
                        }
                    }
                }
            }
            for (const expense of expensesToDeleteId) {
                await Expense.findOneAndDelete({_id: expense});
            }
            User.findOne({_id:body.userId},async (error, user) => {
                user.outcome = user.outcome - amountUserAfterFork;
                await user.save();
            })
            for(const userIndex in body.valueOwedToUser){
                User.findOne({_id:body.valueOwedToUser[userIndex].to},async (error, user) => {
                    user.income = user.income - body.valueOwedToUser[userIndex].value;
                    await user.save();
                    res.send({settleUpFinished:true});
                })
            }
        }
    )
}


export function settleUpInfoNormalMode(req:express.Request,res:express.Response, holder,thisUserOwes,
                                       finalResponseArray,userNames,insideExpensesId:string[]){
    let body = req.body;
    Expense.find({'eachUserExpense.from':body.userId},async (error, expenses) => {
        await SettleUpInfo(req, res, holder, thisUserOwes, finalResponseArray, userNames, insideExpensesId, expenses);
    })
}

export function settleUpInfoGroupMode(req:express.Request,res:express.Response, holder,thisUserOwes,
                                      finalResponseArray,userNames,insideExpensesId:string[]){
    let body=req.body;
    Expense.find({$and:[{'eachUserExpense.from':body.userId},{groupName:body.groupName}]},async (error, expenses) => {
        await SettleUpInfo(req, res, holder, thisUserOwes, finalResponseArray, userNames, insideExpensesId, expenses);
    })
}
