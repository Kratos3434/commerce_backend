import { Router } from 'express';
import authPublicRoute from './auth/public';

const router = Router();

router.use("/auth", authPublicRoute);

export default router;