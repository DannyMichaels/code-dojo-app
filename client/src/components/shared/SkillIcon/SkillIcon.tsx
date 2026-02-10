import { Code } from 'lucide-react';
import './SkillIcon.scss';

/**
 * Maps skill slugs to devicon icon names.
 * Devicon CDN: https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/{name}/{name}-{variant}.svg
 */
const DEVICON_MAP: Record<string, { name: string; variant?: string }> = {
  javascript: { name: 'javascript' },
  typescript: { name: 'typescript' },
  python: { name: 'python' },
  ruby: { name: 'ruby' },
  rust: { name: 'rust', variant: 'original' },
  go: { name: 'go', variant: 'original-wordmark' },
  java: { name: 'java' },
  csharp: { name: 'csharp' },
  cpp: { name: 'cplusplus' },
  c: { name: 'c' },
  php: { name: 'php' },
  swift: { name: 'swift' },
  kotlin: { name: 'kotlin' },
  scala: { name: 'scala' },
  elixir: { name: 'elixir' },
  haskell: { name: 'haskell' },
  clojure: { name: 'clojure' },
  lua: { name: 'lua' },
  r: { name: 'r' },
  dart: { name: 'dart' },
  perl: { name: 'perl' },
  zig: { name: 'zig' },
  ocaml: { name: 'ocaml' },
  erlang: { name: 'erlang' },
  react: { name: 'react' },
  nodejs: { name: 'nodejs' },
  vue: { name: 'vuejs' },
  angular: { name: 'angularjs' },
  sql: { name: 'azuresqldatabase' },
  graphql: { name: 'graphql' },
  css: { name: 'css3' },
  html: { name: 'html5' },
  docker: { name: 'docker' },
  bash: { name: 'bash' },
  git: { name: 'git' },
};

function getDeviconUrl(slug: string): string | null {
  const entry = DEVICON_MAP[slug];
  if (!entry) return null;
  const variant = entry.variant || 'original';
  return `https://cdn.jsdelivr.net/gh/devicons/devicon@latest/icons/${entry.name}/${entry.name}-${variant}.svg`;
}

interface SkillIconProps {
  slug: string;
  size?: number;
}

export default function SkillIcon({ slug, size = 16 }: SkillIconProps) {
  const url = getDeviconUrl(slug);

  if (!url) {
    return <Code size={size} className="SkillIcon SkillIcon--fallback" />;
  }

  return (
    <img
      className="SkillIcon"
      src={url}
      alt=""
      width={size}
      height={size}
      loading="lazy"
    />
  );
}
