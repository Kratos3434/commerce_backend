import { Router } from 'express';
import authPrivateRoute from './auth/private';
import { verifyToken } from '../controller/authenticator';

const router = Router();

router.use(verifyToken);

router.use("/auth", authPrivateRoute);

export default router;