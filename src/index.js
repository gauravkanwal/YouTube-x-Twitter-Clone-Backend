// require('dotenv').config()
import dotenv from 'dotenv' //to load all enviroment variables as soon as application loads
import connectDB from './db/index.js';
import {app} from './app.js'

dotenv.config({
    path:'./.env'
})

connectDB()
.then(()=>{
    app.listen(process.env.PORT || 8000, ()=>{
        console.log(`server is running at port ${process.env.PORT} `);
        
    })
})
.catch((error)=>{
    console.log('mongodb connection failed!!',error);
    
})























/*
import express from 'express'
const app=express();
//IIFE function: An IIFE is a function that runs immediately after it's defined.
(async ()=>{
    try {
        
        await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
        app.on('error',(error)=>{
            console.log('ERR: ',error);
            throw error
        })

        app.listen(process.env.PORT,()=>{
            console.log(`App is listening on port ${process.env.PORT}`);
        })

    } catch (error) {
        console.error('ERROR: ',error);
        throw error
    }
})();
*/