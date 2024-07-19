import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import { ApiResponse } from "../utils/ApiResponse.js";

const registerUser = asyncHandler(async(req,res)=>{
    const {fullName, email, username, password } = req.body
    console.log("email: ", email);
    if (
        [
            fullName, email, username, password
        ].some((field)=> field ?.trim() === "")
    ){
        throw new ApiError (400, 'all fileds are required')
    }
    const existedUser = await User.findOne({
        $or : [{username} , {email}]
    })
    if (existedUser) {
        throw new ApiError(409,"email or password already taken")
    }


    const avatarLocalPath = req.files?.avatar[0]?.path;
    const coverImageLocalPath = req.files?.coverImage[0]?.path;
    if(!avatarLocalPath) {
        console.log(avatarLocalPath);
        throw new ApiError(400, 'avatar file required')
    };



    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if (!avatar) {throw new ApiError(400,'avatar file is needed')}

    const user = await User.create({
        fullName,
        avatar : avatar.url,
        coverImage : coverImage?.url || "",
        email,
        password,
        username : username.toLowerCase()
    })

    const userCreated = await User.findById(user._id).select(
        "-password -refreshToken"
    )

    if (!userCreated){ throw new ApiError(500, 'Something went wrong while user regrestration')}
    
    return res.status(201).json(
        new ApiResponse(200,userCreated,'user registered successfully')
    )
})


export {registerUser}