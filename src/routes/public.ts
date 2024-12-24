import { Router } from 'express';
import userPublicRoute from './user/public';

const router = Router();

router.use("/user", userPublicRoute);

export default router;