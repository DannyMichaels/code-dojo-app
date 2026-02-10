import { useEffect, useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { getBeltInfo, getBeltAnalysis, promoteBelt } from '../../../progress/services/progress.service';
import type { BeltInfo } from '../../../progress/types/progress.types';
import Button from '../../../../components/shared/Button';
import Spinner from '../../../../components/shared/Spinner';
import './BeltInfoModal.scss';

interface BeltInfoModalProps {
  open: boolean;
  onClose: () => void;
  skillId: string;
  onBeltChange?: () => void;
}

const BELT_COLORS: Record<string, string> = {
  white: '#f0f0f0',
  yellow: '#ffd700',
  orange: '#ff8c00',
  green: '#2ecc71',
  blue: '#3498db',
  purple: '#9b59b6',
  brown: '#8b4513',
  black: '#1a1a2e',
};

export default function BeltInfoModal({ open, onClose, skillId, onBeltChange }: BeltInfoModalProps) {
  const [info, setInfo] = useState<BeltInfo | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [analysisLoading, setAnalysisLoading] = useState(false);
  const [aiReadyForPromotion, setAiReadyForPromotion] = useState(false);
  const [promoting, setPromoting] = useState(false);
  const [promoted, setPromoted] = useState<{ fromBelt: string; toBelt: string } | null>(null);

  useEffect(() => {
    if (!open) return;
    let cancelled = false;

    async function load() {
      setLoading(true);
      setError(null);
      setAnalysis(null);
      setAnalysisLoading(true);
      setAiReadyForPromotion(false);
      setPromoted(null);
      try {
        const data = await getBeltInfo(skillId);
        if (!cancelled) setInfo(data);
      } catch {
        if (!cancelled) setError('Failed to load belt info');
      } finally {
        if (!cancelled) setLoading(false);
      }

      // Load AI analysis in parallel (non-blocking)
      try {
        const data = await getBeltAnalysis(skillId);
        if (!cancelled) {
          setAnalysis(data.analysis);
          setAiReadyForPromotion(data.readyForPromotion);
        }
      } catch {
        // Graceful degradation — just don't show analysis
      } finally {
        if (!cancelled) setAnalysisLoading(false);
      }
    }

    load();
    return () => { cancelled = true; };
  }, [open, skillId]);

  const handlePromote = async () => {
    setPromoting(true);
    try {
      const result = await promoteBelt(skillId);
      setPromoted(result);
      onBeltChange?.();
    } catch {
      setError('Promotion failed — please try again');
    } finally {
      setPromoting(false);
    }
  };

  if (!open) return null;

  const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

  return (
    <div className="BeltInfoModal__overlay" onClick={onClose}>
      <div className="BeltInfoModal" onClick={e => e.stopPropagation()}>
        <h3 className="BeltInfoModal__title">Belt Progression</h3>

        {loading && (
          <div className="BeltInfoModal__loading">
            <Spinner size="md" />
          </div>
        )}

        {error && <p className="BeltInfoModal__error">{error}</p>}

        {info && !loading && (
          <>
            <div className="BeltInfoModal__journey">
              {info.beltOrder.map((belt, idx) => (
                <div
                  key={belt}
                  className={`BeltInfoModal__belt ${idx <= info.currentBeltIndex ? 'BeltInfoModal__belt--achieved' : ''} ${idx === info.currentBeltIndex ? 'BeltInfoModal__belt--current' : ''}`}
                >
                  <span
                    className="BeltInfoModal__beltDot"
                    style={{ backgroundColor: BELT_COLORS[belt] }}
                  />
                  <span className="BeltInfoModal__beltName">{capitalize(belt)}</span>
                </div>
              ))}
            </div>

            {info.nextBelt ? (
              <div className="BeltInfoModal__requirements">
                <h4>
                  Next: {capitalize(info.nextBelt)} Belt
                  {info.eligible && <span className="BeltInfoModal__ready"> — Ready!</span>}
                </h4>

                <div className="BeltInfoModal__req">
                  <div className="BeltInfoModal__reqHeader">
                    <span>Concept Mastery</span>
                    <span>{info.details.conceptPct}% / {info.details.requiredPct}%</span>
                  </div>
                  <div className="BeltInfoModal__bar">
                    <div
                      className="BeltInfoModal__fill"
                      style={{ width: `${Math.min(100, (info.details.conceptPct / info.details.requiredPct) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="BeltInfoModal__req">
                  <div className="BeltInfoModal__reqHeader">
                    <span>Sessions</span>
                    <span>{info.details.sessionCount} / {info.details.requiredSessions}</span>
                  </div>
                  <div className="BeltInfoModal__bar">
                    <div
                      className="BeltInfoModal__fill"
                      style={{ width: `${Math.min(100, (info.details.sessionCount / info.details.requiredSessions) * 100)}%` }}
                    />
                  </div>
                </div>

                <div className="BeltInfoModal__req">
                  <div className="BeltInfoModal__reqHeader">
                    <span>Concepts Tracked</span>
                    <span>{info.details.totalConcepts} / {info.details.requiredConcepts}</span>
                  </div>
                  <div className="BeltInfoModal__bar">
                    <div
                      className="BeltInfoModal__fill"
                      style={{ width: `${Math.min(100, (info.details.totalConcepts / info.details.requiredConcepts) * 100)}%` }}
                    />
                  </div>
                </div>

                <p className="BeltInfoModal__masteredNote">
                  {info.details.masteredConcepts} of {info.details.totalConcepts} concepts mastered ({'>'}0.8)
                </p>

                {promoted ? (
                  <div className="BeltInfoModal__promoted">
                    Promoted to {capitalize(promoted.toBelt)} belt!
                  </div>
                ) : aiReadyForPromotion && info.nextBelt && (
                  <Button
                    onClick={handlePromote}
                    loading={promoting}
                  >
                    Promote to {capitalize(info.nextBelt)} Belt
                  </Button>
                )}
              </div>
            ) : (
              <p className="BeltInfoModal__maxBelt">You've reached the highest belt!</p>
            )}
          </>
        )}

        <div className="BeltInfoModal__analysis">
          <h4 className="BeltInfoModal__analysisTitle">AI Analysis</h4>
          {analysisLoading && (
            <div className="BeltInfoModal__analysisLoading">
              <Spinner size="sm" />
              <span>Generating analysis...</span>
            </div>
          )}
          {analysis && !analysisLoading && (
            <div className="BeltInfoModal__analysisContent">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{analysis}</ReactMarkdown>
            </div>
          )}
        </div>

        <div className="BeltInfoModal__actions">
          <Button variant="ghost" onClick={onClose}>Close</Button>
        </div>
      </div>
    </div>
  );
}
