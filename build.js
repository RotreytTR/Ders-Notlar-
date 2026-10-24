const fs = require("fs");
const path = require("path");

const NOTES_DIR = path.join(__dirname, "notlar");
const PUBLIC_DIR = path.join(__dirname, "public");
const SUBJECTS = [
  { id: "turkce", name: "Türkçe", mark: "TÜR", tone: "violet", color: "#8b5cf6", noExam: true, desc: "Anlam, dil bilgisi, paragraf ve yazım." },
  { id: "matematik", name: "Matematik", mark: "MAT", tone: "blue", color: "#3b6bff", desc: "Kavramlar, yöntemler ve problem çözme." },
  { id: "biyoloji", name: "Biyoloji", mark: "BİY", tone: "sage", color: "#1f9d63", desc: "Hücreden ekosisteme, canlılığın temelini keşfet." },
  { id: "kimya", name: "Kimya", mark: "KİM", tone: "amber", color: "#f59e0b", desc: "Maddenin yapısı, değişimi ve tepkimeler." },
  { id: "fizik", name: "Fizik", mark: "FİZ", tone: "rose", color: "#e03a6d", desc: "Doğanın kuralları ve onları açıklayan modeller." }
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

const CSS = String.raw`
:root{color-scheme:light dark;--bg:#ece2cf;--cd:#f6efe0;--tx:#17140f;--mu:#6e6350;--e:#e8630a;--bd:#cfc09f;--tone:#e8630a;--serif:"Iowan Old Style","Palatino Linotype",Georgia,serif;--px:clamp(16px,4vw,56px)}
@media(prefers-color-scheme:dark){:root{--bg:#161310;--cd:#211c16;--tx:#efe6d6;--mu:#a89d88;--e:#ff7a1a;--bd:#3d3529}}
*{box-sizing:border-box}html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
button,input{font:inherit;color:inherit}button{background:none;border:0;padding:0}
button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid var(--e);outline-offset:-3px}
.hidden{display:none!important}
.app{min-height:100vh;min-height:100svh;display:flex;flex-direction:column}

.top{display:flex;align-items:center;justify-content:space-between;gap:14px;height:64px;padding:0 var(--px);flex:none}
.brand{display:flex;align-items:center;gap:10px;font-family:var(--serif);font-size:20px;font-weight:700;letter-spacing:-.02em}.brand i{width:10px;height:10px;border-radius:50%;background:var(--e)}
.search{position:relative;width:min(280px,58%)}.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--mu);font-size:16px;pointer-events:none}
.search input{width:100%;height:40px;padding:0 14px 0 38px;border:1px solid var(--bd);border-radius:99px;background:var(--cd);font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s}.search input::placeholder{color:var(--mu)}.search input:focus{border-color:var(--e);box-shadow:0 0 0 4px rgba(232,99,10,.15)}

#home{flex:1;display:flex;flex-direction:column;min-height:0}
.rows{flex:1;display:flex;flex-direction:column}
.row{position:relative;flex:1;min-height:78px;display:grid;grid-template-columns:clamp(46px,7vw,110px) minmax(0,1fr) auto;align-items:center;gap:clamp(8px,2vw,28px);padding:0 var(--px);border-top:1px solid var(--bd);text-align:left;cursor:pointer;transition:padding-left .4s cubic-bezier(.2,.8,.2,1)}
.row:last-child{border-bottom:1px solid var(--bd)}
.row:after{content:"";position:absolute;left:0;bottom:-1px;height:3px;width:0;background:var(--c);transition:width .5s cubic-bezier(.2,.8,.2,1)}
.row:hover,.row:focus-visible{padding-left:calc(var(--px) + 12px)}.row:hover:after,.row:focus-visible:after{width:100%}
.rno{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:800;letter-spacing:.18em;color:var(--mu)}.rno i{width:9px;height:9px;border-radius:50%;background:var(--c)}
.rname{display:block;font-family:var(--serif);font-weight:700;font-size:clamp(30px,min(6.2vw,8.6vh),92px);font-size:clamp(30px,min(6.2vw,8.6svh),92px);line-height:1.02;letter-spacing:-.035em}
.rdesc{display:block;margin-top:4px;color:var(--mu);font-size:clamp(12px,1.1vw,15px);line-height:1.4}
.rmeta{display:flex;align-items:center;gap:16px;font-size:13px;color:var(--mu)}
.rarrow{width:42px;height:42px;display:grid;place-items:center;border:1.5px solid var(--bd);border-radius:50%;color:var(--tx);font-size:18px;transition:background .3s,border-color .3s,color .3s,transform .4s}
.row:hover .rarrow,.row:focus-visible .rarrow{background:var(--c);border-color:var(--c);color:#fff;transform:rotate(45deg)}

.results{padding:8px var(--px) 28px;flex:1}.results h3{margin:10px 0 0;font-family:var(--serif);font-size:24px}

.view{flex:1;display:flex;flex-direction:column;min-height:100vh;min-height:100svh}
.vhead{padding:clamp(16px,3vw,32px) var(--px) clamp(18px,3vh,32px);flex:none}
.back{display:inline-flex;align-items:center;gap:10px;padding:9px 16px 9px 12px;border:1px solid var(--bd);border-radius:99px;background:var(--cd);cursor:pointer;font-size:13px;font-weight:650;transition:border-color .2s,transform .2s}.back:hover{border-color:var(--tone);transform:translateX(-3px)}
.eyebrow{display:flex;align-items:center;gap:12px;margin-top:clamp(18px,4vh,44px);color:var(--tone);text-transform:uppercase;letter-spacing:.2em;font-size:12px;font-weight:800}.eyebrow:before{content:"";width:34px;height:2px;background:var(--tone)}
.vtitle{margin:.12em 0 .15em;font-family:var(--serif);font-size:clamp(46px,9vw,120px);line-height:.98;letter-spacing:-.04em}
.vdesc{margin:0;color:var(--mu);font-size:15px;line-height:1.6}

.halves{flex:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));border-top:1px solid var(--bd)}
.half{position:relative;display:flex;flex-direction:column;justify-content:space-between;gap:14px;min-height:200px;padding:clamp(20px,3vw,44px) var(--px);text-align:left;cursor:pointer;transition:background .3s}
.half+.half{border-left:1px solid var(--bd)}
.half:after{content:"";position:absolute;left:0;bottom:0;height:4px;width:0;background:var(--tone);transition:width .5s cubic-bezier(.2,.8,.2,1)}.half:hover:after{width:100%}
.half:hover{background:var(--cd)}
.hlabel{align-self:flex-start;display:flex;align-items:center;gap:9px;font-size:12px;font-weight:800;letter-spacing:.16em;text-transform:uppercase;color:var(--mu)}.hlabel:before{content:"";width:9px;height:9px;border-radius:50%;background:var(--tone)}
.hname{display:block;font-family:var(--serif);font-weight:700;font-size:clamp(64px,11vw,170px);line-height:.95;letter-spacing:-.045em}
.hsub{display:block;margin-top:8px;color:var(--mu);font-size:15px}.hcount{font-size:14px;font-weight:750}

.nlist{flex:1;border-top:1px solid var(--bd)}
.nrow{position:relative;display:grid;grid-template-columns:clamp(46px,7vw,110px) minmax(0,1fr) auto;align-items:center;gap:clamp(8px,2vw,28px);padding:clamp(16px,2.6vh,26px) var(--px);border-bottom:1px solid var(--bd);text-decoration:none;color:inherit;transition:padding-left .4s cubic-bezier(.2,.8,.2,1),background .3s}
.nrow:hover{padding-left:calc(var(--px) + 12px);background:var(--cd)}
.nrow:after{content:"";position:absolute;left:0;bottom:-1px;height:3px;width:0;background:var(--tone);transition:width .5s cubic-bezier(.2,.8,.2,1)}.nrow:hover:after{width:100%}
.nno{display:flex;align-items:center;gap:9px;font-size:13px;font-weight:800;letter-spacing:.18em;color:var(--mu)}.nno i{width:9px;height:9px;border-radius:50%;background:var(--tone)}
.ntitle{display:block;font-family:var(--serif);font-size:clamp(20px,2.6vw,32px);font-weight:700;line-height:1.2;letter-spacing:-.02em;overflow-wrap:anywhere}.nmeta{display:block;margin-top:3px;color:var(--mu);font-size:12px;overflow-wrap:anywhere}
.next{display:flex;align-items:center;gap:14px;font-size:11px;font-weight:850;letter-spacing:.1em;color:var(--mu)}.next b{width:40px;height:40px;display:grid;place-items:center;border:1.5px solid var(--bd);border-radius:50%;font-size:17px;color:var(--tx);font-weight:400;transition:background .3s,border-color .3s,color .3s,transform .4s}
.nrow:hover .next b{background:var(--tone);border-color:var(--tone);color:#fff;transform:rotate(45deg)}
.empty{margin:28px var(--px);padding:30px;border:1px dashed var(--bd);border-radius:18px;text-align:center;color:var(--mu);font-size:14px;line-height:1.7}

@media(max-width:700px){
.top{height:58px}.brand{font-size:18px}
.row{grid-template-columns:40px minmax(0,1fr) auto;min-height:72px}.rdesc{display:none}.rcount{display:none}.rarrow{width:36px;height:36px;font-size:16px}.rno span{display:none}
.halves{grid-template-columns:1fr}.half+.half{border-left:0;border-top:1px solid var(--bd)}.hname{font-size:clamp(56px,20vw,96px)}
.nrow{grid-template-columns:34px minmax(0,1fr) auto}.nno span{display:none}.next span{display:none}
}
@media(prefers-reduced-motion:reduce){*,*:before,*:after{animation-duration:.01ms!important;transition-duration:.01ms!important}}
`;

const CLIENT = String.raw`
const NOTES=__NOTES__;const SUBJECTS=__SUBJECTS__;const EXAMS=["TYT","AYT"];
const $=function(id){return document.getElementById(id)};
const home=$("home"),examView=$("examView"),notesView=$("notesView"),searchInput=$("searchInput"),searchResults=$("searchResults"),rows=$("subjectGrid");
let activeSubject=null;
function normText(v){return String(v).toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/İ/g,"i").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function escText(v){return String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function pad(i){return (i+1<10?"0":"")+(i+1)}
function noteRow(n,i){const ex=(n.exam==="TYT"||n.exam==="AYT")?n.exam+" · ":"";return '<a class="nrow" href="'+escText(n.href)+'" target="_blank" rel="noopener noreferrer"><span class="nno"><i></i><span>'+pad(i)+'</span></span><span><span class="ntitle">'+escText(n.title)+'</span><span class="nmeta">'+escText(ex+n.filename)+'</span></span><span class="next"><span>'+escText(n.ext)+'</span><b>↗</b></span></a>'}
function subj(id){return SUBJECTS.find(function(x){return x.id===id})}

function showHome(){home.classList.remove("hidden");examView.classList.add("hidden");notesView.classList.add("hidden");activeSubject=null;window.scrollTo(0,0)}
function showSubject(id){const s=subj(id);if(!s)return;activeSubject=id;document.documentElement.style.setProperty("--tone",s.color);
if(s.noExam)return showNotes(id,null);
home.classList.add("hidden");notesView.classList.add("hidden");examView.classList.remove("hidden");$("subjectEyebrow").textContent="DERS KATALOĞU / "+s.name.toLocaleUpperCase("tr-TR");$("subjectTitle").textContent=s.name;
$("examGrid").innerHTML=EXAMS.map(function(e){const c=NOTES.filter(function(n){return n.subject===id&&n.exam===e}).length;return '<button class="half" type="button" data-exam="'+e+'"><span class="hlabel">'+escText(s.name)+'</span><span><span class="hname">'+e+'</span><span class="hsub">'+(e==="TYT"?"Temel yeterlilik konuları":"Alan yeterlilik konuları")+'</span></span><span class="hcount">'+c+' not →</span></button>'}).join("");
$("examGrid").querySelectorAll("[data-exam]").forEach(function(b){b.addEventListener("click",function(){showNotes(id,b.dataset.exam)})});window.scrollTo(0,0)}
function showNotes(id,exam){const s=subj(id);activeSubject=id;document.documentElement.style.setProperty("--tone",s.color);
const filtered=NOTES.filter(function(n){return n.subject===id&&(!exam||n.exam===exam)});home.classList.add("hidden");examView.classList.add("hidden");notesView.classList.remove("hidden");
$("backExamsLabel").textContent=exam?"TYT / AYT seçimine dön":"Tüm dersler";
$("notesEyebrow").textContent=s.name.toLocaleUpperCase("tr-TR")+(exam?" / "+exam:"");$("notesTitle").textContent=(exam?exam+" ":"")+s.name;
$("notesDescription").textContent=filtered.length?filtered.length+" dosya · Bir konuya tıkladığında not yeni sekmede açılır.":"Bu bölümde henüz not yok. İlgili klasöre dosya eklediğinde burada otomatik görünür.";
$("noteList").innerHTML=filtered.length?filtered.map(noteRow).join(""):'<div class="empty">Burada şimdilik sessiz.<br><strong>Yeni notlar eklendikçe</strong> bu liste otomatik dolacak.</div>';window.scrollTo(0,0)}
rows.querySelectorAll("[data-subject]").forEach(function(b){b.addEventListener("click",function(){showSubject(b.dataset.subject)})});
$("backHome").addEventListener("click",showHome);
$("backExams").addEventListener("click",function(){const s=subj(activeSubject);if(!s||s.noExam)showHome();else showSubject(activeSubject)});

searchInput.addEventListener("input",function(){const q=normText(searchInput.value.trim());if(!q){searchResults.classList.add("hidden");rows.classList.remove("hidden");return}
const found=NOTES.filter(function(n){return normText([n.title,n.filename,n.subject,n.exam].join(" ")).includes(q)});rows.classList.add("hidden");searchResults.classList.remove("hidden");
searchResults.innerHTML="<h3>"+found.length+" sonuç bulundu</h3>"+(found.length?'<div style="margin:14px calc(var(--px)*-1) 0;border-top:1px solid var(--bd)">'+found.map(noteRow).join("")+"</div>":'<div class="empty" style="margin:16px 0 0">Bu aramayla eşleşen not yok.<br>Başka bir kelime deneyebilirsin.</div>')});
`;

const subjectsClient = SUBJECTS.map(({ id, name, color, noExam }) => ({ id, name, color, noExam: !!noExam }));
const notesJson = JSON.stringify(notes).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
const subjectsJson = JSON.stringify(subjectsClient).replace(/</g, "\\u003c");

const rowsHtml = SUBJECTS.map((s, i) => {
  const count = notes.filter((n) => n.subject === s.id).length;
  return `<button class="row" type="button" data-subject="${s.id}" style="--c:${s.color}"><span class="rno"><i></i><span>0${i + 1}</span></span><span><span class="rname">${s.name}</span><span class="rdesc">${s.desc}</span></span><span class="rmeta"><span class="rcount">${count} not</span><span class="rarrow">↗</span></span></button>`;
}).join("\n");

const BODY = `<div class="app">
<section id="home"><header class="top"><div class="brand"><i></i>Ders Arşivi</div><label class="search"><span class="search-icon">⌕</span><input id="searchInput" type="search" placeholder="Notlarda ara…" autocomplete="off" aria-label="Notlarda ara"></label></header>
<div class="rows" id="subjectGrid">${rowsHtml}</div><section id="searchResults" class="results hidden" aria-live="polite"></section></section>
<section id="examView" class="view hidden" aria-live="polite"><div class="vhead"><button class="back" type="button" id="backHome">← <span>Tüm dersler</span></button><div class="eyebrow" id="subjectEyebrow">DERS KATALOĞU</div><h2 class="vtitle" id="subjectTitle"></h2><p class="vdesc">Hangi sınava hazırlanıyorsan oradan devam et.</p></div><div class="halves" id="examGrid"></div></section>
<section id="notesView" class="view hidden" aria-live="polite"><div class="vhead"><button class="back" type="button" id="backExams">← <span id="backExamsLabel">TYT / AYT seçimine dön</span></button><div class="eyebrow" id="notesEyebrow">KONU LİSTESİ</div><h2 class="vtitle" id="notesTitle"></h2><p class="vdesc" id="notesDescription">Bir konuya tıkladığında not yeni sekmede açılır.</p></div><div class="nlist" id="noteList"></div></section>
</div>`;

const client = CLIENT.replace("__NOTES__", () => notesJson).replace("__SUBJECTS__", () => subjectsJson);
const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#ece2cf"><meta name="description" content="TYT ve AYT ders notları — sade, düzenli ve kolay erişilebilir.">
<title>Ders Arşivi — Notlar</title><style>${CSS}</style></head><body>
${BODY}
<script>${client}</script>
</body></html>`;

fs.writeFileSync(path.join(PUBLIC_DIR, "index.html"), html, "utf8");
console.log("Ders Arşivi oluşturuldu — " + notes.length + " dosya listelendi.");
