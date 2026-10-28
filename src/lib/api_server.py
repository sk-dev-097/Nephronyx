"""
Lightweight HTTP API for Check Status.

Endpoints:
    GET  /api/patient-data   -> current patient_data.json
    PUT  /api/patient-data   -> save body to patient_data.json
    POST /api/predict        -> save optional body, run predict.py, return result

Usage (from Nephronyx root or this folder):
    python src/lib/api_server.py
    python api_server.py --port 8000
"""

from __future__ import annotations

import argparse
import json
import sys
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import urlparse

# Allow `python api_server.py` from this directory
sys.path.insert(0, str(Path(__file__).resolve().parent))

import predict  # noqa: E402

DATA_PATH = predict.DEFAULT_DATA_PATH
MODEL_PATH = predict.DEFAULT_MODEL_PATH


class Handler(BaseHTTPRequestHandler):
    def log_message(self, fmt: str, *args) -> None:
        sys.stderr.write("%s - %s\n" % (self.address_string(), fmt % args))

    def _send(self, code: int, payload: dict | list | None = None) -> None:
        body = b"" if payload is None else json.dumps(payload).encode("utf-8")
        self.send_response(code)
        self.send_header("Content-Type", "application/json")
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Access-Control-Allow-Origin", "*")
        self.send_header("Access-Control-Allow-Methods", "GET, PUT, POST, OPTIONS")
        self.send_header("Access-Control-Allow-Headers", "Content-Type")
        self.end_headers()
        if body:
            self.wfile.write(body)

    def _read_json(self) -> dict:
        length = int(self.headers.get("Content-Length", "0"))
        raw = self.rfile.read(length) if length else b"{}"
        data = json.loads(raw.decode("utf-8") or "{}")
        if not isinstance(data, dict):
            raise ValueError("JSON body must be an object")
        return data

    def do_OPTIONS(self) -> None:  # noqa: N802
        self._send(204)

    def do_GET(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path == "/api/patient-data":
            try:
                values = predict.load_from_json(DATA_PATH)
                self._send(200, values)
            except FileNotFoundError:
                self._send(404, {"error": f"File not found: {DATA_PATH}"})
            except Exception as exc:  # noqa: BLE001
                self._send(500, {"error": str(exc)})
            return
        if path == "/api/health":
            model_ok = MODEL_PATH.exists() or (
                predict.FALLBACK_MODEL_JSON.exists()
                and predict.FALLBACK_FEATURES_JSON.exists()
            )
            self._send(
                200,
                {
                    "ok": True,
                    "data_path": str(DATA_PATH),
                    "model_exists": model_ok,
                    "model_path": str(MODEL_PATH),
                    "fallback_model": str(predict.FALLBACK_MODEL_JSON),
                },
            )
            return
        self._send(404, {"error": "Not found"})

    def do_PUT(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path != "/api/patient-data":
            self._send(404, {"error": "Not found"})
            return
        try:
            values = self._read_json()
            cleaned = {k: float(v) for k, v in values.items()}
            predict.save_to_json(DATA_PATH, cleaned)
            self._send(200, {"ok": True, "saved": cleaned, "path": str(DATA_PATH)})
        except Exception as exc:  # noqa: BLE001
            self._send(400, {"error": str(exc)})

    def do_POST(self) -> None:  # noqa: N802
        path = urlparse(self.path).path
        if path != "/api/predict":
            self._send(404, {"error": "Not found"})
            return
        try:
            body = self._read_json()
            if body:
                cleaned = {k: float(v) for k, v in body.items()}
                predict.save_to_json(DATA_PATH, cleaned)
                values = cleaned
            else:
                values = None

            result = predict.run_prediction(
                model_path=MODEL_PATH if MODEL_PATH.exists() else None,
                input_path=DATA_PATH,
                values=values,
            )
            self._send(200, result)
        except Exception as exc:  # noqa: BLE001
            self._send(500, {"error": str(exc)})


def main() -> None:
    ap = argparse.ArgumentParser(description="Nephronyx predict API")
    ap.add_argument("--host", default="127.0.0.1")
    ap.add_argument("--port", type=int, default=8000)
    a = ap.parse_args()

    server = ThreadingHTTPServer((a.host, a.port), Handler)
    model_ok = MODEL_PATH.exists() or (
        predict.FALLBACK_MODEL_JSON.exists()
        and predict.FALLBACK_FEATURES_JSON.exists()
    )
    print(f"API listening on http://{a.host}:{a.port}")
    print(f"  patient data: {DATA_PATH}")
    print(f"  model joblib: {MODEL_PATH} (exists={MODEL_PATH.exists()})")
    print(f"  model ready:  {model_ok}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nShutting down")
        server.server_close()


if __name__ == "__main__":
    main()
