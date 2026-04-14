const User = require("../models/userModel");
const bcrypt = require("bcrypt");
const jwt=require("jsonwebtoken")
const AppError=require("../utils/AppError")
const asyncHandler=require("../utils/asyncHandler")

const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password, role } = req.body;
    if (!name || !password || !email) {
      return res.status(400).json({ message: "All Fields are required" });
    }

    const isUserExists = await User.findOne({ email });
    if (isUserExists) {
      
        throw new AppError("User with same email already exists",400)
    } else {
      const hashPassword = await bcrypt.hash(password, 10);
      const user = new User({
        name,
        email,
        password: hashPassword,
        role,
      });
      await user.save();
       res.status(201).json({success:true, message: "User registered successfully" });
    }
 
});

const loginUser=asyncHandler(async(req,res)=>{
    
        const {email,password}=req.body;
        if(!email || !password){
            
            throw new AppError("All Fields are required",400)

        }
        const user=await User.findOne({email})
        if(!user){
            
            throw new AppError("User not found",404)
        }
        const isPasswordValid=await bcrypt.compare(password,user.password)
        if(!isPasswordValid){
            
            throw new AppError("Invalid Password",401)
        }

        const accessToken=jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:"15m"})
        const refreshToken=jwt.sign({id:user._id,role:user.role},process.env.JWT_SECRET,{expiresIn:"7d"})
         user.refreshToken=refreshToken;
         await user.save();
        res.status(200).json({success:true,message:"Login successfull",accessToken,refreshToken,user:{id:user._id,role:user.role,name:user.name,email:user.email}})
        
    
})

module.exports = { registerUser,loginUser };
