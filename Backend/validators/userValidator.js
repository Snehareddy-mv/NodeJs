const Joi=require("joi");

const updateUserSchema=Joi.object({
    name:Joi.string().min(3).max(50).messages({
        "string.min":"Name must be at least 3 characters",
        "string.max":"Name must be at most 50 characters",
        
    }),
    email:Joi.string().email().messages({
        "string.email":"please provide a valid email address"
    }),
    role:Joi.string().valid("user","admin").messages({
        "any.only":"Role must be either user or admin"
    })

}).min(1).messages({
    "object.min":"At least one field must be provided for update"
})


const refreshTokenSchema=Joi.object({
    refreshToken:Joi.string().required().messages({
        "string.empty":"Refresh token is required"
    })
})



module.exports={
    updateUserSchema,
    refreshTokenSchema
}
