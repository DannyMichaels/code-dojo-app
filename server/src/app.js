import express from 'express';
import cors from 'cors';
import authRoutes from './routes/auth.js';
import skillRoutes from './routes/skills.js';
import userSkillRoutes from './routes/userSkills.js';
import sessionRoutes from './routes/sessions.js';
import errorHandler from './middleware/errorHandler.js';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/skills', skillRoutes);
app.use('/api/user-skills', userSkillRoutes);
app.use('/api/user-skills/:skillId/sessions', sessionRoutes);

app.use(errorHandler);

export default app;
