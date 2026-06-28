const http = require("http");
const fs = require("fs");
const path = require("path");

const root = path.resolve(__dirname, "..", "web", "out");
const port = Number(process.env.PORT || 3000);

const types = {
  ".html": "text/html; charset=utf-8",
  ".js": "application/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".json": "application/json; charset=utf-8",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".txt": "text/plain; charset=utf-8",
};

function resolveFile(urlPath) {
  let pathname = decodeURIComponent(urlPath.split("?")[0] || "/");
  if (pathname.includes("\0")) return null;
  if (pathname.endsWith("/")) pathname += "index.html";
  if (!path.extname(pathname)) pathname = path.join(pathname, "index.html");
  const file = path.resolve(root, "." + pathname.replace(/\\/g, "/"));
  if (!file.startsWith(root)) return null;
  return file;
}

http
  .createServer((req, res) => {
    const file = resolveFile(req.url || "/");
    if (!file || !fs.existsSync(file) || !fs.statSync(file).isFile()) {
      res.writeHead(404, { "content-type": "text/plain; charset=utf-8" });
      res.end("Not found");
      return;
    }
    res.writeHead(200, {
      "content-type": types[path.extname(file).toLowerCase()] || "application/octet-stream",
      "cache-control": "no-cache",
    });
    fs.createReadStream(file).pipe(res);
  })
  .listen(port, "127.0.0.1", () => {
    console.log(`Static preview ready: http://127.0.0.1:${port}`);
  });
