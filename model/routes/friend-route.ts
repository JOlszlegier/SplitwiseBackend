import * as express from 'express';
const router = express.Router();
import {usersIdToNameSort,usersSearch} from "../helpers/user-functions"
import {friendCheckGroupMode,friendCheckNormalMode,addFriend} from "../helpers/friend-functions"
const Friends = require("../friends");

router.post('/add-friend',async (req:express.Request,res:express.Response)=>{
    const body = req.body;
    const friendId = await usersSearch(body.friends);
    const friendsList = [];
    addFriend(req,res,friendId,friendsList);
})

router.post('/friends-list',async (req:express.Request,res:express.Response)=>{
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

router.post('/friend-check',async (req:express.Request,res:express.Response)=> {
    const body=req.body;
    const friendId = await usersSearch(body.friends);
    if(body.groupName !== 'Dashboard' && body.groupName !== 'All Expenses' && body.groupName !== 'Recent Activities' ){
        friendCheckGroupMode(req,res,friendId);
    }else{
        friendCheckNormalMode(req,res,friendId);
    }
})

module.exports = router
