import mongoose, {isValidObjectId} from "mongoose"
import {Like} from "../models/like.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"
import {Video} from '../models/video.model.js'
import {Comment} from '../models/comment.model.js'
import {Tweet} from '../models/tweet.model.js'

const toggleVideoLike = asyncHandler(async (req, res) => {
    const {videoId} = req.params
    //TODO: toggle like on video
    //validate video id
    //check if there exists a like object that have videoId and the userId
    //if yes then delete it
    // if no then create it

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,"Invalid videoId")
    }

    const videoExists = await Video.exists({ _id: videoId });
    if (!videoExists) {
        throw new ApiError(404, "Video not found");
    }

    const deletedLike=await Like.findOneAndDelete({video:videoId, likedBy:req.user._id});
    if(!deletedLike){
        const like= await Like.create({
            video:videoId,
            likedBy:req.user._id,
        })

        return res.status(200).json(
            new ApiResponse(200,{liked:true},'Like added successfully!')
        )
    }

    return res.status(200).json(
        new ApiResponse(200,{liked:false},'Like removed successfully!')
    )
})

const toggleCommentLike = asyncHandler(async (req, res) => {
    const {commentId} = req.params
    //TODO: toggle like on comment
    if(!mongoose.isValidObjectId(commentId)){
        throw new ApiError(400,"Invalid commentId")
    }

    const commentExists = await Comment.exists({ _id: commentId });
    if (!commentExists) {
        throw new ApiError(404, "Comment not found");
    }

    const deletedLike=await Like.findOneAndDelete({comment:commentId, likedBy:req.user._id});
    if(!deletedLike){
        const like= await Like.create({
            comment:commentId,
            likedBy:req.user._id,
        })

        return res.status(200).json(
            new ApiResponse(200,{liked:true},'Like added successfully!')
        )
    }

    return res.status(200).json(
        new ApiResponse(200,{liked:false},'Like removed successfully!')
    )

})

const toggleTweetLike = asyncHandler(async (req, res) => {
    const {tweetId} = req.params
    //TODO: toggle like on tweet
     if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400,"Invalid tweetId")
    }

    const tweetExists = await Tweet.exists({ _id: tweetId });
    if (!tweetExists) {
        throw new ApiError(404, "Tweet not found");
    }

    const deletedLike=await Like.findOneAndDelete({tweet:tweetId, likedBy:req.user._id});
    if(!deletedLike){
        const like= await Like.create({
            tweet:tweetId,
            likedBy:req.user._id,
        })

        return res.status(200).json(
            new ApiResponse(200,{liked:true},'Like added successfully!')
        )
    }

    return res.status(200).json(
        new ApiResponse(200,{liked:false},'Like removed successfully!')
    )
}
)

const getLikedVideos = asyncHandler(async (req, res) => {
    //TODO: get all liked videos
    //perform aggregation 
    //match videos with likedBy by users
    //join like with videos
    //apply pagination
    // send the video data

    const options={
        page:parseInt(req.query.page)||1,
        limit:parseInt(req.query.limit)||10
    }

    const likedVideos= Like.aggregate([
        {
            $match:{
                likedBy:new mongoose.Types.ObjectId(req.user._id),
                video:{$exists:true}
            }
        },
        {
            $lookup:{
                from:'videos',
                localField:'video',
                foreignField:'_id',
                as:'video'
            },
        },
        {
            $unwind:'$video' //removes the array and maintains just object
        },
        {
            $replaceRoot:{
                newRoot:'$video'  //sets video document as the root and removes all outer fields
            }
        },
        {
            $project:{
                videoFile:1,
                thumbnail:1,
                owner:1,
                title:1,
                description:1,
                createdAt:1,
                duration:1,
                views:1
            }
        }
    ]);

    const result=await Like.aggregatePaginate(likedVideos,options);

    if(!result){
        throw new ApiError(400,'something went wrong while fetching liked videos')
    }

    return res.status(200).json(
        new ApiResponse(200,result,'Liked videos fetched successfully!')
    )
})

export {
    toggleCommentLike,
    toggleTweetLike,
    toggleVideoLike,
    getLikedVideos
}