import {ApiError} from "../utils/ApiError.js"
import {ApiResponse} from "../utils/ApiResponse.js"
import {asyncHandler} from "../utils/asyncHandler.js"


const healthcheck = asyncHandler(async (req, res) => {
    //TODO: build a healthcheck response that simply returns the OK status as json with a message
    const dbStatus = mongoose.connection.readyState;

    if(dbStatus !== 1){ //1 means connected
        throw new ApiError(500, "Database connection not healthy")
    }

    return res
    .status(200)
    .json(new ApiResponse(200, {status : "OK", dbStatus}, "Health check passed: System is up and running"))
})

export {
    healthcheck
    }
    