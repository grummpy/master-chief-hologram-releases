#!/usr/bin/env python3
"""Serve one explicit file with HTTP byte-range support for private-LAN BITS transfers."""
from __future__ import annotations

import argparse
import os
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path


def handler_for(file_path: Path):
    file_size = file_path.stat().st_size

    class RangeHandler(BaseHTTPRequestHandler):
        protocol_version = "HTTP/1.1"

        def do_HEAD(self):
            self._serve(send_body=False)

        def do_GET(self):
            self._serve(send_body=True)

        def _serve(self, send_body: bool):
            if self.path.split("?", 1)[0] != f"/{file_path.name}":
                self.send_error(404)
                return
            start, end = 0, file_size - 1
            range_header = self.headers.get("Range", "")
            if range_header:
                try:
                    unit, value = range_header.split("=", 1)
                    if unit != "bytes" or "," in value:
                        raise ValueError
                    left, right = value.split("-", 1)
                    start = int(left) if left else 0
                    end = int(right) if right else file_size - 1
                    if start < 0 or end < start or start >= file_size:
                        raise ValueError
                    end = min(end, file_size - 1)
                except ValueError:
                    self.send_response(416)
                    self.send_header("Content-Range", f"bytes */{file_size}")
                    self.end_headers()
                    return
                self.send_response(206)
                self.send_header("Content-Range", f"bytes {start}-{end}/{file_size}")
            else:
                self.send_response(200)
            length = end - start + 1
            self.send_header("Accept-Ranges", "bytes")
            self.send_header("Content-Type", "application/octet-stream")
            self.send_header("Content-Length", str(length))
            self.end_headers()
            if not send_body:
                return
            with file_path.open("rb") as source:
                source.seek(start)
                remaining = length
                while remaining:
                    chunk = source.read(min(1024 * 1024, remaining))
                    if not chunk:
                        break
                    self.wfile.write(chunk)
                    remaining -= len(chunk)

        def log_message(self, format_string, *args):
            print(f"{self.client_address[0]} {format_string % args}", flush=True)

    return RangeHandler


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("file", type=Path)
    parser.add_argument("--bind", default="0.0.0.0")
    parser.add_argument("--port", type=int, default=8766)
    args = parser.parse_args()
    target = args.file.expanduser().resolve(strict=True)
    if not target.is_file():
        raise SystemExit("Target must be a file.")
    server = ThreadingHTTPServer((args.bind, args.port), handler_for(target))
    print(f"Serving {target.name} ({os.path.getsize(target)} bytes) on {args.bind}:{args.port}", flush=True)
    server.serve_forever()


if __name__ == "__main__":
    main()
