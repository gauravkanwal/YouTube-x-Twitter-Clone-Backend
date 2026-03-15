import mongoose, {isValidObjectId} from "mongoose"
import {User} from "../models/user.model.js"
import { Subscription } from "../models/subscription.model.js"
import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const toggleSubscription = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    // TODO: toggle subscription
    //validate channelId
    //find if there is a subscription object with channel:channelId and subscriber:user.id
    //if yes: delete it
    //if no create a model like that

    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(404,'Invalid channel Id');
    }

    const channelExists=await User.exists({_id:channelId});
    if(!channelExists){
        throw new ApiError(400,'Channel not found')
    }

    const deletedSubscription= await Subscription.findOneAndDelete({channel:channelId,subscriber:req.user._id});
    if(deletedSubscription){
        return res.status(200).json(
            new ApiResponse(200,{subscribed:false},'Unsubscribed successfully!')
        )
    }

    const subscription=await Subscription.create({
        channel:channelId,
        subscriber:req.user._id,
    })
    
    return res.status(200).json(
        new ApiResponse(200,{subscribed:true},'Subscribed successfully!')
    )
})

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
    const {channelId} = req.params
    //validate channel id
    //join with users and add add fields as subscribers
    //project: username fullname avatar id only
    //apply pagination also

    if(!mongoose.isValidObjectId(channelId)){
        throw new ApiError(400,'Invalid channel Id');
    }

    const channelExists=await User.exists({_id:channelId});
    if(!channelExists){
        throw new ApiError(404,'Channel not found')
    }

    const aggregate=Subscription.aggregate([
        {
            $match:{
                channel:new mongoose.Types.ObjectId(channelId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'subscriber',
                foreignField:'_id',
                as:'subscriber',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1,
                            fullName:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                subscribers:{
                    $first:'$subscriber'
                }
            }
        }
    ])

    const options={
        page:parseInt(req.query.page)||1,
        limit:parseInt(req.query.limit)||20,
    }

    const result= await Subscription.aggregatePaginate(aggregate,options);
    if(!result){
        throw new ApiError(404,'Something went wrong')
    }

    res.status(200).json(
        new ApiResponse(200,result,'Subscribers fetched successfully')
    )

})

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
    const { subscriberId } = req.params
    //validate subscriberId
    //match subscriber where subscriber:user.id
    //join with user where channel:user.id
    //return username fullname avatar

    if(!mongoose.isValidObjectId(subscriberId)){
        throw new ApiError(400,'Invalid subscriber Id');
    }

    const userExists=await User.exists({_id:subscriberId});
    if(!userExists){
        throw new ApiError(404,'Subscriber not found')
    }

    const aggregate= Subscription.aggregate([
        {
            $match:{
                subscriber: new mongoose.Types.ObjectId(subscriberId)
            }
        },
        {
            $lookup:{
                from:'users',
                localField:'channel',
                foreignField:'_id',
                as:'channel',
                pipeline:[
                    {
                        $project:{
                            username:1,
                            avatar:1,
                            fullName:1,
                        }
                    }
                ]
            }
        },
        {
            $addFields:{
                channel:{
                    $first:'$channel'
                }
            }
        }
    ])

    const options={
        page:parseInt(req.query.page)||1,
        limit:parseInt(req.query.limit)||20,
    }

    const result= await Subscription.aggregatePaginate(aggregate,options);
    if(!result){
        throw new ApiError(404,'Something went wrong')
    }

    res.status(200).json(
        new ApiResponse(200,result,'Subscribed channels fetched successfully')
    )
})

export {
    toggleSubscription,
    getUserChannelSubscribers,
    getSubscribedChannels
}