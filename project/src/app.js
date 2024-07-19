import express from 'express'
import cors from 'cors'
import cookieParser from 'cookie-parser'


const app = express();

app.use(cors({
    origin : process.env.CORS_ORIGIN,
    credentials : true,
}));

app.use(express.json({
    limit : '16kb'
}));   //from form body

app.use(express.urlencoded({
    extended : true,
    limit : '16kb'
})); //from url

app.use(express.static('public'));  //storage for pdfs images etc.....


app.use(cookieParser());

//routes

import userRouter from './routes/user.routes.js'  

app.use('/api/v1/users', userRouter);  //localhost:8000/api/v1/users/register




export {app};