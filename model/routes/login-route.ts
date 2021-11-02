import * as express from 'express';
import * as bcrypt from 'bcrypt';
import * as jwt from 'jsonwebtoken';
const ACCESS_TOKEN_SECRET ='7b32dcf047c86f0c6aab76639f9c99f980877a6896f5e62a9d997f6d898ffa0f0a423ac9f6b12db31d89b6e51448107d93ff95ff76011f07bf274302c86b85b2'
const User  = require("../user.ts");

const router = express.Router();
router.post('/login',async (req:express.Request,res:express.Response) => {
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
module.exports =router;


