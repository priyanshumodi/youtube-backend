import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";

const healthcheck = asyncHandler(async (req, res) => {
    // TODO: build a healthCheck response that simply returns the OK status as json with a message

    return res
        .status(200)
        .json("health is Good :)")
})

export {
    healthcheck
}