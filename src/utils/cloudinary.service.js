import {v2 as cloudinary} from "cloudinary"
import fs from "fs"

cloudinary.config({     // this configuration gives us the permission to upload files 
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
  api_key: process.env.CLOUDINARY_API_KEY, 
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const uploadOnCloudinary = async (localFilePath)=>{     // localFilePath is the locally saved temporary file
    try {
        if(!localFilePath) return null;
        // upload the file on cloudinary
        const response = await cloudinary.uploader.upload(localFilePath, {
            resource_type: "auto"
        })
        // file has been uploaded successfully
        console.log("File has been uploaded on cloudinary! ", response.url);
        return response;
    } catch (error) {
        fs.unlink(localFilePath)    // remove the locally saved temporary file as the upload operation gets failed
        return null;
    }
}

export {uploadOnCloudinary}

// cloudinary.uploader.upload("https://upload.wikimedia.org/wikipedia/commons/a/ae/Olympic_flag.jpg",
//   { public_id: "olympic_flag" }, 
//   function(error, result) {console.log(result); });
