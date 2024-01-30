import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.service.js";
import { ApiResponse } from "../utils/ApiResponse.js";

// const registerUser = (req, res, next)=>{
//     try{
//         res.status(200).json({
//             message: "ok"
//         })
//     }catch(err){
//         res.status(err.code || 500).json({
//             success: false,
//             message: err.message
//         })
//     }
// }

const registerUser = asyncHandler(async (req, res)=>{   // this will execute the provided async function with the help of promise
    // res.status(200).json({
    //     message: "ok"
    // })

    /* 
        *** ALGORITHM ***
        # get user details from frontend
        # validation - non empty
        # check if user already exists: username, email
        # check for images, check for avatar
        # upload them to cloudinary, avatar
        # create user object - create entry in db
        # remove password and refresh token field from response
        # check for user creation 
        # return response
    */

// USER DETAILS
    const {fullName, username, password, email} = req.body;
    
// VALIDATION
    if(
        [fullName, username, password, email].some(field => field?.trim() === "")   // checks if any of the fields return true or not
    ){
        throw new ApiError(400, "All fields are required!")
    }

// IF USER EXISTS
    const existedUser = await User.findOne(   // User can directly interact with mongoDB as it has been created with the help of monngoose
        {  // email or below
            $or: [{ username }, { email }]    // returns an array of users existing in the db with same username or email fields
        }
    )
        // console.log("Existed User: ", existedUser);
    if(existedUser){
        throw new ApiError(409, "User with username or email already exists");
    }

// FETCH IMAGE LOCAL PATH 
     // as express gives us access to req.body(), multer(middleware) adds on to give us the access of other fields such as files(in case of multer)
     let avatarLocalPath;
     if(req.files && req.files.avatar)
        avatarLocalPath = req.files.avatar[0]?.path      // will return the path of the file as uploaded by multer on to the server 

    // const coverImageLocalPath = req.files?.coverImage[0]?.path      // optional chaining (this line causes error)
    let coverImageLocalPath
    if(req.files && req.files.coverImage)
        coverImageLocalPath = req.files.coverImage[0]?.path

// CHECK IF AVATAR EXISTS
    if(!avatarLocalPath){
        throw new ApiError(400, "Avatar is required")
    }

    // UPLOAD THEM TO CLOUDINARY
    const avatar = await uploadOnCloudinary(avatarLocalPath)   // that's why we made this async
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);      // if it doesn't exist, cloudinary won't give an error but rather returns null.
    if(!avatar){
        throw new ApiError(400, "Avatar is required")
    }

    // CREATE AN ENTRY IN DB
    const user = await User.create({    // db entry will take time that's why await
        fullName,
        avatar: avatar.url,
        coverImage: coverImage?.url || "",   // if coverImage exists then extract it otherwise let it be empty
        email: email.toLowerCase(),
        password,
        username: username.toLowerCase()
    })

    const createdUser = await User.findById(user._id).select(
        "-password -refreshToken"   // by default every field is selected
    )

    if(!createdUser){
        throw new ApiError(500, "Something went wrong while registering the user")
    }

    return res.status(201).json(
        new ApiResponse(200, createdUser, "User registered successfully")
    )
})

export {registerUser}
























// if(fullName.trim() === ""){
    //     throw new ApiError(400, "fullName is required")
    // }
    // if(username.trim() === ""){
    //     throw new ApiError(400, "username is required")
    // }
    // if(password.trim() === ""){
    //     throw new ApiError(400, "password is required")
    // }
    // if(email.trim() === ""){
    //     throw new ApiError(400, "email is required")
    // }
    // OR