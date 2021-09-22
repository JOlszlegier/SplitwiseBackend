import * as express from 'express';
import * as mongoose from 'mongoose';
import * as cors from 'cors'
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

require('dotenv').config();

const User  = require("./model/user.ts");
const Group = require("./model/group.ts");
const Expense = require("./model/expense");
const app = express();
const ACCESS_TOKEN_SECRET ='7b32dcf047c86f0c6aab76639f9c99f980877a6896f5e62a9d997f6d898ffa0f0a423ac9f6b12db31d89b6e51448107d93ff95ff76011f07bf274302c86b85b2'


app.use(cors({
    origin: '*'
}));

app.use(express.json());

app.post("/create_user",async (req:express.Request,res:express.Response)=>{
    const body = req.body;
    let registerSuccess = false;
    await User.findOne({email:body.email},async (error,user)=>{
        if(error){
            res.status(401).send(registerSuccess);
        }else{
            if(user){
                res.status(401).send(registerSuccess).message(`email already taken!`);
            }else{
                req.body.password = await bcrypt.hash(body.password,10);
                const myUser = new User(body);
                await myUser.save();
                registerSuccess = true;
                res.send({myUser,registerSuccess});
            }
        }
    })
})

app.post('/login',async (req:express.Request,res:express.Response) => {
    const body = req.body;
    let currentDate = new Date();
    currentDate.setHours(currentDate.getHours() + 1)
    User.findOne({email:body.email},async (error,user)=>{
        const passwordCorrect = await bcrypt.compare(body.password,user.password)
        if(error){
            res.status(401).send(`Error`);
        }else{
            if(!user || !passwordCorrect){
                res.send(passwordCorrect);
            }else{
                const payload = { subject: user._id };
                const userId = user._id;
                const token = jwt.sign(payload, ACCESS_TOKEN_SECRET);
                const expirationDate = currentDate.getTime().toString();
                res.status(200).send({token,passwordCorrect,expirationDate,userId});
            }
        }

    })
})

app.post('/group-users',(req:express.Request,res:express.Response)=>{
    const body = req.body;
    let usersNames = [];

    function usersSearchById(userId){
        return new Promise(resolve=>{
            User.findOne({_id:userId},async (error,user)=>{
                resolve(user.name);
            })
        })
    }
    async function usersInGroup(usersId){
        for(const userId of usersId){
            const newElem = await usersSearchById(userId);
            usersNames.push(newElem);
        }
    }

    Group.findOne({name:body.name},async(error,groups)=>{
        const usersId = groups.usersEmails;
        await usersInGroup(usersId);
        res.send(usersNames);
    })

})

app.post('/add-group',async (req:express.Request,res:express.Response) => {
    const body = req.body;
    let userID = [];
    function usersSearch(usersEmail){
        return new Promise (resolve=>{
            User.findOne({email:usersEmail},async (error,user)=> {
                resolve(user._id.toString())
            })
        })
    }
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

app.post('/add-expense',(req:express.Request,res:express.Response)=>{
    const body=req.body;
    res.send(body);
})


mongoose.connect("mongodb+srv://first_user:admin@cluster0.qzot6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    ,()=>{
        console.log('Connected to database')
    })

app.listen(3000,()=>{
    console.log(`Listening on 3000`);
})


//Token verification ,might use in the future
// app.get('/token-verification',verifyToken,(req,res)=>{
//     res.status(200).send({tokenVerified:true});
// })

// function verifyToken(req,res,next){
//     if(!req.headers.authorization){
//         return res.status(401).send(`No token`)
//     }
//     let token = req.headers.authorization.split(' ')[1];
//     if(token === 'null'){
//         return res.status(401).send(`Token empty`)
//     }
//     let payload = jwt.verify(token,ACCESS_TOKEN_SECRET);
//     if(!payload){
//         return res.status(401).send(`Tokens do not match!`)
//     }
//     next();
// }
