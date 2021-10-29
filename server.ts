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
const app = express();
const ACCESS_TOKEN_SECRET ='7b32dcf047c86f0c6aab76639f9c99f980877a6896f5e62a9d997f6d898ffa0f0a423ac9f6b12db31d89b6e51448107d93ff95ff76011f07bf274302c86b85b2'

app.use(cors({
    origin: '*'
}));

app.use(express.json());

app.post("/create-user",async (req:express.Request,res:express.Response)=>{
    const body = req.body;
    let registerSuccess = false;
     User.findOne({email:body.email},async (error,user)=>{
            if(user){
                res.send(registerSuccess);
            }else{
                req.body.password = await bcrypt.hash(body.password,10);
                const myUser = new User(body);
                myUser.outcome= 0;
                myUser.income = 0;
                await myUser.save();
                registerSuccess = true;
                res.send({myUser,registerSuccess});
            }
        })
    })

app.post('/login',async (req:express.Request,res:express.Response) => {
    const body = req.body;
    let currentDate = new Date();
    let passwordCorrect = false;
    currentDate.setHours(currentDate.getHours() + 1)
    User.findOne({email:body.email},async (error,user)=>{
        if(error){
            res.status(401).send(`Error`);
        }else{
            if(!user){
                res.send(passwordCorrect)
            }else{
                passwordCorrect = await bcrypt.compare(body.password,user.password)
                if(!passwordCorrect){
                    res.send(passwordCorrect);
                }else{
                    const payload = { subject: user._id };
                    const userId = user._id;
                    const userName = user.email;
                    const token = jwt.sign(payload, ACCESS_TOKEN_SECRET);
                    const expirationDate = currentDate.getTime().toString();
                    res.status(200).send({token,passwordCorrect,expirationDate,userId,userName});
                }
            }
        }

    })
})

app.post('/group-users',(req:express.Request,res:express.Response)=>{
    const body = req.body;
    let usersNames = [];
    Group.findOne({name:body.name},async(error,groups)=>{
        const usersId = groups.usersEmails;
        await usersInGroup(usersId,usersNames);
        res.send(usersNames);
    })
})

app.post('/add-group',async (req:express.Request,res:express.Response) => {
    const body = req.body;
    let userID = [];
    await usersSort(body.usersEmails,userID,req,res);
})

app.post('/group-check',(req:express.Request,res:express.Response)=>{
    const body = req.body;
    Group.find({usersEmails:body.userId},async(error,groups)=>{
        const groupsNames = groups.map((item:{name:any;})=>item.name)
        res.send(groupsNames);
    })
});

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

app.post('/add-friend',async (req:express.Request,res:express.Response)=>{
    const body = req.body;
    const friendId = await usersSearch(body.friends);
    const friendsList = [];
    addFriend(req,res,friendId,friendsList);
})

app.post('/friends-list',async (req:express.Request,res:express.Response)=>{
    const body=req.body;
    let userNames = [];
    Friends.findOne({user:body.user},async (error,user)=>{
        if(user){
            await usersIdToNameSort(user.friends,userNames);
            res.send({friends:userNames});
        }else{
            res.send({friends:[]});
        }
    })
})

app.post('/friend-check',async (req:express.Request,res:express.Response)=> {
    const body=req.body;
    const friendId = await usersSearch(body.friends);
    if(body.groupName !== 'Dashboard' && body.groupName !== 'All Expenses' && body.groupName !== 'Recent Activities' ){
        friendCheckGroupMode(req,res,friendId);
    }else{
        friendCheckNormalMode(req,res,friendId);
    }
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

app.listen(3000,()=>{
    console.log(`Listening on 3000`);
})

