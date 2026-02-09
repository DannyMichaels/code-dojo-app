import MODELS from '../config/models.js';

const SKILL_MAP = {
  // JavaScript variants
  'js': { name: 'JavaScript', slug: 'javascript' },
  'javascript': { name: 'JavaScript', slug: 'javascript' },
  'vanilla js': { name: 'JavaScript', slug: 'javascript' },
  'es6': { name: 'JavaScript', slug: 'javascript' },
  'ecmascript': { name: 'JavaScript', slug: 'javascript' },

  // TypeScript
  'ts': { name: 'TypeScript', slug: 'typescript' },
  'typescript': { name: 'TypeScript', slug: 'typescript' },

  // Python
  'python': { name: 'Python', slug: 'python' },
  'python3': { name: 'Python', slug: 'python' },
  'py': { name: 'Python', slug: 'python' },

  // Ruby
  'ruby': { name: 'Ruby', slug: 'ruby' },
  'rb': { name: 'Ruby', slug: 'ruby' },

  // Rust
  'rust': { name: 'Rust', slug: 'rust' },
  'rs': { name: 'Rust', slug: 'rust' },

  // Go
  'go': { name: 'Go', slug: 'go' },
  'golang': { name: 'Go', slug: 'go' },

  // Java
  'java': { name: 'Java', slug: 'java' },

  // C#
  'c#': { name: 'C#', slug: 'csharp' },
  'csharp': { name: 'C#', slug: 'csharp' },
  'c sharp': { name: 'C#', slug: 'csharp' },

  // C++
  'c++': { name: 'C++', slug: 'cpp' },
  'cpp': { name: 'C++', slug: 'cpp' },

  // C
  'c': { name: 'C', slug: 'c' },

  // SQL
  'sql': { name: 'SQL', slug: 'sql' },
  'mysql': { name: 'SQL', slug: 'sql' },
  'postgresql': { name: 'SQL', slug: 'sql' },
  'postgres': { name: 'SQL', slug: 'sql' },
  'sqlite': { name: 'SQL', slug: 'sql' },

  // React
  'react': { name: 'React', slug: 'react' },
  'react js': { name: 'React', slug: 'react' },
  'reactjs': { name: 'React', slug: 'react' },
  'react.js': { name: 'React', slug: 'react' },

  // Node.js
  'node': { name: 'Node.js', slug: 'nodejs' },
  'nodejs': { name: 'Node.js', slug: 'nodejs' },
  'node.js': { name: 'Node.js', slug: 'nodejs' },
  'node js': { name: 'Node.js', slug: 'nodejs' },

  // PHP
  'php': { name: 'PHP', slug: 'php' },

  // Swift
  'swift': { name: 'Swift', slug: 'swift' },

  // Kotlin
  'kotlin': { name: 'Kotlin', slug: 'kotlin' },
  'kt': { name: 'Kotlin', slug: 'kotlin' },

  // Scala
  'scala': { name: 'Scala', slug: 'scala' },

  // Elixir
  'elixir': { name: 'Elixir', slug: 'elixir' },
  'ex': { name: 'Elixir', slug: 'elixir' },

  // Haskell
  'haskell': { name: 'Haskell', slug: 'haskell' },
  'hs': { name: 'Haskell', slug: 'haskell' },

  // Clojure
  'clojure': { name: 'Clojure', slug: 'clojure' },
  'clj': { name: 'Clojure', slug: 'clojure' },

  // Lua
  'lua': { name: 'Lua', slug: 'lua' },

  // R
  'r': { name: 'R', slug: 'r' },
  'rlang': { name: 'R', slug: 'r' },

  // Dart
  'dart': { name: 'Dart', slug: 'dart' },
  'flutter': { name: 'Dart', slug: 'dart' },

  // Vue
  'vue': { name: 'Vue', slug: 'vue' },
  'vuejs': { name: 'Vue', slug: 'vue' },
  'vue.js': { name: 'Vue', slug: 'vue' },
  'vue js': { name: 'Vue', slug: 'vue' },

  // Angular
  'angular': { name: 'Angular', slug: 'angular' },
  'angularjs': { name: 'Angular', slug: 'angular' },

  // Docker
  'docker': { name: 'Docker', slug: 'docker' },

  // Bash/Shell
  'bash': { name: 'Bash', slug: 'bash' },
  'shell': { name: 'Bash', slug: 'bash' },
  'sh': { name: 'Bash', slug: 'bash' },
  'zsh': { name: 'Bash', slug: 'bash' },

  // CSS
  'css': { name: 'CSS', slug: 'css' },
  'css3': { name: 'CSS', slug: 'css' },
  'scss': { name: 'CSS', slug: 'css' },
  'sass': { name: 'CSS', slug: 'css' },

  // HTML
  'html': { name: 'HTML', slug: 'html' },
  'html5': { name: 'HTML', slug: 'html' },

  // GraphQL
  'graphql': { name: 'GraphQL', slug: 'graphql' },
  'gql': { name: 'GraphQL', slug: 'graphql' },

  // Regex
  'regex': { name: 'Regular Expressions', slug: 'regex' },
  'regexp': { name: 'Regular Expressions', slug: 'regex' },
  'regular expressions': { name: 'Regular Expressions', slug: 'regex' },

  // Zig
  'zig': { name: 'Zig', slug: 'zig' },

  // OCaml
  'ocaml': { name: 'OCaml', slug: 'ocaml' },

  // Erlang
  'erlang': { name: 'Erlang', slug: 'erlang' },

  // Perl
  'perl': { name: 'Perl', slug: 'perl' },
};

/**
 * Try to normalize a skill name using the local mapping.
 * Returns { name, slug } or null if not found.
 */
export function normalizeLocal(query) {
  const key = query.toLowerCase().trim();
  return SKILL_MAP[key] || null;
}

/**
 * Fallback: use Claude Haiku to normalize an unknown skill name.
 * Returns { name, slug, ambiguous }.
 * Throws on failure — caller should handle.
 */
export async function normalizeWithAI(query, anthropicClient) {
  const response = await anthropicClient.messages.create({
    model: MODELS.HAIKU,
    max_tokens: 200,
    messages: [
      {
        role: 'user',
        content: `You are a programming skill normalizer. Given a user query, return the canonical name and URL-safe slug for the programming language, framework, or technology they mean.

Query: "${query}"

Respond with ONLY valid JSON (no markdown):
{"name": "Canonical Name", "slug": "lowercase-slug", "ambiguous": false}

If the query is ambiguous (could mean multiple things), set ambiguous to true and pick the most likely match. If it's not a recognizable programming skill, respond with:
{"name": null, "slug": null, "ambiguous": false}`,
      },
    ],
  });

  const text = response.content[0].text.trim();
  return JSON.parse(text);
}

/**
 * Normalize a skill query: try local map first, then AI fallback.
 * Throws if AI is needed but unavailable.
 */
export async function normalize(query, anthropicClient) {
  const local = normalizeLocal(query);
  if (local) return { ...local, ambiguous: false };

  if (!anthropicClient) {
    throw new Error('AI service unavailable — cannot normalize unknown skill. Please try a common skill name.');
  }

  return normalizeWithAI(query, anthropicClient);
}
