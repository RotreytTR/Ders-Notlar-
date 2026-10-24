const fs = require("fs");
const path = require("path");

const NOTES_DIR = path.join(__dirname, "notlar");

function listFiles(dir, base = "") {
  let results = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const rel = base ? base + "/" + entry.name : entry.name;
    if (entry.isDirectory()) {
      results = results.concat(listFiles(path.join(dir, entry.name), rel));
    } else if (entry.name !== ".gitkeep" && entry.name !== "README.txt") {
      results.push(rel);
    }
  }
  return results;
}

let files = [];
if (fs.existsSync(NOTES_DIR)) {
  files = listFiles(NOTES_DIR).sort((a, b) => a.localeCompare(b, "tr"));
}

const rows = files
  .map((f) => {
    const ext = f.split(".").pop().toLowerCase();
    const isPdf = ext === "pdf";
    const isHtml = ext === "html" || ext === "htm";
    const icon = isPdf ? "📄" : isHtml ? "🌐" : "📁";
    const label = "Aç";
    const href = "notlar/" + encodeURI(f);
    const name = f.split("/").pop();
    const folder = f.includes("/") ? f.slice(0, f.lastIndexOf("/")) : "";
    return `<tr>
      <td class="ico">${icon}</td>
      <td class="name">${name}</td>
      <td class="folder">${folder}</td>
      <td class="ext">${ext.toUpperCase()}</td>
      <td><a class="btn" href="${href}" target="_blank">${label}</a></td>
    </tr>`;
  })
  .join("");

const html = `<!DOCTYPE html>
<html lang="tr">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Notlarım</title>
<style>
  * { box-sizing: border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
         background: #0d1117; color: #c9d1d9; margin: 0; padding: 2rem; }
  h1 { color: #58a6ff; font-size: 1.6rem; }
  .count { color: #8b949e; margin-bottom: 1.5rem; font-size: .9rem; }
  table { width: 100%; border-collapse: collapse; background: #161b22; border-radius: 8px; overflow: hidden; }
  th { text-align: left; padding: .75rem 1rem; background: #21262d; color: #8b949e; font-size: .8rem; text-transform: uppercase; letter-spacing: .05em; }
  td { padding: .75rem 1rem; border-top: 1px solid #21262d; }
  tr:hover td { background: #1c2128; }
  .ico { font-size: 1.2rem; width: 1%; }
  .name { color: #c9d1d9; font-weight: 500; }
  .folder { color: #8b949e; font-size: .85rem; }
  .ext { color: #8b949e; font-size: .8rem; width: 1%; }
  .btn { display: inline-block; padding: .35rem .9rem; border-radius: 6px; text-decoration: none;
         background: #238636; color: #fff; font-size: .85rem; }
  .btn:hover { background: #2ea043; }
  .empty { text-align: center; padding: 3rem; color: #8b949e; }
</style>
</head>
<body>
  <h1>📚 Notlarım</h1>
  <div class="count">${files.length} dosya</div>
  ${files.length === 0 ? '<div class="empty">Henüz dosya yok. notlar/ klasörüne dosya ekleyin.</div>' : `
  <table>
    <thead><tr><th></th><th>Dosya</th><th>Klasör</th><th>Tür</th><th>İşlem</th></tr></thead>
    <tbody>${rows}</tbody>
  </table>`}
</body>
</html>`;

fs.writeFileSync(path.join(__dirname, "index.html"), html, "utf8");
console.log(`index.html oluşturuldu — ${files.length} dosya listelendi.`);
