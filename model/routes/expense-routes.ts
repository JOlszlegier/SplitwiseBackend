import * as express from 'express';
import {expensesFromUserGroupMode,expensesFromUserRecentMode,expensesFromUserInfoNormalMode,
        expensesToUserInfoGroup,expensesToUserInfoRecent,expensesToUserInfoNormalMode,expenseAdd} from "../helpers/expense-functions";
import {settleUpInfoGroupMode,settleUpInfoNormalMode,settleUpNormalMode,settleUpInGroup} from "../helpers/settle-up-functions";
const User  = require("../user.ts");
const router = express.Router();

router.post('/add-expense',async (req:express.Request,res:express.Response)=>{
    const body=req.body;
    let usersId = [];
    let totalAmount = 0;
    let currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 2)
    if(body.groupName === 'Dashboard' || body.groupName === 'Recent Activities' || body.groupName === 'All Expenses'){
        body.groupName = '';
    }
    let userArray = [];
    for(const user of body.eachUserExpense){
        userArray.push(user.from)
    }
    await expenseAdd(userArray,usersId,totalAmount,currentDate,req,res);
})

router.post('/balance-check',async (req:express.Request,res:express.Response)=>{
    const body =req.body;
    User.findOne({_id:body.userId},(error,user)=>{
        res.send({income:user.income,outcome:user.outcome})
    })
})



router.post('/settle-up-info',async (req:express.Request,res:express.Response)=> {
    const body=req.body;
    let thisUserOwes=[]
    let finalResponseArray = [];
    let insideExpensesId = []
    let userNames = [];
    let holder= {};
    if(body.groupName === 'Dashboard' || body.groupName === 'All Expenses' || body.groupName === 'Recent Activities'){
        settleUpInfoNormalMode(req,res,holder,thisUserOwes,finalResponseArray,userNames,insideExpensesId);
    }else{
        settleUpInfoGroupMode(req,res,holder,thisUserOwes,finalResponseArray,userNames,insideExpensesId);
    }

})

router.post('/settle-up',async (req:express.Request,res:express.Response)=>{
    const body = req.body;
    const expensesToDeleteId = [];
    let amountUserAfterFork = 0;
    //without group
    if(body.groupName === 'Dashboard' || body.groupName === 'All Expenses' || body.groupName === 'Recent Activities'){
        settleUpNormalMode(req,res,expensesToDeleteId);
    }else{ //with group
        settleUpInGroup(req,res,expensesToDeleteId,amountUserAfterFork);
    }

})

router.post('/expenses-info-to-user',async (req:express.Request,res:express.Response)=>{
    const body= req.body;
    const expensesUserIsOwed:[{description:String,amount:number}] = [{description:'',amount:0}];
    if(body.groupName === 'Dashboard' || body.groupName === 'All Expenses'){
        expensesToUserInfoNormalMode(req,res,expensesUserIsOwed);
    }else if(body.groupName === 'Recent Activities'){
        expensesToUserInfoRecent(req,res,expensesUserIsOwed);
    }else{
        expensesToUserInfoGroup(req,res,expensesUserIsOwed)
    }
})

router.post('/expenses-info-from-user',async (req:express.Request,res:express.Response)=>{
    const body= req.body;
    const expensesUserIsOwing:[{description:String,amount:number}] = [{description:'',amount:0}];
    if(body.groupName === 'Dashboard'  || body.groupName === 'All Expenses'){
        expensesFromUserInfoNormalMode(req,res,expensesUserIsOwing);
    }else if(body.groupName === 'Recent Activities'){
        expensesFromUserRecentMode(req,res,expensesUserIsOwing);
    }
    else{
        expensesFromUserGroupMode(req,res,expensesUserIsOwing);
    }
})

module.exports = router
