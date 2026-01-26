import { v2 as cloudinary } from "cloudinary";
import fs from 'fs'; //file system by node js


cloudinary.config({ 
        cloud_name: process.env.CLOUDINARY_CLOUD_NAME, 
        api_key: process.env.CLOUDINARY_API_KEY, 
        api_secret: process.env.CLOUDINARY_API_SECRET,
    });


const uploadOnCloudinary=async(localFilePath)=>{
    try {
        
        if(!localFilePath) return null;
        //upload the file on cloudinary
        const respose=await cloudinary.uploader.upload(localFilePath, {
            resource_type: 'auto'
        })

        //file has been uploaded successfully
        // console.log("file is uploaded on cloudinary", respose.url);
        fs.unlinkSync(localFilePath)
        return respose
    } catch (error) {
        console.error("Cloudinary upload error:", error);
        fs.unlinkSync(localFilePath) //remove the localy saved temporary file as the upload operation got failed
        return null;
    }
}

export {uploadOnCloudinary};