export type DiagnosticLevel = 'error' | 'warning';

export type Diagnostic = {
  level: DiagnosticLevel;
  message: string;
};

const VOID_TAGS = new Set([
  'area',
  'base',
  'br',
  'col',
  'embed',
  'hr',
  'img',
  'input',
  'link',
  'meta',
  'param',
  'source',
  'track',
  'wbr',
]);

const KNOWN_CLASSES = [
  'root-banner-wrap',
  'banner-item-wide',
  'left',
  'right',
  'labels',
  'label-text',
  'label-ad',
  'titles',
  'title',
  'headline',
  'subtitle',
  'period',
];

const NAMED_COLORS = new Set([
  'black',
  'white',
  'red',
  'blue',
  'green',
  'navy',
  'teal',
  'aqua',
  'gray',
  'grey',
  'silver',
  'maroon',
  'purple',
  'fuchsia',
  'lime',
  'olive',
  'yellow',
  'orange',
  'transparent',
  'inherit',
  'currentcolor',
  'none',
  'initial',
  'unset',
]);

const TAG_RE =
  /<!--[\s\S]*?-->|<\/?([a-zA-Z][\w:-]*)([^>]*?)(\/)?>/g;

export function diagnoseBannerHtml(html: string): Diagnostic[] {
  const diagnostics: Diagnostic[] = [];
  if (html.trim() === '') {
    diagnostics.push({
      level: 'warning',
      message: 'HTML이 비어 있습니다. 어드민에 넣을 배너 HTML을 붙여 넣으세요.',
    });
    return diagnostics;
  }

  diagnostics.push(...findTagIssues(html));
  diagnostics.push(...findColorIssues(html));
  diagnostics.push(...findClassTypos(html));
  diagnostics.push(...findStructureHints(html));

  return diagnostics;
}

function findTagIssues(html: string): Diagnostic[] {
  const issues: Diagnostic[] = [];
  const stack: string[] = [];

  TAG_RE.lastIndex = 0;
  let match: RegExpExecArray | null;
  while ((match = TAG_RE.exec(html)) !== null) {
    if (match[0].startsWith('<!--')) continue;

    const tag = match[1].toLowerCase();
    const isClose = match[0].startsWith('</');
    const selfClosing = Boolean(match[3]) || VOID_TAGS.has(tag);

    if (isClose) {
      if (stack.length === 0) {
        issues.push({
          level: 'error',
          message: `짝이 없는 닫는 태그 \`</${tag}>\` 가 있습니다.`,
        });
        continue;
      }
      const open = stack.pop();
      if (open !== tag) {
        issues.push({
          level: 'error',
          message: `태그 짝이 맞지 않습니다. \`<${open}>\` 를 열었는데 \`</${tag}>\` 로 닫았습니다.`,
        });
        if (open) stack.push(open);
      }
      continue;
    }

    if (!selfClosing) {
      stack.push(tag);
    }
  }

  if (stack.length > 0) {
    const unique = [...new Set(stack)];
    issues.push({
      level: 'error',
      message: `닫히지 않은 태그가 있습니다: ${unique.map((t) => `\`<${t}>\``).join(', ')}`,
    });
  }

  return issues;
}

function findColorIssues(html: string): Diagnostic[] {
  const issues: Diagnostic[] = [];
  const styleRe = /style\s*=\s*(["'])(.*?)\1/gi;
  let match: RegExpExecArray | null;

  while ((match = styleRe.exec(html)) !== null) {
    const style = match[2];
    const declRe =
      /(background(?:-color)?|color)\s*:\s*([^;]+)/gi;
    let decl: RegExpExecArray | null;
    while ((decl = declRe.exec(style)) !== null) {
      const prop = decl[1];
      const value = decl[2].trim();
      const first = value.split(/\s+/)[0]?.toLowerCase() ?? '';

      if (
        first.startsWith('#') ||
        first.startsWith('rgb') ||
        first.startsWith('hsl') ||
        first.startsWith('var(') ||
        NAMED_COLORS.has(first)
      ) {
        continue;
      }

      if (/^[0-9a-f]{3,8}$/i.test(first)) {
        issues.push({
          level: 'error',
          message: `\`${prop}: ${first}\` 에 \`#\` 이 빠졌습니다. \`#${first}\` 로 쓰세요.`,
        });
      }
    }
  }

  return issues;
}

function findClassTypos(html: string): Diagnostic[] {
  const issues: Diagnostic[] = [];
  const classRe = /class\s*=\s*(["'])(.*?)\1/gi;
  let match: RegExpExecArray | null;
  const seen = new Set<string>();

  while ((match = classRe.exec(html)) !== null) {
    const names = match[2].split(/\s+/).filter(Boolean);
    for (const name of names) {
      if (KNOWN_CLASSES.includes(name) || seen.has(name)) continue;
      seen.add(name);

      const suggestion = closestKnownClass(name);
      if (suggestion) {
        issues.push({
          level: 'warning',
          message: `클래스 \`.${name}\` 는 프로덕션 배너 스타일에 없습니다. \`.${suggestion}\` 를 의도한 것 아닌가요?`,
        });
      }
    }
  }

  return issues;
}

function findStructureHints(html: string): Diagnostic[] {
  const issues: Diagnostic[] = [];
  if (!/\broot-banner-wrap\b/.test(html)) {
    issues.push({
      level: 'warning',
      message:
        '최상위 클래스 `root-banner-wrap` 이 없습니다. 배경색과 높이가 적용되지 않을 수 있습니다.',
    });
  }
  if (!/\bbanner-item-wide\b/.test(html)) {
    issues.push({
      level: 'warning',
      message:
        '`banner-item-wide` 클래스가 없습니다. 좌/우 레이아웃이 깨질 수 있습니다.',
    });
  }
  return issues;
}

function closestKnownClass(name: string): string | null {
  if (name.length < 4) return null;

  let best: string | null = null;
  let bestDist = Infinity;

  for (const known of KNOWN_CLASSES) {
    if (known.length < 4) continue;
    const dist = levenshtein(name, known);
    const max = Math.max(1, Math.floor(known.length / 4));
    if (dist > 0 && dist <= Math.max(2, max) && dist < bestDist) {
      best = known;
      bestDist = dist;
    }
  }

  return best;
}

function levenshtein(a: string, b: string): number {
  const rows = a.length + 1;
  const cols = b.length + 1;
  const dp: number[][] = Array.from({ length: rows }, () =>
    Array.from({ length: cols }, () => 0),
  );

  for (let i = 0; i < rows; i += 1) dp[i][0] = i;
  for (let j = 0; j < cols; j += 1) dp[0][j] = j;

  for (let i = 1; i < rows; i += 1) {
    for (let j = 1; j < cols; j += 1) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost,
      );
    }
  }

  return dp[a.length][b.length];
}
