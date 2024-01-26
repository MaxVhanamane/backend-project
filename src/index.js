import dotenv from 'dotenv'
import connectDB from "./db/db.js";
import { app } from './app.js';
dotenv.config()


connectDB().then(() => {
    app.listen(process.env.PORT || 8000, () => {
        console.log("app is running on port:", process.env.PORT)
    })
}).catch((err) => {
    console.log("Faileddddddddddd to connect MongoDB database", err)
})
