const fs = require("fs");
const path = require("path");

const NOTES_DIR = path.join(__dirname, "notlar");
const PUBLIC_DIR = path.join(__dirname, "public");
const SUBJECTS = [
  { id: "biyoloji", name: "Biyoloji", mark: "BİY", tone: "sage", desc: "Hücreden ekosisteme, canlılığın temelini keşfet." },
  { id: "matematik", name: "Matematik", mark: "MAT", tone: "blue", desc: "Kavramlar, yöntemler ve problem çözme." },
  { id: "kimya", name: "Kimya", mark: "KİM", tone: "amber", desc: "Maddenin yapısı, değişimi ve tepkimeler." },
  { id: "fizik", name: "Fizik", mark: "FİZ", tone: "rose", desc: "Doğanın kuralları ve onları açıklayan modeller." },
  { id: "turkce", name: "Türkçe", mark: "TÜR", tone: "lavender", desc: "Dil bilgisi, anlam ve güçlü bir okuma." }
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
    '<span class="card-art art-' + s.id + '" aria-hidden="true"><span class="art-symbol">' + ({biyoloji:"✳",matematik:"∑",kimya:"⚗",fizik:"◎",turkce:"Aa"}[s.id] || "✳") + '</span><span class="art-label">' + s.mark + '</span></span>' +
    '<span class="card-body"><span class="subject-name">' + s.name + '</span><span class="subject-description">' + s.desc + '</span>' +
    '<span class="card-bottom"><span class="subject-count">' + count + ' not</span><span class="card-arrow" aria-hidden="true">↗</span></span></span></button>';
}).join("\n");
const notesJson = JSON.stringify(notes).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
const subjectsJson = JSON.stringify(SUBJECTS.map(({id,name}) => ({id,name}))).replace(/</g, "\\u003c");

const html = [
'<!doctype html>',
'<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">',
'<meta name="theme-color" content="#f7f4ed"><meta name="description" content="TYT ve AYT ders notların için sade, özenle düzenlenmiş kişisel öğrenme kütüphanesi.">',
'<title>Ders Notları — Kişisel Öğrenme Kütüphanesi</title>',
'<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>',
'<link href="https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Playfair+Display:wght@500;600;700&display=swap" rel="stylesheet"><style>',
':root{color-scheme:light;--paper:#f7f4ed;--ink:#1d3029;--muted:#69766e;--green:#183d30;--line:#e6e0d5;--serif:"Playfair Display",Georgia,serif;--sans:"DM Sans",sans-serif}',
'*{box-sizing:border-box}html{scroll-behavior:smooth;scroll-padding-top:20px}body{margin:0;background:var(--paper);color:var(--ink);font-family:var(--sans);-webkit-font-smoothing:antialiased}button,input{font:inherit}button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid #739582;outline-offset:4px}.shell{width:min(1320px,calc(100% - 80px));margin-inline:auto}',
'.topbar{height:90px;display:flex;align-items:center;justify-content:space-between;border-bottom:1px solid #ded8cd}.brand{display:flex;align-items:center;gap:13px;color:var(--ink);text-decoration:none}.brand-icon{width:38px;height:38px;display:grid;place-items:center;border:1px solid #b9c4b8;border-radius:50%;font-family:var(--serif);font-size:22px;color:var(--green)}.brand-name{font-family:var(--serif);font-size:21px;letter-spacing:-.04em}.brand-sub{margin-left:12px;color:#8a8d80;font-size:11px;letter-spacing:.02em}.top-label{font-size:11px;letter-spacing:.1em;text-transform:uppercase;color:#7c8176}',
'.hero{position:relative;isolation:isolate;min-height:calc(100svh - 90px);display:flex;align-items:center;overflow:hidden;background:#26392e}.hero:before{content:"";position:absolute;inset:0;z-index:-2;background:linear-gradient(90deg,rgba(20,38,29,.88) 0%,rgba(20,38,29,.69) 42%,rgba(20,38,29,.12) 100%),linear-gradient(0deg,rgba(20,38,29,.3),transparent 40%)}.hero-photo{position:absolute;inset:0;z-index:-3;width:100%;height:100%;background-image:url("https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=2400&q=90");background-position:center 54%;background-size:cover;transform:scale(1.015)}.hero-copy{padding:72px 0 110px;max-width:760px;color:#fffaf1}.eyebrow{display:flex;align-items:center;gap:11px;color:#536b59;font-size:10px;font-weight:700;letter-spacing:.2em;text-transform:uppercase}.eyebrow:before{content:"";width:25px;height:1px;background:#7f9984}h1{margin:27px 0 24px;font-family:var(--serif);font-weight:500;font-size:clamp(56px,7.2vw,100px);letter-spacing:-.06em;line-height:1.02;color:#fffaf1}h1 em{font-style:italic;color:#d9c29e}.hero-description{max-width:460px;margin:0;color:#e5e4d8;font-size:15px;line-height:1.9}.hero-signoff{display:inline-flex;align-items:center;gap:12px;margin-top:42px;padding:13px 0 8px;color:#fffaf1;font-size:11px;letter-spacing:.1em;text-transform:uppercase;text-decoration:none;border-bottom:1px solid #d9c29e}.signoff-line{width:28px;height:1px;background:#d9c29e}.hero-ornament{position:absolute;right:5%;bottom:34px;color:#f3eadb;text-align:right;text-shadow:0 1px 15px #0008;font-family:var(--serif);font-size:13px;font-style:italic;letter-spacing:.06em}',
'.subjects-section{padding:70px 0 0}.section-top{display:flex;align-items:end;justify-content:space-between;gap:22px;margin-bottom:22px}.section-kicker{color:#7b8a7b;font-size:10px;letter-spacing:.19em;text-transform:uppercase;font-weight:700}.section-title{margin:9px 0 0;font-family:var(--serif);font-size:clamp(25px,3vw,34px);font-weight:500;letter-spacing:-.045em}.section-caption{margin:0 0 4px;color:#8a8b80;font-family:var(--serif);font-size:13px;font-style:italic}',
'.subject-grid{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:16px}.subject-card{position:relative;display:flex;flex-direction:column;min-width:0;overflow:hidden;padding:0;text-align:left;border:1px solid #e4ded2;border-radius:15px;background:#fffdf8;color:var(--ink);cursor:pointer;box-shadow:0 3px 12px #322c1f05;animation:rise .5s both;animation-delay:calc(var(--i,0)*65ms);transition:transform .24s,border-color .24s,box-shadow .24s}.subject-card:hover{transform:translateY(-5px);border-color:#c7d0c3;box-shadow:0 16px 35px #27382c12}.card-art{position:relative;display:flex;align-items:flex-end;justify-content:space-between;height:205px;overflow:hidden;padding:18px;color:white;background-size:cover;background-position:center}.card-art:before{content:"";position:absolute;inset:0;background:linear-gradient(0deg,rgba(15,28,23,.65),rgba(15,28,23,.02) 75%)}.art-symbol{position:absolute;top:18px;right:18px;z-index:1;display:grid;place-items:center;width:42px;height:42px;border:1px solid #ffffff80;border-radius:50%;background:#172d2540;color:white;font-family:var(--serif);font-size:22px;backdrop-filter:blur(6px)}.art-label{position:relative;z-index:1;color:#fff;font-size:10px;letter-spacing:.22em;font-weight:600}.art-biyoloji{background-image:url("https://images.unsplash.com/photo-1532094349884-543bc11b234d?auto=format&fit=crop&w=800&q=85")}.art-matematik{background-image:url("https://images.unsplash.com/photo-1635070041078-e363dbe005cb?auto=format&fit=crop&w=800&q=85")}.art-kimya{background-image:url("https://images.unsplash.com/photo-1603126857599-f6e157fa2fe6?auto=format&fit=crop&w=800&q=85")}.art-fizik{background-image:url("https://images.unsplash.com/photo-1636466497217-26a8cbeaf0aa?auto=format&fit=crop&w=800&q=85")}.art-turkce{background-image:url("https://images.unsplash.com/photo-1507842217343-583bb7270b66?auto=format&fit=crop&w=800&q=85")}.card-body{display:flex;flex-direction:column;flex:1;padding:18px 18px 17px}.subject-name{font-family:var(--serif);font-size:21px;font-weight:600;letter-spacing:-.04em}.subject-description{display:block;min-height:39px;margin-top:7px;color:#7b8178;font-size:10px;line-height:1.7}.card-bottom{display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:17px;padding-top:13px;border-top:1px solid #e9e5dc}.subject-count{color:#8a8c80;font-size:10px}.card-arrow{display:grid;place-items:center;width:28px;height:28px;border-radius:50%;background:var(--green);color:white;font-size:15px;transition:transform .2s}.blue .card-arrow{background:#38536e}.amber .card-arrow{background:#936126}.rose .card-arrow{background:#794750}.lavender .card-arrow{background:#66517b}.subject-card:hover .card-arrow{transform:translate(2px,-2px)}',
'.search-panel{display:none;margin-top:25px}.search{position:relative;width:min(440px,100%)}.search input{width:100%;height:44px;padding:0 15px 0 43px;border:1px solid #e2ddd3;border-radius:10px;background:#fffdf8;color:var(--ink);font-size:12px;outline:none;transition:border-color .2s,box-shadow .2s}.search input::placeholder{color:#a0a095}.search input:focus{border-color:#a6b8a8;box-shadow:0 0 0 4px #315c4810}.search-icon{position:absolute;left:15px;top:50%;transform:translateY(-50%);font-size:17px;color:#758276;pointer-events:none}.search-results{margin-top:20px}.search-results h3{font-family:var(--serif);font-size:20px;font-weight:500}',
'.lower{display:flex;align-items:center;justify-content:space-between;gap:16px;margin-top:40px;padding:20px 0 25px;border-top:1px solid #e4ded3;color:#8b8d81;font-size:10px}.lower strong{color:#46584b;font-weight:700}.footer-mark{color:#55715b;font-family:var(--serif);font-size:16px;margin-right:8px}',
'.view{padding:32px 0 20px}.back{display:inline-flex;align-items:center;gap:9px;padding:7px 0;border:0;background:transparent;color:#68776b;font-size:12px;cursor:pointer}.back:hover{color:var(--green)}.view-title{margin:21px 0 7px;font-family:var(--serif);font-size:clamp(32px,4vw,47px);font-weight:500;letter-spacing:-.05em}.view-description{margin:0;color:#7c8279;font-size:12px;line-height:1.8}.exam-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:15px;margin:27px 0}.exam-card{display:flex;align-items:center;gap:16px;padding:23px;text-align:left;border:1px solid #e5dfd4;border-radius:14px;background:#fffdf8;color:var(--ink);cursor:pointer;transition:transform .2s,border-color .2s,box-shadow .2s}.exam-card:hover{transform:translateY(-3px);border-color:#bdcbbc;box-shadow:0 12px 30px #27382c0c}.exam-symbol{display:grid;place-items:center;flex:0 0 49px;height:49px;border-radius:50%;background:#e9eee5;color:#355943;font-size:11px;font-weight:700}.exam-copy{flex:1}.exam-name{display:block;font-family:var(--serif);font-size:21px}.exam-sub{display:block;margin-top:5px;color:#898b80;font-size:10px}.exam-count{color:#536d57;font-size:11px;font-weight:700}.note-list{display:grid;gap:9px;margin-top:24px}.note-row{display:flex;align-items:center;gap:14px;padding:15px 17px;border:1px solid #e5dfd4;border-radius:12px;background:#fffdf8;color:inherit;text-decoration:none;transition:transform .18s,border-color .18s}.note-row:hover{transform:translateY(-1px);border-color:#bdcbbc}.file-mark{display:grid;place-items:center;flex:0 0 38px;height:38px;border-radius:10px;background:#e9eee5;color:#385d44;font-size:9px;font-weight:800}.note-copy{flex:1;min-width:0}.note-title{display:block;font-size:12px;font-weight:700;line-height:1.6;overflow-wrap:anywhere}.note-meta{display:block;margin-top:4px;color:#919187;font-size:10px}.open-icon{color:#819080;font-size:18px}.empty{margin-top:22px;padding:30px;border:1px dashed #d9d4c9;border-radius:13px;text-align:center;color:#7d8278;font-size:12px;line-height:1.8}.hidden{display:none!important}',
'@keyframes rise{from{opacity:0;transform:translateY(9px)}to{opacity:1;transform:translateY(0)}}@media(max-width:1050px){.shell{width:calc(100% - 52px)}.subject-grid{grid-template-columns:repeat(3,minmax(0,1fr))}.hero{min-height:410px}.hero-photo{width:62%}.hero-copy{max-width:590px}}@media(max-width:700px){.shell{width:calc(100% - 34px)}.topbar{height:72px}.brand-sub,.top-label{display:none}.hero{min-height:calc(88svh - 72px);display:flex}.hero:before{background:linear-gradient(90deg,rgba(20,38,29,.88),rgba(20,38,29,.48)),linear-gradient(0deg,rgba(20,38,29,.35),transparent)}.hero-photo{width:100%;opacity:1;mask-image:none;background-position:58% center}.hero-copy{padding:55px 0 90px}h1{font-size:clamp(46px,11vw,72px)}.hero-description{max-width:390px;font-size:13px}.hero-ornament{display:none}.card-art{height:155px}.subjects-section{padding-top:32px}.section-top{align-items:flex-start;flex-direction:column;gap:8px}.section-caption{font-size:12px}.subject-grid{grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}.card-art{height:105px}.card-body{padding:14px}.subject-name{font-size:19px}.subject-description{font-size:10px;min-height:34px}.card-bottom{margin-top:12px;padding-top:10px}.exam-grid{grid-template-columns:1fr}.exam-card{padding:17px}.lower{margin-top:30px;align-items:flex-start;flex-direction:column}.search{width:100%}}@media(max-width:370px){.subject-grid{grid-template-columns:1fr}.card-art{height:120px}}@media(prefers-reduced-motion:reduce){*,*::before,*::after{scroll-behavior:auto!important;animation-duration:.01ms!important;transition-duration:.01ms!important}}',
'</style></head><body>',
'<header class="shell topbar"><a class="brand" href="./" aria-label="Ders Notları ana sayfa"><span class="brand-icon" aria-hidden="true">d.</span><span class="brand-name">Ders Notları</span><span class="brand-sub">Kişisel Öğrenme Kütüphanesi</span></a><span class="top-label">TYT + AYT · Kendi ritminde</span></header>',
'<main class="shell"><section id="home"><section class="hero"><div class="hero-photo" aria-hidden="true"></div><div class="hero-copy"><div class="eyebrow">TYT + AYT · Kişisel arşivin</div><h1>Daha iyi bir sen,<br><em>daha güçlü bir gelecek.</em></h1><p class="hero-description">Ders notlarını tek bir yerde, düzenli ve kolay erişilebilir şekilde keşfet. Hedeflerine giden yolda her not, bir adım ileri.</p><a class="hero-signoff" href="#dersler"><span class="signoff-line"></span><span>Derslerini keşfet</span><span aria-hidden="true">↓</span></a></div><div class="hero-ornament">Öğrenmek, kendine açtığın bir yol.</div></section>',
'<section class="subjects-section" id="dersler"><div class="section-top"><div><div class="section-kicker">Öğrenme alanların</div><h2 class="section-title">Hangi dünyayı keşfedeceksin?</h2></div></div><div class="subject-grid" id="subjectGrid">' + cards + '</div></section></section>',
'<section id="examView" class="view hidden" aria-live="polite"><button class="back" type="button" id="backHome">← <span>Tüm dersler</span></button><div class="eyebrow" id="subjectEyebrow">DERS KATALOĞU</div><h2 class="view-title" id="subjectTitle"></h2><p class="view-description">Hangi sınava hazırlanıyorsan oradan devam et.</p><div class="exam-grid" id="examGrid"></div></section>',
'<section id="notesView" class="view hidden" aria-live="polite"><button class="back" type="button" id="backExams">← <span>TYT / AYT seçimine dön</span></button><div class="eyebrow" id="notesEyebrow">KONU LİSTESİ</div><h2 class="view-title" id="notesTitle"></h2><p class="view-description" id="notesDescription">Bir konuya tıkladığında not yeni sekmede açılır.</p><div class="note-list" id="noteList"></div></section></main>',
'<footer class="shell lower"><span><span class="footer-mark">✳</span><strong>Ders Notları</strong> · Küçük adımlar, büyük hedefler.</span><span>Özenle düzenlenmiş kişisel öğrenme arşivin.</span></footer>',
'<script>const NOTES = ' + notesJson + ';const SUBJECTS = ' + subjectsJson + ';const EXAMS=["TYT","AYT"];',
'const home=document.getElementById("home"),examView=document.getElementById("examView"),notesView=document.getElementById("notesView");let activeSubject=null;',
'function normText(v){return String(v).toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/İ/g,"i").normalize("NFD").replace(/[\\u0300-\\u036f]/g,"")}',
'function escText(v){return String(v).replace(/[&<>"\\x27]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",\'"\':"&quot;","\\x27":"&#39;"}[c]))}',
'function noteLink(n){return \'<a class="note-row" href="\' + escText(n.href) + \'" target="_blank" rel="noopener noreferrer"><span class="file-mark">\' + escText(n.ext) + \'</span><span class="note-copy"><span class="note-title">\' + escText(n.title) + \'</span><span class="note-meta">\' + escText(n.exam) + \' · \' + escText(n.filename) + \'</span></span><span class="open-icon" aria-hidden="true">↗</span></a>\'}',
'function showHome(){home.classList.remove("hidden");examView.classList.add("hidden");notesView.classList.add("hidden");activeSubject=null;document.getElementById("subjectGrid").classList.remove("hidden")}',
'function showSubject(id){activeSubject=id;const s=SUBJECTS.find(x=>x.id===id);if(!s)return;home.classList.add("hidden");notesView.classList.add("hidden");examView.classList.remove("hidden");document.getElementById("subjectEyebrow").textContent="DERS KATALOĞU / "+s.name.toLocaleUpperCase("tr-TR");document.getElementById("subjectTitle").textContent=s.name;document.getElementById("examGrid").innerHTML=EXAMS.map(e=>{const count=NOTES.filter(n=>n.subject===id&&n.exam===e).length;return \'<button class="exam-card" type="button" data-exam="\' + e + \'"><span class="exam-symbol">\' + e + \'</span><span class="exam-copy"><span class="exam-name">\' + e + \'</span><span class="exam-sub">\' + (e==="TYT"?"Temel yeterlilik konuları":"Alan yeterlilik konuları") + \'</span></span><span class="exam-count">\' + count + \' not →</span></button>\'}).join("");document.getElementById("examGrid").querySelectorAll("[data-exam]").forEach(b=>b.addEventListener("click",()=>showNotes(id,b.dataset.exam)));window.scrollTo({top:0,behavior:"smooth"})}',
'function showNotes(id,exam){activeSubject=id;const s=SUBJECTS.find(x=>x.id===id),filtered=NOTES.filter(n=>n.subject===id&&n.exam===exam);examView.classList.add("hidden");notesView.classList.remove("hidden");document.getElementById("notesEyebrow").textContent=s.name.toLocaleUpperCase("tr-TR")+" / "+exam;document.getElementById("notesTitle").textContent=exam+" "+s.name;document.getElementById("notesDescription").textContent=filtered.length?filtered.length+" dosya · Bir konuya tıkladığında not yeni sekmede açılır.":"Bu bölümde henüz not yok. İlgili klasöre dosya eklediğinde burada otomatik görünür.";document.getElementById("noteList").innerHTML=filtered.length?filtered.map(noteLink).join(""):\'<div class="empty">Burada şimdilik sessiz.<br><strong>Yeni notlar eklendikçe</strong> bu liste otomatik dolacak.</div>\';window.scrollTo({top:0,behavior:"smooth"})}',
'document.querySelectorAll("[data-subject]").forEach(b=>b.addEventListener("click",()=>showSubject(b.dataset.subject)));document.getElementById("backHome").addEventListener("click",showHome);document.getElementById("backExams").addEventListener("click",()=>showSubject(activeSubject));',
'</body></html>'
].join("\n");

fs.writeFileSync(path.join(PUBLIC_DIR, "index.html"), html, "utf8");
console.log("Ders Arşivi oluşturuldu — " + notes.length + " dosya listelendi.");
