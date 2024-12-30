import { addItem } from '../../controller/item';
import upload from '../../multer-config';
import { Router } from 'express';

const router = Router();

router.post("/add", upload.array('photos'), addItem);


export default router;