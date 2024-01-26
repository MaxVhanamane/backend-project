import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js";

export const verifyJWT = asyncHandler(async (req, res, next) => {
    try {
        // req.headers("Authorization")?.replace("Bearer ", "") this will be helpful if you are creating a mobile app.
        const token = req.cookies?.accessToken || req.headers?.authorization?.replace("Bearer ", "");


        if (!token) {
            throw new ApiError(401, "Unauthorized user")
        }

        const decodedToken = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET)
        // To retrieve only specific fields from a document, you can use .select(["field1", "field2"]).
        // To exclude specific fields from a document, you can use.select(["-field1", "-field2"]), where the fields with a minus sign(-) are excluded.
        const user = await User.findById(decodedToken?._id).select(["-password", "-refreshToken"])


        console.log("ye deksh", user)

        if (!user) {
            throw new ApiError(400, "Invalid Access Token")
        }

        req.user = user
        next()
    } catch (error) {
        throw new ApiError(400, error?.message || "Invalid Access Token")
    }
})
