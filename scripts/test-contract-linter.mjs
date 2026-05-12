import { lintContract } from '../lib/contract-linter.js';

// Minimal compliant HTML
const COMPLIANT = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta name="color-scheme" content="light dark">
  <title>Smoke Test</title>
  <!-- design-contract: v1 -->
  <meta property="og:title" content="Smoke Test">
  <script>
    (function(){
      var d = document.documentElement;
      d.setAttribute('data-scheme', window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
      window.addEventListener('message', function(e){
        if (e.data && e.data.type === 'portal:theme' && (e.data.theme === 'light' || e.data.theme === 'dark'))
          d.setAttribute('data-scheme', e.data.theme);
      });
    })();
  </script>
  <style>
    :root { color-scheme: light; --bg: #fff; }
    [data-scheme="dark"] { color-scheme: dark; --bg: #111; }
    html, body { min-height: 100%; margin: 0; }
    body { background: var(--bg); overflow-x: hidden; max-width: 1600px; font-size: 16px; }
    main { max-width: 72ch; }
    @media (prefers-reduced-motion: reduce) {
      *, *::before, *::after { animation-duration: 0.01ms !important; transition-duration: 0.01ms !important; }
    }
  </style>
</head>
<body>
  <main>
    <h1>Hello</h1>
    <p>Content <a href="https://example.com" target="_blank" rel="noopener noreferrer">link</a></p>
  </main>
</body>
</html>`;

// Violating HTML — missing many requirements
const VIOLATING = `<!DOCTYPE html>
<html>
<head>
  <title></title>
</head>
<body>
  <h1>Hi</h1>
  <a href="https://example.com">no target blank</a>
  <script>localStorage.getItem('x');</script>
</body>
</html>`;

let pass = true;

const r1 = lintContract(COMPLIANT, { title: 'Smoke Test' });
const errors1 = r1.findings.filter(f => f.severity === 'error');
if (errors1.length > 0) {
  console.error('FAIL — compliant HTML has errors:');
  errors1.forEach(e => console.error(' -', e.rule, ':', e.message));
  pass = false;
} else {
  console.log('PASS — compliant HTML: valid=' + r1.valid + ', findings=' + r1.findings.length);
}

const r2 = lintContract(VIOLATING);
const errors2 = r2.findings.filter(f => f.severity === 'error');
if (r2.valid) {
  console.error('FAIL — violating HTML returned valid=true');
  pass = false;
} else if (errors2.length < 5) {
  console.error('FAIL — violating HTML should have ≥ 5 errors, got', errors2.length);
  errors2.forEach(e => console.error(' -', e.rule));
  pass = false;
} else {
  console.log('PASS — violating HTML: valid=false, errors=' + errors2.length);
  const expectedRules = ['html5-lang', 'html5-title', 'design-contract-stamp', 'color-scheme-meta', 'prefers-reduced-motion', 'no-localstorage', 'external-links'];
  const foundRules = errors2.map(e => e.rule);
  expectedRules.forEach(rule => {
    if (!foundRules.includes(rule)) console.warn('  WARN — expected rule not found:', rule);
  });
}

if (pass) {
  console.log('\nAll gate tests passed.');
  process.exit(0);
} else {
  console.error('\nGate tests FAILED.');
  process.exit(1);
}
