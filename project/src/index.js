// require('dotenv').config({path:'./env'})

import dotenv from 'dotenv'
import connectDB from "./db/index.js";
import { app } from './app.js';


dotenv.config({
    path:'./.env'
})
const port = process.env.PORT || 8000 ;
connectDB().then(()=>{
    // app.on("error", (err)=>{ 
    //     console.log("not able to talk to database");
    //     throw(err)
    // })
    app.listen(port,()=>{
        console.log(`server is running at port ${process.env.PORT}`);
    })
}).catch((err) => {
    console.log('mongo db connection failed:::', err);
})



































// const app = express() 




// ;(async ()=>{
//     try {
//        const DbConnection =  await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`);
//        app.on('error', (error)=>{
//         console.log("not able to talk");
//         throw(error);
//        })

//        app.listen(process.env.PORT, ()=>{
//         console.log(`app is listening on port ${process.env.PORT} `);
//        })

//     } catch (error) {
//         console.error("Error :: ", error);
//         throw error
//     }
// })()
