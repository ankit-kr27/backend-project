import { asyncHandler } from "../utils/asyncHandler.js";

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

const registerUser = asyncHandler(async (req, res)=>{
    res.status(200).json({
        message: "ok"
    })
})

export {registerUser}