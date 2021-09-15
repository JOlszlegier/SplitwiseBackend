import * as express from 'express';
import * as mongoose from 'mongoose';
import * as cors from 'cors'
import * as bcrypt from 'bcrypt';

const User  = require("./model/user.ts")

require('dotenv').config();

const app = express();

app.use(cors({
    origin: '*'
}));

app.use(express.json());

app.post("/create_user",async (req:express.Request,res:express.Response)=>{
    try{
        let isEmailTaken = await User.findOne({email:req.body.email})
        if(isEmailTaken){
            res.send({registerStatus:false});
        }else{
            req.body.password = await bcrypt.hash(req.body.password,10);
            const myUser = new User(req.body)
            await myUser.save()
            res.send({registerStatus:false});
        }
    }catch (err){
        res.send(err);
    }
})

app.post('/login',async (req:express.Request,res:express.Response) => {
    const body = req.body;
    const user = await User.findOne({email: body.email});
    if(user){
        if(await bcrypt.compare(body.password,user.password)){
            res.send({loginStatus:true});
        }else{
            res.send({loginStatus:false});
        }
    }
})

mongoose.connect("mongodb+srv://first_user:admin@cluster0.qzot6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    ,()=>{
        console.log('Connected to database')
    })

app.listen(3000,()=>{
    console.log(`Listening on 3000`);
})
