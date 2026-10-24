const fs = require("fs");
const path = require("path");

const NOTES_DIR = path.join(__dirname, "notlar");
const PUBLIC_DIR = path.join(__dirname, "public");
const SUBJECTS = [
  { id: "biyoloji", name: "Biyoloji", mark: "BİY", tone: "sage", color: "#1f9d63", desc: "Hücreden ekosisteme, canlılığın temelini keşfet." },
  { id: "matematik", name: "Matematik", mark: "MAT", tone: "blue", color: "#3b6bff", desc: "Kavramlar, yöntemler ve problem çözme." },
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
:root{color-scheme:light dark;--bg:#ece2cf;--cd:#f6efe0;--tx:#17140f;--mu:#6e6350;--e:#e8630a;--bd:#cfc09f;--so:#e1d4bb;--ink:#0f0c09;--tone:#e8630a;--serif:"Iowan Old Style","Palatino Linotype",Georgia,serif}
@media(prefers-color-scheme:dark){:root{--bg:#1b1712;--cd:#26201a;--tx:#efe6d6;--mu:#a89d88;--e:#ff7a1a;--bd:#3d3529;--so:#2c261d}}
*{box-sizing:border-box}html{background:var(--bg)}
body{margin:0;background:var(--bg);color:var(--tx);font:16px/1.6 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased}
button,input{font:inherit;color:inherit}
button:focus-visible,input:focus-visible,a:focus-visible{outline:3px solid var(--e);outline-offset:3px}
.hidden{display:none!important}

.scroller{height:280vh;height:280svh;position:relative}
.stage{position:sticky;top:0;height:100vh;height:100svh;overflow:hidden;--p:0;background:var(--ink)}

.hero{position:absolute;inset:0;z-index:0;display:flex;flex-direction:column;justify-content:center;padding:0 clamp(20px,6vw,96px);color:#f4ead8;background:radial-gradient(120% 90% at 50% 115%,#2a160a 0%,var(--ink) 62%)}
.orb{position:absolute;border-radius:50%;filter:blur(80px);opacity:.4;width:42vmax;height:42vmax;background:var(--c);animation:drift 18s ease-in-out infinite alternate;pointer-events:none}
.o1{left:-12vmax;top:-12vmax}.o2{right:-14vmax;top:2vh;animation-delay:-5s;animation-duration:22s}.o3{right:2vw;bottom:-24vmax;animation-delay:-9s}.o4{left:6vw;bottom:-22vmax;animation-delay:-13s;animation-duration:26s}
@keyframes drift{from{transform:translate3d(0,0,0) scale(1)}to{transform:translate3d(6vmax,-4vmax,0) scale(1.15)}}
.hero-in{position:relative;z-index:1;max-width:1300px;transform:translateY(calc(var(--p)*-12vh));opacity:calc(1 - var(--p)*1.2);will-change:transform,opacity}
.eyebrow{display:flex;align-items:center;gap:12px;color:var(--e);text-transform:uppercase;letter-spacing:.2em;font-size:12px;font-weight:800}.eyebrow:before{content:"";width:34px;height:2px;background:var(--e)}
h1{margin:.3em 0 .35em;font-family:var(--serif);font-weight:700;font-size:clamp(40px,min(10.5vw,17vh),160px);font-size:clamp(40px,min(10.5vw,17svh),160px);line-height:.96;letter-spacing:-.035em}
.ln{display:block;overflow:hidden;padding-bottom:.1em}.ln>span{display:block;animation:up 1s cubic-bezier(.2,.8,.2,1) both}.ln:nth-child(2)>span{animation-delay:.12s}
h1 em{color:var(--e);font-style:italic;font-weight:600}
@keyframes up{from{transform:translateY(105%)}to{transform:none}}
@keyframes fade{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
.hero-copy{max-width:540px;margin:0;color:#c9bca4;font-size:clamp(14px,1.5vw,18px);line-height:1.65;animation:fade 1s .35s both}
.chips{display:flex;flex-wrap:wrap;gap:8px 10px;margin-top:clamp(16px,3vh,30px);animation:fade 1s .5s both}
.chip{display:inline-flex;align-items:center;gap:8px;padding:7px 14px;border:1px solid #ffffff26;border-radius:99px;font-size:13px;color:#eadfc9;background:#ffffff0a;backdrop-filter:blur(6px)}
.chip i{width:9px;height:9px;border-radius:50%;background:var(--c);box-shadow:0 0 10px var(--c)}
.cue{position:absolute;left:0;right:0;bottom:clamp(84px,11.5vh,108px);text-align:center;z-index:1;font-size:11px;letter-spacing:.32em;text-transform:uppercase;color:#bda98a;opacity:calc(1 - var(--p)*8)}

.seam{position:absolute;left:0;right:0;bottom:calc(var(--p)*100%);height:0;z-index:5;pointer-events:none}
.glow{position:absolute;left:0;right:0;bottom:0;height:34vh;background:linear-gradient(to top,rgba(232,99,10,.55),rgba(232,99,10,.12) 45%,transparent);mix-blend-mode:screen}
.line{position:absolute;left:0;right:0;top:-1px;height:2px;background:#ffd9b3;box-shadow:0 0 10px 2px #ff9a4d,0 0 46px 10px rgba(232,99,10,.6)}
.teeth{position:absolute;left:0;right:0;top:0;height:0}
.teeth:before,.teeth:after{content:"";position:absolute;left:0;right:0;height:9px;filter:drop-shadow(0 0 5px rgba(232,99,10,.9))}
.teeth:before{bottom:1px;background:repeating-linear-gradient(90deg,#ff9a4d 0 8px,transparent 8px 16px)}
.teeth:after{top:1px;background:repeating-linear-gradient(90deg,transparent 0 8px,#ffb87d 8px 16px)}
.pull{position:absolute;left:50%;bottom:16px;width:38px;height:58px;margin-left:-19px;padding:0;border:0;border-radius:13px 13px 19px 19px;background:linear-gradient(160deg,#ffc58f,#e8630a 55%,#9c3a00);box-shadow:0 0 28px rgba(232,99,10,.75),inset 0 1px 0 #fff8;cursor:pointer;pointer-events:auto}
.pull:after{content:"";position:absolute;left:50%;top:11px;width:14px;height:24px;margin-left:-7px;border-radius:8px;background:var(--ink);box-shadow:inset 0 2px 4px #000a}
.idle .pull{animation:bob 1.8s ease-in-out infinite}
@keyframes bob{50%{transform:translateY(-9px)}}
.done .seam{visibility:hidden}

.reveal{position:absolute;inset:0;z-index:2;background:var(--bg);clip-path:inset(calc((1 - var(--p))*100%) 0 0 0)}
.wash{position:absolute;inset:0;z-index:0;pointer-events:none;opacity:0;transform:scale(.88);transition:opacity .7s ease,transform 1s cubic-bezier(.2,.8,.2,1);background:radial-gradient(85% 75% at var(--wx,50%) var(--wy,60%),var(--wc,transparent),transparent 72%)}
.wash.on{opacity:.7;transform:scale(1)}
.cat{position:relative;z-index:1;height:100%;display:flex;flex-direction:column;gap:clamp(12px,2.2vw,26px);padding:clamp(16px,3vw,40px);transform:translateY(calc((1 - var(--p))*7vh));opacity:calc(.15 + var(--p)*.85)}
.cat-head{display:flex;align-items:flex-end;justify-content:space-between;gap:16px;flex-wrap:wrap}
.cat-title{margin:0;font-family:var(--serif);font-size:clamp(28px,4.4vw,60px);line-height:1;letter-spacing:-.03em}.cat-title em{color:var(--e);font-style:italic}
.kicker{display:block;margin-top:8px;color:var(--mu);font-size:13px}
.search{position:relative;width:min(340px,100%)}.search-icon{position:absolute;left:15px;top:50%;transform:translateY(-50%);color:var(--mu);font-size:17px;pointer-events:none}
.search input{width:100%;height:46px;padding:0 16px 0 42px;border:1px solid var(--bd);border-radius:14px;background:var(--cd);font-size:15px;outline:none;transition:border-color .18s,box-shadow .18s}.search input::placeholder{color:var(--mu)}.search input:focus{border-color:var(--e);box-shadow:0 0 0 4px rgba(232,99,10,.16)}
.cat-body{flex:1;min-height:0;overflow:auto;-webkit-overflow-scrolling:touch}
.subject-grid{height:100%;display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:clamp(10px,1.4vw,20px)}
.subject-card{position:relative;overflow:hidden;text-align:left;display:flex;flex-direction:column;justify-content:space-between;min-height:0;padding:clamp(14px,1.7vw,28px);border:1px solid var(--bd);border-radius:24px;background:var(--cd);cursor:pointer;transition:transform .35s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .35s}
.subject-card:hover,.subject-card:focus-visible{transform:translateY(-6px);border-color:var(--c);box-shadow:0 22px 50px -18px var(--c)}
.subject-card:after{content:"";position:absolute;left:0;bottom:0;height:5px;width:0;background:var(--c);transition:width .45s cubic-bezier(.2,.8,.2,1)}.subject-card:hover:after{width:100%}
.ghost{position:absolute;right:clamp(10px,1.6vw,26px);top:24%;font-family:var(--serif);font-weight:800;font-size:clamp(56px,6.6vw,120px);line-height:1;letter-spacing:-.04em;color:transparent;-webkit-text-stroke:1.5px var(--c);opacity:.32;transition:opacity .4s,transform .5s;pointer-events:none}
.subject-card:hover .ghost{opacity:.9;transform:translateY(-6px)}
.card-top{position:relative;display:flex;align-items:center;justify-content:space-between}
.subject-no{color:var(--tx);font-size:13px;letter-spacing:.2em;font-weight:800}.subject-no:before{content:"";display:inline-block;width:9px;height:9px;margin-right:9px;border-radius:50%;background:var(--c)}
.card-arrow{width:40px;height:40px;display:grid;place-items:center;border:1.5px solid var(--bd);border-radius:50%;font-size:18px;transition:background .3s,border-color .3s,color .3s,transform .4s}
.subject-card:hover .card-arrow{background:var(--c);border-color:var(--c);color:#fff;transform:rotate(45deg)}
.card-main{position:relative}
.subject-name{display:block;font-family:var(--serif);font-weight:700;font-size:clamp(24px,2.7vw,44px);line-height:1.05;letter-spacing:-.03em}
.subject-description{display:block;margin-top:8px;color:var(--mu);font-size:clamp(12px,1vw,14px);line-height:1.5}
.card-bottom{position:relative;display:flex;align-items:center;justify-content:space-between;gap:8px;margin-top:14px;font-size:12px}.subject-count{color:var(--mu)}.text-link{font-weight:750;white-space:nowrap}

.search-results h3{margin:0;font-family:var(--serif);font-size:22px}

.view{position:relative;min-height:100vh;min-height:100svh;background:var(--bg);isolation:isolate;overflow:hidden}
.view:before{content:"";position:absolute;inset:auto -10% -35% -10%;height:80%;z-index:-1;background:radial-gradient(55% 60% at 50% 100%,var(--tone),transparent 72%);opacity:.4;animation:bloom 1s cubic-bezier(.2,.8,.2,1) both}
@keyframes bloom{from{opacity:0;transform:scale(.8)}to{opacity:.4;transform:none}}
.view-in{position:relative;width:min(1100px,calc(100% - 40px));margin:0 auto;min-height:100vh;min-height:100svh;padding:clamp(16px,3vw,36px) 0 clamp(24px,4vw,48px);display:flex;flex-direction:column}
.back{align-self:flex-start;display:inline-flex;align-items:center;gap:10px;padding:10px 18px 10px 14px;border:1px solid var(--bd);border-radius:99px;background:var(--cd);cursor:pointer;font-size:13px;font-weight:650;transition:border-color .2s,transform .2s}.back:hover{border-color:var(--tone);transform:translateX(-3px)}
.view .eyebrow{color:var(--tone);margin-top:clamp(20px,5vh,56px)}.view .eyebrow:before{background:var(--tone)}
.view-title{margin:.15em 0 .2em;font-family:var(--serif);font-size:clamp(44px,9vw,120px);line-height:.98;letter-spacing:-.04em}
.view-description{margin:0;color:var(--mu);font-size:15px;line-height:1.6}
.exam-grid{flex:1;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:clamp(12px,2vw,24px);margin-top:clamp(20px,4vh,40px);min-height:260px}
.exam-card{position:relative;overflow:hidden;display:flex;flex-direction:column;justify-content:space-between;gap:14px;text-align:left;padding:clamp(18px,2.4vw,34px);border:1px solid var(--bd);border-radius:26px;background:var(--cd);cursor:pointer;transition:transform .35s cubic-bezier(.2,.8,.2,1),border-color .3s,box-shadow .35s}
.exam-card:hover{transform:translateY(-6px);border-color:var(--tone);box-shadow:0 22px 50px -18px var(--tone)}
.exam-symbol{align-self:flex-start;padding:8px 14px;border-radius:99px;background:var(--tx);color:var(--bg);font-weight:800;font-size:12px;letter-spacing:.12em;text-transform:uppercase}
.exam-name{display:block;font-family:var(--serif);font-weight:700;font-size:clamp(52px,8vw,110px);line-height:1;letter-spacing:-.04em}
.exam-sub{display:block;margin-top:6px;color:var(--mu);font-size:14px}.exam-count{font-size:14px;font-weight:750}
.note-list{display:grid;gap:10px;margin-top:clamp(16px,3vh,28px)}
.note-row{display:flex;align-items:center;gap:16px;padding:16px 20px;border:1px solid var(--bd);border-left:5px solid var(--tone);border-radius:18px;background:var(--cd);text-decoration:none;color:inherit;transition:transform .25s,box-shadow .25s}
.note-row:hover{transform:translateY(-2px);box-shadow:0 16px 36px -16px var(--tone)}
.file-mark{flex:0 0 44px;height:44px;display:grid;place-items:center;border-radius:12px;color:var(--bg);background:var(--tx);font-size:10px;font-weight:850}
.note-copy{min-width:0;flex:1}.note-title{display:block;font-size:16px;font-weight:700;line-height:1.4;overflow-wrap:anywhere}.note-meta{display:block;margin-top:3px;color:var(--mu);font-size:12px;overflow-wrap:anywhere}.open-icon{color:var(--tone);font-size:22px}
.empty{padding:30px;border:1px dashed var(--bd);border-radius:18px;text-align:center;color:var(--mu);font-size:14px;line-height:1.7}

@media(max-width:1000px){.subject-grid{grid-template-columns:repeat(2,minmax(0,1fr));grid-template-rows:repeat(2,minmax(0,1fr))}.ghost{font-size:clamp(56px,11vw,120px)}}
@media(max-width:700px){
.cat-head{flex-direction:column;align-items:stretch;gap:12px}.search{width:100%}.search input{height:44px}
.subject-card{border-radius:18px;padding:14px}.ghost{font-size:46px;top:28%;right:12px}.card-arrow{width:34px;height:34px;font-size:15px}
.subject-name{font-size:22px}.subject-description{display:-webkit-box;-webkit-line-clamp:3;-webkit-box-orient:vertical;overflow:hidden}.text-link{display:none}
.exam-grid{grid-template-columns:1fr}.exam-card{min-height:200px;border-radius:20px}.note-row{padding:13px 14px;gap:12px}.note-title{font-size:15px}
.pull{bottom:12px}.cue{bottom:92px}
h1{font-size:clamp(40px,13vw,64px)}
}
@media(prefers-reduced-motion:reduce){.scroller{height:100vh;height:100svh}*,*:before,*:after{animation-duration:.01ms!important;animation-iteration-count:1!important;transition-duration:.01ms!important}}
`;

const CLIENT = String.raw`
const NOTES=__NOTES__;const SUBJECTS=__SUBJECTS__;const EXAMS=["TYT","AYT"];
const $=function(id){return document.getElementById(id)};
const home=$("home"),examView=$("examView"),notesView=$("notesView"),searchInput=$("searchInput"),searchResults=$("searchResults"),grid=$("subjectGrid"),stage=$("stage"),scroller=$("scroller"),wash=$("wash");
let activeSubject=null;
function normText(v){return String(v).toLocaleLowerCase("tr-TR").replace(/ı/g,"i").replace(/İ/g,"i").normalize("NFD").replace(/[\u0300-\u036f]/g,"")}
function escText(v){return String(v).replace(/[&<>"']/g,function(c){return {"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#39;"}[c]})}
function noteLink(n){return '<a class="note-row" href="'+escText(n.href)+'" target="_blank" rel="noopener noreferrer"><span class="file-mark">'+escText(n.ext)+'</span><span class="note-copy"><span class="note-title">'+escText(n.title)+'</span><span class="note-meta">'+escText(n.exam)+' · '+escText(n.filename)+'</span></span><span class="open-icon">↗</span></a>'}

/* Kaydırma ilerlemesi: fermuar yukarı çıkarken alttaki bölüm büyür */
const reduce=window.matchMedia("(prefers-reduced-motion: reduce)").matches;
let cur=0,raf=0;
function span(){return Math.max(1,scroller.offsetHeight-window.innerHeight)}
function target(){return reduce?1:Math.min(1,Math.max(0,window.scrollY/span()))}
function apply(){stage.style.setProperty("--p",cur.toFixed(4));stage.classList.toggle("idle",cur<.02);stage.classList.toggle("done",cur>.985)}
function tick(){raf=0;const t=target(),d=t-cur;if(Math.abs(d)<.0008){cur=t;apply();return}cur+=d*.2;apply();raf=requestAnimationFrame(tick)}
function kick(){if(!raf&&!home.classList.contains("hidden"))raf=requestAnimationFrame(tick)}
window.addEventListener("scroll",kick,{passive:true});window.addEventListener("resize",kick);kick();
$("pull").addEventListener("click",function(){window.scrollTo({top:span(),behavior:"smooth"})});

function showHome(){home.classList.remove("hidden");examView.classList.add("hidden");notesView.classList.add("hidden");activeSubject=null;requestAnimationFrame(function(){window.scrollTo(0,document.documentElement.scrollHeight);kick()})}
function showSubject(id){activeSubject=id;const s=SUBJECTS.find(function(x){return x.id===id});if(!s)return;document.documentElement.style.setProperty("--tone",s.color);home.classList.add("hidden");notesView.classList.add("hidden");examView.classList.remove("hidden");$("subjectEyebrow").textContent="DERS KATALOĞU / "+s.name.toLocaleUpperCase("tr-TR");$("subjectTitle").textContent=s.name;
$("examGrid").innerHTML=EXAMS.map(function(e){const count=NOTES.filter(function(n){return n.subject===id&&n.exam===e}).length;return '<button class="exam-card" type="button" data-exam="'+e+'"><span class="exam-symbol">'+escText(s.name)+'</span><span class="exam-copy"><span class="exam-name">'+e+'</span><span class="exam-sub">'+(e==="TYT"?"Temel yeterlilik konuları":"Alan yeterlilik konuları")+'</span></span><span class="exam-count">'+count+' not →</span></button>'}).join("");
$("examGrid").querySelectorAll("[data-exam]").forEach(function(b){b.addEventListener("click",function(){showNotes(id,b.dataset.exam)})});window.scrollTo(0,0)}
function showNotes(id,exam){activeSubject=id;const s=SUBJECTS.find(function(x){return x.id===id}),filtered=NOTES.filter(function(n){return n.subject===id&&n.exam===exam});examView.classList.add("hidden");notesView.classList.remove("hidden");$("notesEyebrow").textContent=s.name.toLocaleUpperCase("tr-TR")+" / "+exam;$("notesTitle").textContent=exam+" "+s.name;
$("notesDescription").textContent=filtered.length?filtered.length+" dosya · Bir konuya tıkladığında not yeni sekmede açılır.":"Bu bölümde henüz not yok. İlgili klasöre dosya eklediğinde burada otomatik görünür.";
$("noteList").innerHTML=filtered.length?filtered.map(noteLink).join(""):'<div class="empty">Burada şimdilik sessiz.<br><strong>Yeni notlar eklendikçe</strong> bu liste otomatik dolacak.</div>';window.scrollTo(0,0)}
document.querySelectorAll("[data-subject]").forEach(function(b){b.addEventListener("click",function(){showSubject(b.dataset.subject)})});
$("backHome").addEventListener("click",showHome);$("backExams").addEventListener("click",function(){showSubject(activeSubject)});

/* Dersin üstüne gelince arka plan o dersin rengine bürünür */
function washOn(c){const r=c.getBoundingClientRect(),w=wash.parentElement.getBoundingClientRect();wash.style.setProperty("--wc",c.style.getPropertyValue("--c"));wash.style.setProperty("--wx",((r.left+r.width/2-w.left)/w.width*100)+"%");wash.style.setProperty("--wy",((r.top+r.height/2-w.top)/w.height*100)+"%");wash.classList.add("on")}
grid.querySelectorAll(".subject-card").forEach(function(c){c.addEventListener("pointerenter",function(){washOn(c)});c.addEventListener("pointerleave",function(){wash.classList.remove("on")});c.addEventListener("focus",function(){washOn(c)});c.addEventListener("blur",function(){wash.classList.remove("on")})});

searchInput.addEventListener("input",function(){const q=normText(searchInput.value.trim());wash.classList.remove("on");if(!q){searchResults.classList.add("hidden");grid.classList.remove("hidden");return}
const found=NOTES.filter(function(n){return normText([n.title,n.filename,n.subject,n.exam].join(" ")).includes(q)});grid.classList.add("hidden");searchResults.classList.remove("hidden");
searchResults.innerHTML="<h3>"+found.length+" sonuç bulundu</h3>"+(found.length?'<div class="note-list">'+found.map(noteLink).join("")+"</div>":'<div class="empty" style="margin-top:16px">Bu aramayla eşleşen not yok.<br>Başka bir kelime deneyebilirsin.</div>')});
`;

const subjectsClient = SUBJECTS.map(({ id, name, color }) => ({ id, name, color }));
const notesJson = JSON.stringify(notes).replace(/</g, "\\u003c").replace(/>/g, "\\u003e").replace(/&/g, "\\u0026");
const subjectsJson = JSON.stringify(subjectsClient).replace(/</g, "\\u003c");

const cards = SUBJECTS.map((s, i) => {
  const count = notes.filter((n) => n.subject === s.id).length;
  return `<button class="subject-card" type="button" data-subject="${s.id}" style="--i:${i};--c:${s.color}">
<span class="ghost">${s.mark}</span>
<span class="card-top"><span class="subject-no">0${i + 1}</span><span class="card-arrow">↗</span></span>
<span class="card-main"><span class="subject-name">${s.name}</span><span class="subject-description">${s.desc}</span></span>
<span class="card-bottom"><span class="subject-count">${count} not</span><span class="text-link">Dersi keşfet →</span></span></button>`;
}).join("\n");
const orbs = SUBJECTS.map((s, i) => `<div class="orb o${i + 1}" style="--c:${s.color}"></div>`).join("");
const chips = SUBJECTS.map((s) => `<span class="chip" style="--c:${s.color}"><i></i>${s.name}</span>`).join("");

const BODY = `<main>
<section id="home"><div class="scroller" id="scroller"><div class="stage" id="stage">
<div class="hero">${orbs}
<div class="hero-in"><div class="eyebrow">Kişisel öğrenme kütüphanen</div>
<h1><span class="ln"><span>Bilgini düzenle.</span></span><span class="ln"><span><em>İlerlemene odaklan.</em></span></span></h1>
<p class="hero-copy">Ders notların tek bir yerde, ihtiyacın olduğunda elinin altında. Aşağı kaydır, bir ders seç ve çalışmaya kaldığın yerden devam et.</p>
<div class="chips">${chips}<span class="chip">${notes.length} not</span></div></div>
<div class="cue">Kaydır</div></div>
<div class="reveal"><div class="wash" id="wash"></div>
<div class="cat"><div class="cat-head"><div><h2 class="cat-title">Hangi dersten <em>başlıyoruz?</em></h2><span class="kicker">${notes.length} not · ${SUBJECTS.length} ders</span></div>
<label class="search"><span class="search-icon">⌕</span><input id="searchInput" type="search" placeholder="Notlarda ara…" autocomplete="off" aria-label="Notlarda ara"></label></div>
<div class="cat-body"><div class="subject-grid" id="subjectGrid">${cards}</div><section id="searchResults" class="search-results hidden" aria-live="polite"></section></div></div></div>
<div class="seam"><div class="glow"></div><div class="line"></div><div class="teeth"></div><button class="pull" id="pull" type="button" aria-label="Derslere kaydır"></button></div>
</div></div></section>
<section id="examView" class="view hidden" aria-live="polite"><div class="view-in"><button class="back" type="button" id="backHome">← <span>Tüm dersler</span></button><div class="eyebrow" id="subjectEyebrow">DERS KATALOĞU</div><h2 class="view-title" id="subjectTitle"></h2><p class="view-description">Hangi sınava hazırlanıyorsan oradan devam et.</p><div class="exam-grid" id="examGrid"></div></div></section>
<section id="notesView" class="view hidden" aria-live="polite"><div class="view-in"><button class="back" type="button" id="backExams">← <span>TYT / AYT seçimine dön</span></button><div class="eyebrow" id="notesEyebrow">KONU LİSTESİ</div><h2 class="view-title" id="notesTitle"></h2><p class="view-description" id="notesDescription">Bir konuya tıkladığında not yeni sekmede açılır.</p><div class="note-list" id="noteList"></div></div></section>
</main>`;

const client = CLIENT.replace("__NOTES__", () => notesJson).replace("__SUBJECTS__", () => subjectsJson);
const html = `<!doctype html>
<html lang="tr"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover">
<meta name="theme-color" content="#0f0c09"><meta name="description" content="TYT ve AYT ders notları — sade, düzenli ve kolay erişilebilir.">
<title>Ders Arşivi — Notlar</title><style>${CSS}</style></head><body>
${BODY}
<script>${client}</script>
</body></html>`;

fs.writeFileSync(path.join(PUBLIC_DIR, "index.html"), html, "utf8");
console.log("Ders Arşivi oluşturuldu — " + notes.length + " dosya listelendi.");
