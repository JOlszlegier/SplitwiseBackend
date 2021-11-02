import * as express from 'express';
import {usersIdToNameSort, usersSearch} from "./user-functions";
const Friends = require("../friends");
const Group = require("../group");

export function friendCheckGroupMode(req:express.Request, res:express.Response, friendId){
    let body = req.body;
    Group.findOne({$and:[{name:body.groupName},{usersEmails:friendId}]},async(error,user)=>{
        if(user){
            Friends.findOne({user:body.user},async (error,user)=>{
                if(user.friends.includes(friendId)){
                    res.send({correctUser:true})
                }else {
                    res.send({correctUser:false})
                }
            })
        }else{
            res.send({correctUser:false});
        }
    });
}

export function friendCheckNormalMode(req:express.Request, res:express.Response, friendId){
    Friends.findOne({user:req.body.user},async (error,user)=>{
        if(user.friends.includes(friendId)){
            res.send({correctUser:true})
        }else {
            res.send({correctUser:false})
        }
    })
}

export function addFriend(req:express.Request, res:express.Response, friendId, friendsList){
    let body = req.body;
    Friends.findOne({user:body.user},async (error, user) => {
        if(friendId!=0){
            if(friendId === body.user){
                if(user.friends){
                    await usersIdToNameSort(user.friends, friendsList)
                    res.send({errorMessage:`Sadly, you can't be a friend with yourself :(`,
                        friends:friendsList})
                }else{
                    await usersIdToNameSort(body.friends, friendsList)
                    res.send({errorMessage:`Sadly, you can't be a friend with yourself :(`,
                        friends:friendsList})
                }
            }else{
                if (user) {
                    if(user.friends.includes(friendId)){
                        await usersIdToNameSort(user.friends, friendsList)
                        res.send({userAlreadyOnTheList:true, friends:friendsList, errorMessage:'This user is already in your friends group!'});
                    }else{
                        user.friends.push(friendId);
                        await user.save();
                        await usersIdToNameSort(user.friends, friendsList)
                        res.send({friends:friendsList, successMessage:"Friend added!"});
                    }
                } else {
                    const newFriend = new Friends(body);
                    newFriend.friends = await usersSearch(body.friends)
                    newFriend.user = body.user;
                    await newFriend.save();
                    await usersIdToNameSort(newFriend.friends, friendsList)
                    res.send({friends:friendsList,successMessage:"Friend added!"});
                }
            }
        }
        else{
            await usersIdToNameSort(user.friends, friendsList);
            res.send({friends:friendsList, errorMessage:`This user does not exist!`})
        }
    })
}
