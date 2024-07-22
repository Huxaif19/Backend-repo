import { asyncHandler } from "../utils/asyncHandler.js";
import {ApiError} from '../utils/ApiError.js'
import { User } from "../models/user.model.js";
import { uploadOnCloudinary } from "../utils/cloudinary.js";
import jwt from 'jsonwebtoken'
import { ApiResponse } from "../utils/ApiResponse.js";

const generateAcessAndRefreshToken = async (userId)=>{
    try {
        const user = await User.findById(userId)
        const accessToken = user.generateAccessToken()
        const refreshToken = user.generateRefreshToken()


        user.refreshToken = refreshToken;
        await user.save({validateBeforeSave : false});


        return {accessToken, refreshToken}
    } catch (error) {
        throw new ApiError(500,'something went wrong :::: refresh and access token not generated')
    }
}

const registerUser = asyncHandler(async(req,res)=>{
    const {fullname, email, username, password } = req.body
    console.log("email: ", email);
    console.log(req.body);
    if (
        [
            fullname, email, username, password
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
    console.log(req.files)


    const avatarLocalPath = req.files?.avatar[0]?.path;
    // const coverImageLocalPath = req.files?.coverImage[0]?.path;
    let coverImageLocalPath ; 
    if (req.files && Array.isArray(req.files.coverImage)&& req.files.coverImage.length > 0){
        coverImageLocalPath = req.files.coverImage[0].path
    }
    if(!avatarLocalPath) {
        console.log(avatarLocalPath);
        throw new ApiError(400, 'avatar file required')
    };



    const avatar = await uploadOnCloudinary(avatarLocalPath);
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);



    if (!avatar) {throw new ApiError(400,'avatar file is needed')}

    const user = await User.create({
        fullname,
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
        new ApiResponse(200,'user registered successfully',userCreated)
    )
})


const loginUser = asyncHandler(async(req,res)=>{
    const {username,password,email} = req.body;
    if (!(username || password)) throw new ApiError(400,'eamil or username required');

    const user = await User.findOne({
        $or : [{username}, {email}]
    })
    if (!user) throw new ApiError(404,"user doesn't exist");

    const isPasswordValid = await user.isPasswordCorrect(password)

    if(!isPasswordValid) throw new ApiError(401, 'invalid crediantials');

    const {accessToken, refreshToken} = await generateAcessAndRefreshToken(user._id)


    const loggedInUser = await User.findById(user._id).select("-password -refreshToken")  // can update current user object 


    const options = {
        httpOnly : true,
        secure  : true
    }

    return res.status(200).cookie("accessToken", accessToken, options).cookie("refreshToken", refreshToken, options).json(
        new ApiResponse(200,"user logged in successfully",{
            user : loggedInUser,accessToken,refreshToken
        })
    )
})


const logoutUser = asyncHandler(async (req, res)=>{
    await User.findByIdAndUpdate(req.user._id,
        {
            $set : 
            {
                refreshToken : undefined
            },
        }, 
        {
            new : true
        }
    )
    const options = {
        httpOnly : true,
        secure  : true
    }
    return res.status(200).clearCookie("accessToken",options).clearCookie("refreshToken", options).json(
        new ApiResponse(200,"user loggedOut", {})
    );
})

const refreshAccessToken = asyncHandler(async (req, res)=>{
    const incomingRefreshToken = req.cookies.refreshToken || req.body.refreshToken

    if (incomingRefreshToken) throw new ApiError(401, 'unauthorized request');
    try {
        const decodedToken = jwt.verify(
            incomingRefreshToken,
            process.env.REFRESH_TOKEN_SECRET
        )
        const user = await User.findById(decodedToken._id);
        if (!user) throw new ApiError(401, 'invalid refresh token');
    
        if(incomingRefreshToken !== user?.refreshToken){
            throw new ApiError(401, 'refresh token used or expired')
        }
    
    
        const options = {
            httpOnly : true, 
            secure  : true
        }
        const {accessToken,generatedRefreshToken} = await generateAcessAndRefreshToken(user._id);
        return res.status(200).cookie('accessToken', accessToken, options).cookie('refreshToken', generatedRefreshToken,options).json(
            new ApiResponse(200, 'Access token refresh', {
                accessToken, refreshToken : generatedRefreshToken
            })
        )
    } catch (error) {
        throw new ApiError(401, error?.message || 'invalid refresh Token')
    }
})

const changeCurrentPassword = asyncHandler (async(req,res)=>{
    const {oldPassword, newPassword} = req.body;
    console.log(newPassword);
    console.log(oldPassword);
    const user = await User.findById(req.user?._id);
    console.log(user);
    const isPasswordCorrect = await user.isPasswordCorrect(oldPassword); 
    if (!isPasswordCorrect) throw new ApiError(400, 'invalid old password');


    user.password = newPassword;
    await user.save({validateBeforeSave:false})
    return  res.status(200).json(new ApiResponse(200,"password changed", {}))
})

const getCurrentUser = asyncHandler(async (req,res) =>{
    return res.status(200).json(
        new ApiResponse(200, 'user fetched',req.user)
    )
})

const updateAccountDetails = asyncHandler(async(req,res) =>{
    const {fullname,email} = req.body;
    

    if(!(email || fullname)){
        throw new ApiError(400,'all fields requried')
    }


    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                fullname,
                email
            }
        },
        {new : true}  // update and returns
    ).select("-password");

    return res.status(200).json(new ApiResponse(200, 'details updated',user))
})

const updateAvatar = asyncHandler(async(req, res) =>{
    const avatarLocalPath = req.file?.path; 
    if (!avatarLocalPath) throw new ApiError(400,'avatar file is missing');
    const avatar = await uploadOnCloudinary(avatarLocalPath);

    if(!avatar.url) throw new ApiError(400,'error while uploading avatar')

    const user = await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                avatar: avatar.url
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(
        new ApiResponse(200,'avatar image updated successfully',user)
    )
    
})

const updateCoverImage = asyncHandler(async(req, res) =>{
    const coverImageLocalPath = req.file?.path; 
    if (!coverImageLocalPath) throw new ApiError(400,'coverimage file is missing');
    const coverImage = await uploadOnCloudinary(coverImageLocalPath);

    if(!avatar.url) throw new ApiError(400,'error while uploading coverImage')

    const user =  await User.findByIdAndUpdate(
        req.user?._id,
        {
            $set : {
                coverImage: coverImage.url
            }
        },
        {new:true}
    ).select("-password")
    return res.status(200).json(
        new ApiResponse(200,'cover image updated successfully',user)
    )
})


export {
    registerUser,
    loginUser,
    logoutUser,
    refreshAccessToken,
    getCurrentUser,
    changeCurrentPassword,
    updateAvatar,
    updateCoverImage
}