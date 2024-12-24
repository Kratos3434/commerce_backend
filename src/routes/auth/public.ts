import { Router } from 'express';
import { forgotPassword, signin, signup } from '../../controller/auth';

const router = Router();

router.post("/signin", signin);
router.post("/signup", signup);
router.get("/forgot-password/:email", forgotPassword);

export default router;