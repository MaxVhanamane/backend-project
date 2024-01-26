import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js"
import { ApiResponse } from "../utils/ApiResponse.js"
import { uploadOnCloudinary } from "../utils/fileUpload.js"
import jwt from "jsonwebtoken"
import { User } from "../models/user.model.js"


const options = {
    httpOnly: true,
    secure: true
}

const generateAccessAndRefreshToken = async (userId) => {
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()
        user.refreshToken = refreshToken
        await user.save();
        return { accessToken, refreshToken }

    } catch (error) {
        throw new ApiError(500, "Something went wrong while generating access token")
    }

}

const registerUser = asyncHandler(async (req, res, next) => {
    const { fullName, email, username, password } = req.body

    //validataion
    if ([fullName, email, username, password].some((item) => item.trim() === "")) {
        throw new ApiError(400, "All fields are required.")
    }

    const isUserExists = await User.findOne({
        $or: [{ username }, { email }]
    })


    if (isUserExists) {
        throw new ApiError(400, "User with this email or username already exists.")
    }
    console.log("req.file", req.files)
    const avatarLocalPath = req?.files?.Avatar[0]?.path
    const coverImageLocalPath = req?.files?.coverImage?.[0]?.path

    console.log("ye wala", avatarLocalPath)
    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar image is required")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)
    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    console.log(avatar)
    if (!avatar) {
        throw new ApiError(400, "Avatar image is required")
    }

    console.log(req.body)

    const user = await User.create({
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",
        email,
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user?.id).select(["-password", "-refreshToken"])

    if (!createdUser) {
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(new ApiResponse(200, createdUser, "User created successfully"))
})

const loginUser = asyncHandler(async (req, res, next) => {
    // get username/email and password from req.body
    // find the user in db
    // check the password
    // generate accessToken and refreshToken
    // send cookie

    const { email, password, username } = req.body
    // use email or username for login here I have used both
    if (!email && !username) {
        throw new ApiError(400, "username or email is required")
    }

    const user = await User.findOne({
        $or: [{ email }, { username }]

    })

    if (!user) {
        throw new ApiError(400, "User not found")
    }

    // in user model we have added our own custom methods like this 
    // userSchema.methods.isPasswordCorrect = async function (password) {
    // return await bcrypt.compare(password, this.password)}
    // you can access them once you get the user. it is this const user=User.findOne({ }) not User model

    // pass the password received from the user to becrypt like this
    const isPasswordValid = await user.isPasswordCorrect(password)


    if (!isPasswordValid) {
        throw new ApiError(401, "Invalid user credentials")
    }

    const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user?._id);
    // const { password: pass, refreshToken: refToken, ...rest } = user // Mongoose documents have additional properties and methods beyond the actual document data. so when you destructure like this you get additional props in rest to avoid that destructure like this.
    const { password: pass, refreshToken: refToken, ...rest } = user.toObject()

    const userWithourCertainFields = rest


    res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {
        user: userWithourCertainFields, refreshToken, accessToken
    }, "User logged in successfully"))



})

const logoutUser = asyncHandler(async (req, res, next) => {
    console.log("ye wwww", req.user._id)
    const user = await User.findByIdAndUpdate(req?.user?._id, {
        $set: {
            refreshToken: ""
        }
    }, {
        new: true // to get updated document
    })


    return res.status(200).clearCookie("accessToken", options).clearCookie("refreshToken", options).json(new ApiResponse(200, {}, "User logged out successfully"))
})

const refreshAccessToken = asyncHandler(async (req, res, next) => {
    try {
        const incomingRefreshToken = req?.cookies?.refreshToken || req?.body?.refreshToken
        if (!incomingRefreshToken) {
            throw new ApiError(401, "Unauthorized request: Missing refresh token")
        }
        const decodedToken = jwt.verify(incomingRefreshToken, process.env.REFRESH_TOKEN_SECRET)
        const user = await User.findById(decodedToken?._id)

        if (!user || (incomingRefreshToken !== user?.refreshToken)) {
            throw new ApiError(400, "Invalid refresh token: User not found or mismatch");
        }
        const { accessToken, refreshToken } = await generateAccessAndRefreshToken(user?._id)

        return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(new ApiResponse(200, {
            accessToken, refreshToken, message: "Access Token refreshed successfully!"
        }))
    } catch (error) {
        throw new ApiError(401, error?.message || "Invalid refresh token")
    }
})

const changeCurrentPassword = asyncHandler(async (req, res) => {
    const { oldPassword, newPassword } = req.body



    const user = await User.findById(req.user?._id)
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword)

    if (!isPasswordCorrect) {
        throw new ApiError(400, "Invalid old password")
    }

    user.password = newPassword
    await user.save({ validateBeforeSave: false })

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "Password changed successfully"))
})


const getCurrentUser = asyncHandler(async (req, res) => {
    return res
        .status(200)
        .json(new ApiResponse(200, req.user, "current user fetched successfully"))
})

const updateAccountDetails = asyncHandler(async (req, res) => {
    const { fullName, email } = req.body

    if (!fullName || !email) {
        throw new ApiError(400, "All fields are required")
    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                fullName,
                email
            }
        },
        { new: true }

    ).select("-password")

    return res
        .status(200)
        .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async (req, res) => {
    const avatarLocalPath = req.file?.path

    if (!avatarLocalPath) {
        throw new ApiError(400, "Avatar file is missing")
    }

    const avatar = await uploadOnCloudinary(avatarLocalPath)

    if (!avatar.url) {
        throw new ApiError(400, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                avatar: avatar.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Avatar image updated successfully")
        )
})

const updateUserCoverImage = asyncHandler(async (req, res) => {
    const coverImageLocalPath = req.file?.path

    if (!coverImageLocalPath) {
        throw new ApiError(400, "Cover image file is missing")
    }

    const coverImage = await uploadOnCloudinary(coverImageLocalPath)

    if (!coverImage.url) {
        throw new ApiError(500, "Error while uploading on avatar")

    }

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set: {
                coverImage: coverImage.url
            }
        },
        { new: true }
    ).select("-password")

    return res
        .status(200)
        .json(
            new ApiResponse(200, user, "Cover image updated successfully")
        )
})

const getData = (req, res) => {
    console.log("hey there",)
    throw new ApiError(400, "Hello bum chiki bum")
}


export {
    registerUser, loginUser, logoutUser, getData, refreshAccessToken, changeCurrentPassword,
    getCurrentUser,
    updateAccountDetails,
    updateUserAvatar,
    updateUserCoverImage
}
