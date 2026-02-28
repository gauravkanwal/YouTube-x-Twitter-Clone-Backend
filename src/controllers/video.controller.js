import mongoose, { isValidObjectId } from "mongoose";
import { Video } from "../models/video.model.js";
import { User } from "../models/user.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import {
  uploadOnCloudinary,
  deleteFromCloudinary,
} from "../utils/cloudinary.js";

const getAllVideos = asyncHandler(async (req, res) => {
  const {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  //TODO: get all videos based on query, sort, pagination

  //steps:
  //query means if user is search something get him videos with matching title or description for this use $regex
  // if userId is provided that means searching videos from the given user's uploaded videos
  //sortBy means to sort on basis of which property
  //sortType means which type of sorting ascending or descending
  //join with users and add avatar and username of the owner also

  const videoProperties = {
    isPublished: true,
  };

  if (userId) {
    if (!(isValidObjectId(userId) && (await User.exists({ _id: userId })))) {
      throw new ApiError(400, "Invalid userId");
    }

    videoProperties.owner = mongoose.Types.ObjectId(userId);
  }

  if (query) {
    videoProperties.$or = [
      {
        title: {
          $regex: query,
          $options: "i",
        },
      },
      {
        description: {
          $regex: query,
          $options: "i",
        },
      },
    ];
  }

  const sortProperties = {};
  sortProperties[sortBy] = sortType == "asc" ? 1 : -1;

  const aggregate = Video.aggregate([
    {
      $match: videoProperties,
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
              username: 1,
              avatar: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
      },
    },
    {
      $sort: sortProperties,
    },
  ]);

  const options = {
    limit: parseInt(limit) || 10,
    page: parseInt(page) || 1,
  };

  const result = await Video.aggregatePaginate(aggregate, options);

  if (!result) {
    throw new ApiError(400, "Something went wrong while fetching the videos");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, result, "Videos fetched successfully"));
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  // TODO: get video, upload to cloudinary, create video
  if (title?.trim() === "" || description?.trim() === "") {
    throw new ApiError(400, "All fields are required!");
  }

  const videoFileLocalPath = req.files?.videoFile?.[0].path;
  const thumbnailLocalPath = req.files?.thumbnail?.[0].path;

  if (!videoFileLocalPath) {
    throw new ApiError(400, "Video file not found");
  }

  if (!thumbnailLocalPath) {
    throw new ApiError(400, "Thumbnail not found");
  }

  const videoFile = await uploadOnCloudinary(videoFileLocalPath);
  const thumbnailFile = await uploadOnCloudinary(thumbnailLocalPath);

  if (!videoFile?.url || !thumbnailFile?.url) {
    throw new ApiError(400, "Uplaoding on cloudinary failed");
  }

  const video = await Video.create({
    videoFile: videoFile.secure_url,
    videoFilePublicId: videoFile.public_id,
    videoFileResourceType: videoFile.resource_type,

    thumbnail: thumbnailFile.secure_url,
    thumbnailPublicId: thumbnailFile.public_id,
    thumbnailResourceType: thumbnailFile.resource_type,

    title,
    description,
    duration: videoFile.duration,
    owner: req.user._id,
  });

  if (!video) {
    throw new ApiError(400, "Something went wrong");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videoUrl: videoFile.url, thumbnail: thumbnailFile.url },
        "Video uploaded successfully"
      )
    );
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: get video by id
  if (!isValidObjectId(videoId) || !(await Video.exists({ _id: videoId }))) {
    throw new ApiError(400, "Invalid video ID");
  }

  //send view count
  //increase the view count of video
  //send comments with username and avatar of commentors
  //send number of subscribers and if the user has subscribed the channel or not
  //send like count and if the user has liked the video or not
  await Video.findByIdAndUpdate(
    videoId,
    {
      $inc: {
        views: 1,
      },
    },
    {
      new: false,
    }
  );

  const videoDetails = await Video.aggregate([
    {
      $match: {
        _id: new mongoose.Types.ObjectId(videoId),
      },
    },
    {
      $lookup: {
        from: "comments",
        localField: "_id",
        foreignField: "video",
        as: "comments",
        pipeline: [
          {
            $sort: {
              createdAt: -1,
            },
          },
          {
            $limit: 10,
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
                    username: 1,
                    avatar: 1,
                  },
                },
              ],
            },
          },
          {
            $addFields: {
              owner: {
                $first: "$owner",
              },
            },
          },
        ],
      },
    },
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
        from: "users",
        localField: "owner",
        foreignField: "_id",
        as: "owner",
        pipeline: [
          {
            $lookup: {
              from: "subscriptions",
              localField: "_id",
              foreignField: "channel",
              as: "subscribers",
            },
          },
          {
            $addFields: {
              isSubscribed: {
                $in: [
                  new mongoose.Types.ObjectId(req.user._id),
                  "$subscribers.subscriber",
                ],
              },
              subscribersCount: {
                $size: "$subscribers",
              },
            },
          },
          {
            $project: {
              username: 1,
              avatar: 1,
              fullName: 1,
              subscribersCount: 1,
              isSubscribed: 1,
            },
          },
        ],
      },
    },
    {
      $addFields: {
        owner: {
          $first: "$owner",
        },
        isLiked: {
          $in: [new mongoose.Types.ObjectId(req.user._id), "$likes.likedBy"],
        },
        likes: {
          $size: "$likes",
        },
      },
    },
  ]);

  if (!videoDetails.length === 0) {
    throw new ApiError(400, "something went wrong while fetching video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, videoDetails, "Video fetched successfully!"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: update video details like title, description, thumbnail
  if (!isValidObjectId(videoId) || !(await Video.exists({ _id: videoId }))) {
    throw new ApiError(400, "Invalid video ID");
  }

  const { title, description } = req.body;
  const thumbnail = req.file?.path;

  if (title.trim() === "" && description.trim() === "" && !thumbnail) {
    throw new ApiError(400, "Atleast one field should be there to update");
  }

  const video = await Video.findById(videoId);
  const updatedData = {};

  if (thumbnail) {
    const uploadedThumbnail = await uploadOnCloudinary(thumbnail);
    if (!uploadedThumbnail.secure_url) {
      throw new ApiError(
        400,
        "Cloudinary upload error while updating the thumbnail"
      );
    }

    const deletedThumbnail = await deleteFromCloudinary(
      video.thumbnailPublicId,
      video.thumbnailResourceType
    );

    if (!deletedThumbnail) {
      throw new ApiError(
        400,
        "Something went wrong while deleting previous thumbnail"
      );
    }

    updatedData.thumbnail = uploadedThumbnail?.secure_url;
    updatedData.thumbnailPublicId = uploadedThumbnail?.public_id;
    updatedData.thumbnailResourceType = uploadedThumbnail?.resource_type;
  }

  if (title) {
    updatedData.title = title;
  }

  if (description) {
    updatedData.description = description;
  }

  const updatedVideo = await Video.findByIdAndUpdate(videoId, updatedData, {
    new: true,
  });

  if (!updatedVideo) {
    throw new ApiError(400, "Something went wrong while updating the video");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, updatedVideo, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  //TODO: delete video
  if (!isValidObjectId(videoId) || !(await Video.exists({ _id: videoId }))) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  const deletedVideoFile = await deleteFromCloudinary(
    video.videoFilePublicId,
    video.videoFileResourceType
  );
  const deletedThumbnail = await deleteFromCloudinary(
    video.thumbnailPublicId,
    video.thumbnailResourceType
  );

  if (!deletedVideoFile || !deletedThumbnail) {
    throw new ApiError(
      400,
      "Something went wrong while deleting video and thumbnail from cloudinary!"
    );
  }

  const deletedVideo = await Video.findByIdAndDelete(videoId);

  if (!deletedVideo) {
    throw new ApiError(400, "Video deletion failed");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, deletedVideo, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const updatedVideo = await Video.findByIdAndUpdate(
    videoId,
    [
      {
        $set: {
          isPublished: { $not: "$isPublished" },
        },
      },
    ],
    { new: true }
  );

  if (!updatedVideo) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { isPublished: updatedVideo.isPublished },
        "Toggled publish status successfully"
      )
    );
});

export {
  getAllVideos,
  publishAVideo,
  getVideoById,
  updateVideo,
  deleteVideo,
  togglePublishStatus,
};
