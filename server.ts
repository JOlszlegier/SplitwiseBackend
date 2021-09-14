import * as express from 'express';
import * as mongoose from 'mongoose';
import * as cors from 'cors'
import * as bcrypt from 'bcrypt';

const User  = require("./model/user.ts")

require('dotenv').config();

const app =express();

app.use(cors({
    origin: '*'
}));

app.use(express.json());


app.post("/create_user",async (req,res)=>{
    try{
        const isEmailAlreadyRegistered = await User.findOne({email:req.body.email})
        if(!isEmailAlreadyRegistered){
            const salt = await bcrypt.genSalt(10);
            req.body.password = await bcrypt.hash(req.body.password,salt);
            const myUser = new User(req.body)
            await myUser.save()
            res.send(myUser)
        }else{
            res.status(400).json({ message: "Invalid password" });
        }
    }catch (err){
        res.send(err);
    }
})

app.post('/login',async (req, res) => {
    const body = req.body;
    const user = await User.findOne({email: body.email});
    if(user){
        const validPassword = await bcrypt.compare(body.password,user.password);
        if(validPassword){
            res.status(200).json({ message: "Valid password" });
        }else{
            res.status(400).json({ error: "Invalid Password" });
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
