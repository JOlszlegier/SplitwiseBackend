import * as express from 'express';
const User  = require("../user.ts");
const router = express.Router();
import * as bcrypt from 'bcrypt';

router.post("/create-user",async (req:express.Request,res:express.Response)=>{
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

module.exports = router;
