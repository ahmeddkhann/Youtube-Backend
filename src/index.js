import dotenv from "dotenv"

import connectDB from "./db/index.js";
import { app } from "./app.js";
import { error, log } from "console";

dotenv.config({
    path: "./env"
})
connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000,()=>{
        console.log(`Server is running at port :
             ${process.env.PORT}`);     
    })
    app.listen(process.env.PORT, ()=> {
    console.log("Error:", error);
    throw error  
    })
})

.catch((error)=>{
    console.log("MONGO db connection failed !!!", error);
})