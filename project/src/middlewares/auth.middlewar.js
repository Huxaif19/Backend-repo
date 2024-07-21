import { ApiError } from "../utils/ApiError.js";
import { asyncHandler } from "../utils/asyncHandler.js";
import jwt from 'jsonwebtoken'
import { User } from "../models/user.model.js";

export const  verifyJwt = asyncHandler(async (req, _ ,next) =>{
   try {
     const token = req.cookies?.accessToken || req.header("Authorization")?.replace("Bearer ", "")
 
     if (!token) throw new ApiError(401 , 'unauthorized request');
 
     const dataDecoded =await jwt.verify(token,process.env.ACCESS_TOKEN_SECRET)
 
 
     const user = await User.findById(dataDecoded?._id).select("-password -refreshToken")   // _id ref from user jwt sign
 
     if (!user) throw new ApiError(401, 'invalid Access Token');
 
     req.user = user;
     next();
   } catch (error) {
    throw new ApiError(401 , error?.message || 'invalid access token');
   }


})
