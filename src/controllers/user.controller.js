import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";
import jwt from "jsonwebtoken";
import mongoose from "mongoose";

const generateAccessandRefreshTokens = async (userId) => {
  try {
    const user = await User.findById(userId);
    const accessToken = user.generateAccessToken();
    const refreshToken = user.generateRefreshToken();

    user.refreshToken = refreshToken;
    await user.save({ ValidateBeforeSave: false });

    return { accessToken, refreshToken };
  } catch (error) {
    throw new ApiError(
      500,
      "Something went wrong while generating access and refresh tokens "
    );
  }
};

const registerUser = asyncHandler(async (req, res) => {
  //   STEPS FOR GETTING USER DATA FOR THIS APPLICATION

  //1. Get user details from frontend
  //2. validation - not empty
  //3. check if user already exists: username, email
  //4. check for images, check for avatar,
  //5. upload them to cloudianry, avatar
  //6. create user object - create entry in db
  //7. remove password and refresh token field from response
  //8. check for user creation
  //9. retuurn response

  const { fullname, email, password, username } = req.body;
  //   console.log(
  //     "email:",
  //     email,
  //     " fullname",
  //     fullname,
  //     " password",
  //     password,
  //     " username",
  //     username
  //   );

  if (
    [username, fullname, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(404, "Username or Email already exists");
  }

  const avatarLocalPth = req.files?.avatar[0]?.path;

  let coverImageLocalPath;
  if (
    req.files &&
    Array.isArray(req.files.coverImage) &&
    req.files.coverImage.length > 0
  ) {
    coverImageLocalPath = req.files.coverImage[0].path;
  }

  if (!avatarLocalPth) {
    throw new ApiError(402, "Avatar file is required");
  }

  const avatar = await uploadOnCloudinary(avatarLocalPth);
  const coverImage = await uploadOnCloudinary(coverImageLocalPath);
  if (!avatar) {
    throw new ApiError(402, "Avatar file is required");
  }

  const user = await User.create({
    fullname,
    password,
    email,
    username: username.toLowerCase(),
    avatar: avatar.url,
    coverImage: coverImage?.url,
  });

  const createdUser = await User.findById(user._id).select(
    "-pasword -refreshToken"
  );

  if (!createdUser) {
    throw new ApiError(500, "Something went wrong while registering user");
  }

  return res
    .status(201)
    .json(new ApiResponse(200, createdUser, "User registered Sucessfully"));
});

const loginUser = asyncHandler(async (req, res) => {
  // STEPS FOR LOGIN OF A USER
  // 1. REQ BODY -> DATA
  // 2. USERNAME OR EMAIL
  //3. FIND THE USER
  //4. PASSWORD CHECK
  //5. ACCESS AND REFRESH TOKEN
  //6. SEND COOKIE

  const { username, email, password } = req.body;

  if (!username || !email) {
    throw new ApiError(400, "Email or Username must required");
  }

  const user = await User.findOne({
    $or: [{ username }, { email }],
  });

  if (!user) {
    throw new ApiError(404, "User does not exists");
  }

  const isPasswordValid = await user.isPasswordCorrect(password);

  if (!isPasswordValid) {
    throw new ApiError(401, "Invalid Password!");
  }

  const { accessToken, refreshToken } = await generateAccessandRefreshTokens(
    user._id
  );

  const loggedInUser = await User.findById(user._id).select(
    "-password -refreshToken"
  );

  const options = {
    httponly: true,
    secure: true,
  };

  return res.status
    .cookie("AccessToken", accessToken, options)
    .cookie("refreshToken", refreshToken, options)
    .json(
      new ApiResponse(
        200,
        {
          user: loggedInUser,
          accessToken,
          refreshToken,
        },
        "User LoggedIn Successfuly"
      )
    );
});

const logoutUser = asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.user._id, {
    $set: {
      refreshToken: undefined,
    },
  });

  const options = {
    httponly: true,
    secure: true,
  };
  return res
    .status(200)
    .clearCookie("accessToken", options)
    .clearCookie("refreshToken", options)
    .json(new ApiResponse(200, {}, "User LoggedOut Sucessfully"));
});

const refreshAccessToken = asyncHandler(async (req, res) => {
  const incomingRefreshToken =
    req.cookies.refreshToken || req.body.refreshToken;
  if (!incomingRefreshToken) {
    throw new ApiError(401, "Unauthorized Request");
  }

  try {
    const decodedToken = jwt.verify(
      incomingRefreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decodedToken?._id);
    if (!user) {
      throw new ApiError(402, "Invalid Refresh Token");
    }

    if (incomingRefreshToken !== user?.refreshToken) {
      throw new ApiError(402, "Refresh Token is used or expired");
    }

    const options = {
      httponly: true,
      secure: true,
    };
    const { accessToken, newRefreshToken } =
      await generateAccessandRefreshTokens(user._id);

    return res
      .status(200)
      .cookie("accessToken", accessToken, options)
      .cookie("refreshToken", refreshToken, options)
      .json(
        new ApiResponse(
          200,
          { accessToken, accessToken: newRefreshToken },
          "Access Token and Refresh Token generated successfully"
        )
      );
  } catch (error) {
    throw new ApiError(401, error?.message || "Invalid Refresh Token");
  }
});

const changeCurrentPassword = asyncHandler(async (req, res) => {
  const { oldPassword, newPassword, confirmPassword } = req.body;
  const user = await User.findById(req.user._id);
  const isPasswordCorrect = await user.isPasswordCorrect(oldPassword);

  if (!(newPassword === confirmPassword)) {
    throw new ApiError(400, "Passwords do not match");
  }
  if (!isPasswordCorrect) {
    throw new ApiError(400, "Invalid Old password");
  }

  user.password = newPassword;
  await user.save(ValidateBeforeSave);

  return res
    .status(200)
    .json(new ApiResponse(200, {}, "Password changed successfully"));
});

const getCurrentUser = asyncHandler(async (req, res) => {
  return res
    .status(200)
    .json(new 200, req.user, "Current user fetched successfully");
});

const updateAccountDetails = asyncHandler(async (req, res) => {
  const { fullname, email } = req.body;

  if (!fullname || !email) {
    throw new ApiError(400, "All fields are required");
  }
  User.findByIdAndUpdate(
    req.user?._id,
     {
      $set: {
        fullname,
         email
      }
     },
      { new: true }
    ).select("-password");

    return res
    .status(200)
    .json(new ApiResponse(200, user, "Account details updated successfully"))
});

const updateUserAvatar = asyncHandler(async(req, res)=> {

  const avatarLocalPth = req.file?.path

  if(!avatarLocalPth){
    throw new ApiError(400, "Avatar file is missing")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPth)

  if(!avatar.url){
    throw new ApiError (400, "Error while uploading on avatar")
  }
 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set: {
          avatar: avatar.url
        }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse,
    {message: "Cover Image updated successfully"})
})

const updateUserCoverImage = asyncHandler(async(req, res)=> {

  const coverImageLocalPath = req.file?.path

  if(!coverImageLocalPath){
    throw new ApiError(400, "Cover Image file is missing")
  }

  const coverImage = await uploadOnCloudinary(coverImageLocalPath)

  if(!coverImage.url){
    throw new ApiError (400, "Error while uploading on avatar")
  }
 const user = await User.findByIdAndUpdate(
    req.user?._id,
    {
        $set: {
          coverImage: coverImage.url
        }
    },
    {new: true}
  ).select("-password")

  return res
  .status(200)
  .json(
    new ApiResponse,
    {message: "Cover Image updated successfully"})
})

const getUserChannelProfile = asyncHandler(async (req, res) => {

  const {username} = req.params
   
  if (!username.trim()) {
    throw new ApiError(400, "Username is missing")
  }

 const channel = await User.aggregate([
  {
    $match: {
      username: username?.toLowerCase()
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "channel",
      as: "subscribers"
    }
  },
  {
    $lookup: {
      from: "subscriptions",
      localField: "_id",
      foreignField: "subscriber",
      as: "subscribedTo"
    }
  },
  {
    $addFields: {
      subscribersCount: {
        $size: "$subscribers"
      },
      channelsSubscribedToCount: {
        $size: "subscribedTo"
      },
      isSubscribed: {
        $cond: {
          if: {$in: [req.user?._id, "$subscribers.subscriber"]},
          then: true,
          else: false
        }
      }
    }
  },
  {
    $project: {
      fullname: 1,
      username: 1,
      subscribersCount: 1,
      channelsSubscribedToCount: 1,
      isSubscribed: 1,
      avatar: 1,
      coverImage: 1,
      email: 1
    }
  }
 ])

 if(!channel?.length){
  throw new ApiError (404, "channel does not exists")
 }

 return res
 .status(200)
 .json(
  new ApiResponse(200, channel[0], "User channel fetched successfully")
 )
})

const getWatchHistory = asyncHandler(async(req, res)=> {
  const user = await User.aggregate([
    {  
      $match: {
      _id: new mongoose.Types.ObjectId(req.user?._id)

    }
  },
  {
    $lookup: {
      from: "videos",
      localField: "watchHistory",
      foreignField: "_id",
      as: "watchHistory",
      pipeline: [
        {
          $lookup: {
            from: "users",
            localField: "owner",
            foreignField: "_id",
            as: "owner",
            pipeline: [
              {
                $project: {
                  fullname: 1,
                  username: 1,
                  avatar: 1
                }
              }
            ]
          }
        },
        {
          $addFields: {
            owner: {
              $first: "$owner"
            }
          }
        }
      ]
    }
  }
  ])
  return res
  .status(200)
  .json(
    new ApiResponse (200, 
      user[0].watchHistory,
      "Watch history fetched successfully"
    )
  )
})


export {
  registerUser,
  loginUser,
  logoutUser,
  refreshAccessToken,
  changeCurrentPassword,
  getCurrentUser,
  updateAccountDetails,
  updateUserAvatar,
  updateUserCoverImage,
  getUserChannelProfile,
  getWatchHistory
};
