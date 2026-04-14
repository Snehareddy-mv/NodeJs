const jwt=require("jsonwebtoken")

const authMiddleware=(req,res,next)=>{
    const usertoken=req.headers.authorization;
    if(!usertoken){
        return res.status(401).json({message:"Unauthorized"})
    }
    const token=usertoken.split(" ")[1];
    jwt.verify(token,process.env.JWT_SECRET,(err,decodedData)=>{
        if(err){
            return res.status(401).json({message:"Invalid Token"})
        }
        req.currentUser=decodedData;
        next();
    })
  
}

module.exports=authMiddleware;