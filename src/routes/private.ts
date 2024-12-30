import { Router } from 'express';

import authPrivateRoute from './auth/private';
import itemPrivateRoute from './item/private';
import userPrivateRoute from './user/private';

import { verifyToken } from '../controller/authenticator';

const router = Router();

router.use(verifyToken);

router.use("/user", userPrivateRoute);
router.use("/auth", authPrivateRoute);
router.use("/item", itemPrivateRoute);

export default router;