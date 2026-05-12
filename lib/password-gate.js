// Minimal dark-themed HTML password gate for share links.
// action is always /share/<base64url-token> — no HTML injection risk.
export function passwordGatePage(action, { error = false } = {}) {
  return `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width,initial-scale=1">
  <title>Password Required</title>
  <style>
    *{box-sizing:border-box;margin:0;padding:0}
    body{background:#0e0e0f;color:#e4e4e7;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;
         display:flex;align-items:center;justify-content:center;min-height:100vh}
    .card{background:#18181b;border:1px solid #27272a;border-radius:8px;padding:2rem;width:100%;max-width:360px}
    h1{font-size:1rem;font-weight:600;margin-bottom:1.5rem;color:#fafafa}
    label{display:block;font-size:.75rem;color:#a1a1aa;margin-bottom:.375rem}
    input{width:100%;background:#09090b;border:1px solid #27272a;border-radius:6px;
          color:#fafafa;font-size:.875rem;padding:.5rem .75rem;outline:none}
    input:focus{border-color:#52525b}
    button{margin-top:1rem;width:100%;background:#3f3f46;border:none;border-radius:6px;
           color:#fafafa;cursor:pointer;font-size:.875rem;padding:.5rem}
    button:hover{background:#52525b}
    .err{color:#f87171;font-size:.75rem;margin-top:.75rem}
  </style>
</head>
<body>
  <div class="card">
    <h1>Password Required</h1>
    <form method="get" action="${action}">
      <label for="p">Password</label>
      <input id="p" name="p" type="password" autofocus required>
      <button type="submit">Continue</button>
      ${error ? '<p class="err">Incorrect password. Try again.</p>' : ''}
    </form>
  </div>
</body>
</html>`;
}
