const AppError = require("../utils/AppError");

const validate = (schema) => (req, res, next) => {
  const { error, value } = schema.validate(req.body);
  if (error) {
   
    const errors=error.details.map(detail=>detail.message);
    return res.status(400).json({
        success:false,
        message:"Validation Failed",
        errors
    })
  }
req.body = value;
  next();

 
};
module.exports = validate;
