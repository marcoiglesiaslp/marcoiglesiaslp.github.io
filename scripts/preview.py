"""Local preview with automatic reload and public files only. No dependencies."""
from hashlib import sha256
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import unquote, urlsplit
import mimetypes

ROOT = Path(__file__).resolve().parent.parent
PUBLIC_FILES = {"index.html", "404.html", "inner-page.html", "portfolio-details.html", "robots.txt", "sitemap.xml", "google3dba36e45271caa9.html"}
ASSET_TYPES = {".css", ".js", ".png", ".jpg", ".jpeg", ".webp", ".svg", ".gif", ".ico", ".woff", ".woff2", ".ttf", ".eot"}


def version():
    files = [ROOT / "index.html", ROOT / "404.html", *sorted((ROOT / "assets/css").glob("*.css")), *sorted((ROOT / "assets/js").glob("*.js"))]
    return sha256("|".join(str(file.stat().st_mtime_ns) for file in files).encode()).hexdigest()


class Preview(BaseHTTPRequestHandler):
    def do_GET(self):
        request_path = unquote(urlsplit(self.path).path)
        if request_path == "/__preview_version":
            return self.respond(version().encode(), "text/plain; charset=utf-8")
        relative = request_path.lstrip("/") or "index.html"
        target = (ROOT / relative).resolve()
        allowed = relative in PUBLIC_FILES or (relative.startswith("assets/") and target.suffix.lower() in ASSET_TYPES)
        if not allowed or not target.is_relative_to(ROOT) or not target.is_file():
            return self.respond((ROOT / "404.html").read_bytes(), "text/html; charset=utf-8", status=404)
        content = target.read_bytes()
        content_type = mimetypes.guess_type(str(target))[0] or "application/octet-stream"
        if target.suffix == ".html":
            reload_script = """<script>(()=>{let current=VERSION;setInterval(async()=>{try{const r=await fetch('/__preview_version',{cache:'no-store'});if(r.ok&&(await r.text())!==current)location.reload()}catch{}},1200)})()</script>""".replace("VERSION", repr(version()))
            content = content.replace(b"</body>", reload_script.encode() + b"</body>")
            content_type += "; charset=utf-8"
        self.respond(content, content_type)

    def respond(self, content, content_type, status=200):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(content)))
        self.send_header("Cache-Control", "no-store")
        self.send_header("X-Content-Type-Options", "nosniff")
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, *_):
        pass


if __name__ == "__main__":
    print("Vista local: http://localhost:4173 (recarga automática)", flush=True)
    try:
        ThreadingHTTPServer(("127.0.0.1", 4173), Preview).serve_forever()
    except KeyboardInterrupt:
        pass
