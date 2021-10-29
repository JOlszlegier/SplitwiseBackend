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
