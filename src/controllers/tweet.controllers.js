import { Tweet } from "../models/tweet.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const createTweet = asyncHandler(async (req, res) => {
  const { content } = req.body;
  if (!content) {
    throw new ApiError(400, "Some content is required to post a tweet.");
  }
  const tweet = await Tweet.create({
    content: content.toLowerCase(),
    owner: req.user._id,
  });

  if (!tweet) {
    throw new ApiError(404, "Content not found!");
  }

  const createdTweet = await Tweet.findById(tweet._id);

  return res
    .status(200)
    .json(new ApiResponse(200, createdTweet, "Content fetched successfully"));
});

const getUserTweets = asyncHandler(async (req, res) => {
  const userId = req.user._id;
  const tweets = await Tweet.find({ owner: userId }).sort({ createdAt: -1 });
  return res
    .status(200)
    .json(new ApiResponse(200, tweets, "User tweets fetched successfully"));
});

const updateTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const { content } = req.body;
  const userId = req.user._id;

  if (!content) {
    throw new ApiError(400, "Content is required to update the tweet.");
  }

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  if (!tweet.owner || tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this tweet.");
  }

  tweet.content = content;
  await tweet.save();

  return res
    .status(200)
    .json(new ApiResponse(200, tweet, "Tweet updated successfully"));
});

const deleteTweet = asyncHandler(async (req, res) => {
  const { tweetId } = req.params;
  const userId = req.user._id;

  const tweet = await Tweet.findById(tweetId);
  if (!tweet) {
    throw new ApiError(404, "Tweet not found.");
  }

  if (!tweet.owner || tweet.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this tweet.");
  }

  await tweet.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Tweet deleted successfully"));
});

export { createTweet, getUserTweets, updateTweet, deleteTweet };
