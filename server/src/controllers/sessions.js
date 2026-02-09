import Session from '../models/Session.js';
import UserSkill from '../models/UserSkill.js';
import SkillCatalog from '../models/SkillCatalog.js';
import { buildSystemPrompt } from '../services/promptBuilder.js';
import { streamMessage } from '../services/anthropic.js';

// GET /api/user-skills/:skillId/sessions
export async function listSessions(req, res, next) {
  try {
    const { skillId } = req.params;

    // Verify ownership
    const skill = await UserSkill.findOne({ _id: skillId, userId: req.userId });
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const sessions = await Session.find({ skillId, userId: req.userId })
      .select('-messages')
      .sort({ date: -1 })
      .limit(50)
      .lean();

    res.json({ sessions });
  } catch (err) {
    next(err);
  }
}

// POST /api/user-skills/:skillId/sessions
export async function createSession(req, res, next) {
  try {
    const { skillId } = req.params;
    const { type } = req.body;

    // Verify ownership
    const skill = await UserSkill.findOne({ _id: skillId, userId: req.userId });
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    const session = await Session.create({
      skillId,
      userId: req.userId,
      type: type || 'training',
    });

    res.status(201).json({ session });
  } catch (err) {
    next(err);
  }
}

// GET /api/user-skills/:skillId/sessions/:sid
export async function getSession(req, res, next) {
  try {
    const session = await Session.findOne({
      _id: req.params.sid,
      skillId: req.params.skillId,
      userId: req.userId,
    }).lean();

    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }

    res.json({ session });
  } catch (err) {
    next(err);
  }
}

// POST /api/user-skills/:skillId/sessions/:sid/messages — SSE streaming
export async function sendMessage(req, res, next) {
  try {
    const { skillId, sid } = req.params;
    const { content } = req.body;

    // Load session
    const session = await Session.findOne({
      _id: sid,
      skillId,
      userId: req.userId,
    });
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    if (session.status !== 'active') {
      return res.status(400).json({ error: 'Session is not active' });
    }

    // Load skill + catalog for prompt building
    const userSkill = await UserSkill.findById(skillId);
    const skillCatalog = await SkillCatalog.findById(userSkill.skillCatalogId);

    // Add user message to session
    session.messages.push({ role: 'user', content });
    await session.save();

    // Build system prompt
    const systemPrompt = buildSystemPrompt({
      skillCatalog,
      userSkill,
      sessionType: session.type,
    });

    // Build messages array from session history
    const messages = session.messages.map(m => ({
      role: m.role === 'system' ? 'user' : m.role,
      content: m.content,
    }));

    // Set up SSE
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no',
    });

    let fullResponse = '';

    try {
      await streamMessage({
        system: systemPrompt,
        messages,
        maxTokens: 4096,
        onText: (text) => {
          fullResponse += text;
          res.write(`data: ${JSON.stringify({ type: 'text', content: text })}\n\n`);
        },
        onToolUse: (toolCall) => {
          res.write(`data: ${JSON.stringify({ type: 'tool_use', tool: toolCall.name, input: toolCall.input })}\n\n`);
        },
        onDone: () => {
          res.write(`data: ${JSON.stringify({ type: 'done' })}\n\n`);
        },
      });

      // Save assistant message
      session.messages.push({ role: 'assistant', content: fullResponse });
      await session.save();
    } catch (streamErr) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: streamErr.message })}\n\n`);
    }

    res.end();
  } catch (err) {
    // If headers already sent, can't use normal error handling
    if (res.headersSent) {
      res.write(`data: ${JSON.stringify({ type: 'error', error: err.message })}\n\n`);
      res.end();
    } else {
      next(err);
    }
  }
}
