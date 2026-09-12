#!/usr/bin/env python3
"""Local mirror of https://ui.shadcn.com for the shadcn CLI (REGISTRY_URL=http://127.0.0.1:4000/r).

Serves apps/v4/public/r/** statically and emulates the dynamic /init route by
running apps/v4/scripts/local-init.mts (same builders as the upstream route).
"""
import os
import subprocess
import sys
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from urllib.parse import urlsplit

V4 = os.environ.get("SHADCN_V4_DIR")  # .../shadcn-ui/apps/v4
BUN = os.environ.get("BUN", os.path.expanduser("~/.bun/bin/bun"))
PORT = int(os.environ.get("PORT", "4000"))


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *a, **kw):
        super().__init__(*a, directory=os.path.join(V4, "public"), **kw)

    def do_GET(self):
        parts = urlsplit(self.path)
        if parts.path.rstrip("/") == "/init":
            proc = subprocess.run(
                [BUN, "run", "scripts/local-init.mts", parts.query],
                cwd=V4,
                capture_output=True,
                text=True,
            )
            if proc.returncode != 0:
                body = proc.stderr.encode() or b'{"error":"init failed"}'
                self.send_response(400 if proc.returncode == 2 else 500)
            else:
                body = proc.stdout.encode()
                self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        return super().do_GET()

    def log_message(self, fmt, *args):
        sys.stderr.write("%s %s\n" % (self.log_date_time_string(), fmt % args))


if __name__ == "__main__":
    if not V4:
        sys.exit("set SHADCN_V4_DIR to <shadcn-ui clone>/apps/v4")
    ThreadingHTTPServer(("127.0.0.1", PORT), Handler).serve_forever()
