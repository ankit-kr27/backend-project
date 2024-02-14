import { Router } from "express";
import { verifyJWT } from "../middlewares/auth.middleware.js";
import { createTweet, deleteTweet, getUserTweets, updateTweet } from "../controllers/tweet.controller.js";

const router = Router()
router.use(verifyJWT)   // apply verification middleware for all routes in the file
// it will also add user to the req object

router.route("/create").post(createTweet);
router.route("/user/:userId").get(getUserTweets);
router.route("/user").get(getUserTweets);   // for error handling purpose, while the user id is not provided
router.route("/update/:tweetId").patch(updateTweet)
router.route("/update").patch(updateTweet)  // for error handling purpose
router.route("/delete/:tweetId").delete(deleteTweet)
router.route("/delete").delete(deleteTweet) // for error handling purpose

export default router;