const Group = require("../group.ts");
const User  = require("../user.ts");

export function usersSearch(usersEmail){
    return new Promise (resolve=>{
        User.findOne({email:usersEmail},async (error,user)=> {
            if(user){
                resolve(user._id.toString())
            }else{
                resolve(0);
            }
        })
    })
}

export function userIdToName(userId){
    return new Promise (resolve=>{
        User.findOne({_id:userId},async (error,user)=> {
            resolve(user.name.toString())
        })
    })
}

export function updateBalancePlus(userId:string,amount:number){
    return new Promise(resolve=>{
        User.findOne({_id:userId},(error,user)=>{
            if(user.income!=0){
                user.income=user.income+amount;
            }else{
                user.income=amount
            }
            resolve(user.save());
        })
    })
}

export function  updateBalanceMinus(userId:string,amount:number){
    return new Promise(resolve=>{
        User.findOne({_id:userId},(error,user)=>{
            if(user.outcome!=0){
                user.outcome=user.outcome+amount;
            }else{
                user.outcome=amount
            }
            resolve(user.save());
        })
    })
}

export function usersSearchById(userId){
    return new Promise(resolve=>{
        User.findOne({_id:userId},async (error,user)=>{
            resolve(user.name);
        })
    })
}

export async function usersInGroup(usersId:string,usersNames){
    for(const userId of usersId){
        const newElem = await usersSearchById(userId);
        usersNames.push(newElem);
    }
}

export async function usersSort(usersBodyEmail,userID,body,res){
    for(const userEmail of usersBodyEmail){
        const newElem = await usersSearch(userEmail);
        userID.push(newElem)
    }
    const newGroup =  new Group({name:body.name,usersEmails:userID});
    await newGroup.save();
    res.send({newGroup});
}
