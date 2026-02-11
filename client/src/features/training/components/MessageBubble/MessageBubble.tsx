import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import type { SessionMessage } from '../../types/session.types';
import './MessageBubble.scss';

interface MessageBubbleProps {
  message: SessionMessage;
}

/** Ensure markdown block elements have a blank line before them so they parse correctly. */
function fixMarkdown(text: string): string {
  // Fix musical sharps split across lines: "F\n#" or "F\n\n#" → "F# "
  // This prevents the # from being parsed as a markdown heading.
  let fixed = text.replace(/([A-Ga-g])\s*\n+\s*#/g, '$1#');

  // Escape sharp signs in musical context on the same line (e.g. "F#", "C#4")
  // so they aren't parsed as headings when they land at the start of a line.
  // Uses negative lookbehind for backtick to avoid mangling inline code.
  fixed = fixed.replace(/(?<!`)([A-Ga-g])#/g, '$1♯');

  // Ensure real markdown headings have a blank line before them
  fixed = fixed.replace(/([^\n])\n?(#{1,6}\s)/g, '$1\n\n$2');

  return fixed;
}

export default function MessageBubble({ message }: MessageBubbleProps) {
  return (
    <div className={`MessageBubble MessageBubble--${message.role}`}>
      <div className="MessageBubble__label">
        {message.role === 'user' ? 'You' : 'Sensei'}
      </div>
      <div className="MessageBubble__content">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {fixMarkdown(message.content)}
          </ReactMarkdown>
      </div>
    </div>
  );
}
