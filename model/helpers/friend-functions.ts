import * as express from 'express';
const Friends = require("../friends");
const Group = require("../group");

export function friendCheckGroupMode(req:express.Request,res:express.Response,friendId){
    let body = req.body;
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
}

export function friendCheckNormalMode(req:express.Request,res:express.Response,friendId){
    Friends.findOne({user:req.body.user},async (error,user)=>{
        if(user.friends.includes(friendId)){
            res.send({correctUser:true})
        }else
        {
            res.send({correctUser:false})
        }
    })
}
