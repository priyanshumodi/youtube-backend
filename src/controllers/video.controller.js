import mongoose,{isValidObjectId} from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";

// debug this function it not run porperly with filteration
// const getAllVideos = asyncHandler(async (req,res) => {
//     const {
//         page = 1,
//         limit = 10,
//         query = /(^video\/)|(.+)/i,
//         sortBy = 'createdAt',
//         sortType = 1,
//         userId = req.user?._id
//     } = req.query;
//     // TODO: get all Videos based on query, sort, pagination

//     if(!isValidObjectId(userId)) {
//         throw new ApiError(400, "user doesn't exist");
//     }

//     const getAllVideoAggregate = await Video.aggregate([
//         {
//             $match: {
//                 owner: new mongoose.Types.ObjectId(userId),
//                 $or: [
//                     {title: {$regex: query, $options: 'i'}},
//                     {description: {$regex: query, $options: 'i'}}
//                 ]
//             }
//         },
//         {
//             $sort: {
//                 [sortBy]: parseInt(sortType)
//             }
//         },
//         {
//             $skip: (page -1)*limit,
//         },
//         {
//             $limit: parseInt(limit)
//         }
//     ])

//     const videos = await Video.aggregatePaginate(
//         getAllVideoAggregate,
//         {
//             page,
//             limit
//         }
//     )

//     if(!videos) {
//         throw new ApiError(500, "Something went wrong while fatching videos")
//     }

//     return res
//         .status(200)
//         .json(new ApiResponse(200, videos, "all video fetched successfully"))
// })

const getAllVideos = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, query = "", sortBy = "createdAt", sortType = 1, userId = "" } = req.query
    //TODO: get all videos based on query, sort, pagination
    
    // await is giving error check and learn
    var videoAggregate;
    try {
        videoAggregate = Video.aggregate(
            [
                {
                    $match: {
                        $or: [
                            { title: { $regex: query, $options: "i" } },
                            { description: { $regex: query, $options: "i" } }
                        ]
                    }

                },
                {
                    $lookup: {
                        from: "users",
                        localField: "owner",
                        foreignField: "_id",
                        as: "owner",
                        pipeline: [
                            {
                                $project: {
                                    _id :1,
                                    fullName: 1,
                                    avatar: 1,
                                    username: 1,
                                }
                            },

                        ]
                    }
                },
                {
                    $addFields: {
                        owner: {
                            $first: "$owner",
                        },
                    },
                },
                {
                    $sort: {
                        [sortBy || "createdAt"]: sortType || 1
                    }
                },

            ]
        )
    } catch (error) {
        // console.error("Error in aggregation:", error);
        throw new ApiError(500, error.message || "Internal server error in video aggregation");
    }

    const options = {
        page,
        limit,
        customLabels: {
            totalDocs: "totalVideos",
            docs: "videos",

        },
        skip: (page - 1) * limit,
        limit: parseInt(limit),
    }

    Video.aggregatePaginate(videoAggregate, options)
        .then(result => {
            // console.log("first")
            if (result?.videos?.length === 0 ) {
                return res.status(200).json(new ApiResponse(200, [], "No videos found"))
            }

            return res.status(200)
                .json(
                    new ApiResponse(
                        200,
                        result,
                        "video fetched successfully"
                    )
                )
        }).catch(error => {
            // console.log("error ::", error)
            throw new ApiError(500, error?.message || "Internal server error in video aggregate Paginate")
        })
})


const publishVideo = asyncHandler(async (req,res) => {
    const {title, description} = req.body

    // TODO: get video, upload to cloudinary, create video

    if(title.trim() === "" || description.trim() === "") {
        throw new ApiError(400, "All fields are required")
    }

    const videoLocalPath = req.files?.videoFile[0]?.path;
    if(!videoLocalPath) {
        throw new ApiError(400, "Video File are required")
    }

    const thumbnailLocalPath = req.files?.thumbnail[0]?.path;
    if(!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file are required")
    }

    const videoFile = await uploadOnCloudinary(videoLocalPath)
    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!videoFile) {
        throw new ApiError(400, "Video File are required")
    }

    if(!thumbnail) {
        throw new ApiError(400, "thumbnail File are required")
    }

    // console.log(videoFile)

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration: videoFile.duration,
        owner: req.user?._id
    })

    if(!video) {
        throw new ApiError(500, "Something wents wrong while uploading video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "Video uploaded successfully"))

})

const getVideoById = asyncHandler(async (req,res) => {
    const { videoId } = req.params
    // TODO: get video by id

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.aggregate([
        {
            $match: {
                _id: new mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup: {
                from: "users",
                localField: "owner",
                foreignField: "_id",
                as: "owner",
                pipeline: [
                    {
                        $project: {
                            _id :1,
                            fullName: 1,
                            avatar: 1,
                            username: 1,
                        }
                    },

                ]
            }
        },
        {
            $unwind: '$owner'
        }
    ])

    if(!video) {
        throw new ApiError(400, "something went wrong while fetching video by ID")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, video, "video feteched successfully"))
})

const updateVideo = asyncHandler( async (req,res) => {
    const {videoId} = req.params
    // TODO: update video details like title, description, thumbnail
    const {title, description} = req.body

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    // console.log(video.owner?._id)
    // console.log(req.user?._id)

    if(video.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "you dont have permission")
    }

    if(title.trim() === "" || description.trim() === "") {
        throw new ApiError(400, "title or description are required")
    }

    const thumbnailLocalPath = req.file?.path

    if(!thumbnailLocalPath) {
        throw new ApiError(400, "thumbnail file is missing")
    }

    const thumbnail = await uploadOnCloudinary(thumbnailLocalPath)

    if(!thumbnail) {
        throw new ApiError(400, "Error while uploading new thumbnail")
    }

    const videoUpdated = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                thumbnail: thumbnail.url,
                title,
                description,

            }
        },
        {
            new: true
        }
    )

    if(!videoUpdated) {
        throw new ApiError(500, "somenthing went wrong while updating video details")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoUpdated, "video details updated Successfully"))
})

const deleteVideo = asyncHandler(async (req,res) => {
    const {videoId} = req.params
    // TODO: delete video

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    // console.log(video.owner?._id)
    // console.log(req.user?._id)

    if(video.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "you dont have permission")
    }

    const videoDeleted = await Video.findByIdAndDelete(videoId)

    if(!videoDeleted) {
        throw new ApiError(500, "something wents wrong while deleting video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoDeleted, "video has deleted Successfully"));
    
})

const togglePublishStatus = asyncHandler(async (req, res) => {
    const {videoId} = req.params

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video ID")
    }

    const video = await Video.findById(videoId)

    // console.log(video.owner?._id)
    // console.log(req.user?._id)

    if(video.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(403, "you dont have permission")
    }

    // console.log(video.isPublished)
    const togglePublish = await Video.findByIdAndUpdate(
        videoId,
        {
            $set: {
                isPublished: ! video.isPublished,
            }
        },
        {
            new: true
        }
    )

    if(!togglePublish) {
        throw new ApiError(500, "something wents wrong while toggle Publish video")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, togglePublish, "Publish has toggled Successfully"));

})

export {
    getAllVideos,
    publishVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
}