import mongoose, {isValidObjectId} from "mongoose";
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createPlaylist = asyncHandler(async (req,res) => {
    const {name, description} = req.body

    // TODO: create playlist
    if(name.trim() === "" || description.trim() === "") {
        throw new ApiError(400, "name and description required")
    }

    const playlist = await Playlist.create({
        name,
        description,
        owner: req.user?._id
    })

    if(!playlist) {
        throw new ApiError(400, "something wents wrong while creating playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist created successfully"))
})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    // TODO: get User playlists

    if(!isValidObjectId(userId)) {
        throw new ApiError(400, "Invalid User Id")
    }

    const playlists = await Playlist.find({
        owner: userId
    })

    if(!playlists) {
        throw new ApiError(400, "something wents wrong while fetching playlist by user Id")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, playlists, "playlist fetched successfully"))
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: get playlist by id

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(!playlist) {
        throw new ApiError(400, "something wents wrong while fetching playlist by id")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlist, "playlist fetched successfully"))
})

const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(playlist.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorized request")
    }

    const videoAddedToPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $push: {videos: videoId}
        },
        {
            new:true
        }
    )

    if(!videoAddedToPlaylist) {
        throw new ApiError(400, "something wents wrong while adding video to playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoAddedToPlaylist, "video added successfully"))

})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    if(!isValidObjectId(videoId)) {
        throw new ApiError(400, "Invalid video Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(playlist.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorized request")
    }

    const videoRemovedFromPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $pull: {videos: videoId}
        },
        {
            new:true
        }
    )

    if(!videoRemovedFromPlaylist) {
        throw new ApiError(400, "something wents wrong while removing video to playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, videoRemovedFromPlaylist, "video removed successfully"))
})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    const playlist = await Playlist.findById(playlistId)

    if(playlist.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorized request")
    }

    const playlistDeleted = await Playlist.findByIdAndDelete(playlistId)

    if(!playlistDeleted) {
        throw new ApiError(400, "something wents wrong while deleting playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlistDeleted, "playlist removed successfully"))

})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    // TODO: update playlist

    if(!isValidObjectId(playlistId)) {
        throw new ApiError(400, "Invalid playlist Id")
    }

    if(name.trim() === "" || description.trim() === "") {
        throw new ApiError(400, "name and description required")
    }

    const playlist = await Playlist.findById(playlistId)

    if(playlist.owner?._id.toString() !== req.user?._id.toString()) {
        throw new ApiError(400, "Unauthorized request")
    }

    const playlistUpdated = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                name,
                description
            }
        },
        {
            new:true
        }
    )

    if(!playlistUpdated) {
        throw new ApiError(400, "something wents wrong while updating playlist")
    }

    return res
        .status(200)
        .json(new ApiResponse(200, playlistUpdated, "playlist updated successfully"))
    
})

export {
    createPlaylist,
    getUserPlaylists,
    getPlaylistById,
    addVideoToPlaylist,
    removeVideoFromPlaylist,
    deletePlaylist,
    updatePlaylist
}