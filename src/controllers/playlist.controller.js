import mongoose, {isValidObjectId} from "mongoose"
import {Playlist} from "../models/playlist.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import { User } from "../models/user.model.js"


const createPlaylist = asyncHandler(async (req, res) => {
    const {name, description} = req.body

    //TODO: create playlist
    if(!name || !name.trim() || !description || !description.trim()){
        throw new ApiError(400,'The name or description of the playlist can;t be empty!');
    }

    const playlist=await Playlist.create({
        name,
        description,
        owner:req.user._id,
    });

    if(!playlist){
        throw new ApiError(400,'Something went wrong while creating the playlist!');
    }

    return res.status(200).json(
        new ApiResponse(200,playlist,"Playlist created successfully")
    )

})

const getUserPlaylists = asyncHandler(async (req, res) => {
    const {userId} = req.params
    //TODO: get user playlists
    if(!isValidObjectId(userId) || !await User.exists({_id:userId})){
        throw new ApiError('invalid user ID')
    }

    const result=await Playlist.aggregate([
        {
            $match:{
                owner:mongoose.Types.ObjectId(userId)
            }
        },
        {
            $sort:{
                createdAt:-1,
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'ownerDetails',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                ownerDetails:{
                    $first:'$ownerDetails'
                },
                totalVideos:{
                    $size:'$videos'
                }
            }
        }
    ])

    if(!result){
        throw new ApiError(400,'Something went wrong while fetching the playlists')
    }

    return res.status(200).json(
        new ApiResponse(200,result,'Playlists fetched successfully')
    )
})

const getPlaylistById = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    //TODO: get playlist by id
    if(!isValidObjectId(playlistId) || !await Playlist.exists({_id:playlistId})){
        throw new ApiError('invalid playlist ID')
    }

    const result= await Playlist.aggregate([
        {
            $match:{
                _id:mongoose.Types.ObjectId(playlistId)
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'videos',
                foreignField:'_id',
                as:'videos',
                pipeline:[
                    {
                        $lookup:{
                            from:'users',
                            localField:'owner',
                            foreignField:'_id',
                            as:'owner' 
                        },
                    },    
                    {
                        $project:{
                            username:1,
                            fullName:1,
                            avatar:1
                        },
                    },    
                    {   
                        $addFields:{
                            owner:{
                                $first:'$owner',
                            }
                        }
                    }
                ]
            }
        },
    ])

    if(!result){
        throw new ApiError(400,'Something went wrong while fetching the playlist')
    }

    return res.status(200).json(
        new ApiResponse(200,result,'Playlist fetched successfully')
    )
})


const addVideoToPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
})

const removeVideoFromPlaylist = asyncHandler(async (req, res) => {
    const {playlistId, videoId} = req.params
    // TODO: remove video from playlist

})

const deletePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    // TODO: delete playlist
})

const updatePlaylist = asyncHandler(async (req, res) => {
    const {playlistId} = req.params
    const {name, description} = req.body
    //TODO: update playlist
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