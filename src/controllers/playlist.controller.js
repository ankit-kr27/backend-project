import mongoose, { isValidObjectId } from 'mongoose'
import {asyncHandler} from '../utils/asyncHandler.js'
import { Playlist } from '../models/playlist.model.js'
import { ApiError } from '../utils/ApiError.js'
import { ApiResponse } from '../utils/ApiResponse.js'
import { Video } from '../models/video.model.js'
import { User } from '../models/user.model.js'

/* 
    * createPlaylist 
    * addVideoToPlaylist
    * getUserPlaylists
    * getPlaylistById
    * removeVideoFromPlaylist
    * deletePlaylist
*/

const createPlaylist = asyncHandler(async (req, res)=>{
    const {name, description} = req.body;
    // console.log(name, description);
    if(!name || !description){
        throw new ApiError(400, "All fields are required");
    }

    const playlist = await Playlist.create({
        name: name.trim(),
        description: description.trim(),
        owner: req.user._id
    })

    const createdPlaylist = await Playlist.findById(playlist?._id);

    if(!createPlaylist){
        throw new ApiError(400, "Something went wrong while creating the playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, createdPlaylist, "Playlist created successfully!")
    )
})

const addVideoToPlaylist = asyncHandler(async (req, res)=>{
    // /:videoId/:playlistId

    const {videoId, playlistId} = req.params;

    if(!(videoId && playlistId)){
        throw new ApiError(400, "playlist id or video id missing")
    }

    if(!(isValidObjectId(videoId) && isValidObjectId(playlistId))){
        throw new ApiError(400, "Invalid playlist or video id")
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist doesn't exist")
    }

    if(playlist.owner?.toString() !== req.user?._id.toString()){
        throw new ApiError(401, "You're unauthorized to add to this playlist")
    }

    const video = await Video.findById(videoId)

    if(!video){
        throw new ApiError(404, "Video doesn't exist")
    }

    // playlist.videos.push(video._id);

    // await playlist.save({validateBeforeSave: false})

    // const newPlaylist = await Playlist.findById(playlist._id);

    const newPlaylist = await Playlist.findByIdAndUpdate(
        playlistId,
        {
            $set: {
                videos: [...this.videos, videoId]
            }
        },
        {new: true}
    )

    if(!newPlaylist){
        throw new ApiResponse(500, "Something went wrong while adding video to the playlist");
    }

    return res 
    .status(200)
    .json(
        new ApiResponse(200, newPlaylist, "Video added to the playlist successfully!")
    )    
})

const getUserPlaylists = asyncHandler(async (req, res)=>{
    /* 
        get all the playlists that the user has created: 
        * fetch userId
        * check if userId exists
        * check if userId is valid
        * fetch the user
        * check if the user is fetched successfully or not
        * use aggregation pipelines to fetch all the playlists matching the owner with userId and present the data in a suitable way.
        * return the response;
    */
    
    const {userId} = req.params;
    if(!userId){
        throw new ApiError(400, "User id is missing");
    }

    if(!isValidObjectId(userId)){
        throw new ApiError(400, "Invalid user id");
    }

    const user = await User.findById(userId);

    if(!user){
        throw new ApiError(404, "User does not exist");
    }

    const userPlaylists = await User.aggregate([
        {
            $match: {_id: new mongoose.Types.ObjectId(userId)}
        },
        {
            $lookup: {
                from: "playlists",
                foreignField: "owner",
                localField: "_id",
                as: "playlists",
                pipeline: [
                    // Populating and adding owner field
                    {
                        $lookup: {
                            from: "users",
                            foreignField: "_id",
                            localField: "owner",
                            as: "owner",
                            pipeline: [
                                {
                                    $project: {
                                        fullName: 1,
                                        username: 1, 
                                        avatar: 1
                                    }
                                }
                            ]
                        }
                    },
                    {
                        $addFields: {
                            owner: {
                                $first: "$owner"
                            }
                        }
                    },
                    // Populating and adding videos field
                    {
                        $lookup: {
                            from: "videos",
                            foreignField: "_id",
                            localField: "videos",
                            as: "videos"
                        }
                    }
                ]
            }
        },
        {
            $project: {
                owner: 1, 
                playlists: 1
            }
        }
    ])

    return res
    .status(200)
    .json(
        new ApiResponse(200, userPlaylists, "User playlists fetched successfully")
    )
})

const getPlaylistById = asyncHandler(async (req, res)=>{
    /* 
        Sending the playlist of a particular id
        * playlist id -> req.params
        * if missing id test
        * aggregation pipeline to return the playlist populating videos and owner field or use mongoose's .populate() method
        * check if it exist or not
        * return response
    */
    const {playlistId} = req.params;

    if(!playlistId){
        throw new ApiError(400, "Missing playlist id");
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(401, "Invalid playlist id")
    }

    const playlist = await Playlist.findById(playlistId)
    .populate({
        path: "owner",
        select: "username fullName avatar"
    })
    .populate({
        path: "videos",
    })
      // we could've used aggregation pipelines for the same also

    // const playlist = await Playlist.aggregate([
    //     {
    //         $match: {_id: new mongoose.Types.ObjectId(playlistId)}
    //     },
    //     {
    //         $lookup: {
    //             from: "users",
    //             foreignField: "_id",
    //             localField: "owner",
    //             as: "owner",
    //             pipeline: [
    //                 {
    //                     $project: {
    //                         fullName: 1,
    //                         username: 1,
    //                         avatar: 1
    //                     }
    //                 },
    //                 {
    //                     $addFields: {
    //                         owner: {
    //                             $first: "$owner"
    //                         }
    //                     }
    //                 }
    //             ]
    //         } 
    //     },
    //     {
    //         $lookup: {
    //             from: "videos",
    //             foreignField: "_id",
    //             localField: "videos",
    //             as: "videos"
    //         }
    //     },
    //     {
    //         $project: {
    //             owner: 1,
    //             videos: 1
    //         }
    //     }
    // ])

    if(!playlist){
        throw new ApiError(404, "Cannot find the playlist");
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, playlist, "playlist fetched successfully!")
    )
})

const removeVideoFromPlaylist = asyncHandler(async (req, res)=>{
    /* 
        * fetch videoId playlistId
        * check if both exist or not
        * check if both of them are valid or not
        * fetch playlist with the playlist id
        * check if it exist
        * check if the current loggedIn user is the owner of the playlist or not
        * check if the video exist in the array of videos
        * remove the video from the array (playlist.videos)
        * save playlist
        * return response
    */

    const {videoId, playlistId} = req.params;

    if(!videoId || !playlistId){
        throw new ApiError(400, "Missing video id or playlist id");
    }

    if(!isValidObjectId(videoId) || !isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid video id or playlist id");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist doesn't exist!");
    }

    if(playlist.owner.toString() !== req.user?._id.toString()){
        throw new ApiError(401, "You are unauthorized to the video from the playlist")
    }

    const videoIdx = playlist.videos.indexOf(videoId);

    if(videoIdx === -1){
        throw new ApiError(404, "Video does not exist in the playlist");
    }

    playlist.videos.splice(videoIdx, 1);
    await playlist.save({validateBeforeSave: false})
    const updatedPlaylist = await Playlist.findById(playlistId);

    return res
    .status(200)
    .json(
        new ApiResponse(200, updatedPlaylist ,"Video removed successfully")
    );
})

const deletePlaylist = asyncHandler(async (req, res)=>{
    const {playlistId} = req.params;

    if(!playlistId){
        throw new ApiError(400, "Missing playlist id");
    }

    if(!isValidObjectId(playlistId)){
        throw new ApiError(400, "Invalid playlist Id");
    }

    const playlist = await Playlist.findById(playlistId);

    if(!playlist){
        throw new ApiError(404, "Playlist doesn't exist");
    }

    if(req.user?._id.toString() !== playlist.owner.toString()){
        throw new ApiError(401, "You are unauthorized to delete the playlist");
    }

    await Playlist.deleteOne({
        _id: playlistId
    })

    if(!(await Playlist.findById(playlistId))){
        throw new ApiError(500, "Something went wrong while deleting the playlist")
    }

    return res
    .status(200)
    .json(
        new ApiResponse(200, {}, "Playlist deleted successfully")
    )
})

export {
    createPlaylist,
    addVideoToPlaylist,
    getUserPlaylists,
    getPlaylistById,
    removeVideoFromPlaylist,
    deletePlaylist
}

