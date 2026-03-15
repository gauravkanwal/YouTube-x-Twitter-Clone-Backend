import mongoose from "mongoose";
import { Video } from "../models/video.model.js";
import { Subscription } from "../models/subscription.model.js";
import { Like } from "../models/like.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { User } from "../models/user.model.js";

const getChannelStats = asyncHandler(async (req, res) => {
  // TODO: Get the channel stats like total video views, total subscribers, total videos, total likes etc.
  const result = await User.aggregate([
    {
      $match: {
        _id: req.user._id,
      },
    },
    {
      $lookup: {
        from: "videos",
        localField: "_id",
        foreignField: "owner",
        as: "videos",
        pipeline: [
          {
            $lookup: {
              from: "likes",
              localField: "_id",
              foreignField: "video",
              as: "likes",
            },
          },
          {
            $lookup: {
              from: "comments",
              localField: "_id",
              foreignField: "video",
              as: "comments",
            },
          },
          {
            $addFields: {
              likes: {
                $size: "$likes",
              },
              comments: {
                $size: "$comments",
              },
            },
          },
          {
            $project: {
              views: 1,
              likes: 1,
              comments: 1,
            },
          },
        ],
      },
    },
    {
      $lookup: {
        from: "subscribers",
        localField: "_id",
        foreignField: "channel",
        as: "subscribers",
        pipeline: [
          {
            $project: {
              _id: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        totalVideos: {
          $size: "$videos",
        },
        totalComments: {
          $sum: "$videos.comments",
        },
        totalLikes: {
          $sum: "$videos.likes",
        },
        totalViews: {
          $sum: "$videos.views",
        },
        totalSubscribers: {
          $size: "$subscribers",
        },
      },
    },
    {
      $project: {
        totalComments: 1,
        totalVideos: 1,
        totalLikes: 1,
        totalViews: 1,
        totalSubscribers: 1,
      },
    },
  ]);

  if (!result) {
    throw new ApiError(400, "Something went wrong while getting user stats!");
  }

  return res
    .status(200)
    .json(new ApiResponse(400, result, "User stats fetched successfully!"));
});

const getChannelVideos = asyncHandler(async (req, res) => {
  // TODO: Get all the videos uploaded by the channel
  const aggregate = Video.aggregate([
    {
      $match: {
        owner: req.user._id,
      },
    },
    {
      $project: {
        videoFile: 1,
        thumbnail: 1,
        title: 1,
        duration: 1,
        views: 1,
        createdAt: 1,
      },
    },
    {
        $sort:{
            createdAt:-1
        }
    }
  ]);

 const page=parseInt(req.query.page)||1
 const limit=parseInt(req.query.limit)||10

  const options={
    page:page,
    limit:limit,
  }

  const result=await Video.aggregatePaginate(aggregate,options);

  if (!result) {
    throw new ApiError(400, "Something went wrong while fetching the videos uploaded by user");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos uploaded by user fetched successfully"));

});

export { getChannelStats, getChannelVideos };
