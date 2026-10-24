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

/* --- Marka simgesi (kitap + turuncu nokta) --- */
const BOOK_PATHS = '<path d="M14 26 Q30 16 46 26 L46 61 Q30 51 14 61 Z"/><path d="M46 26 Q62 16 78 26 L78 61 Q62 51 46 61 Z"/><path d="M46 26 V61"/>';
function bookSvg(cls, sw, draw) {
  const paths = draw ? BOOK_PATHS.replace(/<path /g, '<path pathLength="1" ') : BOOK_PATHS;
  return '<svg class="' + cls + '" viewBox="10 12 76 54" aria-hidden="true"><g fill="none" stroke="currentColor" stroke-width="' + sw + '" stroke-linecap="round" stroke-linejoin="round">' + paths + '</g></svg>';
}
const faviconHref = 'data:image/svg+xml,' + encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" viewBox="8 10 80 58"><style>@media(prefers-color-scheme:dark){g{stroke:#efe6d6}circle{fill:#ff7a1a}}</style><g fill="none" stroke="#211E19" stroke-width="5.5" stroke-linecap="round" stroke-linejoin="round">' + BOOK_PATHS + '</g><circle cx="78" cy="26" r="5" fill="#E8630A"/></svg>');

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

/* --- Ünite algılama ve otomatik kategorileştirme --- */
/* Not başlığındaki ünite numarasını bulur: "1. Ünite", "1.ünite", "1 Ünite",
   "Ünite 3", "Birinci Ünite", "III. Ünite" gibi tüm yaygın biçimler desteklenir. */
const WORD_ORDS = [
  ["on birinci", 11], ["on ikinci", 12], ["on ucuncu", 13], ["on dorduncu", 14],
  ["on besinci", 15], ["on altinci", 16], ["on yedinci", 17], ["on sekizinci", 18], ["on dokuzuncu", 19],
  ["birinci", 1], ["ikinci", 2], ["ucuncu", 3], ["dorduncu", 4], ["besinci", 5],
  ["altinci", 6], ["yedinci", 7], ["sekizinci", 8], ["dokuzuncu", 9], ["onuncu", 10],
  ["yirminci", 20], ["otuzuncu", 30]
];
const ROMAN_ORDS = [["x", 10], ["ix", 9], ["viii", 8], ["vii", 7], ["vi", 6], ["v", 5], ["iv", 4], ["iii", 3], ["ii", 2], ["i", 1]];
function unitOf(title) {
  const t = norm(title).replace(/\s+/g, " ");
  let m = t.match(/\b(\d{1,2})\s*[.)\]]?\s*unite\b/);
  if (m) return parseInt(m[1], 10);
  m = t.match(/\bunite\s*(\d{1,2})\b/);
  if (m) return parseInt(m[1], 10);
  for (const [w, n] of WORD_ORDS) {
    if (new RegExp("\\b" + w + "\\b").test(t)) return n;
  }
  for (const [r, n] of ROMAN_ORDS) {
    if (new RegExp("\\b" + r + "\\.?\\s+unite\\b").test(t) || new RegExp("\\bunite\\s+" + r + "\\b").test(t)) return n;
  }
  return null;
}
/* Sıralama anahtarı: yazı ile yazılan ünite adlarını rakam biçimine çevirip
   noktalama/space farklarını yumuşatır. Böylece "Birinci Ünite Notu" ile
   "1. Ünite Notu" aynı anahtara düşer; eşitlikte kısa ad aşağıya alınır. */
function unitKey(title) {
  let t = " " + norm(title).replace(/\s+/g, " ").trim() + " ";
  for (const [w, n] of WORD_ORDS) t = t.replace(new RegExp("\\b" + w + "\\b", "g"), n + ".");
  t = t.replace(/\bunite\s*(\d{1,2})\b/g, "$1. unite");
  t = t.replace(/\b(\d{1,2})\s*[.)\]]?\s*unite\b/g, "$1. unite");
  return t.replace(/[^\p{L}\p{N}]+/gu, " ").trim();
}
const subjectOrder = {};
SUBJECTS.forEach((s, i) => { subjectOrder[s.id] = i; });
function compareNotes(a, b) {
  const sa = subjectOrder[a.subject] !== undefined ? subjectOrder[a.subject] : 999;
  const sb = subjectOrder[b.subject] !== undefined ? subjectOrder[b.subject] : 999;
  if (sa !== sb) return sa - sb;
  const ua = a.unit, ub = b.unit;
  if (ua !== null && ub !== null && ua !== ub) return ua - ub;
  if (ua !== null && ub === null) return -1;
  if (ua === null && ub !== null) return 1;
  const c = unitKey(a.title).localeCompare(unitKey(b.title), "tr");
  if (c !== 0) return c;
  return b.title.length - a.title.length;
}

const files = listFiles(NOTES_DIR).sort((a, b) => a.localeCompare(b, "tr"));
const notes = files.map((file) => {
  const n = classify(file);
  n.unit = unitOf(n.title);
  return n;
}).sort(compareNotes);
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
.brand{display:flex;align-items:center;gap:10px;font-family:var(--serif);font-size:20px;font-weight:700;letter-spacing:-.02em}.bmark{position:relative;display:inline-flex;flex:none}.bicon{display:block;width:29px;height:21px;color:var(--tx)}.brand .bdot{position:absolute;left:89.5%;top:25.9%;width:6px;height:6px;border-radius:50%;background:var(--e);transform:translate(-50%,-50%)}
.search{position:relative;width:min(280px,58%)}.search-icon{position:absolute;left:14px;top:50%;transform:translateY(-50%);color:var(--mu);font-size:16px;pointer-events:none}
.search input{width:100%;height:40px;padding:0 14px 0 38px;border:1px solid var(--bd);border-radius:99px;background:var(--cd);font-size:14px;outline:none;transition:border-color .2s,box-shadow .2s}.search input::placeholder{color:var(--mu)}.search input:focus{border-color:var(--e);box-shadow:0 0 0 4px rgba(232,99,10,.15)}
.sghost{position:absolute;left:38px;right:16px;top:0;height:40px;display:flex;align-items:center;color:var(--mu);font-size:14px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;pointer-events:none;opacity:0;transition:opacity .18s ease;cursor:pointer}.sghost.on{opacity:1;pointer-events:auto}.search.hasghost input::placeholder{color:transparent}

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

/* --- Açılış sahnesi (Arc tarzı) --- */
.intro{position:fixed;inset:0;z-index:60;display:grid;place-items:center;background:var(--bg);pointer-events:none;transition:opacity .45s ease .15s}
.intro.fade{opacity:0}
.ilogo{display:flex;align-items:center;gap:clamp(18px,3vw,28px)}
.ibook-wrap{position:relative;display:block;animation:ibookin .55s cubic-bezier(.2,.85,.25,1) both}
.ibook{display:block;width:clamp(88px,15vw,142px);height:auto;color:var(--tx);transition:transform .85s cubic-bezier(.2,.85,.25,1)}
.ibook path{stroke-dasharray:1;stroke-dashoffset:1;animation:idraw .75s .1s ease-out forwards}
.idotpos{position:absolute;left:89.5%;top:25.9%;width:0;height:0;transition:transform .85s cubic-bezier(.2,.85,.25,1)}
.idot{position:absolute;left:0;top:0;width:clamp(13px,2vw,17px);height:clamp(13px,2vw,17px);border-radius:50%;background:var(--e);box-shadow:0 18px 50px rgba(232,99,10,.35);transform:translate(-50%,-50%);animation:idotin .45s .4s cubic-bezier(.2,.85,.25,1) both}
.iname{position:relative;font-family:var(--serif);font-weight:700;font-size:clamp(36px,7vw,64px);letter-spacing:-.035em;color:var(--tx);white-space:nowrap;animation:inamein .55s .16s cubic-bezier(.2,.85,.25,1) both;transition:transform .85s cubic-bezier(.2,.85,.25,1)}
.iname:after{content:"";position:absolute;left:3px;bottom:-12px;width:clamp(40px,6vw,58px);height:3px;border-radius:3px;background:var(--e);transition:opacity .3s ease}
.intro.depart .iname:after{opacity:0}
@keyframes ibookin{from{opacity:0;transform:scale(.82)}to{opacity:1;transform:scale(1)}}
@keyframes idraw{to{stroke-dashoffset:0}}
@keyframes idotin{from{opacity:0;transform:translate(-50%,-50%) scale(.4)}to{opacity:1;transform:translate(-50%,-50%) scale(1)}}
@keyframes inamein{from{opacity:0;transform:translateY(14px)}to{opacity:1;transform:none}}
html.introing .brand{opacity:0}
.btxt{display:inline-block}

@media(max-width:700px){
.top{height:58px}.brand{font-size:18px}.bicon{width:26px;height:19px}
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
$("examGrid").innerHTML=EXAMS.map(function(e,idx){const c=NOTES.filter(function(n){return n.subject===id&&n.exam===e}).length;return '<button class="half" type="button" data-exam="'+e+'"><span class="hlabel">'+pad(idx)+' · '+escText(s.name)+'</span><span><span class="hname">'+e+'</span><span class="hsub">'+(e==="TYT"?"Temel yeterlilik konuları":"Alan yeterlilik konuları")+'</span></span><span class="hcount">'+c+' not →</span></button>'}).join("");
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

/* --- Son açılan not (hayalet metin) --- */
const LVKEY="dersArsivi:lastNote";const searchBox=document.querySelector(".search"),ghost=$("searchGhost");
function readLast(){try{return JSON.parse(localStorage.getItem(LVKEY))}catch(e){return null}}
document.addEventListener("click",function(e){const a=e.target.closest("a.nrow");if(!a)return;const n=NOTES.find(function(x){return x.href===a.getAttribute("href")});if(n){try{localStorage.setItem(LVKEY,JSON.stringify({href:n.href,title:n.title,filename:n.filename,subject:n.subject,exam:n.exam,ext:n.ext,ts:Date.now()}))}catch(err){}}});
function renderSearch(){const q=normText(searchInput.value.trim());
if(!q){searchResults.classList.add("hidden");rows.classList.remove("hidden");return}
const found=NOTES.filter(function(n){return normText([n.title,n.filename,n.subject,n.exam].join(" ")).includes(q)});
rows.classList.add("hidden");searchResults.classList.remove("hidden");
searchResults.innerHTML="<h3>"+found.length+" sonuç bulundu</h3>"+(found.length?'<div style="margin:14px calc(var(--px)*-1) 0;border-top:1px solid var(--bd)">'+found.map(noteRow).join("")+"</div>":'<div class="empty" style="margin:16px 0 0">Bu aramayla eşleşen not yok.<br>Başka bir kelime deneyebilirsin.</div>')}
function updateGhost(){const n=(document.activeElement===searchInput&&searchInput.value==="")?readLast():null;
if(n&&n.title){ghost.textContent=n.title;searchBox.classList.add("hasghost");ghost.classList.add("on")}
else{searchBox.classList.remove("hasghost");ghost.classList.remove("on")}}
function materializeLast(){const n=readLast();if(!n||!n.title)return false;searchInput.value=n.title;updateGhost();renderSearch();const L=searchInput.value.length;try{searchInput.setSelectionRange(L,L)}catch(e){}return true}

/* --- / kısayolu --- */
document.addEventListener("keydown",function(e){if(e.key!=="/")return;const t=document.activeElement&&document.activeElement.tagName;if(t==="INPUT"||t==="TEXTAREA")return;if(!home.classList.contains("hidden")){e.preventDefault();searchInput.focus()}});

/* --- ESC ile geri + rakam kısayolları --- */
function numTargets(){
if(document.getElementById("intro"))return[];
if(!notesView.classList.contains("hidden"))return Array.prototype.slice.call($("noteList").querySelectorAll("a.nrow"));
if(!examView.classList.contains("hidden"))return Array.prototype.slice.call($("examGrid").querySelectorAll("[data-exam]"));
if(!home.classList.contains("hidden"))return searchResults.classList.contains("hidden")?Array.prototype.slice.call(rows.querySelectorAll("[data-subject]")):Array.prototype.slice.call(searchResults.querySelectorAll("a.nrow"));
return[]}
let numStr="",numT=null;
document.addEventListener("keydown",function(e){
if(e.key==="Escape"){
if(e.defaultPrevented)return;const tg=document.activeElement&&document.activeElement.tagName;
if(tg==="INPUT"||tg==="TEXTAREA")return;
if(document.getElementById("intro"))return;
if(!notesView.classList.contains("hidden")){const s=subj(activeSubject);if(!s||s.noExam)showHome();else showSubject(activeSubject);return}
if(!examView.classList.contains("hidden")){showHome();return}
if(!home.classList.contains("hidden")&&searchInput.value!==""){searchInput.value="";updateGhost();renderSearch()}return}
if(!/^[1-9]$/.test(e.key))return;
if(e.ctrlKey||e.metaKey||e.altKey)return;
const tk=document.activeElement&&document.activeElement.tagName;
if(tk==="INPUT"||tk==="TEXTAREA")return;
if(document.getElementById("intro"))return;
const targets=numTargets();const count=targets.length;if(!count)return;
if(count>9){
if(numT){clearTimeout(numT);numT=null;const two=parseInt(numStr+e.key,10);numStr="";if(two<=count&&targets[two-1].offsetParent!==null)targets[two-1].click();return}
numStr=e.key;numT=setTimeout(function(){numT=null;const n=parseInt(numStr,10);numStr="";if(n<=count&&targets[n-1].offsetParent!==null)targets[n-1].click()},700);return}
e.preventDefault();targets[parseInt(e.key,10)-1].click()});

ghost.addEventListener("mousedown",function(e){e.preventDefault()});
ghost.addEventListener("click",function(){if(document.activeElement===searchInput&&searchInput.value==="")materializeLast()});
searchInput.addEventListener("focus",updateGhost);
searchInput.addEventListener("blur",updateGhost);
searchInput.addEventListener("input",function(){updateGhost();renderSearch()});
searchInput.addEventListener("keydown",function(e){
if(e.key==="Escape"){e.preventDefault();if(searchInput.value!==""){searchInput.value="";updateGhost();renderSearch()}else{searchInput.blur()}return}
if(searchInput.value!==""||!readLast())return;
if(e.key==="ArrowLeft"||e.key==="End"){e.preventDefault();materializeLast()}});

/* --- Açılış sahnesi (Arc tarzı, oturumda bir kez) --- */
(function(){const intro=$("intro");if(!intro)return;
const rm=window.matchMedia&&window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let seen=null;try{seen=sessionStorage.getItem("dersArsivi:intro")}catch(e){}
if(rm||seen){intro.remove();return}
try{sessionStorage.setItem("dersArsivi:intro","1")}catch(e){}
const H=document.documentElement;H.classList.add("introing");
const book=intro.querySelector(".ibook"),dotpos=intro.querySelector(".idotpos"),iname=intro.querySelector(".iname"),idot=intro.querySelector(".idot");
const bicon=document.querySelector(".brand .bicon"),bdot=document.querySelector(".brand .bdot"),btxt=document.querySelector(".brand .btxt");
let done=false;
function finish(){if(done)return;done=true;H.classList.remove("introing");intro.classList.add("fade");setTimeout(function(){if(intro.parentNode)intro.parentNode.removeChild(intro)},650)}
function play(){try{
iname.style.animation="none";intro.classList.add("depart");
book.querySelectorAll("path").forEach(function(p){p.style.strokeDasharray="none"});
const kr=book.getBoundingClientRect(),kt=bicon.getBoundingClientRect();
const dr=idot.getBoundingClientRect(),dt=bdot.getBoundingClientRect();
const nr=iname.getBoundingClientRect(),tr=btxt.getBoundingClientRect();
book.style.transformOrigin="top left";
book.style.transform="translate("+(kt.left-kr.left)+"px,"+(kt.top-kr.top)+"px) scale("+(kt.width/kr.width)+","+(kt.height/kr.height)+")";
dotpos.style.transformOrigin="0 0";
dotpos.style.transform="translate("+((dt.left+dt.width/2)-(dr.left+dr.width/2))+"px,"+((dt.top+dt.height/2)-(dr.top+dr.height/2))+"px) scale("+(dt.width/dr.width)+")";
iname.style.transformOrigin="top left";
iname.style.transform="translate("+(tr.left-nr.left)+"px,"+(tr.top-nr.top)+"px) scale("+(tr.width/nr.width)+","+(tr.height/nr.height)+")";
setTimeout(finish,900);
}catch(e){finish()}}
setTimeout(play,1000);
setTimeout(finish,4500);
})();
`;

const subjectsClient = SUBJECTS.map(({ id, name, color, noExam }) => ({ id, name, color, noExam: !!noExam }));
const notesJson = JSON.stringify(notes).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
const subjectsJson = JSON.stringify(subjectsClient).replace(/</g, "\\u003c");

const rowsHtml = SUBJECTS.map((s, i) => {
  const count = notes.filter((n) => n.subject === s.id).length;
  return `<button class="row" type="button" data-subject="${s.id}" style="--c:${s.color}"><span class="rno"><i></i><span>0${i + 1}</span></span><span><span class="rname">${s.name}</span><span class="rdesc">${s.desc}</span></span><span class="rmeta"><span class="rcount">${count} not</span><span class="rarrow">↗</span></span></button>`;
}).join("\n");

const BODY = `<div id="intro" class="intro" aria-hidden="true"><div class="ilogo"><span class="ibook-wrap">${bookSvg("ibook", 2.7, true)}<span class="idotpos"><span class="idot"></span></span></span><span class="iname">Ders Arşivi</span></div></div><noscript><style>#intro{display:none!important}</style></noscript>
<div class="app">
<section id="home"><header class="top"><div class="brand"><span class="bmark">${bookSvg("bicon", 5)}<i class="bdot"></i></span><span class="btxt">Ders Arşivi</span></div><div class="search"><span class="search-icon">⌕</span><input id="searchInput" type="search" placeholder="Notlarda ara…" autocomplete="off" aria-label="Notlarda ara"><span id="searchGhost" class="sghost" aria-hidden="true"></span></div></header>
<div class="rows" id="subjectGrid">${rowsHtml}</div><section id="searchResults" class="results hidden" aria-live="polite"></section></section>
<section id="examView" class="view hidden" aria-live="polite"><div class="vhead"><button class="back" type="button" id="backHome">← <span>Tüm dersler</span></button><div class="eyebrow" id="subjectEyebrow">DERS KATALOĞU</div><h2 class="vtitle" id="subjectTitle"></h2><p class="vdesc">Hangi sınava hazırlanıyorsan oradan devam et.</p></div><div class="halves" id="examGrid"></div></section>
<section id="notesView" class="view hidden" aria-live="polite"><div class="vhead"><button class="back" type="button" id="backExams">← <span id="backExamsLabel">TYT / AYT seçimine dön</span></button><div class="eyebrow" id="notesEyebrow">KONU LİSTESİ</div><h2 class="vtitle" id="notesTitle"></h2><p class="vdesc" id="notesDescription">Bir konuya tıkladığında not yeni sekmede açılır.</p></div><div class="nlist" id="noteList"></div></section>
</div>`;

const client = CLIENT.replace("__NOTES__", () => notesJson).replace("__SUBJECTS__", () => subjectsJson);
const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#ece2cf"><meta name="description" content="TYT ve AYT ders notları — sade, düzenli ve kolay erişilebilir.">
<title>Ders Arşivi — Notlar</title><link rel="icon" type="image/svg+xml" href="${faviconHref}"><style>${CSS}</style></head><body>
${BODY}
<script>${client}</script>
<script>setTimeout(function(){var i=document.getElementById("intro");if(i){document.documentElement.classList.remove("introing");if(i.parentNode)i.parentNode.removeChild(i)}},5000)</script>
</body></html>`;

fs.writeFileSync(path.join(PUBLIC_DIR, "index.html"), html, "utf8");
console.log("Ders Arşivi oluşturuldu — " + notes.length + " dosya listelendi.");
