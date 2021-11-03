import * as express from 'express';
import * as mongoose from 'mongoose';
import * as cors from 'cors'

require('dotenv').config();

const app = express();
const loginRouter = require("./model/routes/login-route.ts");
const registerRouter = require("./model/routes/register-route.ts");
const groupRouter = require("./model/routes/group-routes.ts");
const friendRouter = require("./model/routes/friend-route.ts");
const expenseRouter = require("./model/routes/expense-routes.ts");

app.use(cors({
    origin: '*'
}));

app.use(express.json());

app.use("",loginRouter);
app.use("",registerRouter);
app.use("",groupRouter);
app.use("",friendRouter);
app.use("",expenseRouter);

mongoose.connect("mongodb+srv://newuser:admin@cluster0.hiiuc.mongodb.net/myFirstDatabase?retryWrites=true&w=majority"
    ,()=>{
        console.log('Connected to database')
    })

app.listen(process.env.PORT || 3000,()=>{
    console.log(`Listening on ${process.env.PORT}`);
})

