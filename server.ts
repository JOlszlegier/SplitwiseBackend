import * as express from 'express';
import * as mongoose from 'mongoose';
import * as cors from 'cors'
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import {
    usersSearch,
    usersInGroup,
    usersSort, usersIdToNameSort
} from "./model/helpers/user-functions";
import {
    usersEmailsToId,
    expensesToUserInfoGroup,
    expensesToUserInfoRecent,
    expensesToUserInfoNormalMode,
    expensesFromUserInfoNormalMode,
    expensesFromUserRecentMode,
    expensesFromUserGroupMode
} from "./model/helpers/expense-functions";
import {
    settleUpInfoGroupMode,
    settleUpInfoNormalMode,
    settleUpInGroup,
    settleUpNormalMode
} from "./model/helpers/settle-up-functions";
import {addFriend, friendCheckGroupMode, friendCheckNormalMode} from "./model/helpers/friend-functions";

require('dotenv').config();

const User  = require("./model/user.ts");
const Group = require("./model/group.ts");
const Friends = require("./model/friends");
const router = express.Router();
const app = express();
const loginRouter = require("./model/routes/login-route.ts");
const registerRouter = require("./model/routes/register-route.ts");
const groupRouter = require("./model/routes/group-routes.ts");
const friendRouter = require("./model/routes/friend-route.ts");
const ACCESS_TOKEN_SECRET ='7b32dcf047c86f0c6aab76639f9c99f980877a6896f5e62a9d997f6d898ffa0f0a423ac9f6b12db31d89b6e51448107d93ff95ff76011f07bf274302c86b85b2'

app.use(cors({
    origin: '*'
}));

app.use(express.json());

app.use("",loginRouter);
app.use("",registerRouter);
app.use("",groupRouter);
app.use("",friendRouter);




app.post('/add-expense',async (req:express.Request,res:express.Response)=>{
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
    await usersEmailsToId(userArray,usersId,totalAmount,currentDate,req,res);
})

app.post('/balance-check',async (req:express.Request,res:express.Response)=>{
    const body =req.body;
    User.findOne({_id:body.userId},(error,user)=>{
        res.send({income:user.income,outcome:user.outcome})
    })
})



app.post('/settle-up-info',async (req:express.Request,res:express.Response)=> {
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

app.post('/settle-up',async (req:express.Request,res:express.Response)=>{
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

app.post('/expenses-info-to-user',async (req:express.Request,res:express.Response)=>{
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

app.post('/expenses-info-from-user',async (req:express.Request,res:express.Response)=>{
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

mongoose.connect("mongodb+srv://newuser:admin@cluster0.hiiuc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    ,()=>{
        console.log('Connected to database')
    })

app.listen(process.env.PORT || 3000,()=>{
    console.log(`Listening on 3000`);
})

