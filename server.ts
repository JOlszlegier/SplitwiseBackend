import * as express from 'express';
import * as mongoose from 'mongoose';
import * as cors from 'cors'
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
import {usersSearch,userIdToName,updateBalancePlus,updateBalanceMinus,usersInGroup} from "./model/helpers/exports";

require('dotenv').config();

const User  = require("./model/user.ts");
const Group = require("./model/group.ts");
const Expense = require("./model/expense");
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
    async function usersSort(usersBodyEmail){

        for(const userEmail of usersBodyEmail){
            const newElem = await usersSearch(userEmail);
            userID.push(newElem)
        }
        const newGroup =  new Group({name:body.name,usersEmails:userID});
        await newGroup.save();
        res.send({newGroup});
    }
    await usersSort(body.usersEmails);
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
    async function usersEmailsToId(usersEmails){
        for(const userEmail of usersEmails){
            const newElement = await usersSearch(userEmail)
            usersId.push(newElement);
        }
        for(const user in usersId){
            body.eachUserExpense[user].from = usersId[user];
            await updateBalanceMinus(body.eachUserExpense[user].from,body.eachUserExpense[user].value)
            totalAmount=totalAmount+body.eachUserExpense[user].value;
        }
        body.to = await usersSearch(body.to);
        await updateBalancePlus(body.to,totalAmount);
        const newExpense = new Expense(body);
        newExpense.date = currentDate.getTime().toString();
        res.send({expenseAdded:true})
        await newExpense.save();
    }
    let userArray = [];
    for(const user of body.eachUserExpense){
        userArray.push(user.from)
    }
    await usersEmailsToId(userArray);

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
        Friends.findOne({user:body.user},async (error, user) => {
            if(friendId!=0){
                if(friendId === body.user){
                    if(user.friends){
                        await usersIdToNameSort(user.friends)
                        res.send({errorMessage:`Sadly, you can't be a friend with yourself :(`,
                            friends:friendsList})
                    }else{
                        await usersIdToNameSort(body.friends)
                        res.send({errorMessage:`Sadly, you can't be a friend with yourself :(`,
                            friends:friendsList})
                    }

                }else{
                    if (user) {
                        if(user.friends.includes(friendId)){
                            await usersIdToNameSort(user.friends)
                            res.send({userAlreadyOnTheList:true,friends:friendsList,errorMessage:'This user is already in your friends group!'});
                        }else{
                            user.friends.push(friendId);
                            await user.save();
                            await usersIdToNameSort(user.friends)
                            res.send({friends:friendsList,successMessage:"Friend added!"});
                        }
                    } else {
                        const newFriend = new Friends(body);
                        newFriend.friends = await usersSearch(body.friends)
                        newFriend.user = body.user;
                        await newFriend.save();
                        await usersIdToNameSort(newFriend.friends)
                        res.send({friends:friendsList,successMessage:"Friend added!"});
                    }
                }
            }
            else{
                await usersIdToNameSort(user.friends);
                res.send({friends:friendsList,errorMessage:`This user does not exist!`})
            }
        })


    async function usersIdToNameSort(usersId) {
        for (const friend of usersId) {
            const newElement = await userIdToName(friend)
            friendsList.push(newElement);
        }
    }
})

app.post('/friends-list',async (req:express.Request,res:express.Response)=>{
    const body=req.body;
    let userNames = [];
    Friends.findOne({user:body.user},async (error,user)=>{
        if(user){
            await usersIdToNameSort(user.friends);
            res.send({friends:userNames});
        }else{
            res.send({friends:[]});
        }
    })

    async function usersIdToNameSort(usersId) {
        for (const friend of usersId) {
            const newElement = await userIdToName(friend)
            userNames.push(newElement);
        }
    }
})

app.post('/friend-check',async (req:express.Request,res:express.Response)=> {
    const body=req.body;
    const friendId = await usersSearch(body.friends);
    if(body.groupName !== 'Dashboard' && body.groupName !== 'All Expenses' && body.groupName !== 'Recent Activities' ){
        Group.findOne({$and:[{name:body.groupName},{usersEmails:friendId}]},async(error,user)=>{
            if(user){
                Friends.findOne({user:body.user},async (error,user)=>{
                    if(user.friends.includes(friendId)){
                        res.send({correctUser:true})
                    }else
                    {
                        res.send({correctUser:false})
                    }
                })
            }else{
                res.send({correctUser:false});
            }
        });
    }else{
        Friends.findOne({user:body.user},async (error,user)=>{
            if(user.friends.includes(friendId)){
                res.send({correctUser:true})
            }else
            {
                res.send({correctUser:false})
            }
        })
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
        Expense.find({'eachUserExpense.from':body.userId},async (error, expenses) => {
            for (const expense in expenses) {
                for (const user in expenses[expense].eachUserExpense) {
                    if (expenses[expense].eachUserExpense[user].from === body.userId) {
                        thisUserOwes.push({
                            to: expenses[expense].to,
                            value: expenses[expense].eachUserExpense[user].value,
                            userName:''
                        })
                        insideExpensesId.push(expenses[expense].eachUserExpense[user]._id);
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
                const newElem =await userIdToName(finalResponseArray[user].to)
                userNames.push(newElem);
            }

            res.send({valueOwedToUser: finalResponseArray, expensesId: insideExpensesId,userNames:userNames});
        })
    }else{
        Expense.find({$and:[{'eachUserExpense.from':body.userId},{groupName:body.groupName}]},async (error, expenses) => {
            for (const expense in expenses) {
                for (const user in expenses[expense].eachUserExpense) {
                    if (expenses[expense].eachUserExpense[user].from === body.userId) {
                        thisUserOwes.push({
                            to: expenses[expense].to,
                            value: expenses[expense].eachUserExpense[user].value,
                            userName:''
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
                const newElem =await userIdToName(finalResponseArray[user].to)
                userNames.push(newElem);
            }

            res.send({valueOwedToUser: finalResponseArray, expensesId: insideExpensesId,userNames:userNames});
        })
    }

})

app.post('/settle-up',async (req:express.Request,res:express.Response)=>{
    const body = req.body;
    const expensesToDeleteId = [];
    let amountUserAfterFork = 0;
    //without group
    if(body.groupName === 'Dashboard' || body.groupName === 'All Expenses' || body.groupName === 'Recent Activities'){
        Expense.find({'eachUserExpense.from':body.userId},async (error, expenses) => {
                for (const expense in expenses) {
                    for (const user in expenses[expense].eachUserExpense) {
                        if (expenses[expense].eachUserExpense[user].from === body.userId) {
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
        User.findOne({_id:body.userId},async (error, user) => {
            user.outcome = 0;
            await user.save();
        })
        for(const userIndex in body.valueOwedToUser){
            User.findOne({_id:body.valueOwedToUser[userIndex].to},async (error, user) => {
                user.income = user.income - body.valueOwedToUser[userIndex].value;
                await user.save();
                res.send({settleUpFinished:true});
            })
        }
    }else{ //with group
        Expense.find({$and:[{'eachUserExpense.from':body.userId},{groupName:body.groupName}]},async (error, expenses) => {
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



})

app.post('/expenses-info-to-user',async (req:express.Request,res:express.Response)=>{
    const body= req.body;
    const expensesUserIsOwed:[{description:String,amount:number}] = [{description:'',amount:0}];
    if(body.groupName === 'Dashboard' || body.groupName === 'All Expenses'){
        Expense.find({to:body.userId},async(error,expenses)=>{
            for(let expense in expenses){
                let description = expenses[expense].description;
                let amount = 0;
                for(let user in expenses[expense].eachUserExpense){
                    amount= amount + expenses[expense].eachUserExpense[user].value;
                }
                expensesUserIsOwed.push({description,amount});
            }
            expensesUserIsOwed.splice(0,1);
            res.send({expensesArray:expensesUserIsOwed});
        })

    }else if(body.groupName === 'Recent Activities'){
        Expense.find({to:body.userId},async(error,expenses)=>{
            for(let expense in expenses){
                let description = expenses[expense].description;
                let amount = 0;
                for(let user in expenses[expense].eachUserExpense){
                    amount= amount + expenses[expense].eachUserExpense[user].value;
                }
                expensesUserIsOwed.push({description,amount});
            }
            expensesUserIsOwed.splice(0,1);
            expensesUserIsOwed.splice(3,expensesUserIsOwed.length-1);
            res.send({expensesArray:expensesUserIsOwed});
        })
    }else{
        Expense.find({$and:[{to:body.userId},{groupName:body.groupName}]},async(error,expenses)=>{
            for(let expense in expenses){
                let description = expenses[expense].description;
                let amount = 0;
                for(let user in expenses[expense].eachUserExpense){
                    amount= amount + expenses[expense].eachUserExpense[user].value;
                }
                expensesUserIsOwed.push({description,amount});
            }
            expensesUserIsOwed.splice(0,1);
            res.send({expensesArray:expensesUserIsOwed});
        })
    }
})

app.post('/expenses-info-from-user',async (req:express.Request,res:express.Response)=>{
    const body= req.body;
    const expensesUserIsOwing:[{description:String,amount:number}] = [{description:'',amount:0}];
    if(body.groupName === 'Dashboard'  || body.groupName === 'All Expenses'){
        Expense.find({'eachUserExpense.from':body.userId},async(error,expenses)=>{
            for (const expense in expenses) {
                for (const user in expenses[expense].eachUserExpense) {
                    if (expenses[expense].eachUserExpense[user].from === body.userId) {
                        expensesUserIsOwing.push({description:expenses[expense].description,amount:expenses[expense].eachUserExpense[user].value})
                    }
                }
            }
            expensesUserIsOwing.splice(0,1);
            res.send({expensesArray:expensesUserIsOwing});
        })
    }else if(body.groupName === 'Recent Activities'){
        Expense.find({'eachUserExpense.from':body.userId},async(error,expenses)=>{
            for (const expense in expenses) {
                for (const user in expenses[expense].eachUserExpense) {
                    if (expenses[expense].eachUserExpense[user].from === body.userId) {
                        expensesUserIsOwing.push({description:expenses[expense].description,amount:expenses[expense].eachUserExpense[user].value})
                    }
                }
            }
            expensesUserIsOwing.splice(0,1);
            expensesUserIsOwing.splice(3,expensesUserIsOwing.length-3);
            res.send({expensesArray:expensesUserIsOwing});
        })
    }
    else{
        Expense.find({$and:[{'eachUserExpense.from':body.userId},{groupName:body.groupName}]},async(error,expenses)=>{
            for (const expense in expenses) {
                for (const user in expenses[expense].eachUserExpense) {
                    if (expenses[expense].eachUserExpense[user].from === body.userId) {
                        expensesUserIsOwing.push({description:expenses[expense].description,amount:expenses[expense].eachUserExpense[user].value})
                    }
                }
            }
            expensesUserIsOwing.splice(0,1);
            res.send({expensesArray:expensesUserIsOwing});
        })
    }
})



mongoose.connect("mongodb+srv://newuser:admin@cluster0.hiiuc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    ,()=>{
        console.log('Connected to database')
    })

app.listen(3000,()=>{
    console.log(`Listening on 3000`);
})

