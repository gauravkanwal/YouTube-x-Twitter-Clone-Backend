import mongoose from "mongoose"
import {Comment} from "../models/comment.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const getVideoComments = asyncHandler(async (req, res) => {
    //TODO: get all comments for a video
    //we want to return 10 comments : having content, owner name , created at, avatar 
    const {videoId} = req.params

    //steps:
    //check video id is valid or not
    //match comments having the video :videoId
    //join comments with users based on owner = _id
    //add field owner.username and owner.avatar
    //project content,owner.name,owner.avatar,createdAt
    //apply pagination 
    //return the response

    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,'Invalid Video ID!');
    };


    const comments=Comment.aggregate([
        {
            $match:{
                video: mongoose.Types.ObjectId(videoId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner',
                pipeline:[
                    {
                        $project:{
                            userName:1,
                            avatar:1,
                        }
                    }       
                ]
            }
        },
        {
            $addFields:{
                owner:{
                    $first:'$owner'
                }
            }
        },
        {
            $project:{
                content:1,
                'owner.username':1,
                'owner.avatar':1,
                createdAt:1
            }
        }
    ])


    const options={
        page:parseInt(req.query.page)||1,
        limit:parseInt(req.query.limit)||10,
    }

    const result=await Comment.aggregatePaginate(comments,options);
    if(!result){
        throw new ApiError(400,'Something went wrong while fetching comments')
    }

    return res.status(200)
    .json(
         new ApiResponse(200,result,'Comments Fetched Successfully!')
    )    
})

const addComment = asyncHandler(async (req, res) => {
    // TODO: add a comment to a video
    //validate video id and content
    //get user by req.user
    //create a new object in Comment: content, video:videoId, owner:user._id 
    //return response
    const {videoId}=req.params;
    const {content}=req.body;
    if(!mongoose.isValidObjectId(videoId)){
        throw new ApiError(400,'Invalid video ID!')
    }

    if(!content || !content.trim()){
        throw new ApiError(400,'Comment should not be empty!')
    }

    const user=req.user;
    const comment=await Comment.create({
        content:content,
        video: videoId,
        owner: user._id,
    })

    const createdComment=await Comment.findById(comment._id);

    if(!createdComment){
        throw new ApiError(400,'Something went wrong while adding comment!') 
    }

    return res.status(200)
    .json(
        new ApiResponse(200,createdComment,'Comment Added Successfully!')
    );

})

const updateComment = asyncHandler(async (req, res) => {
    // TODO: update a comment

    //steps:
    //get comment id and new content
    //validate commentid and content
    //validate user is the owner of comment 
    //update the content 
    //return respose
    const {commentId} = req.params;
    const {content}=req.body;
    if(!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400,'Invalid comment ID!');
    }   
    if(!content || !content.trim()){
        throw new ApiError(400,'Comment should not be empty!');
    }



    const comment=await Comment.findById(commentId);

    if(!comment){
        throw new ApiError(400,"No such comment with given ID!");
    }

    if(!comment.owner.equals(req.user._id)) throw new ApiError(400,'You are not the owner of this comment!')

    comment.content=content;
    await comment.save();    

    return res.status(200)
    .json(
         new ApiResponse(200,comment,'Comment updated successfully!')
    );
})

const deleteComment = asyncHandler(async (req, res) => {
    // TODO: delete a comment
    //steps:
    //get comment id 
    //validate user is the owner of comment 
    //delete the comment 
    //return respose

    const {commentId} = req.params;
    if(!commentId || !mongoose.isValidObjectId(commentId)) {
        throw new ApiError(400,'Invalid comment ID!');
    }   

    const deletedDetails= await Comment.deleteOne({_id:commentId, owner:req.user._id});
    
    if(deletedDetails.deletedCount===0){
        throw new ApiError(404,"Comment not found or you are not authorized to delete it!")
    }

    return res.status(200)
    .json(
         new ApiResponse(200,deletedDetails,'Comment deleted successfully!')
    );
})

export {
    getVideoComments, 
    addComment, 
    updateComment,
    deleteComment
}