import { Router } from "express";
import { 
    getAllVideos,
    publishAVideo,
    getVideoById,
    updateVideo,
    deleteVideo,
    togglePublishStatus
} from "../controllers/video.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { upload } from "../middlewares/multer.middleware.js";

const router = Router();

// Public route - get all videos
router.route('/').get(getAllVideos);

// Protected routes
router.route('/publish').post(
    verifyJWT,
    upload.fields([
        {
            name: "videoFile",
            maxCount: 1
        },
        {
            name: "thumbnail",
            maxCount: 1
        }
    ]),
    publishAVideo
);

router.route('/:videoId').get(verifyJWT,getVideoById);
router.route('/:videoId').patch(verifyJWT, updateVideo);
router.route('/:videoId').delete(verifyJWT, deleteVideo);
router.route('/toggle-publish/:videoId').patch(verifyJWT, togglePublishStatus);

export default router;
