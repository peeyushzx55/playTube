import mongoose, { isValidObjectId } from "mongoose";
import { User } from "../models/user.models.js";
import { Subscription } from "../models/subscription.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const toggleSubscription = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const channel = await User.findById(channelId);
  if (!channel) {
    throw new ApiError(404, "Channel not found!");
  }

  const existingSubscriber = await Subscription.findOne({
    subscriber: req.user._id,
    channel: channelId,
  });

  if (existingSubscriber) {
    await existingSubscriber.deleteOne();
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: false },
          "Channel unsubscribed successfully"
        )
      );
  } else {
    await Subscription.create({
      subscriber: req.user._id,
      channel: channelId,
    });
    return res
      .status(200)
      .json(
        new ApiResponse(
          200,
          { subscribed: true },
          "Channel subscribed successfully"
        )
      );
  }
});

// controller to return subscriber list of a channel
const getUserChannelSubscribers = asyncHandler(async (req, res) => {
  const { channelId } = req.params;

  if (!isValidObjectId(channelId)) {
    throw new ApiError(400, "Invalid channel ID");
  }

  const subscriberCount = await Subscription.countDocuments({
    channel: channelId,
  });
  console.log(subscriberCount);

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        subscriberCount,
        "Subscriber count fetched successfully"
      )
    );
});

// controller to return channel list to which user has subscribed
const getSubscribedChannels = asyncHandler(async (req, res) => {
  const { subscriberId } = req.params;

  if (!isValidObjectId(subscriberId)) {
    throw new ApiError(400, "Invalid subscriber ID");
  }

  const channelCount = await Subscription.countDocuments({
    subscriber: subscriberId,
  });
  console.log(channelCount);

  return res
    .status(200)
    .json(
      new ApiResponse(200, channelCount, "Channel count fetched successfully")
    );
});

export { toggleSubscription, getUserChannelSubscribers, getSubscribedChannels };
