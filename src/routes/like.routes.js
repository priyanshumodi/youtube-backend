import { Router } from "express";
import {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikes,
    getCommentLikes,
    getTweetLikes
} from "../controllers/like.controller.js"
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router()
router.use(verifyJWT) // Apply verifyJWT middlewares to all routes in this file

router.route("/toggle/v/:videoId").post(toggleVideoLike)
router.route("/toggle/c/:commentId").post(toggleCommentLike)
router.route("/toggle/t/:tweetId").post(toggleTweetLike)
router.route("/videos").get(getLikedVideos)
router.route('/video/:videoId').get(getVideoLikes)
router.route('/comment/:commentId').get(getCommentLikes)
router.route('/tweet/:tweetId').get(getTweetLikes)

export default router