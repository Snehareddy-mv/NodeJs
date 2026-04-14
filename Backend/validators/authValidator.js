const Joi = require("joi");

const registerSchema = Joi.object({
  name: Joi.string().required().min(3).max(50).messages({
    "string.empty": "Name is required",
    "string.min": "Name must be atleast 3 characters",
    "string.max": "Name must be atmost 50 characters",
  }),
  email: Joi.string().email().required().messages({
    "string.empty": "Email is required",
    "string.email": "Please provide a valid email address",
  }),
  password: Joi.string()
    .min(6)
    .required()
    .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .messages({
      "string.empty": "Password is required",
      "string.min": "Password must be atleast 6 characters",
      "string.pattern.base":
        "Password must contain atleast one uppercase letter,one lowercase letter,one number",
    }),
  role: Joi.string()
    .valid("user", "admin")
    .required()
    .default("user")
    .messages({
      "string.valid": "Role must be either user or admin",
      "any.required": "Role is required",
    }),
});


const loginSchema=Joi.object({
    email:Joi.string().email().required().messages({
        "string.empty":"Email is required",
        "string.email":"Please provide a valid email address"
    }),

    password:Joi.string().min(6).pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/).messages({
        "string.empty":"Password is required",
        "string.min":"Password must be atleast 6 characters",
        "string.pattern.base":"Password must contain atleast one uppercase letter, one lowercase letter, one number"
    })
})

module.exports={
    registerSchema,
    loginSchema
}