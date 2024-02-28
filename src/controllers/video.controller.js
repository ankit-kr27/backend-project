/**
 * publish a video
 * get all videos
 * get video by id
 * delete video
 * update video (thumbnail)
 * toggle publish status
 */

import { Video } from "../models/video.model.js";
import { ApiError } from "../utils/ApiError.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import {v2 as cloudinary} from "cloudinary"

const publishAVideo = asyncHandler(async (req, res)=>{
    /**
     * if req.files exist and then req.files.videoFile and also thumbnail exist fetch the video file and thumbnail paths
     * fetch the title and the description
     * check if the path exists
     * check if the title and description exist
     * upload them to cloudinary
     * check if you get the url of the uploaded files both of them are required
     * create a database entry
     * return the response
     */

    const localVideoFilePath = req.files?.videoFile[0]?.path
    const localThumbnailPath = req.files?.thumbnail[0]?.path
    const {title, description} = req.body;

    if(!title?.trim() || !description?.trim()){
        throw new ApiError(400, "Title and description are required")
    }

    if(!localVideoFilePath || !localThumbnailPath){
        throw new ApiError(400, "All files are required");
    }

    const videoFile = await uploadOnCloudinary(localVideoFilePath);
    const thumbnail = await uploadOnCloudinary(localThumbnailPath);

    if(!videoFile || !thumbnail){
        throw new ApiError(400, "Video and thumbnail, both are required");
    }

    const duration = videoFile.duration;

    // cloudinary.api.resource(videoFile.url, {resource_type: "video"}, (err, result)=>{
    //     if(err){
    //         throw new ApiError(501, err.message)
    //     }
    //     else{
    //         duration = result.duration;
    //     }
    // })

    const video = await Video.create({
        videoFile: videoFile.url,
        thumbnail: thumbnail.url,
        title,
        description,
        duration,
        owner: req.user?._id
    })

    const createdVideo = await Video.findById(video?._id).populate({
        path: "owner",
        select: "fullName avatar username"
    })

    if(!createdVideo){
        throw new ApiError(500, "Something went wrong while uploading the video");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdVideo, "Video uploaded successfully")
    )
})

const getAllVideos = asyncHandler(async (req, res)=>{
    const {page = 1, limit = 10, query, sortBy, sortType = "desc", userId} = req.query;

    page = Number(page);
    limit = Number(limit);

    let queryConditions = {isPublished: true}

    // if userId is provided filter videos by userId
    if(userId){
        queryConditions.owner = userId
    }

    // if query is provided search videos by title or description
    if(query){
        queryConditions.$or = [     // if any of the conditions within the $or array evaluates to true, the document matches the query.
        // $or field will be added to the object and is to be later evaluated in the find method
            {
                title: {$regex: query, $options: "i"}   // case insensitive title search
            },
            {
                description: {$regex: query, $options: "i"}     // case insensitive description search
            }
        ]
        // if the regular expression of query matches the title or description
    }

    // sorting the videos based on uploadDate or views
    const allowedSortOptions = ["uploadDate", "views"];

    if(sortBy && !allowedSortOptions.includes(sortBy)){
        throw new ApiError(400, `Invalid sortBy parameter. Allowed options are ${allowedSortOptions.join(", ")}`)
    }

    const sortOptions = {}

    if(sortBy === "uploadDate"){
        sortOptions.createdAt = (sortType === "asc" ? 1 : -1)
    } else if(sortBy === "views"){
        sortOptions.views = (sortType === "asc" ? 1 : -1)
    } else{
        sortOptions.createdAt = (sortType === "asc" ? 1 : -1)
    }
    // structure {createdAt: 1}

    const videoList = await Video
    .find(queryConditions)
    .skip((page-1)*limit)
    .limit(limit)
    .sort(sortOptions)
    .populate({
        path: "owner",
        select: "avatar username fullName"
    })

    return res
    .status(200)
    .json(
        new ApiResponse(200, videoList, "Videos fetched successfully")
    )

    /**
     * Key points to be noted
     * By default we provided the query condition for searching the videos is isPublished: true
     * if userId exists, we shall give the videos where the owner have the same userId
     * if query exists, we add $or field to the queryConditions object which will either match the title with the regular expression or the description (if title or decription follows the regular expression of the query or not)
     */
})

export {
    publishAVideo,
    getAllVideos,

}