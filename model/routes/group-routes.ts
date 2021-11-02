import * as express from 'express';
import {usersInGroup,usersSort} from "../helpers/user-functions"
const router = express.Router();
const Group = require("../group");

router.post('/group-users',(req:express.Request,res:express.Response)=>{
               const body = req.body;
               let usersNames = [];
               Group.findOne({name:body.name},async(error,groups)=>{
                   const usersId = groups.usersEmails;
                   await usersInGroup(usersId,usersNames);
                   res.send(usersNames);
               })
           })

           router.post('/add-group',async (req:express.Request,res:express.Response) => {
               const body = req.body;
               let userID = [];
               await usersSort(body.usersEmails,userID,req,res);
           })

           router.post('/group-check',(req:express.Request,res:express.Response)=>{
               const body = req.body;
               Group.find({usersEmails:body.userId},async(error,groups)=>{
                   const groupsNames = groups.map((item:{name:any;})=>item.name)
                   res.send(groupsNames);
               })
           });

module.exports = router
