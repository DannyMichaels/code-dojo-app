import Anthropic from '@anthropic-ai/sdk';
import env from '../config/env.js';
import MODELS from '../config/models.js';

let client = null;

export function getClient() {
  if (!client) {
    if (!env.anthropicApiKey) {
      throw new Error('ANTHROPIC_API_KEY is not set');
    }
    client = new Anthropic({ apiKey: env.anthropicApiKey });
  }
  return client;
}

/**
 * Stream a message from Claude, yielding SSE-formatted chunks.
 * Returns the full assistant message content when done.
 */
export async function streamMessage({ model = MODELS.SONNET, system, messages, tools, maxTokens = 4096, onText, onToolUse, onDone }) {
  const client = getClient();

  const params = {
    model,
    max_tokens: maxTokens,
    messages,
  };

  if (system) params.system = system;
  if (tools && tools.length > 0) params.tools = tools;

  const stream = await client.messages.stream(params);

  let fullText = '';
  const toolCalls = [];

  stream.on('text', (text) => {
    fullText += text;
    if (onText) onText(text);
  });

  const response = await stream.finalMessage();

  // Collect tool use blocks
  for (const block of response.content) {
    if (block.type === 'tool_use') {
      toolCalls.push(block);
      if (onToolUse) onToolUse(block);
    }
  }

  if (onDone) onDone({ text: fullText, toolCalls, response });

  return { text: fullText, toolCalls, response };
}
