import { useEffect, useState } from 'react';
import CodeEditor from '../CodeEditor';
import LanguageSelector from '../LanguageSelector';
import Button from '../../../../components/shared/Button';
import './CodePanel.scss';

interface CodePanelProps {
  language?: string;
  starterCode?: string;
  onSubmit: (code: string, language: string) => void;
  submitting?: boolean;
  onPopOut?: () => void;
  compact?: boolean;
  /** Controlled code value — when provided, CodePanel is controlled from parent */
  code?: string;
  /** Callback when code changes — required when `code` is provided */
  onCodeChange?: (code: string) => void;
}

export default function CodePanel({ language: initialLang = 'javascript', starterCode = '', onSubmit, submitting, onPopOut, compact, code: controlledCode, onCodeChange }: CodePanelProps) {
  const isControlled = controlledCode !== undefined;
  const [internalCode, setInternalCode] = useState(starterCode);
  const [language, setLanguage] = useState(initialLang);

  const code = isControlled ? controlledCode : internalCode;
  const setCode = isControlled ? (onCodeChange ?? (() => {})) : setInternalCode;

  // Sync editor when starter code arrives from tool events (uncontrolled mode)
  useEffect(() => {
    if (starterCode && !isControlled) {
      setInternalCode(starterCode);
    }
  }, [starterCode, isControlled]);

  return (
    <div className={`CodePanel${compact ? ' CodePanel--compact' : ''}`}>
      <div className="CodePanel__toolbar">
        <LanguageSelector value={language} onChange={setLanguage} />
        <div className="CodePanel__toolbarActions">
          {onPopOut && (
            <Button size="sm" variant="ghost" onClick={onPopOut}>
              Pop out
            </Button>
          )}
          <Button
            size="sm"
            onClick={() => onSubmit(code, language)}
            loading={submitting}
            disabled={!code.trim()}
          >
            Submit Solution
          </Button>
        </div>
      </div>
      <div className="CodePanel__editor">
        <CodeEditor
          value={code}
          onChange={setCode}
          language={language}
        />
      </div>
    </div>
  );
}
