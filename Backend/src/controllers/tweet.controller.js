import mongoose, { isValidObjectId } from "mongoose"
import {Tweet} from "../models/tweet.model.js"
import {User} from "../models/user.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"

const createTweet = asyncHandler(async (req, res) => {
    //TODO: create tweet

    //steps:
    //validate content
    //create new tweet
    //return response

    const {content}=req.body
    if(!content || !content.trim()){
        throw new ApiError(400,"Content should not can't empty!")
    }

    const tweet=await Tweet.create({
        content:content,
        owner:req.user._id
    });

    return res.status(200).json(
        new ApiResponse(200,tweet,"Tweet created successfully!")
    );

})

const getUserTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    //get user id from params
    //in tweets match tweets where owner is given user id
    //join with user(owner) add user.username and user.avatar fields
    //apply pagination 
    // return response : tweet createdAt
    const {userId}=req.params;
    const {limit,page}=req.query;
    if(!mongoose.isValidObjectId(userId)){
        throw new ApiError(400,"Invalid user id");
    }

    const tweets= Tweet.aggregate([
        {
            $match:{
                owner:new mongoose.Types.ObjectId(userId)
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
                            username:1,
                            avatar:1
                        }
                    },
                ]
            }
        },
        {
            $lookup:{
                from:'likes',
                localField:'_id',
                foreignField:'tweet',
                as:'likes'
            }
        },
        {
            $addFields:{
                owner:{
                    $first:'$owner'
                },
                isLiked:{
                    $in:[new mongoose.Types.ObjectId(req.user._id), '$likes.likedBy']
                },
                likes:{
                    $size:'$likes'
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ])

    const options={
        limit:parseInt(limit) || 10,
        page:parseInt(page) || 1,
    }

    const result=await Tweet.aggregatePaginate(tweets,options);

    return res.status(200).json(
        new ApiResponse(200,result,'Tweets fetched successfully!')
    )

})

const getTweets = asyncHandler(async (req, res) => {
    // TODO: get user tweets
    //get user id from params
    //in tweets match tweets where owner is given user id
    //join with user(owner) add user.username and user.avatar fields
    //apply pagination 
    // return response : tweet createdAt
    // const {userId}=req.params;
    const {limit,page}=req.query;


    const tweets= Tweet.aggregate([
        {
            $lookup:{
                from:'users',
                localField:'owner',
                foreignField:'_id',
                as:'owner',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1
                        }
                    },
                ]
            }
        },
        {
            $lookup:{
                from:'likes',
                localField:'_id',
                foreignField:'tweet',
                as:'likes'
            }
        },
        {
            $addFields:{
                owner:{
                    $first:'$owner'
                },
                isLiked:{
                    $in:[new mongoose.Types.ObjectId(req.user._id), '$likes.likedBy']
                },
                likes:{
                    $size:'$likes'
                }
            }
        },
        {
            $sort:{
                createdAt:-1
            }
        }
    ])

    const options={
        limit:parseInt(limit) || 10,
        page:parseInt(page) || 1,
    }

    const result=await Tweet.aggregatePaginate(tweets,options);

    return res.status(200).json(
        new ApiResponse(200,result,'Tweets fetched successfully!')
    )

})

const updateTweet = asyncHandler(async (req, res) => {
    //TODO: update tweet
    //get tweetId from req.params
    //check if the tweet id is valid
    //check if user is the owner of tweet
    //get content from req.body 
    //validate content
    //update tweet 
    //return response
    const{tweetId}=req.params
    const {content}= req.body
    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(404,'Invalid tweet id!');
    }

    if(!content || !content.trim()){
        throw new ApiError(400,"The content of tweet cannot be empty!");
    }

    const tweet= await Tweet.findOne({_id:tweetId,owner:req.user._id});

    if(!tweet){
        throw new ApiError(403,"An error occured. Either the tweet is not available or you are not the owner of the tweet!");
    }

    tweet.content=content.trim();
    await tweet.save();

    return res.status(200).json(
        new ApiResponse(200,tweet,'Tweet updated successfully!')
    )

})

const deleteTweet = asyncHandler(async (req, res) => {
    //TODO: delete tweet
    //get tweet id from req.params
    //call delete one method 
    //check if deletedcount>1
    // return response 

    const {tweetId}=req.params;
    if(!mongoose.isValidObjectId(tweetId)){
        throw new ApiError(400,'Invalid tweet id!')
    }

    const deletedTweet= await Tweet.findOneAndDelete({_id:tweetId,owner:req.user._id});

    if(!deletedTweet){
        throw new ApiError(404,'Tweet not found')
    }

    return res.status(200).json(
        new ApiResponse(200,deletedTweet,"Tweet deletion successfull!")
    )
})

export {
    createTweet,
    getUserTweets,
    getTweets,
    updateTweet,
    deleteTweet
}