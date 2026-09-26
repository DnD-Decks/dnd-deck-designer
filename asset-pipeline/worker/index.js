const OWNER = "DnD-Decks";
const REPOSITORY = "dnd-deck-designer";
const IMAGE_MODEL = "gpt-image-2";
const GITHUB_API = "https://api.github.com";
const PREVIEW_VARIANTS = [
  {
    id: 1,
    title: "Centered focal action",
    note: "Keep the main action near the center, with a clear silhouette and an immediate focal read.",
  },
  {
    id: 2,
    title: "Strong diagonal movement",
    note: "Build a strong diagonal through the action so movement and force read at a glance.",
  },
  {
    id: 3,
    title: "Wider setting",
    note: "Show more of the named setting as broad atmospheric shapes while keeping the card subject unmistakable.",
  },
  {
    id: 4,
    title: "Closer dramatic view",
    note: "Move closer to the key action and emphasize its silhouette, light, and shadow without adding detail.",
  },
];

const buildPage = () => String.raw`<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1">
    <meta name="theme-color" content="#11161b">
    <meta name="description" content="Generate, compare, and submit D&D card artwork from the deck's open asset issues.">
    <link rel="icon" href="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'%3E%3Crect width='40' height='40' rx='10' fill='%2311161b'/%3E%3Cpath d='M21 5 11 23h8l-1 12 11-20h-8z' fill='%23e1b96b'/%3E%3C/svg%3E">
    <title>Asset Pipeline · D&amp;D Decks</title>
    <style>${styles}</style>
  </head>
  <body>
    <div class="app-shell">
      <aside class="sidebar" aria-label="Open asset issues">
        <a class="brand" href="/" aria-label="D&D Decks Asset Pipeline home">
          <span class="brand-mark" aria-hidden="true">✦</span>
          <span><strong>DECKS</strong><small>ART PIPELINE</small></span>
        </a>
        <div class="sidebar-heading"><span>OPEN ASSET ISSUES</span><span class="count" id="issue-count">—</span></div>
        <label class="search-box">
          <span class="sr-only">Filter issues</span>
          <svg viewBox="0 0 20 20" aria-hidden="true"><circle cx="8.7" cy="8.7" r="5.6"></circle><path d="m13 13 4 4"></path></svg>
          <input id="issue-search" type="search" placeholder="Find a card…" autocomplete="off">
          <kbd>/</kbd>
        </label>
        <div class="issue-list" id="issue-list" aria-live="polite">
          <div class="list-state"><span class="loader"></span><span>Loading issues</span></div>
        </div>
        <div class="sidebar-footer"><span class="live-dot"></span> Synced with GitHub</div>
      </aside>

      <main class="main-content">
        <header class="topbar">
          <div class="crumbs"><span>DnD Decks</span><i>/</i><strong>Asset Pipeline</strong></div>
          <div class="service-status" id="service-status" aria-live="polite">
            <span class="status-pill pending"><i></i> Checking services</span>
          </div>
        </header>
        <div class="workspace" id="workspace">
          <section class="welcome-panel" id="welcome-panel">
            <div class="welcome-kicker"><span class="sparkle">✦</span> ILLUSTRATION WORKBENCH</div>
            <h1>Choose the image<br><em>that tells the story.</em></h1>
            <p>Pick an open card issue, compare four low-cost compositions, then render the selected image at card resolution and open a pull request.</p>
            <div class="workflow-strip" aria-label="Artwork process">
              <div><span>01</span><b>Select an issue</b></div><i></i>
              <div><span>02</span><b>Compare four drafts</b></div><i></i>
              <div><span>03</span><b>Render &amp; submit</b></div>
            </div>
            <div class="welcome-note"><span class="note-icon">i</span><span>Previews use low quality at 480 × 672 or 672 × 480. Final renders use the card's exact 5:7 or 7:5 ratio. The OpenAI API account is billed for each image.</span></div>
          </section>
          <section class="issue-workspace hidden" id="issue-workspace" aria-live="polite">
            <div class="issue-header">
              <div class="issue-title-group">
                <div class="eyebrow-row"><span class="issue-label">ASSET REQUEST</span><a id="issue-link" href="#" target="_blank" rel="noreferrer">ISSUE <span id="issue-number">#—</span> <span aria-hidden="true">↗</span></a></div>
                <h1 id="card-title">Loading card…</h1>
                <div class="metadata" id="card-metadata"></div>
              </div>
              <div class="path-chip"><span>OUTPUT FILE</span><code id="output-path">—</code></div>
            </div>
            <div class="prompt-toggle"><details><summary><span class="prompt-icon">⌘</span> View image-generation prompt <span class="chevron">⌄</span></summary><pre id="prompt-text"></pre></details></div>
            <section class="candidate-section" aria-labelledby="candidate-heading">
              <div class="section-heading">
                <div><div class="section-kicker">CONCEPT EXPLORATION</div><h2 id="candidate-heading">Four compositions</h2></div>
                <button class="button button-primary" id="generate-button" type="button"><span class="button-icon">✦</span> Generate four drafts</button>
              </div>
              <div class="progress-line hidden" id="generation-progress"><span class="loader"></span><span>Generating four low-quality drafts in parallel…</span></div>
              <div class="candidate-grid" id="candidate-grid">
                <div class="empty-candidates"><div class="empty-art" aria-hidden="true">✧</div><strong>Your concepts will appear here</strong><span>Each draft keeps the issue's art direction and explores a different composition.</span></div>
              </div>
              <div class="workflow-message" id="workflow-message" role="status"></div>
            </section>
            <section class="final-section hidden" id="final-section" aria-labelledby="final-heading">
              <div class="final-divider"><span></span><b>FINAL ARTWORK</b><span></span></div>
              <div class="final-content" id="final-content"></div>
            </section>
          </section>
          <section class="not-found hidden" id="not-found"><div class="not-found-icon">?</div><h1>Issue unavailable</h1><p id="not-found-message">This issue is not open or does not contain a usable asset prompt.</p><button class="button button-subtle" id="back-to-issues" type="button">Back to issues</button></section>
        </div>
      </main>
    </div>
    <script>${clientScript}</script>
  </body>
</html>`;

const styles = String.raw`
:root{color-scheme:dark;--bg:#11161b;--panel:#171e24;--panel-2:#1b242b;--line:#29333b;--muted:#849099;--text:#edf0ec;--soft:#c8d0cb;--gold:#e1b96b;--gold-2:#f0cf84;--green:#8fc29d;--red:#e99883;--mono:'DM Mono',monospace;--sans:'DM Sans',system-ui,sans-serif;--serif:'Playfair Display',Georgia,serif}
*{box-sizing:border-box}body{margin:0;background:var(--bg);color:var(--text);font:14px/1.5 var(--sans);min-height:100vh}button,input{font:inherit}button{cursor:pointer}a{color:inherit}.app-shell{display:grid;grid-template-columns:292px minmax(0,1fr);min-height:100vh}.sidebar{background:#141a1f;border-right:1px solid var(--line);display:flex;flex-direction:column;min-height:100vh;padding:26px 17px 18px}.brand{display:flex;gap:11px;align-items:center;text-decoration:none;margin:1px 8px 44px}.brand-mark{display:grid;place-items:center;width:38px;height:38px;background:#2c281f;border:1px solid #60513a;border-radius:11px;color:var(--gold);font-size:21px}.brand strong,.brand small{display:block;line-height:1.2}.brand strong{font-size:13px;letter-spacing:.18em}.brand small{color:var(--muted);font:10px var(--mono);letter-spacing:.13em;margin-top:4px}.sidebar-heading{display:flex;justify-content:space-between;align-items:center;margin:0 8px 11px;color:#9ba49f;font:10px var(--mono);letter-spacing:.14em}.count{background:#252d32;color:#bec7c1;padding:3px 7px;border-radius:9px;font-size:10px}.search-box{display:flex;align-items:center;gap:9px;height:39px;margin:0 2px 17px;padding:0 10px;border:1px solid #303940;border-radius:8px;background:#11171c;color:#89949c}.search-box svg{width:16px;fill:none;stroke:currentColor;stroke-width:1.6}.search-box input{border:0;outline:0;background:transparent;min-width:0;flex:1;color:var(--text);font-size:12px}.search-box input::placeholder{color:#748089}.search-box kbd{font:10px var(--mono);border:1px solid #384149;border-radius:4px;padding:1px 5px}.issue-list{flex:1;overflow:auto;min-height:120px}.list-state{display:flex;align-items:center;gap:10px;color:var(--muted);padding:20px 12px;font-size:12px}.issue-row{display:block;width:100%;text-align:left;padding:12px 11px;margin:3px 0;border:1px solid transparent;border-radius:8px;color:var(--soft);background:transparent;transition:background .15s,border-color .15s}.issue-row:hover{background:#1b2329}.issue-row.selected{background:#25271f;border-color:#554832;color:var(--text)}.issue-row-top{display:flex;justify-content:space-between;gap:8px;align-items:center}.issue-row-name{font-size:12px;font-weight:600;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}.issue-row-number{color:#89949a;font:10px var(--mono)}.issue-row-meta{display:flex;gap:7px;margin-top:6px;color:#89949a;font:9px var(--mono);text-transform:uppercase;letter-spacing:.035em}.issue-row-meta span+span:before{content:'·';margin-right:7px;color:#566168}.sidebar-footer{border-top:1px solid #252e34;padding:15px 9px 0;color:#849099;font-size:10px;display:flex;gap:8px;align-items:center}.live-dot{width:6px;height:6px;border-radius:50%;background:#83b48e;box-shadow:0 0 10px #83b48e66}.main-content{min-width:0}.topbar{height:65px;border-bottom:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;padding:0 38px}.crumbs{display:flex;gap:11px;align-items:center;color:#89939a;font-size:12px}.crumbs i{color:#465059;font-style:normal}.crumbs strong{color:#d8ded9;font-weight:500}.service-status{display:flex;gap:8px}.status-pill{display:flex;align-items:center;gap:6px;border:1px solid var(--line);border-radius:20px;padding:5px 9px;font:9px var(--mono);color:#a5b0ac}.status-pill i{width:6px;height:6px;border-radius:50%;background:#879198}.status-pill.ready i{background:#84bf90;box-shadow:0 0 6px #84bf9070}.status-pill.needs i{background:#d0a767}.status-pill.off i{background:#c77f6e}.workspace{max-width:1190px;margin:0 auto;padding:60px 42px 88px}.welcome-panel{max-width:790px;padding-top:22px}.welcome-kicker,.section-kicker{color:var(--gold);font:10px var(--mono);letter-spacing:.16em}.sparkle{font-size:15px;vertical-align:-1px;margin-right:6px}.welcome-panel h1{font-size:clamp(38px,5vw,56px);line-height:1.12;letter-spacing:-.045em;margin:17px 0 17px;font-weight:500}.welcome-panel h1 em{font-family:var(--serif);color:var(--gold-2);font-weight:600}.welcome-panel>p{max-width:625px;color:#aab3b0;font-size:15px;line-height:1.75;margin:0}.workflow-strip{display:flex;align-items:center;gap:18px;margin-top:39px;padding:18px 20px;border:1px solid var(--line);border-radius:10px;background:#151c21;width:max-content;max-width:100%}.workflow-strip div{display:flex;align-items:center;gap:9px;white-space:nowrap}.workflow-strip span{font:10px var(--mono);color:var(--gold)}.workflow-strip b{font-size:11px;font-weight:500;color:#d5dcd7}.workflow-strip>i{width:28px;border-top:1px solid #3b4448}.welcome-note{display:flex;align-items:flex-start;gap:10px;max-width:670px;margin-top:24px;color:#869198;font-size:11px;line-height:1.65}.note-icon{display:grid;place-items:center;flex:none;width:17px;height:17px;border:1px solid #586168;border-radius:50%;font:10px var(--mono);color:#a7b0aa}.issue-workspace{animation:appear .24s ease-out}.issue-header{display:flex;justify-content:space-between;gap:24px;align-items:flex-end;padding:2px 0 20px;border-bottom:1px solid var(--line)}.eyebrow-row{display:flex;gap:13px;align-items:center;margin-bottom:12px}.issue-label{font:9px var(--mono);letter-spacing:.13em;color:var(--gold);border:1px solid #5d4d33;border-radius:4px;padding:4px 7px;background:#29251d}.eyebrow-row a{font:10px var(--mono);color:#8b989e;text-decoration:none}.eyebrow-row a:hover{color:var(--gold)}.issue-header h1{font-size:35px;line-height:1.18;letter-spacing:-.025em;font-weight:500;margin:0 0 13px}.metadata{display:flex;flex-wrap:wrap;gap:7px}.meta-tag{padding:4px 8px;border:1px solid #2c373d;border-radius:5px;color:#a8b2ad;font:9px var(--mono);text-transform:uppercase;letter-spacing:.035em}.path-chip{text-align:right;min-width:190px;padding:10px 12px;border:1px solid #303b40;border-radius:7px;background:#151c21}.path-chip span{display:block;color:#758188;font:9px var(--mono);letter-spacing:.1em;margin-bottom:5px}.path-chip code{font:10px var(--mono);color:#c0c9c2}.prompt-toggle{margin:15px 0 31px}.prompt-toggle details{border:1px solid #29343a;border-radius:7px;background:#151b20}.prompt-toggle summary{list-style:none;cursor:pointer;padding:10px 12px;color:#9da7a3;font-size:11px;display:flex;gap:8px;align-items:center}.prompt-toggle summary::-webkit-details-marker{display:none}.prompt-toggle summary:hover{color:var(--soft)}.prompt-icon{color:var(--gold);font:13px var(--mono)}.chevron{margin-left:auto;color:#747f85}.prompt-toggle pre{max-height:330px;overflow:auto;border-top:1px solid #29343a;padding:14px;margin:0;color:#b7c0ba;font:10px/1.65 var(--mono);white-space:pre-wrap}.section-heading{display:flex;align-items:flex-end;justify-content:space-between;gap:15px;margin-bottom:17px}.section-kicker{font-size:9px;color:#89968e;margin-bottom:3px}.section-heading h2{font-size:21px;font-weight:500;letter-spacing:-.02em;margin:0}.button{display:inline-flex;align-items:center;justify-content:center;gap:8px;border-radius:7px;padding:10px 14px;min-height:39px;font-size:11px;font-weight:600;transition:filter .15s,transform .15s}.button:hover:not(:disabled){filter:brightness(1.08);transform:translateY(-1px)}.button:disabled{opacity:.52;cursor:wait}.button-primary{background:var(--gold);border:1px solid var(--gold);color:#202018}.button-icon{font-size:14px}.button-subtle{background:#1e272d;color:#d2d9d3;border:1px solid #344047}.candidate-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px}.candidate-card{border:1px solid #303a40;border-radius:9px;background:#171e23;overflow:hidden;transition:border-color .15s,box-shadow .15s}.candidate-card.chosen{border-color:#b39255;box-shadow:0 0 0 1px #b3925538}.candidate-image-wrap{position:relative;min-height:190px;display:grid;place-items:center;background:radial-gradient(ellipse at center,#272d2c,#171d21 68%);overflow:hidden}.candidate-image{display:block;width:100%;height:310px;object-fit:contain}.candidate-image-wrap:has(.candidate-image){background:#11161a}.candidate-placeholder{height:224px;display:flex;flex-direction:column;justify-content:center;align-items:center;gap:11px;color:#657177;font-size:10px}.candidate-placeholder .loader{width:18px;height:18px}.candidate-number{position:absolute;top:10px;left:10px;z-index:1;background:#11171cdd;border:1px solid #657078;border-radius:5px;padding:4px 7px;color:#d3d9d4;font:9px var(--mono);letter-spacing:.06em}.candidate-info{padding:13px 14px 14px;border-top:1px solid #29343a}.candidate-info-top{display:flex;align-items:center;justify-content:space-between;gap:10px}.candidate-info h3{font-size:12px;margin:0;font-weight:600}.candidate-info p{color:#8f9a9d;font-size:10px;line-height:1.55;margin:7px 0 12px;min-height:31px}.select-button{width:100%;border:1px solid #3c474d;background:#20282d;color:#bec8c1;border-radius:6px;padding:8px;font-size:10px;font-weight:600}.select-button:hover{border-color:#928056;color:#f0cf84}.select-button[aria-pressed="true"]{background:#342d20;border-color:#907342;color:#edcc82}.empty-candidates{grid-column:1/-1;min-height:245px;display:flex;flex-direction:column;align-items:center;justify-content:center;text-align:center;border:1px dashed #364148;border-radius:9px;background:#151c21;padding:28px}.empty-art{font-size:27px;color:#958155;margin-bottom:7px}.empty-candidates strong{font-size:12px;font-weight:600}.empty-candidates span{max-width:320px;color:#879297;font-size:10px;margin-top:5px}.progress-line{display:flex;align-items:center;gap:10px;color:#b6beb9;font-size:11px;margin:-2px 0 13px}.loader{width:14px;height:14px;border:2px solid #4f5a5f;border-top-color:var(--gold);border-radius:50%;animation:spin .75s linear infinite}.workflow-message{min-height:24px;padding-top:7px;color:#91a29a;font-size:11px}.workflow-message.error{color:var(--red)}.workflow-message.success{color:var(--green)}.final-section{margin-top:10px}.final-divider{display:flex;gap:12px;align-items:center;color:#79858a;font:9px var(--mono);letter-spacing:.12em}.final-divider span{height:1px;background:#2b363b;flex:1}.final-content{margin-top:15px}.final-panel{display:grid;grid-template-columns:minmax(180px,280px) minmax(0,1fr);gap:22px;padding:15px;border:1px solid #394239;border-radius:9px;background:#191f20}.final-preview{background:#11161a;border-radius:6px;overflow:hidden;display:flex;align-items:center;justify-content:center;min-height:170px}.final-preview img{display:block;width:100%;height:auto;max-height:400px;object-fit:contain}.final-copy{align-self:center}.final-copy h3{font-size:15px;font-weight:500;margin:0 0 6px}.final-copy p{font-size:11px;color:#95a09a;line-height:1.7;margin:0 0 13px}.final-actions{display:flex;gap:9px;flex-wrap:wrap}.final-dimensions{font:9px var(--mono);color:#879297;margin-top:11px}.pr-link{display:inline-flex;align-items:center;gap:7px;margin-top:12px;color:var(--green);font-size:11px;text-decoration:none}.pr-link:hover{text-decoration:underline}.not-found{max-width:530px;padding-top:105px;text-align:center;margin:0 auto}.not-found-icon{display:grid;place-items:center;width:46px;height:46px;margin:0 auto 18px;border:1px solid #544632;border-radius:50%;color:var(--gold);font:20px var(--serif)}.not-found h1{font-size:25px;font-weight:500}.not-found p{color:#95a09a;font-size:12px;line-height:1.7;margin-bottom:20px}.hidden{display:none!important}.sr-only{position:absolute;width:1px;height:1px;padding:0;margin:-1px;overflow:hidden;clip:rect(0,0,0,0);white-space:nowrap;border:0}@keyframes spin{to{transform:rotate(360deg)}}@keyframes appear{from{opacity:0;transform:translateY(5px)}to{opacity:1;transform:translateY(0)}}
@media(max-width:980px){.app-shell{grid-template-columns:255px minmax(0,1fr)}.sidebar{padding-left:12px;padding-right:12px}.workspace{padding:45px 28px 70px}.topbar{padding:0 28px}.candidate-image{height:260px}}
@media(max-width:720px){.app-shell{display:block}.sidebar{min-height:0;height:auto;padding:13px 15px 10px;border-right:0;border-bottom:1px solid var(--line)}.brand{margin:0 3px 12px}.brand-mark{width:31px;height:31px;font-size:17px}.sidebar-heading{margin-bottom:7px}.search-box{margin-bottom:7px}.issue-list{display:flex;overflow-x:auto;gap:6px;min-height:0;max-height:76px}.issue-row{width:190px;flex:none;padding:8px}.sidebar-footer{display:none}.list-state{padding:12px}.topbar{height:51px;padding:0 17px}.workspace{padding:31px 17px 55px}.welcome-panel{padding-top:9px}.welcome-panel h1{font-size:39px}.welcome-panel>p{font-size:13px}.workflow-strip{gap:9px;padding:12px;margin-top:27px;width:100%;overflow:auto}.workflow-strip div{gap:6px}.workflow-strip b{font-size:9px}.workflow-strip>i{width:13px;flex:none}.welcome-note{font-size:10px}.issue-header{display:block}.issue-header h1{font-size:28px}.path-chip{display:inline-block;text-align:left;margin-top:14px;min-width:0}.section-heading{align-items:flex-start}.section-heading h2{font-size:19px}.button-primary{padding:9px 10px;font-size:10px}.candidate-grid{grid-template-columns:1fr;gap:11px}.candidate-image{height:min(116vw,420px)}.candidate-image-wrap{min-height:180px}.candidate-placeholder{height:180px}.candidate-info p{min-height:0}.final-panel{grid-template-columns:110px minmax(0,1fr);gap:13px;padding:10px}.final-copy h3{font-size:13px}.final-copy p{font-size:10px}.service-status{gap:4px}.status-pill{padding:4px 6px;font-size:8px}.crumbs{font-size:10px;gap:7px}}
@media(max-width:390px){.workflow-strip{gap:6px}.workflow-strip b{white-space:normal}.section-heading{display:block}.section-heading .button{margin-top:11px}.service-status .status-pill{font-size:0;gap:0;width:15px;height:15px;padding:0;justify-content:center}.status-pill i{width:6px;height:6px}}
`;

const clientScript = String.raw`
const $ = (selector, root) => (root || document).querySelector(selector);
const state = { issues: [], active: null, manifest: null, selected: null, final: null, search: "" };
const listNode = $("#issue-list");
const messageNode = $("#workflow-message");

async function request(path, options) {
  const response = await fetch(path, options || {});
  const data = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(data.error || "Request failed (" + response.status + ")");
  return data;
}

function setMessage(message, tone) {
  messageNode.textContent = message || "";
  messageNode.className = "workflow-message" + (tone ? " " + tone : "");
}

function renderStatus(health) {
  const node = $("#service-status");
  const pill = function(label, configured) {
    return '<span class="status-pill ' + (configured ? "ready" : "needs") + '"><i></i>' + label + " " + (configured ? "ready" : "needs setup") + "</span>";
  };
  node.innerHTML = pill("OpenAI", health.openAI) + pill("GitHub", health.github) + pill("Image storage", health.storage);
}

function visibleIssues() {
  const needle = state.search.trim().toLowerCase();
  return state.issues.filter(function(issue) {
    return !needle || (issue.name + " " + issue.title + " " + issue.number + " " + issue.kind).toLowerCase().includes(needle);
  });
}

function renderIssueList() {
  const issues = visibleIssues();
  $("#issue-count").textContent = state.issues.length;
  if (!issues.length) {
    listNode.innerHTML = '<div class="list-state">No matching open asset issues.</div>';
    return;
  }
  listNode.replaceChildren();
  issues.forEach(function(issue) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "issue-row" + (state.active && state.active.number === issue.number ? " selected" : "");
    button.setAttribute("aria-label", "Open issue " + issue.number + ": " + issue.name);
    const top = document.createElement("span");
    top.className = "issue-row-top";
    const name = document.createElement("span");
    name.className = "issue-row-name";
    name.textContent = issue.name || issue.title;
    const number = document.createElement("span");
    number.className = "issue-row-number";
    number.textContent = "#" + issue.number;
    top.append(name, number);
    const meta = document.createElement("span");
    meta.className = "issue-row-meta";
    [issue.kind || "asset", issue.orientationLabel || "prompt check"].forEach(function(text) {
      const part = document.createElement("span");
      part.textContent = text;
      meta.append(part);
    });
    button.append(top, meta);
    button.addEventListener("click", function() { openIssue(issue.number); });
    listNode.append(button);
  });
}

function setSurface(surface) {
  $("#welcome-panel").classList.toggle("hidden", surface !== "welcome");
  $("#issue-workspace").classList.toggle("hidden", surface !== "issue");
  $("#not-found").classList.toggle("hidden", surface !== "not-found");
}

function renderIssue(issue) {
  state.active = issue;
  state.manifest = null;
  state.selected = null;
  state.final = null;
  setSurface("issue");
  $("#card-title").textContent = issue.name || issue.title;
  $("#issue-number").textContent = "#" + issue.number;
  $("#issue-link").href = issue.htmlUrl;
  $("#output-path").textContent = issue.targetPath || "Prompt needs a valid output path";
  $("#prompt-text").textContent = issue.prompt || "No image-generation prompt was found in this issue.";
  const metadata = $("#card-metadata");
  metadata.replaceChildren();
  [issue.kind || "asset", issue.subtitle, issue.orientationLabel].filter(Boolean).forEach(function(value) {
    const tag = document.createElement("span");
    tag.className = "meta-tag";
    tag.textContent = value;
    metadata.append(tag);
  });
  $("#candidate-grid").innerHTML = '<div class="empty-candidates"><div class="empty-art" aria-hidden="true">✧</div><strong>Your concepts will appear here</strong><span>Each draft keeps the issue\'s art direction and explores a different composition.</span></div>';
  $("#final-section").classList.add("hidden");
  $("#generate-button").disabled = !issue.ready;
  $("#generate-button").title = issue.ready ? "" : issue.errors.join(" ");
  setMessage(issue.ready ? "" : issue.errors.join(" "), issue.ready ? "" : "error");
  renderIssueList();
}

function imageUrl(key) { return "/api/image?key=" + encodeURIComponent(key); }

function renderGallery(manifest) {
  state.manifest = manifest;
  const grid = $("#candidate-grid");
  grid.replaceChildren();
  if (!manifest.candidates || !manifest.candidates.length) {
    const empty = document.createElement("div");
    empty.className = "empty-candidates";
    empty.innerHTML = '<div class="empty-art" aria-hidden="true">✧</div><strong>No complete drafts in this run</strong><span>Generate another set. Any failed request is shown below.</span>';
    grid.append(empty);
    return;
  }
  manifest.candidates.forEach(function(candidate) {
    const card = document.createElement("article");
    card.className = "candidate-card" + (state.selected === candidate.id ? " chosen" : "");
    const imageWrap = document.createElement("div");
    imageWrap.className = "candidate-image-wrap";
    const number = document.createElement("span");
    number.className = "candidate-number";
    number.textContent = "DRAFT 0" + candidate.id;
    const image = document.createElement("img");
    image.className = "candidate-image";
    image.src = imageUrl(candidate.key);
    image.alt = candidate.title + " composition for " + (state.active.name || "the card");
    image.loading = "lazy";
    imageWrap.append(number, image);
    const info = document.createElement("div");
    info.className = "candidate-info";
    const title = document.createElement("h3");
    title.textContent = candidate.title;
    const description = document.createElement("p");
    description.textContent = candidate.description;
    const choose = document.createElement("button");
    choose.type = "button";
    choose.className = "select-button";
    choose.textContent = state.selected === candidate.id ? "Selected for final render" : "Choose this composition";
    choose.setAttribute("aria-pressed", String(state.selected === candidate.id));
    choose.addEventListener("click", function() { selectCandidate(candidate.id); });
    info.append(title, description, choose);
    card.append(imageWrap, info);
    grid.append(card);
  });
  if (manifest.failures && manifest.failures.length) {
    const fail = document.createElement("p");
    fail.className = "workflow-message error";
    fail.textContent = manifest.failures.length + " draft request(s) failed: " + manifest.failures.join(" · ");
    grid.append(fail);
  }
}

function finalDimensions(issue) {
  return issue.orientation === "landscape" ? "1120 × 800" : "800 × 1120";
}

function renderFinalPanel() {
  const section = $("#final-section");
  const content = $("#final-content");
  if (!state.selected || !state.manifest) {
    section.classList.add("hidden");
    content.replaceChildren();
    return;
  }
  section.classList.remove("hidden");
  content.replaceChildren();
  const panel = document.createElement("div");
  panel.className = "final-panel";
  const preview = document.createElement("div");
  preview.className = "final-preview";
  const finalImage = state.final && state.final.key ? document.createElement("img") : null;
  if (finalImage) {
    finalImage.src = imageUrl(state.final.key);
    finalImage.alt = "Final render for " + state.active.name;
    preview.append(finalImage);
  } else {
    preview.innerHTML = '<div class="candidate-placeholder"><span class="empty-art">✦</span><span>Final render not made</span></div>';
  }
  const copy = document.createElement("div");
  copy.className = "final-copy";
  const heading = document.createElement("h3");
  heading.id = "final-heading";
  heading.textContent = state.final ? "Final image ready for review" : "Render the selected composition";
  const para = document.createElement("p");
  para.textContent = state.final
    ? "Check this image at the target size. If it looks right, create a branch and open a pull request against the deck."
    : "The selected low-quality draft will guide one final high-quality image edit. The final size exactly matches the card orientation.";
  const actions = document.createElement("div");
  actions.className = "final-actions";
  const button = document.createElement("button");
  button.type = "button";
  button.className = "button button-primary";
  if (state.final && state.final.prUrl) {
    button.textContent = "Pull request opened";
    button.disabled = true;
  } else if (state.final) {
    button.textContent = "Create pull request";
    button.addEventListener("click", openPullRequest);
  } else {
    button.innerHTML = '<span class="button-icon">✦</span> Render final image';
    button.addEventListener("click", renderFinal);
  }
  actions.append(button);
  const dimensions = document.createElement("div");
  dimensions.className = "final-dimensions";
  dimensions.textContent = (state.final ? "FINAL SIZE · " : "TARGET SIZE · ") + finalDimensions(state.active) + " px · exact " + state.active.orientationLabel;
  copy.append(heading, para, actions, dimensions);
  if (state.final && state.final.prUrl) {
    const link = document.createElement("a");
    link.className = "pr-link";
    link.href = state.final.prUrl;
    link.target = "_blank";
    link.rel = "noreferrer";
    link.textContent = "View pull request ↗";
    copy.append(link);
    const closeNote = document.createElement("div");
    closeNote.className = "final-dimensions";
    closeNote.textContent = "The issue closes automatically when the pull request is merged.";
    copy.append(closeNote);
  }
  panel.append(preview, copy);
  content.append(panel);
}

function setBusy(button, progress, busy, text) {
  button.disabled = busy;
  $("#generation-progress").classList.toggle("hidden", !busy || progress !== "generation");
  if (busy && text) setMessage(text, "");
}

async function openIssue(number) {
  setSurface("issue");
  $("#card-title").textContent = "Loading card…";
  $("#issue-number").textContent = "#" + number;
  setMessage("Loading the issue prompt and saved drafts…", "");
  try {
    const issue = await request("/api/issues/" + number);
    renderIssue(issue);
    const response = await request("/api/issues/" + number + "/runs");
    if (response.runs && response.runs.length) renderGallery(response.runs[0]);
    setMessage("", "");
    const url = new URL(window.location.href);
    url.searchParams.set("issue", String(number));
    history.replaceState(null, "", url);
  } catch (error) {
    $("#not-found-message").textContent = error.message;
    setSurface("not-found");
  }
}

function selectCandidate(id) {
  state.selected = id;
  state.final = state.manifest.finals && state.manifest.finals[String(id)] ? state.manifest.finals[String(id)] : null;
  renderGallery(state.manifest);
  renderFinalPanel();
  setMessage("Draft 0" + id + " selected. Review it below before creating a final image.", "success");
}

async function generateDrafts() {
  const button = $("#generate-button");
  button.disabled = true;
  $("#generation-progress").classList.remove("hidden");
  $("#candidate-grid").innerHTML = '<div class="empty-candidates"><span class="loader"></span><strong>Creating four compositions</strong><span>Each draft uses low-quality output to keep preview cost down.</span></div>';
  setMessage("Generating four previews. Keep this page open until they finish.", "");
  try {
    const data = await request("/api/issues/" + state.active.number + "/generations", { method: "POST" });
    state.selected = null;
    state.final = null;
    renderGallery(data.run);
    renderFinalPanel();
    setMessage("Created " + data.run.candidates.length + " preview(s). Choose the composition you want to carry forward.", data.run.candidates.length ? "success" : "error");
  } catch (error) {
    setMessage(error.message, "error");
    $("#candidate-grid").innerHTML = '<div class="empty-candidates"><div class="empty-art" aria-hidden="true">!</div><strong>Draft generation did not finish</strong><span>Check the service status and try again. Completed previews are kept when available.</span></div>';
  } finally {
    button.disabled = !state.active.ready;
    $("#generation-progress").classList.add("hidden");
  }
}

async function renderFinal() {
  const buttons = $("#final-content").querySelectorAll("button");
  const button = buttons[0];
  setBusy(button, "final", true, "Rendering one high-quality final image…");
  try {
    const data = await request("/api/issues/" + state.active.number + "/finals", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.manifest.runId, candidateId: state.selected }),
    });
    state.manifest = data.run;
    state.final = data.final;
    renderGallery(state.manifest);
    renderFinalPanel();
    setMessage("Final image rendered at " + finalDimensions(state.active) + " px. Review it, then create a pull request.", "success");
  } catch (error) {
    setMessage(error.message, "error");
    renderFinalPanel();
  }
}

async function openPullRequest() {
  const button = $("#final-content").querySelector("button");
  setBusy(button, "pull-request", true, "Adding the final image to a branch and opening a pull request…");
  try {
    const data = await request("/api/issues/" + state.active.number + "/pull-requests", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ runId: state.manifest.runId, candidateId: state.selected }),
    });
    state.manifest = data.run;
    state.final = data.final;
    renderFinalPanel();
    setMessage("Pull request opened. The issue will close after the PR is merged.", "success");
  } catch (error) {
    setMessage(error.message, "error");
    renderFinalPanel();
  }
}

async function start() {
  try {
    const health = await request("/api/health");
    renderStatus(health);
    const data = await request("/api/issues");
    state.issues = data.issues || [];
    renderIssueList();
    const requested = new URL(window.location.href).searchParams.get("issue");
    if (requested && state.issues.some(function(issue) { return String(issue.number) === requested; })) await openIssue(requested);
  } catch (error) {
    listNode.innerHTML = '<div class="list-state">Could not load GitHub issues: ' + escapeText(error.message) + '</div>';
    $("#issue-count").textContent = "!";
  }
}

function escapeText(value) {
  return String(value).replace(/[&<>"']/g, function(character) {
    return { "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[character];
  });
}

$("#issue-search").addEventListener("input", function(event) {
  state.search = event.target.value;
  renderIssueList();
});
$("#generate-button").addEventListener("click", generateDrafts);
$("#back-to-issues").addEventListener("click", function() { setSurface("welcome"); history.replaceState(null, "", "/"); });
document.addEventListener("keydown", function(event) {
  if (event.key === "/" && !["INPUT", "TEXTAREA"].includes(document.activeElement.tagName)) {
    event.preventDefault();
    $("#issue-search").focus();
  }
});
start();
`;

export const previewDimensions = (orientation) =>
  orientation === "landscape" ? { width: 672, height: 480 } : { width: 480, height: 672 };
export const finalDimensions = (orientation) =>
  orientation === "landscape" ? { width: 1120, height: 800 } : { width: 800, height: 1120 };

export function parseAssetIssue(issue) {
  const body = String(issue.body || "");
  const assetId = body.match(/^## Asset ID\s*\n+\s*`([^`]+)`/im)?.[1]?.trim() || null;
  const getCell = (name) =>
    body.match(new RegExp(`^\\|\\s*${name}\\s*\\|\\s*([^|]+)\\|`, "im"))?.[1]?.trim() || "";
  const prompt =
    body
      .match(/## Image-generation prompt[^\n]*\r?\n+```[^\r\n]*\r?\n([\s\S]*?)\r?\n```/i)?.[1]
      ?.trim() || "";
  const orientationValue = getCell("Orientation").toLowerCase();
  const orientation = /landscape|7\s*:\s*5/.test(orientationValue)
    ? "landscape"
    : /portrait|vertical|5\s*:\s*7/.test(orientationValue)
      ? "portrait"
      : "";
  const targetPath = body.match(/PR adds `((?:public\/art\/)[a-z0-9][a-z0-9-]*\.png)`/i)?.[1] || "";
  const criteriaClose = body.match(/Closes\s+#(\d+)/i)?.[1] || "";
  const validAssetId = Boolean(assetId && /^[a-z0-9][a-z0-9-]*$/.test(assetId));
  const targetMatchesId = !targetPath || targetPath === `public/art/${assetId}.png`;
  const issues = [];
  if (!validAssetId) issues.push("Missing or invalid Asset ID.");
  if (!prompt) issues.push("No fenced image-generation prompt was found.");
  if (!orientation) issues.push("Card orientation must state portrait 5:7 or landscape 7:5.");
  if (!targetPath) issues.push("Acceptance criteria must name a public/art/*.png output file.");
  if (!targetMatchesId) issues.push("Acceptance-criteria image path does not match the Asset ID.");
  if (criteriaClose && Number(criteriaClose) !== Number(issue.number))
    issues.push("Acceptance-criteria issue number does not match this issue.");
  const type = getCell("Kind");
  const name =
    getCell("Name") ||
    String(issue.title || "")
      .replace(/^\[asset\]:\s*/i, "")
      .replace(/`/g, "");
  const subtitle = [
    getCell("School"),
    getCell("Level") && (getCell("Level") === "0" ? "cantrip" : `level ${getCell("Level")}`),
    type === "feat" ? `${getCell("Class")} feat` : "",
  ]
    .filter(Boolean)
    .join(" · ");
  const orientationLabel = orientation
    ? orientation === "landscape"
      ? "Landscape 7:5"
      : "Portrait 5:7"
    : "Orientation missing";
  return {
    number: Number(issue.number),
    title: issue.title || `Asset issue #${issue.number}`,
    htmlUrl: issue.html_url || `https://github.com/${OWNER}/${REPOSITORY}/issues/${issue.number}`,
    name,
    assetId,
    kind: type,
    subtitle,
    orientation,
    orientationLabel,
    targetPath,
    prompt,
    ready: issues.length === 0,
    errors: issues,
    state: issue.state || "open",
    pullRequest: Boolean(issue.pull_request),
  };
}

export function promptForDimensions(prompt, width, height, variation) {
  const output = `## OUTPUT\n\nExact image dimensions: ${width} × ${height} pixels. Preserve the requested aspect ratio and keep the important action within the image bounds. Do not add text, frames, or card UI.`;
  const outputHeader = /^## OUTPUT\s*$/im;
  const outputIndex = prompt.search(outputHeader);
  const body = outputIndex >= 0 ? prompt.slice(0, outputIndex) + output : `${prompt}\n\n${output}`;
  const direction = `## COMPOSITION DIRECTION FOR THIS CANDIDATE\n\n${variation}\n\n`;
  const styleHeader = /^## VISUAL STYLE\s*$/im;
  const styleIndex = body.search(styleHeader);
  return styleIndex >= 0
    ? body.slice(0, styleIndex) + direction + body.slice(styleIndex)
    : `${body}\n\n${direction}`;
}

function jsonResponse(data, status) {
  return new Response(JSON.stringify(data), {
    status: status || 200,
    headers: { "content-type": "application/json; charset=utf-8", "cache-control": "no-store" },
  });
}

function htmlResponse() {
  return new Response(buildPage(), {
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "no-store",
      "content-security-policy":
        "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data:; connect-src 'self'; object-src 'none'; base-uri 'none'; frame-ancestors 'none'",
      "referrer-policy": "strict-origin-when-cross-origin",
      "x-content-type-options": "nosniff",
    },
  });
}

function makePipelineError(message, status) {
  return Object.assign(new Error(message), { status: status || 500 });
}

function assertSameOrigin(request) {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin)
    throw makePipelineError("Cross-origin requests are not allowed.", 403);
}

function requireBucket(env) {
  if (!env.BUCKET || typeof env.BUCKET.get !== "function")
    throw makePipelineError("Image storage is not configured for this Site.", 503);
  return env.BUCKET;
}

async function githubJson(path, env, options) {
  const headers = new Headers(options?.headers || {});
  headers.set("accept", "application/vnd.github+json");
  headers.set("x-github-api-version", "2022-11-28");
  headers.set("user-agent", "dnd-deck-asset-pipeline");
  if (env.GITHUB_TOKEN) headers.set("authorization", `Bearer ${env.GITHUB_TOKEN}`);
  if (options?.body) headers.set("content-type", "application/json");
  const response = await fetch(GITHUB_API + path, { ...options, headers });
  const raw = await response.text();
  let data;
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }
  if (!response.ok) {
    const detail = data.message
      ? String(data.message).slice(0, 220)
      : `GitHub API returned ${response.status}`;
    throw makePipelineError(
      `GitHub request failed: ${detail}`,
      response.status === 401 || response.status === 403 ? 502 : response.status
    );
  }
  return data;
}

async function openIssues(env) {
  const output = [];
  for (let pageNumber = 1; pageNumber <= 10; pageNumber += 1) {
    const query = new URLSearchParams({
      state: "open",
      labels: "ASSET",
      per_page: "100",
      page: String(pageNumber),
    });
    const rows = await githubJson(`/repos/${OWNER}/${REPOSITORY}/issues?${query}`, env);
    if (!Array.isArray(rows))
      throw makePipelineError("GitHub returned an unexpected issue list.", 502);
    output.push(...rows.filter((issue) => !issue.pull_request).map(parseAssetIssue));
    if (rows.length < 100) break;
  }
  output.sort((a, b) => b.number - a.number);
  return output;
}

async function getIssue(number, env) {
  const raw = await githubJson(`/repos/${OWNER}/${REPOSITORY}/issues/${number}`, env);
  if (
    raw.pull_request ||
    raw.state !== "open" ||
    !(raw.labels || []).some((label) => String(label.name).toLowerCase() === "asset")
  ) {
    throw makePipelineError("This is no longer an open ASSET issue.", 404);
  }
  return { raw, parsed: parseAssetIssue(raw) };
}

function toBytes(base64) {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i += 1) bytes[i] = binary.charCodeAt(i);
  return bytes;
}

function toBase64(buffer) {
  const bytes = new Uint8Array(buffer);
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) {
    binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  }
  return btoa(binary);
}

async function openAIJson(response) {
  const body = await response.json().catch(() => ({}));
  if (!response.ok) {
    const detail = body?.error?.message
      ? String(body.error.message).slice(0, 260)
      : `OpenAI API returned ${response.status}`;
    throw makePipelineError(`OpenAI image request failed: ${detail}`, 502);
  }
  return body;
}

async function generateImage(prompt, env, size, quality) {
  if (!env.OPENAI_API_KEY)
    throw makePipelineError(
      "OpenAI image generation is not configured. Add OPENAI_API_KEY as a Site secret.",
      503
    );
  const response = await fetch("https://api.openai.com/v1/images/generations", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}`, "content-type": "application/json" },
    body: JSON.stringify({
      model: IMAGE_MODEL,
      prompt,
      n: 1,
      size,
      quality,
      output_format: "png",
      background: "opaque",
    }),
  });
  const body = await openAIJson(response);
  const image = body.data?.[0]?.b64_json;
  if (!image) throw makePipelineError("OpenAI did not return image bytes.", 502);
  return toBytes(image);
}

async function editImage(prompt, sourceBytes, env, size) {
  if (!env.OPENAI_API_KEY)
    throw makePipelineError(
      "OpenAI image generation is not configured. Add OPENAI_API_KEY as a Site secret.",
      503
    );
  const form = new FormData();
  form.set("model", IMAGE_MODEL);
  form.set("prompt", prompt);
  form.set("size", size);
  form.set("quality", "high");
  form.set("output_format", "png");
  form.set("background", "opaque");
  form.append("image", new Blob([sourceBytes], { type: "image/png" }), "selected-preview.png");
  const response = await fetch("https://api.openai.com/v1/images/edits", {
    method: "POST",
    headers: { authorization: `Bearer ${env.OPENAI_API_KEY}` },
    body: form,
  });
  const body = await openAIJson(response);
  const image = body.data?.[0]?.b64_json;
  if (!image) throw makePipelineError("OpenAI did not return the final image bytes.", 502);
  return toBytes(image);
}

function pngDimensions(bytes) {
  if (
    bytes.length < 24 ||
    bytes[0] !== 137 ||
    bytes[1] !== 80 ||
    bytes[2] !== 78 ||
    bytes[3] !== 71
  )
    return null;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  return { width: view.getUint32(16), height: view.getUint32(20) };
}

function validRunId(value) {
  return typeof value === "string" && /^[0-9a-f-]{20,40}$/i.test(value);
}

function runPrefix(number, runId) {
  return `issues/${number}/runs/${runId}/`;
}

async function saveManifest(bucket, manifest) {
  await bucket.put(manifest.manifestKey, JSON.stringify(manifest), {
    httpMetadata: { contentType: "application/json", cacheControl: "private, no-store" },
  });
}

async function readManifest(bucket, number, runId) {
  if (!validRunId(runId)) throw makePipelineError("Invalid draft run ID.", 400);
  const manifestKey = `${runPrefix(number, runId)}manifest.json`;
  const object = await bucket.get(manifestKey);
  if (!object) throw makePipelineError("Draft run not found. Generate previews again.", 404);
  const manifest = await object.json();
  if (Number(manifest.issueNumber) !== number || manifest.runId !== runId)
    throw makePipelineError("Draft run does not belong to this issue.", 404);
  return manifest;
}

async function getRuns(number, env) {
  const bucket = requireBucket(env);
  const prefix = `issues/${number}/runs/`;
  let cursor;
  const keys = [];
  for (let pageNumber = 0; pageNumber < 4; pageNumber += 1) {
    const page = await bucket.list({ prefix, cursor, limit: 100 });
    keys.push(
      ...page.objects.filter((item) => item.key.endsWith("/manifest.json")).map((item) => item.key)
    );
    if (!page.truncated || !page.cursor) break;
    cursor = page.cursor;
  }
  const manifests = await Promise.all(
    keys.map(async (key) => {
      const object = await bucket.get(key);
      return object ? object.json() : null;
    })
  );
  return manifests
    .filter(Boolean)
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, 8);
}

async function makeDrafts(number, env) {
  const bucket = requireBucket(env);
  if (!env.OPENAI_API_KEY)
    throw makePipelineError(
      "OpenAI image generation is not configured. Add OPENAI_API_KEY as a Site secret.",
      503
    );
  const { raw, parsed } = await getIssue(number, env);
  if (!parsed.ready) throw makePipelineError(parsed.errors.join(" "), 422);
  const dimensions = previewDimensions(parsed.orientation);
  const runId = crypto.randomUUID();
  const prefix = runPrefix(number, runId);
  const attempts = await Promise.allSettled(
    PREVIEW_VARIANTS.map(async (variant) => {
      const prompt = promptForDimensions(
        parsed.prompt,
        dimensions.width,
        dimensions.height,
        variant.note
      );
      const bytes = await generateImage(
        prompt,
        env,
        `${dimensions.width}x${dimensions.height}`,
        "low"
      );
      const size = pngDimensions(bytes);
      if (!size || size.width !== dimensions.width || size.height !== dimensions.height) {
        throw makePipelineError("A preview returned unexpected dimensions.", 502);
      }
      const key = `${prefix}candidate-${variant.id}.png`;
      await bucket.put(key, bytes, {
        httpMetadata: { contentType: "image/png", cacheControl: "private, max-age=3600" },
        customMetadata: { issue: String(number), run: runId, candidate: String(variant.id) },
      });
      return {
        id: variant.id,
        title: variant.title,
        description: variant.note,
        key,
        width: size.width,
        height: size.height,
      };
    })
  );
  const candidates = [];
  const failures = [];
  attempts.forEach((attempt, index) => {
    if (attempt.status === "fulfilled") candidates.push(attempt.value);
    else
      failures.push(
        `Draft 0${PREVIEW_VARIANTS[index].id}: ${String(attempt.reason?.message || "request failed").slice(0, 160)}`
      );
  });
  const manifest = {
    issueNumber: number,
    issueTitle: raw.title,
    assetId: parsed.assetId,
    targetPath: parsed.targetPath,
    orientation: parsed.orientation,
    orientationLabel: parsed.orientationLabel,
    runId,
    manifestKey: `${prefix}manifest.json`,
    createdAt: new Date().toISOString(),
    previewQuality: "low",
    previewModel: IMAGE_MODEL,
    previewSize: dimensions,
    candidates,
    failures,
    finals: {},
  };
  await saveManifest(bucket, manifest);
  if (!candidates.length)
    throw makePipelineError(`All four preview requests failed. ${failures.join(" ")}`, 502);
  return manifest;
}

function validateCandidate(manifest, candidateId) {
  const id = Number(candidateId);
  const candidate = manifest.candidates.find((item) => item.id === id);
  if (!candidate) throw makePipelineError("Choose a candidate from this draft run.", 400);
  return candidate;
}

async function renderFinalImage(number, body, env) {
  const bucket = requireBucket(env);
  const manifest = await readManifest(bucket, number, body.runId);
  const candidate = validateCandidate(manifest, body.candidateId);
  const keyName = String(candidate.id);
  if (manifest.finals?.[keyName]) return { manifest, final: manifest.finals[keyName] };
  const { parsed } = await getIssue(number, env);
  if (!parsed.ready) throw makePipelineError(parsed.errors.join(" "), 422);
  const previewObject = await bucket.get(candidate.key);
  if (!previewObject) throw makePipelineError("The selected preview is no longer available.", 404);
  const sourceBytes = new Uint8Array(await previewObject.arrayBuffer());
  const dimensions = finalDimensions(parsed.orientation);
  const referenceBrief =
    "## SELECTED PREVIEW\n\nThe supplied reference image is the composition selected by the user. Preserve its main action, subject placement, camera view, dominant color mood, and silhouette. Refine the painterly image at higher quality for print. Do not introduce new story elements or change the card scene.";
  const outputHeader = /^## OUTPUT\s*$/im;
  const finalPromptSource = outputHeader.test(parsed.prompt)
    ? parsed.prompt.replace(outputHeader, `${referenceBrief}\n\n## OUTPUT`)
    : `${parsed.prompt}\n\n${referenceBrief}`;
  const prompt = promptForDimensions(
    finalPromptSource,
    dimensions.width,
    dimensions.height,
    candidate.description
  );
  const finalBytes = await editImage(
    prompt,
    sourceBytes,
    env,
    `${dimensions.width}x${dimensions.height}`
  );
  const actual = pngDimensions(finalBytes);
  if (!actual || actual.width !== dimensions.width || actual.height !== dimensions.height) {
    throw makePipelineError(
      `Final render dimensions were ${actual ? `${actual.width} × ${actual.height}` : "unreadable"}; expected ${dimensions.width} × ${dimensions.height}. No PR was opened.`,
      502
    );
  }
  const key = `${runPrefix(number, manifest.runId)}final-${candidate.id}.png`;
  await bucket.put(key, finalBytes, {
    httpMetadata: { contentType: "image/png", cacheControl: "private, max-age=3600" },
    customMetadata: {
      issue: String(number),
      run: manifest.runId,
      candidate: String(candidate.id),
      stage: "final",
    },
  });
  const final = {
    key,
    width: actual.width,
    height: actual.height,
    quality: "high",
    model: IMAGE_MODEL,
    createdAt: new Date().toISOString(),
    candidateId: candidate.id,
  };
  manifest.finals = { ...(manifest.finals || {}), [keyName]: final };
  await saveManifest(bucket, manifest);
  return { manifest, final };
}

function refPath(branch) {
  return branch.split("/").map(encodeURIComponent).join("/");
}

async function openPullRequest(number, body, env) {
  if (!env.GITHUB_TOKEN)
    throw makePipelineError(
      "Pull-request creation is not configured. Add a repository-scoped GITHUB_TOKEN as a Site secret.",
      503
    );
  const bucket = requireBucket(env);
  const manifest = await readManifest(bucket, number, body.runId);
  const candidate = validateCandidate(manifest, body.candidateId);
  const final = manifest.finals?.[String(candidate.id)];
  if (!final)
    throw makePipelineError(
      "Render and review the final image before creating a pull request.",
      409
    );
  if (final.prUrl) return { manifest, final };
  const { raw, parsed } = await getIssue(number, env);
  if (!parsed.ready) throw makePipelineError(parsed.errors.join(" "), 422);
  const finalObject = await bucket.get(final.key);
  if (!finalObject)
    throw makePipelineError("The rendered final image is no longer available.", 404);
  const finalBytes = await finalObject.arrayBuffer();
  const actual = pngDimensions(new Uint8Array(finalBytes));
  if (!actual || actual.width !== final.width || actual.height !== final.height)
    throw makePipelineError("Final image dimensions failed validation.", 422);

  const repo = await githubJson(`/repos/${OWNER}/${REPOSITORY}`, env);
  const base = repo.default_branch || "main";
  const branch = `asset/issue-${number}-${parsed.assetId}-${manifest.runId.slice(0, 8)}-c${candidate.id}`;
  const pullsQuery = new URLSearchParams({ state: "open", head: `${OWNER}:${branch}` });
  const existingPulls = await githubJson(`/repos/${OWNER}/${REPOSITORY}/pulls?${pullsQuery}`, env);
  if (existingPulls.length) {
    final.prUrl = existingPulls[0].html_url;
    final.prNumber = existingPulls[0].number;
    manifest.finals[String(candidate.id)] = final;
    await saveManifest(bucket, manifest);
    return { manifest, final };
  }

  const baseRef = await githubJson(
    `/repos/${OWNER}/${REPOSITORY}/git/ref/heads/${encodeURIComponent(base)}`,
    env
  );
  const baseSha = baseRef.object.sha;
  const baseCommit = await githubJson(`/repos/${OWNER}/${REPOSITORY}/git/commits/${baseSha}`, env);
  const blob = await githubJson(`/repos/${OWNER}/${REPOSITORY}/git/blobs`, env, {
    method: "POST",
    body: JSON.stringify({ content: toBase64(finalBytes), encoding: "base64" }),
  });
  const tree = await githubJson(`/repos/${OWNER}/${REPOSITORY}/git/trees`, env, {
    method: "POST",
    body: JSON.stringify({
      base_tree: baseCommit.tree.sha,
      tree: [{ path: parsed.targetPath, mode: "100644", type: "blob", sha: blob.sha }],
    }),
  });
  const commit = await githubJson(`/repos/${OWNER}/${REPOSITORY}/git/commits`, env, {
    method: "POST",
    body: JSON.stringify({
      message: `Add ${parsed.name} card artwork`,
      tree: tree.sha,
      parents: [baseSha],
    }),
  });
  let branchRef;
  try {
    branchRef = await githubJson(
      `/repos/${OWNER}/${REPOSITORY}/git/ref/heads/${refPath(branch)}`,
      env
    );
  } catch (error) {
    if (error.status !== 404) throw error;
  }
  if (branchRef) {
    await githubJson(`/repos/${OWNER}/${REPOSITORY}/git/refs/heads/${refPath(branch)}`, env, {
      method: "PATCH",
      body: JSON.stringify({ sha: commit.sha, force: false }),
    });
  } else {
    await githubJson(`/repos/${OWNER}/${REPOSITORY}/git/refs`, env, {
      method: "POST",
      body: JSON.stringify({ ref: `refs/heads/${branch}`, sha: commit.sha }),
    });
  }
  const dimensions = `${final.width} × ${final.height}`;
  const pull = await githubJson(`/repos/${OWNER}/${REPOSITORY}/pulls`, env, {
    method: "POST",
    body: JSON.stringify({
      title: `[asset] ${parsed.name} artwork`,
      head: branch,
      base,
      body: `## Generated card artwork\n\n- Asset: \`${parsed.assetId}\`\n- Image: \`${parsed.targetPath}\`\n- Dimensions: ${dimensions} px (${parsed.orientationLabel})\n- Generated with \`${IMAGE_MODEL}\` from the prompt in issue #${number}.\n\nCloses #${number}`,
    }),
  });
  final.prUrl = pull.html_url;
  final.prNumber = pull.number;
  final.branch = branch;
  manifest.finals[String(candidate.id)] = final;
  await saveManifest(bucket, manifest);
  return { manifest, final };
}

async function handleApi(request, env, url) {
  const path = url.pathname;
  if (path === "/api/health" && request.method === "GET") {
    return jsonResponse({
      openAI: Boolean(env.OPENAI_API_KEY),
      github: Boolean(env.GITHUB_TOKEN),
      storage: Boolean(env.BUCKET),
    });
  }
  if (path === "/api/issues" && request.method === "GET") {
    return jsonResponse({ issues: await openIssues(env) });
  }
  if (path === "/api/image" && request.method === "GET") {
    const key = url.searchParams.get("key") || "";
    if (!/^issues\/\d+\/runs\/[0-9a-f-]{20,40}\/(?:candidate-[1-4]|final-[1-4])\.png$/i.test(key))
      throw makePipelineError("Image not found.", 404);
    const image = await requireBucket(env).get(key);
    if (!image) throw makePipelineError("Image not found.", 404);
    const headers = new Headers({
      "content-type": "image/png",
      "cache-control": "private, max-age=3600",
      "x-content-type-options": "nosniff",
    });
    image.writeHttpMetadata(headers);
    return new Response(image.body, { headers });
  }
  const match = path.match(/^\/api\/issues\/(\d+)(?:\/(runs|generations|finals|pull-requests))?$/);
  if (!match) return jsonResponse({ error: "Not found." }, 404);
  const number = Number(match[1]);
  if (!Number.isSafeInteger(number) || number < 1)
    throw makePipelineError("Invalid issue number.", 400);
  const action = match[2] || "detail";
  if (request.method === "GET" && action === "detail") {
    const { parsed } = await getIssue(number, env);
    return jsonResponse(parsed);
  }
  if (request.method === "GET" && action === "runs")
    return jsonResponse({ runs: await getRuns(number, env) });
  if (request.method !== "POST" || !["generations", "finals", "pull-requests"].includes(action))
    return jsonResponse({ error: "Method not allowed." }, 405);
  assertSameOrigin(request);
  if (Number(request.headers.get("content-length") || 0) > 12000)
    throw makePipelineError("Request is too large.", 413);
  if (action === "generations") return jsonResponse({ run: await makeDrafts(number, env) });
  const body = await request.json().catch(() => ({}));
  if (!validRunId(body.runId) || ![1, 2, 3, 4].includes(Number(body.candidateId)))
    throw makePipelineError("A valid draft run and candidate are required.", 400);
  if (action === "finals") {
    const result = await renderFinalImage(number, body, env);
    return jsonResponse({ run: result.manifest, final: result.final });
  }
  const result = await openPullRequest(number, body, env);
  return jsonResponse({ run: result.manifest, final: result.final });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    try {
      if (url.pathname.startsWith("/api/")) return await handleApi(request, env || {}, url);
      if (url.pathname === "/favicon.ico" || url.pathname === "/favicon.svg") {
        return new Response(
          "<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 40 40'><rect width='40' height='40' rx='10' fill='#11161b'/><path d='M21 5 11 23h8l-1 12 11-20h-8z' fill='#e1b96b'/></svg>",
          { headers: { "content-type": "image/svg+xml", "cache-control": "public, max-age=86400" } }
        );
      }
      if (url.pathname === "/" && (request.method === "GET" || request.method === "HEAD"))
        return request.method === "HEAD"
          ? new Response(null, { headers: { "content-type": "text/html; charset=utf-8" } })
          : htmlResponse();
      return new Response("Not found", {
        status: 404,
        headers: {
          "content-type": "text/plain; charset=utf-8",
          "x-content-type-options": "nosniff",
        },
      });
    } catch (error) {
      console.error("Asset pipeline request failed", {
        path: url.pathname,
        message: String(error?.message || error),
      });
      return jsonResponse(
        { error: error instanceof Error ? error.message : "Unexpected server error." },
        error.status || 500
      );
    }
  },
};
