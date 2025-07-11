import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
  return res.status(200).json(
    new ApiResponse(200, {
      status: "ok",
      message: "Server is healthy",
      serverTime: new Date().toISOString(),
    })
  );
});

export { healthcheck };
