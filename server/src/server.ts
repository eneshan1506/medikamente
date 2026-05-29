import 'dotenv/config';
import cookieParser from 'cookie-parser';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth';
import { medicationRouter } from './routes/medications';
import { doseRouter } from './routes/doses';
import { pushRouter } from './routes/push';
import { errorHandler } from './middleware/error';
import { startScheduler } from './application/pushScheduler';

const app = express();
const port = Number(process.env.PORT ?? 8787);
app.set('trust proxy', 1);

app.use(helmet());
app.use(
  cors({
    origin: process.env.CLIENT_ORIGIN?.split(',') ?? ['http://localhost:5173'],
    credentials: true
  })
);
app.use(express.json());
app.use(cookieParser());
app.use(
  rateLimit({
    windowMs: 60_000,
    limit: 120,
    standardHeaders: true,
    legacyHeaders: false
  })
);

app.get('/api/health', (_req, res) => res.json({ ok: true }));
app.use('/api/auth', authRouter);
app.use('/api/medications', medicationRouter);
app.use('/api/doses', doseRouter);
app.use('/api/push', pushRouter);
app.use(errorHandler);

startScheduler();

app.listen(port, () => {
  // eslint-disable-next-line no-console
  console.log(`API listening on ${port}`);
});
