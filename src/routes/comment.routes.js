import { Router } from "express";
import { getVideoComments } from "../controllers/comment.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router=Router();

router.route('/get-comments/:videoId').get(verifyJWT);
router.route('/add-comment/:videoId').post(verifyJWT);
router.route('/update-comment/:commentId').patch(verifyJWT);
router.route('/delet-comment/:commentId').delete(verifyJWT);

export default router;