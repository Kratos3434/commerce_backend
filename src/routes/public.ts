import { Router } from 'express';
import authPublicRoute from './auth/public';
import itemPublicRoute from './item/public';

const router = Router();

router.use("/auth", authPublicRoute);
router.use("/item", itemPublicRoute);

export default router;