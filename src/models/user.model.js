import mongoose, { Schema } from "mongoose";
import jwt from "jsonwebtoken"
import bcrypt from "bcryptjs"

const userSchema = new Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
            index: true
        },
        email: {
            type: String,
            required: true,
            unique: true,
            lowecase: true,
            trim: true,
        },
        fullName: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        avatar: {
            type: String, // url 
            required: true,
        },
        coverImage: {
            type: String,// url 
        },
        watchHistory: [
            {
                type: Schema.Types.ObjectId,
                ref: "Video"
            }
        ],
        password: {
            type: String,
            required: [true, 'Password is required']
        },
        refreshToken: {
            type: String
        }

    },
    {
        timestamps: true
    }
)

// This will run before saving the document.Pre hooks are middleware functions that run before a specific event occurs, such as saving a document, updating it, or deleting it. These are often used for tasks like data validation, modification, or any other operations that should happen before the event takes place.
// Post hooks, on the other hand, run after a specific event occurs. They are useful for tasks that need to be performed after a document is saved, updated, or deleted. Common use cases include logging, triggering additional processes, or any actions that should occur after the event.
userSchema.pre("save", async function (next) {
    // When the pre-hook is executed, the document's values have been modified in the main code but have not yet been saved to the database. The pre-hook runs just before the actual save operation takes place. this is why we can check isModified here if password is not modified then there is no need to hash it again.
    if (!this.isModified("password")) return next();

    this.password = await bcrypt.hash(this.password, 10)
    next()
})

userSchema.methods.isPasswordCorrect = async function (password) {
    return await bcrypt.compare(password, this.password)
}

userSchema.methods.generateAccessToken = function () {
    return jwt.sign(
        {
            _id: this._id,
            email: this.email,
            username: this.username,
            fullName: this.fullName
        },
        process.env.ACCESS_TOKEN_SECRET,
        {
            expiresIn: process.env.ACCESS_TOKEN_EXPIRY
        }
    )
}
userSchema.methods.generateRefreshToken = function () {
    return jwt.sign(
        {
            _id: this._id,

        },
        process.env.REFRESH_TOKEN_SECRET,
        {
            expiresIn: process.env.REFRESH_TOKEN_EXPIRY
        }
    )
}

export const User = mongoose.model("User", userSchema)
