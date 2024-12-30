import multer from 'multer';
import multerS3 from 'multer-s3';
import { S3Client } from '@aws-sdk/client-s3';

const s3Config = new S3Client({
    region: 'ca-central-1',
    credentials:{
    accessKeyId: process.env.AWS_ACCESS_KEY_ID as string,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY as string,
   }
});

const upload = multer({
    storage: multerS3({
        s3: s3Config,
        bucket: 'mycommerce',
        metadata: (req, file, cb) => {
            cb(null, { fieldName: file.fieldname });
        },
        key: (req, file, cb) => {
            cb(null, `uploads/${Date.now()}_${file.originalname}`);
        }
    })
});

export default upload;