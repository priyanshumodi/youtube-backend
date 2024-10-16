import mongoose,{isValidObjectId} from "mongoose";
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async(req,res) => {
    // TODO: create tweet
    const {content} = req.body

    if(content.trim()==="") {
        throw new ApiError(400, "Content is Required")
    }

    const tweet = await Tweet.create(
        {
            owner: req.user?._id,
            content
        }
    )

    if(!tweet) {
        throw new ApiError(500, "something went wrong while creating tweet")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweet, "tweet created successfully"))
})

const getUserTweets = asyncHandler(async(req,res) => {
    // TODO: get user tweets

    const {userId} = req.params

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    const tweets = await User.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(userId)
            }
        },
        {
            $lookup: {
                from: "tweets",
                localField: "_id",
                foreignField: "owner",
                as: "tweet"
            }
        },
        {
            $unwind: '$tweet'
        },
        {
            $sort: {
                'tweet.createdAt': -1
            }
        },
        {
            $project: {
                tweet: 1,
                _id: 0
            }
        }
    ])

    if(!tweets) {
        throw new ApiError(500, "something went wrong while fetching tweet by user")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, tweets, "successfully fetch all tweets of user"))
})

const updateTweet = asyncHandler(async(req,res) => {
    // TODO: update tweet

    const {tweetId} = req.params
    const {content} = req.body

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    if(content.trim()==="") {
        throw new ApiError(400, "Content is Required")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(400, "error while fetching tweet by Id")
    }

    if(tweet.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorised request")
    }

    const updatedTweet = await Tweet.findByIdAndUpdate(
        tweetId,
        {
            $set: {
                content
            }
        },
        {
            new: true
        }
    )

    if(!updatedTweet) {
        throw new ApiError(500, "something went wrong while updating tweet.")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateTweet, "successfully update tweet"))

})

const deleteTweet = asyncHandler(async(req,res) => {
    // TODO: delete tweet

    const {tweetId} = req.params

    if(!isValidObjectId(tweetId)) {
        throw new ApiError(400, "Invalid tweet Id")
    }

    const tweet = await Tweet.findById(tweetId)

    if(!tweet) {
        throw new ApiError(400, "error while fetching tweet by Id")
    }

    if(tweet.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorised request")
    }

    const deletedTweet = await Tweet.findByIdAndDelete(tweetId)

    if(!deletedTweet) {
        throw new ApiError(500, "something went wrong while deleting tweet.")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, updateTweet, "successfully delete tweet"))

})

export {
    createTweet,
    getUserTweets,
    updateTweet,
    deleteTweet
}