import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import skillRoutes from './routes/skills.js';
import userSkillRoutes from './routes/userSkills.js';
import sessionRoutes from './routes/sessions.js';
import userRoutes from './routes/users.js';
import beltHistoryRoutes from './routes/beltHistory.js';
import progressRoutes from './routes/progress.js';
import socialRoutes from './routes/social.js';
import feedRoutes from './routes/feed.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json({ limit: '2mb' }));

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/user-skills', userSkillRoutes);
app.use('/api/user-skills/:skillId/sessions', sessionRoutes);
app.use('/api/users', userRoutes);
app.use('/api/belt-history', beltHistoryRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/social', socialRoutes);
app.use('/api/feed', feedRoutes);

app.use(errorHandler);

export default app;
