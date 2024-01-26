import { Router } from "express";
import { getData, loginUser, logoutUser, refreshAccessToken, registerUser } from "../controllers/user.controller.js";
import { upload } from "../middlewares/multer.middleware.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";
const router = Router()


router.route("/register").post(
    upload.fields([
        { name: "Avatar", maxCount: 1 },
        { name: "coverImage", maxCount: 1 },
    ]),
    registerUser)
// This also works
// router.post("/register", registerUser) 


router.route("/login").post(loginUser)
// secured routes
router.route("/logout").post(verifyJWT, logoutUser)
router.route("/refresh-token").post(refreshAccessToken)
router.route("/getdata").post(getData)


export default router
