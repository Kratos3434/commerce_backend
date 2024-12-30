import express from 'express';
import dotenv from 'dotenv';
import routes from './routes';

dotenv.config();

const HTTP_PORT = 8080;
const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Server entry point is "/dev" change it to however u want based on your needs
app.use("/dev", routes);

app.listen(HTTP_PORT, () => console.log(`Express server running on port ${HTTP_PORT}`));