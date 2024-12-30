import { Router } from 'express';
import { getProfileByToken } from '../../controller/user';

const router = Router();

router.get("/profile", getProfileByToken);

export default router;