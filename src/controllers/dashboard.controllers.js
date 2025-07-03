import { Video } from "../models/video.models.js";
import { Subscription } from "../models/subscription.models.js";
import { Like } from "../models/like.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const getChannelStats = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not found");
  }

  // Total videos uploaded by the channel
  const totalVideos = await Video.countDocuments({ owner: userId });

  // Total views across all videos
  const videos = await Video.find({ owner: userId }, "views");
  const totalViews = videos.reduce((sum, video) => sum + (video.views || 0), 0);

  // Total subscribers
  const totalSubscribers = await Subscription.countDocuments({
    channel: userId,
  });

  // Total likes across all videos
  const videoIds = videos.map((v) => v._id);
  const totalLikes = await Like.countDocuments({ video: { $in: videoIds } });

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        totalVideos,
        totalViews,
        totalSubscribers,
        totalLikes,
      },
      "Channel stats fetched successfully"
    )
  );
});

const getChannelVideos = asyncHandler(async (req, res) => {
  const userId = req.user?._id;
  if (!userId) {
    throw new ApiError(401, "Unauthorized: User not found");
  }

  // Fetch all videos uploaded by the channel (user)
  const videos = await Video.find({ owner: userId }).sort({ createdAt: -1 });

  return res
    .status(200)
    .json(new ApiResponse(200, videos, "Channel videos fetched successfully"));
});

export { getChannelStats, getChannelVideos };
