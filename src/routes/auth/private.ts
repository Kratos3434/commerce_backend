import { Router } from 'express';
import { resendOtp, resendPasswordResetLink, resetPassword, verify } from '../../controller/auth';

const router = Router();

router.patch("/verify/:otp", verify);
router.patch("/resend/otp", resendOtp);
router.patch("/reset-password", resetPassword);
router.get("/resend/forgot-password", resendPasswordResetLink);

export default router;