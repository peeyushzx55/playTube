import { isValidObjectId } from "mongoose";
import { Video } from "../models/video.models.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import cloudinary from "cloudinary";

const getAllVideos = asyncHandler(async (req, res) => {
  let {
    page = 1,
    limit = 10,
    query,
    sortBy = "createdAt",
    sortType = "desc",
    userId,
  } = req.query;
  page = parseInt(page);
  limit = parseInt(limit);

  const filter = {};
  if (query) {
    filter.$or = [
      { title: { $regex: query, $options: "i" } },
      { description: { $regex: query, $options: "i" } },
    ];
  }
  if (userId && isValidObjectId(userId)) {
    filter.owner = userId;
  }

  const sort = {};
  sort[sortBy] = sortType === "asc" ? 1 : -1;

  const skip = (page - 1) * limit;

  const videos = await Video.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("owner", "_id username avatar");

  const totalVideos = await Video.countDocuments(filter);

  return res.status(200).json(
    new ApiResponse(
      200,
      {
        videos,
        page,
        limit,
        totalVideos,
        totalPages: Math.ceil(totalVideos / limit),
      },
      "Videos fetched successfully"
    )
  );
});

const publishAVideo = asyncHandler(async (req, res) => {
  const { title, description } = req.body;
  const userId = req.user._id;

  if (!title || !description) {
    throw new ApiError(400, "Title and description are required");
  }

  // Check if file is present (using multer.fields)
  if (!req.files || !req.files.videoFile || !req.files.videoFile[0]) {
    throw new ApiError(400, "Video file is required");
  }

  const videoFile = req.files.videoFile[0];
  // Optional: handle thumbnail
  let thumbnailFile = null;
  if (req.files.thumbnail && req.files.thumbnail[0]) {
    thumbnailFile = req.files.thumbnail[0];
  }

  // Upload video to Cloudinary
  const uploadResult = await uploadOnCloudinary(videoFile.path, "video");
  if (!uploadResult || !uploadResult.secure_url) {
    throw new ApiError(500, "Video upload failed");
  }

  // Optionally upload thumbnail to Cloudinary if present
  let thumbnailUrl = uploadResult.thumbnail_url || null;
  if (thumbnailFile) {
    const thumbResult = await uploadOnCloudinary(thumbnailFile.path, "image");
    if (thumbResult && thumbResult.secure_url) {
      thumbnailUrl = thumbResult.secure_url;
    }
  }

  // Create video document
  const video = await Video.create({
    title,
    description,
    videoUrl: uploadResult.secure_url,
    owner: userId,
    duration: uploadResult.duration || null,
    thumbnail: thumbnailUrl,
    public_id: uploadResult.public_id,
  });

  if (!video) {
    throw new ApiError(500, "Video could not be published");
  }

  return res
    .status(201)
    .json(new ApiResponse(201, video, "Video published successfully"));
});

const getVideoById = asyncHandler(async (req, res) => {
  const { videoId } = req.params;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video fetched successfully"));
});

const updateVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const { title, description } = req.body;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner || video.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to update this video.");
  }

  // Update fields if provided
  if (title) video.title = title;
  if (description) video.description = description;

  // Handle thumbnail update if a new file is uploaded
  if (req.file) {
    const thumbResult = await uploadOnCloudinary(req.file.path, "image");
    if (thumbResult && thumbResult.secure_url) {
      video.thumbnail = thumbResult.secure_url;
    }
  }

  await video.save();

  return res
    .status(200)
    .json(new ApiResponse(200, video, "Video updated successfully"));
});

const deleteVideo = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);

  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner || video.owner.toString() !== userId.toString()) {
    throw new ApiError(403, "You are not authorized to delete this video.");
  }

  // Delete from Cloudinary if public_id exists
  if (video.public_id) {
    await cloudinary.v2.uploader.destroy(video.public_id, {
      resource_type: "video",
    });
  }

  await video.deleteOne();

  return res
    .status(200)
    .json(new ApiResponse(200, null, "Video deleted successfully"));
});

const togglePublishStatus = asyncHandler(async (req, res) => {
  const { videoId } = req.params;
  const userId = req.user._id;

  if (!isValidObjectId(videoId)) {
    throw new ApiError(400, "Invalid video ID");
  }

  const video = await Video.findById(videoId);
  if (!video) {
    throw new ApiError(404, "Video not found");
  }

  if (!video.owner || video.owner.toString() !== userId.toString()) {
    throw new ApiError(
      403,
      "You are not authorized to change publish status of this video."
    );
  }

  video.isPublished = !video.isPublished;
  await video.save();

  return res
    .status(200)
    .json(
      new ApiResponse(
        200,
        video,
        `Video publish status toggled to ${video.isPublished ? "published" : "unpublished"}`
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
