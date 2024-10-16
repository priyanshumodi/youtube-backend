import mongoose, {isValidObjectId} from "mongoose";
import{Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const toggleVideoLike = asyncHandler(async (req,res) => {
    const {videoId} = req.params
    // TODO: toggle like on vido

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video id")
    }


    const video = await Like.findOne({
        video: videoId,
        likedBy: req.user?._id
    })

    let result;
    let like;

    if(!video) {
        result = await Like.create({
            video: videoId,
            likedBy: req.user?._id
        })
        like = true;
    }
    else {
        result = await Like.deleteOne({
            video: videoId,
            likedBy: req.user?._id
        })
        like = false;
    }

    if(!result) {
        throw new ApiError(500, "something went wrong while toggling video like")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, like?"Video toggle to like successfully":"Video toggle to unlike successfully"))
})

const toggleCommentLike = asyncHandler(async(req,res) => {
    const {commentId} = req.params
    // TODO: toggle like on comment

    if(!isValidObjectId(commentId)) {
        throw new ApiError(400, "Invalid video id")
    }


    const comment = await Like.findOne({
        comment: commentId,
        likedBy: req.user?._id
    })

    let result;
    let like;

    if(!comment) {
        result = await Like.create({
            comment: commentId,
            likedBy: req.user?._id
        })
        like = true;
    }
    else {
        result = await Like.deleteOne({
            comment: commentId,
            likedBy: req.user?._id
        })
        like = false;
    }

    if(!result) {
        throw new ApiError(500, "something went wrong while toggling comment like")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, like?"comment toggle to like successfully":"comment toggle to unlike successfully"))
})

const toggleTweetLike = asyncHandler(async(req,res) => {
    const {tweetId} = req.params
    // TODO: toggle like on tweet

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid video id")
    }


    const tweet = await Like.findOne({
        tweet: tweetId,
        likedBy: req.user?._id
    })

    let result;
    let like;

    if(!tweet) {
        result = await Like.create({
            tweet: tweetId,
            likedBy: req.user?._id
        })
        like = true;
    }
    else {
        result = await Like.deleteOne({
            tweet: tweetId,
            likedBy: req.user?._id
        })
        like = false;
    }

    if(!result) {
        throw new ApiError(500, "something went wrong while toggling tweet like")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, result, like?"tweet toggle to like successfully":"tweet toggle to unlike successfully"))
})

const getLikedVideos = asyncHandler(async (req, res) => {
    // TODO: get all liked videos

    const videos = await Like.aggregate([
        {
          $match: {
            likedBy: new mongoose.Types.ObjectId(req.user?._id),
            video: { $ne: null }
          }
        },
        {
          $lookup: {
            from: "videos",
            localField: "video",
            foreignField: "_id",
            as: "videos"
          }
        },
        {
          $unwind: '$videos'
        },
        {
          $lookup: {
            from: "users",
            localField: "videos.owner",
            foreignField: "_id",
            as: "owner"
          }
        },
        {
          $unwind: '$owner'
        },
        {
            $project: {
              video: {
                $mergeObjects: [
                  "$videos",
                  { owner: { fullName: "$owner.fullName", avatar: "$owner.avatar", _id: "$owner._id", username: "$owner.username" } }
                ]
              }
            }
          }
      ]);
      

    console.log(videos)

    if(!videos) {
        throw new ApiError(500, "something went wrong while fetching all liked videos")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videos, "All liked video fetched successfully"))
})

const getVideoLikes = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(404, 'Invalid Video Id')
    }

    // const likes = await Like.aggregate([
    //     {
    //         $match: {
    //             video: new mongoose.Types.ObjectId(videoId)
    //         }
    //     },
    //     {
    //         $addFields: {
    //             isLiked: {
    //                 $in: [req?.user?._id, '$likedBy']
    //             }
    //         }
    //     },
    //     {
    //         $project: {
    //             isLiked: 1
    //         }
    //     }
    // ])

    const likes = await Like.aggregate([
        {
            $match: {
                video: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $addFields: {
                isLiked: {
                    $eq: [req?.user?._id, '$likedBy'] // Use $eq instead of $in
                }
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: { $sum: 1 },
                isLiked: { $max: '$isLiked' } // Since isLiked is a boolean (either true or false), $max will return true if at least one document has isLiked set to true, otherwise it returns false.
            }
        },
        {
            $project: {
                _id: 0,
                totalLikes: 1,
                isLiked: 1
            }
        }
    ]);
    
    

    if(!likes) {
        throw new ApiError(500, 'something went wrong while fetching likes')
    }

    // console.log(likes)

    return res
        .status(200)
        .json(new ApiResponse(200, likes, 'likes fetched successfully'))
})

const getCommentLikes = asyncHandler(async (req, res) => {
    const {commentId} = req.params

    if(!isValidObjectId(commentId)) {
        throw new ApiError(404, 'Invalid Video Id')
    }

    const likes = await Like.aggregate([
        {
            $match: {
                comment: new mongoose.Types.ObjectId(commentId)
            }
        },
        {
            $addFields: {
                isLiked: {
                    $eq: [req?.user?._id,'$likedBy']
                }
            }
        },
        {
            $group: {
                _id:null,
                totalLikes: {$sum: 1},
                isLiked: {$max: '$isLiked'}
            }
        },
        {
            $project: {
                _id: 0,
                totalLikes: 1,
                isLiked: 1
            }
        }
    ])

    if(!likes) {
        throw new ApiError(500, 'something went wrong while fetching likes')
    }

    // console.log(likes)

    return res
        .status(200)
        .json(new ApiResponse(200, likes, 'likes fetched successfully'))
})

const getTweetLikes = asyncHandler(async (req, res) => {
    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(404, 'Invalid Video Id')
    }

    const likes = await Like.aggregate([
        {
            $match: {
                tweet: new mongoose.Types.ObjectId(tweetId)
            }
        },
        {
            $addFields: {
                isLiked: {
                    $eq: [req?.user?._id, '$likedBy']
                }
            }
        },
        {
            $group: {
                _id: null,
                totalLikes: {$sum: 1},
                isLiked: {$max: '$isLiked'}
            }
        },
        {
            $project: {
                _id: 0,
                totalLikes: 1,
                isLiked: 1
            }
        }
    ])

    if(!likes) {
        throw new ApiError(500, 'something went wrong while fetching likes')
    }

    // console.log(likes)

    return res
        .status(200)
        .json(new ApiResponse(200, likes, 'likes fetched successfully'))
})
export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos,
    getVideoLikes,
    getCommentLikes,
    getTweetLikes
}