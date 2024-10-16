import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import {Subscription} from "../models/subscription.model.js"
import {Like} from "../models/like.model.js"
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStatus = asyncHandler(async (req, res) => {
    // Todo: Get the channel status like total video views, total subscribers, total videos, total likes etc.

    const channelStatus = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $lookup: {
                from: "videos",
                localField: "_id",
                foreignField: "owner",
                as: "videos"
            }
        },
        {
            $lookup: {
                from: "subscriptions",
                localField: "_id",
                foreignField: "channel",
                as: "subscribers"
            }
        },
        {
            $lookup: {
                from: "likes",
                localField: "_id",
                foreignField: "video",
                as: "likes"
            }
        },
        {
            $addFields: {
                subscribersCount: {
                    $size: "$subscribers"
                },
                totalViews: {
                    $sum: "$videos.view"
                },
                totalLikes: {
                    $size: "$likes"
                },
                totalVideos: {
                    $size: "$videos"
                }
            }
        },
        {
            $project: {
                fullName: 1,
                username: 1,
                avatar: 1,
                coverImage: 1,
                email: 1,
                subscribersCount: 1,
                totalViews: 1,
                totalLikes: 1,
                totalVideos: 1
            }
        }
    ])

    if(!channelStatus) {
        throw new ApiError(500, "something wents wrong while fetching dashboard details")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, channelStatus, "dashboard details fetched successfully"))
})

const getChannelVideos = asyncHandler(async (req,res) => {
    // Todo: get all the videos uploaded by the channel

    const videos = await Video.aggregate([
        {
            $match: {
                owner: new mongoose.Types.ObjectId(req.user?._id)
            }
        },
        {
            $project: {
                videoFile: 1,
                thumbnail: 1,
                title: 1,
                description: 1,
                duration: 1,
                owner: 1
            }
        }
    ])

    console.log(videos)

    if(!videos) {
        throw new ApiError(500, "something wents wrong while fetching channel videos")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "videos fetched successfully"))
})

export {
    getChannelStatus,
    getChannelVideos
}