import { Router } from "express";
import {
    createTweet,
    getUserTweets,
    getTweets,
    updateTweet,
    deleteTweet
} from "../controllers/tweet.controller.js";
import { verifyJWT } from "../middlewares/auth.middleware.js";

const router = Router();

router.route('/').post(verifyJWT, createTweet);
router.route('/').get(verifyJWT,getTweets);
router.route('/user/:userId').get(verifyJWT,getUserTweets);
router.route('/:tweetId').patch(verifyJWT, updateTweet);
router.route('/:tweetId').delete(verifyJWT, deleteTweet);

export default router;
