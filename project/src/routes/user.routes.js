import {Router} from 'express'
import { loginUser, logoutUser, registerUser,refreshAccessToken,changeCurrentPassword } from '../controllers/user.controller.js';
import { upload } from '../middlewares/multer.js';
import { verifyJwt } from '../middlewares/auth.middlewar.js';

const router = Router();

router.route('/register').post(
    upload.fields([
        {
            name : "avatar", 
            maxCount : 1
        },
        {
            name : "coverImage", 
            maxCount : 1
        }
    ]),
    registerUser
)


router.route('/login').post(
    loginUser
);

router.route('/logout').post(verifyJwt,logoutUser);

router.route('/refresh-Token').post(refreshAccessToken);
router.route('/resetPassword').post(changeCurrentPassword)

export default router