import * as express from 'express';
import * as mongoose from 'mongoose';
import * as cors from 'cors'
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';

require('dotenv').config();

const User  = require("./model/user.ts");
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

    User.findOne({email:body.email},async (error,user)=>{
        const passwordCorrect = await bcrypt.compare(body.password,user.password)
        if(error){
            res.status(401).send(`Error`);
        }else{
            if(!user || !passwordCorrect){
                res.send(passwordCorrect);
            }else{
                const payload = { subject: user._id };
                const token = jwt.sign(payload, ACCESS_TOKEN_SECRET);
                res.status(200).send({token,passwordCorrect});
            }
        }
    })

})

mongoose.connect("mongodb+srv://first_user:admin@cluster0.qzot6.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    ,()=>{
        console.log('Connected to database')
    })

app.listen(3000,()=>{
    console.log(`Listening on 3000`);
})


