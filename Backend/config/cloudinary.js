const dotenv=require("dotenv");
dotenv.config();
const multer=require("multer");
const cloudinary=require("cloudinary").v2;
const {CloudinaryStorage}=require("multer-storage-cloudinary");


cloudinary.config({
    cloud_name:process.env.CLOUDINARY_CLOUD_NAME,
    api_key:process.env.CLOUDINARY_API_KEY,
    api_secret:process.env.CLOUDINARY_API_SECRET
})

const storage=new CloudinaryStorage({
    cloudinary:cloudinary,
    params:{
        folder:"ImagesFolder",
        acceptedFormats:["jpeg","jpg","png","gif"],
        transformation:[{width:500,height:500,crop:"limit"}]

    }
})

const upload=multer({
    storage:storage,
    limits:{
        fileSize:5*1024*1024
    }
})

module.exports={upload,cloudinary}
