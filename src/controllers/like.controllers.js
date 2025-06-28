import { isValidObjectId } from "mongoose";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { Video } from "../models/video.models.js";
import { Comment } from "../models/comment.models.js";
import { Tweet } from "../models/tweet.models.js";

const toggleVideoLike = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  const existingLike = await Like.findOne({
    video: videoId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, "Video unliked successfully")
      );
  } else {
    await Like.create({
      video: videoId,
      likedBy: req.user._id,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: true }, "Video liked successfully"));
  }
});

const toggleCommentLike = asyncHandler(async (req, res) => {
  const { commentId } = req.params;

  if (!isValidObjectId(commentId)) {
    throw new ApiError(400, "Invalid comment ID");
  }

  const comment = await Comment.findById(commentId);
  if (!comment) {
    throw new ApiError(404, "Comment not found");
  }

  const existingLike = await Like.findOne({
    comment: commentId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, "Comment unliked successfully")
      );
  } else {
    await Like.create({
      comment: commentId,
      likedBy: req.user._id,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: true }, "Comment liked successfully")
      );
  }
});

const toggleTweetLike = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;

  if (!isValidObjectId(tweetId)) {
    throw new ApiError(400, "Invalid tweet ID");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found");
  }

  const existingLike = await Like.findOne({
    tweet: tweetId,
    likedBy: req.user._id,
  });

  if (existingLike) {
    await existingLike.deleteOne();
    return res
      .status(200)
      .json(
        new ApiResponse(200, { liked: false }, "Tweet unliked successfully")
      );
  } else {
    await Like.create({
      tweet: tweetId,
      likedBy: req.user._id,
    });
    return res
      .status(200)
      .json(new ApiResponse(200, { liked: true }, "Tweet liked successfully"));
  }
});

const getLikedVideos = asyncHandler(async (req, res) => {
  const likes = await Like.find({
    likedBy: req.user._id,
    video: { $ne: null },
  }).populate("video");

  const likedVideos = likes.map((like) => like.video).filter(Boolean);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        { videos: likedVideos },
        "Fetched liked videos successfully"
      )
    );
});

export { toggleCommentLike, toggleTweetLike, toggleVideoLike, getLikedVideos };
