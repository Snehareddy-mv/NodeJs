const User = require("../models/userModel");
const jwt = require("jsonwebtoken");
const asyncHandler = require("../utils/asyncHandler");
const AppError = require("../utils/AppError");

const getallUsers = asyncHandler(async (req, res) => {
  
  const page=parseInt(req.query.page) || 1;
  const limit=parseInt(req.query.limit) || 10;
  if (req.currentUser.role !== "admin") {
    throw new AppError("Access Denied", 403);
  }

  
  //calculating excluded records
  const skip=(page-1)*limit;

  const users = await User.find().select("-password -refreshToken").skip(skip).limit(limit);

  const totalUsers=await User.countDocuments();

  res.status(200).json({
    success: true,
    message: "Fetched all users",
    page,
    limit,
    totalUsers,
    totalPages:Math.ceil(totalUsers/limit),
    users,
  });
});

const getSingleUser = asyncHandler(async (req, res) => {
  const user = await User.findById(req.params.id).select(
    "-password -refreshToken",
  );

  res.status(200).json({
    success: true,
    message: "Fetched single user",
    user,
  });
});

const updateUser = asyncHandler(async (req, res) => {
  const { name, email, role } = req.body;
  if (role && req.currentUser.role !== "admin") {
    throw new AppError("Access Denied", 403);
  }
  const user = await User.findByIdAndUpdate(
    req.params.id,
    { name, email, role },
    { new: true },
  ).select("-password -refreshToken");

  res.status(200).json({
    success: true,
    message: "User Updated successfully",
    user,
  });
});

const deleteUser = asyncHandler(async (req, res) => {
  if (req.currentUser.role !== "admin") {
    throw new AppError("Access Denied.Only admin can Delete other users", 403);
  }

  if (req.currentUser.id === req.params.id) {
    throw new AppError("You cannot delete your own account", 400);
  }

  const user = await User.findByIdAndDelete(req.params.id);
  if (!user) {
    throw new AppError("User not found", 404);
  }

  res.status(200).json({
    success: true,
    message: "User Deleted successfully",
  });
});

const logout = asyncHandler(async (req, res) => {
  const user = await User.findByIdAndUpdate(req.currentUser.id, {
    refreshToken: null,
  });
  await user.save();
  res
    .status(200)
    .json({ success: true, message: "User Logged Out successfully" });
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const { refreshToken } = req.body;
  if (!refreshToken) {
    throw new AppError("Refresh Token Is Required", 401);
  }

  const decoded = jwt.verify(refreshToken, process.env.JWT_SECRET);
  const user = await User.findById(decoded.id);
  if (!user || user.refreshToken !== refreshToken) {
    throw new AppError("Invalid Refresh Token", 401);
  }

  const newAccessToken = jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_SECRET,
    { expiresIn: "15m" },
  );
  res.status(200).json({ success: true, accessToken: newAccessToken });
});

const updateProfilePicture = asyncHandler(async (req, res) => {
  //file from multer
  if (!req.file) {
    throw new AppError("No Image Uploaded", 404);
  }
  const user = await User.findByIdAndUpdate(
    req.currentUser.id,
    {
      profileImage: req.file.path,
    },
    { new: true },
  ).select("-password -refreshToken");

  res
    .status(200)
    .json({
      success: true,
      message: "Profile Picture Updated Successfully",
      user,
    });
});

module.exports = {
  getallUsers,
  getSingleUser,
  updateUser,
  deleteUser,
  logout,
  refreshAccessToken,
  updateProfilePicture,
};
