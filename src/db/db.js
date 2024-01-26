import mongoose from "mongoose";
import { DB_NAME } from "../constants.js";


const connectDB = async () => {

    try {
        const connectionInstance = await mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)

        // console.log("MongoDB connected successfully", connectionInstance)


    } catch (error) {
        console.log("Errorrrrrrrrr connecting database", error)
        // process.exit(1)
        throw error

    }

}

export default connectDB
