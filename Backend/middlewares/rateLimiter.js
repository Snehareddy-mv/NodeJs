const rateLimit=require("express-rate-limit");


const limiter=rateLimit({
    windowMs:15*60*1000,
    max:100,
    message:"Too many requests from this IP, please try again later"

})

const registerLimiter=rateLimit({
    windowMs:1*60*1000,
    max:5,
    message:"Too many Registration attempts,please try again later"
})

const loginLimiter=rateLimit({
    windowMs:15*60*1000,
    max:10,
    message:"Too many Login attempts,please try again later"
})

module.exports={limiter,registerLimiter,loginLimiter};
