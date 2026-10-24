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
'<meta name="theme-color" content="#ece2cf"><meta name="description" content="TYT ve AYT ders notları — sade, düzenli ve kolay erişilebilir.">',
'<title>Ders Arşivi — Notlar</title><style>',
':root{color-scheme:light dark;--bg:#ece2cf;--cd:#f6efe0;--tx:#17140f;--mu:#6e6350;--e:#e8630a;--bd:#cfc09f;--so:#e1d4bb;--q:#f7ddc2;--shadow:0 12px 30px rgba(23,20,15,.16)}@media(prefers-color-scheme:dark){:root{--bg:#161310;--cd:#211c16;--tx:#efe6d6;--mu:#a89d88;--e:#ff7a1a;--bd:#3d3529;--so:#2c261d;--q:#3a2412;--shadow:0 12px 30px rgba(0,0,0,.5)}}',
'*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;padding:env(safe-area-inset-top,0px) env(safe-area-inset-right,0px) env(safe-area-inset-bottom,0px) env(safe-area-inset-left,0px)}',
'button,input{font:inherit}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid var(--e);outline-offset:3px}.shell{width:min(1080px,calc(100% - 32px));margin:0 auto}',
'.topbar{height:56px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid var(--bd)}.brand{display:flex;align-items:center;gap:10px;color:var(--tx);text-decoration:none;font-size:15px;font-weight:750;letter-spacing:-.02em}',
'.brand-symbol{width:32px;height:32px;border-radius:10px;background:var(--tx);color:var(--bg);display:grid;place-items:center;font:700 16px Georgia,serif}.brand-sub{color:var(--mu);font-size:12px;font-weight:500;letter-spacing:0;margin-left:3px}',
'.top-meta{display:flex;align-items:center;gap:8px;color:var(--mu);font-size:12px}.status-dot{width:8px;height:8px;border-radius:50%;background:var(--e);box-shadow:0 0 0 4px rgba(232,99,10,.18)}',
'.hero{padding:34px 0 22px;display:grid;grid-template-columns:minmax(0,1fr) auto;align-items:end;gap:24px}.eyebrow{display:flex;align-items:center;gap:10px;color:var(--e);text-transform:uppercase;letter-spacing:.16em;font-size:11px;font-weight:800}.eyebrow:before{content:"";width:22px;height:2px;background:var(--e)}',
'h1{margin:12px 0 10px;max-width:720px;font-family:"Iowan Old Style","Palatino Linotype",Georgia,serif;font-size:clamp(34px,5.6vw,60px);line-height:1.04;letter-spacing:-.03em;font-weight:700}h1 em{color:var(--e);font-style:italic;font-weight:600}.hero-copy{max-width:520px;margin:0;color:var(--mu);font-size:15px;line-height:1.65}',
'.hero-note{padding:14px 20px;background:var(--tx);color:var(--bg);border-radius:16px;min-width:150px}.hero-note-label{color:var(--e);font-size:10px;font-weight:800;text-transform:uppercase;letter-spacing:.13em}.hero-note-number{display:block;margin-top:4px;font:700 38px/1 Georgia,serif}.hero-note-caption{display:block;margin-top:4px;opacity:.7;font-size:12px;line-height:1.4}',
'.toolbar{display:flex;align-items:center;justify-content:space-between;gap:16px;margin:6px 0 14px}.section-heading{display:flex;align-items:baseline;gap:12px}.section-heading h2{margin:0;font-family:Georgia,serif;font-size:22px}.section-kicker{color:var(--mu);font-size:12px}',
'.search{position:relative;width:min(320px,100%)}.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--mu);font-size:17px;pointer-events:none}.search input{width:100%;height:44px;padding:0 14px 0 40px;border:1px solid var(--bd);border-radius:12px;color:var(--tx);background:var(--cd);font-size:14px;outline:none;transition:border-color .18s,box-shadow .18s}.search input::placeholder{color:var(--mu)}.search input:focus{border-color:var(--e);box-shadow:0 0 0 4px rgba(232,99,10,.15)}',
'.subject-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px}.subject-card{min-height:210px;text-align:left;border:1px solid var(--bd);border-radius:18px;padding:18px;display:flex;flex-direction:column;align-items:stretch;color:var(--tx);cursor:pointer;transition:transform .2s,box-shadow .2s;animation:rise .45s both;animation-delay:calc(var(--i,0)*55ms)}.subject-card:hover{transform:translateY(-4px);box-shadow:var(--shadow)}',
'.sage{background:var(--cd)}.blue{background:var(--tx);color:var(--bg);border-color:var(--tx)}.amber{background:var(--e);color:#17140f;border-color:var(--e)}.rose{background:var(--so)}.card-top{display:flex;align-items:center;justify-content:space-between}.subject-mark{width:42px;height:42px;border:1.5px solid currentColor;border-radius:13px;display:grid;place-items:center;font-size:11px;letter-spacing:.04em;font-weight:800}.card-arrow{font-size:20px;transition:transform .2s}.subject-card:hover .card-arrow{transform:translate(3px,-3px)}',
'.subject-name{display:block;margin-top:20px;font-family:Georgia,serif;font-size:24px;font-weight:700;letter-spacing:-.02em}.subject-description{display:block;margin-top:6px;opacity:.75;font-size:13px;line-height:1.5}.card-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:auto;padding-top:16px;font-size:12px}.subject-count{opacity:.75}.text-link{font-weight:750;white-space:nowrap}',
'.lower{margin-top:26px;padding:14px 0 18px;border-top:1px solid var(--bd);display:flex;align-items:center;justify-content:space-between;gap:16px;color:var(--mu);font-size:12px}.lower strong{color:var(--tx);font-weight:700}.footer-right{display:flex;align-items:center;gap:8px}.tiny-mark{width:20px;height:20px;border-radius:6px;display:grid;place-items:center;color:var(--bg);background:var(--tx);font:700 11px Georgia,serif}',
'.view{padding:18px 0 8px}.back{display:inline-flex;align-items:center;gap:8px;border:0;background:transparent;color:var(--mu);padding:6px 0;cursor:pointer;font-size:13px}.back:hover{color:var(--e)}.view-title{margin:12px 0 6px;font-family:Georgia,serif;font-size:clamp(30px,4.6vw,46px);line-height:1.1;letter-spacing:-.02em}.view-description{margin:0;color:var(--mu);font-size:14px;line-height:1.6}',
'.exam-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:12px;margin:20px 0 10px}.exam-card{padding:20px;display:flex;align-items:center;gap:16px;text-align:left;background:var(--cd);color:var(--tx);border:1px solid var(--bd);border-radius:16px;cursor:pointer;transition:.2s}.exam-card:hover{border-color:var(--e);transform:translateY(-2px);box-shadow:var(--shadow)}.exam-symbol{flex:0 0 50px;height:50px;border-radius:14px;display:grid;place-items:center;background:var(--tx);color:var(--bg);font-weight:800;font-size:13px}.exam-copy{flex:1}.exam-name{display:block;font-family:Georgia,serif;font-weight:700;font-size:20px}.exam-sub{display:block;margin-top:3px;color:var(--mu);font-size:12px}.exam-count{color:var(--e);font-size:13px;font-weight:750}',
'.search-results h3{margin:6px 0 0;font-family:Georgia,serif;font-size:20px}.note-list{display:grid;gap:8px;margin-top:16px}.note-row{display:flex;align-items:center;gap:14px;padding:14px 16px;border:1px solid var(--bd);border-left:4px solid var(--e);border-radius:14px;background:var(--cd);text-decoration:none;color:inherit;transition:transform .18s,box-shadow .18s}.note-row:hover{transform:translateY(-1px);box-shadow:var(--shadow)}.file-mark{flex:0 0 42px;height:42px;display:grid;place-items:center;border-radius:11px;color:var(--bg);background:var(--tx);font-size:10px;font-weight:850}.note-copy{min-width:0;flex:1}.note-title{display:block;font-size:15px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}.note-meta{display:block;margin-top:3px;color:var(--mu);font-size:11px;overflow-wrap:anywhere}.open-icon{color:var(--e);font-size:20px}.empty{margin-top:16px;padding:28px;border:1px dashed var(--bd);border-radius:15px;text-align:center;color:var(--mu);font-size:14px;line-height:1.7}.hidden{display:none!important}',
'@keyframes rise{from{opacity:0;transform:translateY(7px)}to{opacity:1;transform:translateY(0)}}@media(max-width:900px){.subject-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.subject-card{min-height:190px}}',
'@media(max-width:600px){.shell{width:calc(100% - 24px)}.topbar{height:50px}.brand-sub,.top-meta{display:none}.hero{display:block;padding:22px 0 16px}h1{font-size:36px;margin:10px 0 8px}.hero-copy{font-size:14px}.hero-note{display:flex;align-items:center;gap:12px;margin-top:14px;padding:10px 14px}.hero-note-number{font-size:26px;margin:0}.hero-note-caption{margin:0}.hero-note-caption br{display:none}.toolbar{align-items:stretch;flex-direction:column;gap:10px;margin-top:0}.search{width:100%}.subject-grid{gap:10px}.subject-card{min-height:170px;padding:14px;border-radius:16px}.subject-mark{width:36px;height:36px;border-radius:11px}.subject-name{font-size:20px;margin-top:14px}.subject-description{font-size:12px}.card-bottom{align-items:flex-start;flex-direction:column;gap:4px;padding-top:10px}.lower{align-items:flex-start;flex-direction:column;gap:8px;margin-top:18px}.exam-grid{grid-template-columns:1fr;margin-top:14px}.exam-card{padding:16px}.note-row{padding:12px;gap:10px}.note-title{font-size:14px}.view{padding-top:10px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}',
'</style></head><body>',
'<header class="shell topbar"><a class="brand" href="./" aria-label="Ders Arşivi ana sayfa"><span class="brand-symbol">n.</span><span>Ders Arşivi <span class="brand-sub">/ kişisel çalışma alanı</span></span></a><div class="top-meta"><span class="status-dot"></span><span>Notların düzenli, odağın yerinde</span></div></header>',
'<main class="shell"><section id="home"><div class="hero"><div><div class="eyebrow">Kişisel öğrenme kütüphanen</div><h1>Bilgini düzenle.<br><em>İlerlemene odaklan.</em></h1><p class="hero-copy">Ders notların tek bir yerde, ihtiyacın olduğunda elinin altında. Bir ders seç, TYT veya AYT konularına geç ve çalışmaya kaldığın yerden devam et.</p></div><aside class="hero-note"><div><span class="hero-note-label">Arşivde</span><span class="hero-note-number">' + notes.length + '</span></div><span class="hero-note-caption">çalışma dosyası <br>ve büyümeye hazır</span></aside></div>',
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
