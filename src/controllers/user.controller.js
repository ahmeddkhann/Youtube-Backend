import { asyncHandler } from "../utils/asyncHandler.js";
import { ApiError } from "../utils/ApiError.js";
import { User } from "../models/user.model.js";
import {uploadOnCloudinary} from "../utils/cloudinary.js"
import { ApiResponse } from "../utils/ApiResponse.js";

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
  console.log(
    "email:",
    email,
    " fullname",
    fullname,
    " password",
    password,
    " username",
    username
  );

  if (
    [username, fullname, email, password].some((field) => field?.trim() === "")
  ) {
    throw new ApiError(400, "All fields are required");
  }

  const existedUser = User.findOne({
    $or: [{ username }, { email }],
  });

  if (existedUser) {
    throw new ApiError(404, "Username or Email already exists");
  }

  const avatarLocalPth = req.files?.avatar[0]?.path
  const coverImageLocalPath = req.files?.avatar[0]?.path;

  if (!avatarLocalPth) {
    throw new ApiError (402, "Avatar file is required")
  }

  const avatar = await uploadOnCloudinary(avatarLocalPth)
  const coverImage = await uploadOnCloudinary(coverImageLocalPath)
  if (!avatar) {
   throw new ApiError(402, "Avatar file is required")
  }
  
  const user = await User.create({
   fullname,
   password,
   email, 
   username: username.toLowerCase(),
   avatar: avatar.url,
   coverImage: coverImage?.url
  })

  const createdUser = await User.findById(user._id).select(
   "-pasword -refreshToken"
  )

  if (!createdUser) {
   throw new ApiError (500, "Something went wrong while registering user")
  }

  return res.status(201).json(
   new ApiResponse(200, createdUser, "User registered Sucessfully")
  )

});

export { registerUser };
