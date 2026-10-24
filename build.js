const fs = require("fs");
const path = require("path");

const NOTES_DIR = path.join(__dirname, "notlar");
const PUBLIC_DIR = path.join(__dirname, "public");
const SUBJECTS = [
  { id: "biyoloji", name: "Biyoloji", mark: "BİY", tone: "sage", desc: "Hücreden ekosisteme, canlılığın temelini keşfet." },
  { id: "matematik", name: "Matematik", mark: "MAT", tone: "blue", desc: "Kavramlar, yöntemler ve problem çözme." },
  { id: "kimya", name: "Kimya", mark: "KİM", tone: "amber", desc: "Maddenin yapısı, değişimi ve tepkimeler." },
  { id: "fizik", name: "Fizik", mark: "FİZ", tone: "rose", desc: "Doğanın kuralları ve onları açıklayan modeller." }
];
const EXAMS = ["TYT", "AYT"];

function listFiles(dir, base = "") {
  if (!fs.existsSync(dir)) return [];
  let result = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + "/" + entry.name : entry.name;
    if (entry.isDirectory()) result = result.concat(listFiles(path.join(dir, entry.name), rel));
    else if (entry.name !== ".gitkeep" && entry.name !== "README.txt" && !entry.name.startsWith(".")) result.push(rel);
  }
  return result;
}
function norm(value) {
  return String(value).toLocaleLowerCase("tr-TR").replace(/ı/g, "i").replace(/İ/g, "i")
    .normalize("NFD").replace(/[\u0300-\u036f]/g, "");
}
function classify(file) {
  const parts = file.split("/");
  const filename = parts[parts.length - 1];
  const stem = filename.replace(/\.[^.]+$/, "");
  const normalized = norm(file);
  let subject = SUBJECTS.find((s) => parts.some((p) => norm(p) === s.id));
  if (!subject) subject = SUBJECTS.find((s) => norm(stem).includes(s.id)) || null;
  if (!subject) subject = SUBJECTS.find((s) => normalized.includes(s.id)) || null;
  let exam = EXAMS.find((e) => parts.some((p) => norm(p) === norm(e))) || null;
  if (!exam) {
    const match = stem.match(/(?:^|\b)(TYT|AYT)(?:\b|\s*[-–—])/i);
    if (match) exam = match[1].toUpperCase();
  }
  const title = stem.replace(/^(TYT|AYT)\s*[-–—:]?\s*/i, "")
    .replace(/^(Biyoloji|Matematik|Kimya|Fizik)\s*[-–—:]?\s*/i, "").replace(/\s+/g, " ").trim() || stem;
  const ext = path.extname(filename).slice(1).toUpperCase() || "DOSYA";
  const href = "notlar/" + file.split("/").map(encodeURIComponent).join("/");
  return { file, title, filename, href, ext, subject: subject ? subject.id : "diger", exam: exam || "Belirtilmemiş" };
}
function esc(value) {
  return String(value).replace(/[&<>"']/g, (c) => ({ "&":"&amp;", "<":"&lt;", ">":"&gt;", '"':"&quot;", "'":"&#39;" }[c]));
}

const files = listFiles(NOTES_DIR).sort((a, b) => a.localeCompare(b, "tr"));
const notes = files.map(classify);
if (fs.existsSync(PUBLIC_DIR)) fs.rmSync(PUBLIC_DIR, { recursive: true, force: true });
fs.mkdirSync(path.join(PUBLIC_DIR, "notlar"), { recursive: true });
for (const file of files) {
  const src = path.join(NOTES_DIR, file);
  const dst = path.join(PUBLIC_DIR, "notlar", file);
  fs.mkdirSync(path.dirname(dst), { recursive: true });
  fs.copyFileSync(src, dst);
}

const cards = SUBJECTS.map((s, i) => {
  const count = notes.filter((n) => n.subject === s.id).length;
  return '<button class="subject-card ' + s.tone + '" type="button" data-subject="' + s.id + '" style="--i:' + i + '">' +
    '<span class="card-top"><span class="subject-mark">' + s.mark + '</span><span class="card-arrow">↗</span></span>' +
    '<span class="subject-name">' + s.name + '</span><span class="subject-description">' + s.desc + '</span>' +
    '<span class="card-bottom"><span class="subject-count">' + count + ' not</span><span class="text-link">Dersi keşfet →</span></span></button>';
}).join("\n");
const notesJson = JSON.stringify(notes).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
const subjectsJson = JSON.stringify(SUBJECTS.map(({id,name}) => ({id,name}))).replace(/</g, "\\u003c");

const html = [
'<!doctype html>',
'<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
'<meta name="theme-color" content="#f5f4ef"><meta name="description" content="TYT ve AYT ders notları — sade, düzenli ve kolay erişilebilir.">',
'<title>Ders Arşivi — Notlar</title><style>',
':root{color-scheme:light;--paper:#f5f4ef;--surface:#fffefa;--ink:#202a25;--muted:#7b827b;--line:#e5e6de;--green:#315c48;--shadow:0 14px 40px rgba(37,49,40,.055)}',
'*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--paper);color:var(--ink);font-family:Inter,ui-sans-serif,system-ui,-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;-webkit-font-smoothing:antialiased}',
'button,input{font:inherit}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #89a997;outline-offset:3px}.shell{width:min(1120px,calc(100% - 48px));margin:0 auto}',
'.topbar{height:76px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--line)}.brand{display:flex;align-items:center;gap:11px;color:var(--ink);text-decoration:none;font-size:15px;font-weight:750;letter-spacing:-.035em}',
'.brand-symbol{width:34px;height:34px;border-radius:11px;background:var(--green);color:#fff;display:grid;place-items:center;font-size:17px;box-shadow:0 5px 12px #315c4825}.brand-sub{color:var(--muted);font-size:12px;font-weight:500;letter-spacing:0;margin-left:3px}',
'.top-meta{display:flex;align-items:center;gap:8px;color:var(--muted);font-size:12px}.status-dot{width:7px;height:7px;border-radius:50%;background:#6c9c7a;box-shadow:0 0 0 4px #6c9c7a18}',
'.hero{padding:70px 0 42px;display:grid;grid-template-columns:minmax(0,1fr) 240px;align-items:end;gap:40px}.eyebrow{display:flex;align-items:center;gap:10px;color:var(--green);text-transform:uppercase;letter-spacing:.16em;font-size:10px;font-weight:800}.eyebrow:before{content:"";width:22px;height:1px;background:#8ba394}',
'h1{margin:19px 0 16px;max-width:700px;font-size:clamp(38px,5.3vw,64px);line-height:1.02;letter-spacing:-.065em;font-weight:720}h1 em{color:var(--green);font-family:Georgia,"Times New Roman",serif;font-weight:500}.hero-copy{max-width:530px;margin:0;color:#737b73;font-size:15px;line-height:1.8}',
'.hero-note{justify-self:end;width:100%;max-width:230px;padding:20px;background:#e9ece4;border:1px solid #e0e4da;border-radius:17px}.hero-note-label{color:#778177;font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.13em}.hero-note-number{display:block;margin-top:10px;font-size:36px;line-height:1;letter-spacing:-.06em;font-weight:750}.hero-note-caption{display:block;margin-top:7px;color:#69736a;font-size:12px}',
'.toolbar{display:flex;align-items:center;justify-content:space-between;gap:18px;margin:12px 0 17px}.section-heading{display:flex;align-items:baseline;gap:12px}.section-heading h2{margin:0;font-size:18px;letter-spacing:-.04em}.section-kicker{color:#92978e;font-size:11px}',
'.search{position:relative;width:min(300px,100%)}.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:#8b938a;font-size:17px;pointer-events:none}.search input{width:100%;height:43px;padding:0 14px 0 40px;border:1px solid #e1e3db;border-radius:12px;color:var(--ink);background:#fbfaf6;font-size:12px;outline:none;transition:border-color .18s,box-shadow .18s}.search input::placeholder{color:#9b9f97}.search input:focus{border-color:#a6b9aa;box-shadow:0 0 0 4px #315c4810}',
'.subject-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:14px}.subject-card{min-height:244px;text-align:left;border:1px solid #e3e5dd;border-radius:17px;padding:20px;display:flex;flex-direction:column;align-items:stretch;color:var(--ink);cursor:pointer;box-shadow:0 2px 5px #24352b04;transition:transform .2s,box-shadow .2s,border-color .2s;animation:rise .45s both;animation-delay:calc(var(--i,0)*55ms)}.subject-card:hover{transform:translateY(-4px);box-shadow:var(--shadow);border-color:#cbd5ca}',
'.sage{background:#e9eee5}.blue{background:#e9edf1}.amber{background:#f2eee4}.rose{background:#f1e9e5}.card-top{display:flex;align-items:center;justify-content:space-between}.subject-mark{width:40px;height:40px;border:1px solid #526c571b;border-radius:13px;display:grid;place-items:center;color:#365743;background:#ffffff85;font-size:10px;letter-spacing:.04em;font-weight:800}.blue .subject-mark{color:#405a72}.amber .subject-mark{color:#80663a}.rose .subject-mark{color:#86574c}.card-arrow{color:#8c958b;font-size:19px;transition:transform .2s}.subject-card:hover .card-arrow{transform:translate(2px,-2px)}',
'.subject-name{display:block;margin-top:25px;font-size:20px;font-weight:750;letter-spacing:-.045em}.subject-description{display:block;margin-top:7px;color:#747d74;font-size:11px;line-height:1.6;min-height:36px}.card-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:19px}.subject-count{color:#747e74;font-size:10px}.text-link{color:var(--green);font-size:10px;font-weight:750;white-space:nowrap}',
'.lower{margin-top:34px;padding:19px 0 24px;border-top:1px solid var(--line);display:flex;align-items:center;justify-content:space-between;gap:16px;color:#858b82;font-size:11px}.lower strong{color:#535e54;font-weight:700}.footer-right{display:flex;align-items:center;gap:8px}.tiny-mark{width:18px;height:18px;border-radius:6px;display:grid;place-items:center;color:var(--green);background:#e4e9df;font-size:10px}',
'.view{padding:34px 0 20px}.back{display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;color:#667366;padding:8px 0;cursor:pointer;font-size:12px}.back:hover{color:var(--green)}.view-title{margin:20px 0 8px;font-size:clamp(28px,4vw,42px);letter-spacing:-.06em}.view-description{margin:0;color:var(--muted);font-size:13px;line-height:1.7}',
'.exam-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:14px;margin:27px 0 14px}.exam-card{padding:23px;display:flex;align-items:center;gap:18px;text-align:left;background:var(--surface);border:1px solid var(--line);border-radius:15px;cursor:pointer;transition:.2s}.exam-card:hover{border-color:#b8c9bb;transform:translateY(-2px);box-shadow:var(--shadow)}.exam-symbol{flex:0 0 48px;height:48px;border-radius:14px;display:grid;place-items:center;background:#e8eee5;color:var(--green);font-weight:800;font-size:13px}.exam-copy{flex:1}.exam-name{display:block;font-weight:750;font-size:17px;letter-spacing:-.03em}.exam-sub{display:block;margin-top:5px;color:var(--muted);font-size:11px}.exam-count{color:var(--green);font-size:12px;font-weight:750}',
'.note-list{display:grid;gap:9px;margin-top:25px}.note-row{display:flex;align-items:center;gap:15px;padding:16px 18px;border:1px solid var(--line);border-radius:13px;background:var(--surface);text-decoration:none;color:inherit;transition:border-color .18s,transform .18s,box-shadow .18s}.note-row:hover{border-color:#b8c9bb;transform:translateY(-1px);box-shadow:0 7px 20px #24352b08}.file-mark{flex:0 0 39px;height:39px;display:grid;place-items:center;border-radius:11px;color:var(--green);background:#eaf0e7;font-size:10px;font-weight:850}.note-copy{min-width:0;flex:1}.note-title{display:block;font-size:13px;font-weight:700;line-height:1.5;overflow-wrap:anywhere}.note-meta{display:block;margin-top:4px;color:#8b9189;font-size:10px}.open-icon{color:#899389;font-size:18px}.empty{margin-top:25px;padding:32px;border:1px dashed #d4d9cf;border-radius:15px;text-align:center;color:#7e867c;font-size:13px;line-height:1.8}.hidden{display:none!important}',
'@keyframes rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}@media(max-width:900px){.subject-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.hero{grid-template-columns:minmax(0,1fr) 190px;gap:24px;padding-top:56px}.subject-card{min-height:220px}}',
'@media(max-width:600px){.shell{width:min(100% - 32px,480px)}.topbar{height:64px}.brand-sub,.top-meta{display:none}.hero{display:block;padding:44px 0 27px}h1{font-size:43px;margin-top:17px}.hero-copy{font-size:13px}.hero-note{display:flex;align-items:center;gap:12px;max-width:none;margin-top:24px;padding:14px 16px}.hero-note-number{font-size:28px;margin:0}.hero-note-caption{margin:0}.toolbar{align-items:stretch;flex-direction:column;gap:14px}.search{width:100%}.subject-grid{gap:10px}.subject-card{min-height:214px;padding:15px;border-radius:14px}.subject-name{font-size:17px;margin-top:20px}.subject-description{font-size:10px}.card-bottom{align-items:flex-start;flex-direction:column;gap:7px;padding-top:14px}.lower{align-items:flex-start;flex-direction:column;padding-top:16px}.exam-grid{grid-template-columns:1fr}.exam-card{padding:18px}.note-row{padding:13px;gap:11px}.note-title{font-size:12px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}',
'</style></head><body>',
'<header class="shell topbar"><a class="brand" href="./" aria-label="Ders Arşivi ana sayfa"><span class="brand-symbol">n.</span><span>Ders Arşivi <span class="brand-sub">/ kişisel çalışma alanı</span></span></a><div class="top-meta"><span class="status-dot"></span><span>Notların düzenli, odağın yerinde</span></div></header>',
'<main class="shell"><section id="home"><div class="hero"><div><div class="eyebrow">Kişisel öğrenme kütüphanen</div><h1>Bilgini düzenle.<br><em>İlerlemene odaklan.</em></h1><p class="hero-copy">Ders notların tek bir yerde, ihtiyacın olduğunda elinin altında. Bir ders seç, TYT veya AYT konularına geç ve çalışmaya kaldığın yerden devam et.</p></div><aside class="hero-note"><div><span class="hero-note-label">Arşivde</span><span class="hero-note-number">' + notes.length + '</span></div><span class="hero-note-caption">çalışma dosyası<br>ve büyümeye hazır</span></aside></div>',
'<div class="toolbar"><div class="section-heading"><h2>Derslerin</h2><span class="section-kicker">01 — 04</span></div><label class="search"><span class="search-icon">⌕</span><input id="searchInput" type="search" placeholder="Notlarda ara…" autocomplete="off" aria-label="Notlarda ara"></label></div>',
'<div class="subject-grid" id="subjectGrid">' + cards + '</div><section id="searchResults" class="search-results hidden" aria-live="polite"></section></section>',
'<section id="examView" class="view hidden" aria-live="polite"><button class="back" type="button" id="backHome">← <span>Tüm dersler</span></button><div class="eyebrow" id="subjectEyebrow">DERS KATALOĞU</div><h2 class="view-title" id="subjectTitle"></h2><p class="view-description">Hangi sınava hazırlanıyorsan oradan devam et.</p><div class="exam-grid" id="examGrid"></div></section>',
'<section id="notesView" class="view hidden" aria-live="polite"><button class="back" type="button" id="backExams">← <span>TYT / AYT seçimine dön</span></button><div class="eyebrow" id="notesEyebrow">KONU LİSTESİ</div><h2 class="view-title" id="notesTitle"></h2><p class="view-description" id="notesDescription">Bir konuya tıkladığında not yeni sekmede açılır.</p><div class="note-list" id="noteList"></div></section></main>',
'<footer class="shell lower"><span><strong>Ders Arşivi</strong> · Kendi ritminde, kendi yolunda.</span><span class="footer-right"><span class="tiny-mark">n.</span><span>Her not, bir adım ileri.</span></span></footer>',
'<script>const NOTES = ' + notesJson + ';const SUBJECTS = ' + subjectsJson + ';const EXAMS=["TYT","AYT"];',
'const home=document.getElementById("home"),examView=document.getElementById("examView"),notesView=document.getElementById("notesView"),searchInput=document.getElementById("searchInput"),searchResults=document.getElementById("searchResults");let activeSubject=null;',
'function normText(v){return String(v).toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/İ/g,"i").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"")}',
'function escText(v){return String(v).replace(/[&<>"\\x27]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;","\\x27":"&#39;"}[c]))}',
'function noteLink(n){return \'<a class="note-row" href="\' + escText(n.href) + \'" target="_blank" rel="noopener noreferrer"><span class="file-mark">\' + escText(n.ext) + \'</span><span class="note-copy"><span class="note-title">\' + escText(n.title) + \'</span><span class="note-meta">\' + escText(n.exam) + \' · \' + escText(n.filename) + \'</span></span><span class="open-icon">↗</span></a>\'}',
'function showHome(){home.classList.remove("hidden");examView.classList.add("hidden");notesView.classList.add("hidden");activeSubject=null}',
'function showSubject(id){activeSubject=id;const s=SUBJECTS.find(x=>x.id===id);if(!s)return;home.classList.add("hidden");notesView.classList.add("hidden");examView.classList.remove("hidden");document.getElementById("subjectEyebrow").textContent="DERS KATALOĞU / "+s.name.toLocaleUpperCase("tr-TR");document.getElementById("subjectTitle").textContent=s.name;document.getElementById("examGrid").innerHTML=EXAMS.map(e=>{const count=NOTES.filter(n=>n.subject===id&&n.exam===e).length;return \'<button class="exam-card" type="button" data-exam="\' + e + \'"><span class="exam-symbol">\' + e + \'</span><span class="exam-copy"><span class="exam-name">\' + e + \'</span><span class="exam-sub">\' + (e==="TYT"?"Temel yeterlilik konuları":"Alan yeterlilik konuları") + \'</span></span><span class="exam-count">\' + count + \' not →</span></button>\'}).join("");document.getElementById("examGrid").querySelectorAll("[data-exam]").forEach(b=>b.addEventListener("click",()=>showNotes(id,b.dataset.exam)));window.scrollTo({top:0,behavior:"smooth"})}',
'function showNotes(id,exam){activeSubject=id;const s=SUBJECTS.find(x=>x.id===id),filtered=NOTES.filter(n=>n.subject===id&&n.exam===exam);examView.classList.add("hidden");notesView.classList.remove("hidden");document.getElementById("notesEyebrow").textContent=s.name.toLocaleUpperCase("tr-TR")+" / "+exam;document.getElementById("notesTitle").textContent=exam+" "+s.name;document.getElementById("notesDescription").textContent=filtered.length?filtered.length+" dosya · Bir konuya tıkladığında not yeni sekmede açılır.":"Bu bölümde henüz not yok. İlgili klasöre dosya eklediğinde burada otomatik görünür.";document.getElementById("noteList").innerHTML=filtered.length?filtered.map(noteLink).join(\'\'):\'<div class="empty">Burada şimdilik sessiz.<br><strong>Yeni notlar eklendikçe</strong> bu liste otomatik dolacak.</div>\';window.scrollTo({top:0,behavior:"smooth"})}',
'document.querySelectorAll("[data-subject]").forEach(b=>b.addEventListener("click",()=>showSubject(b.dataset.subject)));document.getElementById("backHome").addEventListener("click",showHome);document.getElementById("backExams").addEventListener("click",()=>showSubject(activeSubject));',
'searchInput.addEventListener("input",()=>{const q=normText(searchInput.value.trim());if(!q){searchResults.classList.add("hidden");document.getElementById("subjectGrid").classList.remove("hidden");return}const found=NOTES.filter(n=>normText([n.title,n.filename,n.subject,n.exam].join(" ")).includes(q));document.getElementById("subjectGrid").classList.add("hidden");searchResults.classList.remove("hidden");searchResults.innerHTML="<h3>"+found.length+" sonuç bulundu</h3>"+(found.length?\'<div class="note-list">\'+found.map(noteLink).join("")+\'</div>\':\'<div class="empty">Bu aramayla eşleşen not yok.<br>Başka bir kelime deneyebilirsin.</div>\')});</script>',
'</body></html>'
].join("\n");

fs.writeFileSync(path.join(PUBLIC_DIR, "index.html"), html, "utf8");
console.log("Ders Arşivi oluşturuldu — " + notes.length + " dosya listelendi.");
