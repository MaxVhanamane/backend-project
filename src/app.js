import express from "express"
import cors from "cors"
import cookieParser from "cookie-parser"

const app = express()
console.log("ye dekh", process.env.CORS_ORIGIN)
app.use(cors({ origin: process.env.CORS_ORIGIN, credentials: true }))
app.use(express.json({ limit: "16kb" }))
app.use(express.urlencoded({ extended: true, limit: "16kb" }))
app.use(express.static("public"))
app.use(cookieParser())

// Import routes

import userRouter from "./routes/user.routes.js"


app.use("/api/v1/users", userRouter)
// // Global error handling middleware
// app.use((err, req, res, next) => {
//     // Handle errors here
//     console.error(err);

//     // Respond to the client with an appropriate error message
//     res.status(err.statusCode || 500).json({
//         success: false,
//         message: err.message + "ffffffffff" || "Internal Server Error",
//         errors: err.errors || [],
//     });
// });

export { app }
