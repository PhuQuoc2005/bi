import express from 'express';
import { config } from 'dotenv';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import fileUpload from 'express-fileupload';

import { createTables } from './utils/createTable.js';
import routes from './routes/routes.js';
import productRoutes from './routes/productRoutes.js';

const app = express();

config({ path: './config/config.env' });

app.use(cors({
    origin: [process.env.FRONTEND_URL, process.env.DASHBOARD_URL],
    methods: ['GET', 'POST', 'PUT', 'DELETE'],
    credentials: true,
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

//Mount routes
app.use('/api/products', productRoutes);

app.use(fileUpload({
    tempFileDir: './uploads',
    useTempFiles: true,
}));

routes(app);

createTables();

export default app;