#!/usr/bin/env python3
from __future__ import annotations

import argparse
import json
import threading
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer

NL = chr(10)
_lock = threading.Lock()
_flaky_count = 0


def sse(payload):
    return "".join(["data: ", json.dumps(payload), NL, NL]).encode()


def sse_done():
    # "[D" + "ONE]" is split so this file stays greppable without tripping
    # SSE-aware middleware that treats the terminator token as end-of-stream.
    return "".join(["data: ", "[D" + "ONE]", NL, NL]).encode()


class Handler(BaseHTTPRequestHandler):
    def log_message(self, *args):
        pass

    def do_POST(self):
        global _flaky_count
        if not self.path.rstrip("/").endswith("chat/completions"):
            self.send_error(404)
            return
        length = int(self.headers.get("Content-Length", 0))
        body = json.loads(self.rfile.read(length))
        model = str(body.get("model", ""))

        if "flaky" in model:
            with _lock:
                _flaky_count += 1
                attempt = _flaky_count
            if attempt <= 2:
                self.send_error(500, "induced transient failure")
                return

        if "nosse" in model:
            payload = json.dumps(dict(choices=[dict(message=dict(content="plain body"))])).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(payload)))
            self.end_headers()
            self.wfile.write(payload)
            return

        self.send_response(200)
        self.send_header("Content-Type", "text/event-stream")
        self.end_headers()
        n_chunks = 12
        for i in range(n_chunks):
            chunk = dict(choices=[dict(delta=dict(content=("tok" + str(i) + " ")))])
            self.wfile.write(sse(chunk))
            self.wfile.flush()
        if "nousage" not in model:
            usage_chunk = dict(choices=[], usage=dict(prompt_tokens=24, completion_tokens=n_chunks))
            self.wfile.write(sse(usage_chunk))
            self.wfile.flush()
        self.wfile.write(sse_done())
        self.wfile.flush()


def serve(port: int) -> ThreadingHTTPServer:
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    threading.Thread(target=server.serve_forever, daemon=True).start()
    return server


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--port", type=int, default=8123)
    args = parser.parse_args()
    server = serve(args.port)
    print("mock SSE server on http://127.0.0.1:%d/v1" % server.server_address[1], flush=True)
    try:
        threading.Event().wait()
    except KeyboardInterrupt:
        pass
