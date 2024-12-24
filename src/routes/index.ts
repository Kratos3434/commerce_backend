import { Router } from 'express';
import publicRoutes from './public';
import privateRoutes from './private';

const router = Router();

router.use("/public", publicRoutes);
router.use("/private", privateRoutes);

router.get("/test", (req, res) => {
    res.send("This route is properly working");
})

export default router;