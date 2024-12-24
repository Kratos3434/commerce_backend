import { Router } from 'express';
import userPrivateRoute from './user/private';
import { verifyToken } from '../controller/authenticator';

const router = Router();

router.use(verifyToken);

router.use("/user", userPrivateRoute);

export default router;