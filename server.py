#!/usr/bin/env python3
"""
เซิร์ฟเวอร์เล็กๆ สำหรับเปิดเว็บฝึกคาลิมบา 9 คีย์บนมือถือ

    python server.py            # พอร์ต 8000
    python server.py --port 8080

เปิดมือถือให้อยู่ Wi-Fi วงเดียวกับคอม แล้วเข้า URL ที่โปรแกรมพิมพ์ออกมา
ใช้เฉพาะไลบรารีมาตรฐานของ Python ไม่ต้อง pip install อะไรเลย
"""

import argparse
import http.server
import json
import os
import socket
import sys
import webbrowser
from functools import partial

WEB_DIR = os.path.join(os.path.dirname(os.path.abspath(__file__)), "web")


def setup_console():
    """คอนโซล Windows ดีฟอลต์เป็น cp874 ซึ่งพิมพ์อีโมจิ/เส้นกรอบไม่ได้ ต้องสลับเป็น UTF-8"""
    if os.name == "nt":
        try:
            import ctypes

            ctypes.windll.kernel32.SetConsoleOutputCP(65001)
        except Exception:
            pass
    for stream in (sys.stdout, sys.stderr):
        try:
            stream.reconfigure(encoding="utf-8", errors="replace")
        except Exception:
            pass


class Handler(http.server.SimpleHTTPRequestHandler):
    # Windows อ่าน MIME จาก registry ซึ่งบางเครื่องคืน text/plain ให้ไฟล์ .js
    # แล้วเบราว์เซอร์จะไม่ยอมรันสคริปต์ เลยกำหนดเองให้ชัด
    extensions_map = {
        **http.server.SimpleHTTPRequestHandler.extensions_map,
        ".html": "text/html; charset=utf-8",
        ".js": "text/javascript; charset=utf-8",
        ".css": "text/css; charset=utf-8",
        ".json": "application/json",
        ".webmanifest": "application/manifest+json",
        ".svg": "image/svg+xml",
        ".png": "image/png",
    }

    def do_GET(self):
        # ให้หน้าเว็บถามได้ว่าเปิดบนมือถือด้วย URL ไหน
        if self.path == "/api/info":
            body = json.dumps({
                "urls": [f"http://{ip}:{self.server.server_address[1]}" for ip in lan_ips()],
            }).encode()
            self.send_response(200)
            self.send_header("Content-Type", "application/json")
            self.send_header("Content-Length", str(len(body)))
            self.end_headers()
            self.wfile.write(body)
            return
        super().do_GET()

    def end_headers(self):
        # กันเบราว์เซอร์มือถือแคชไฟล์เก่าไว้ตอนเราแก้โน้ตเพลง
        self.send_header("Cache-Control", "no-store, must-revalidate")
        super().end_headers()

    def log_message(self, fmt, *args):
        sys.stderr.write("   %s\n" % (fmt % args))


def lan_ips():
    """หา IP ของเครื่องในวง LAN"""
    ips = set()
    try:
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))  # ไม่ได้ส่งอะไรจริง แค่ให้ OS เลือก interface
        ips.add(s.getsockname()[0])
        s.close()
    except OSError:
        pass
    try:
        for info in socket.getaddrinfo(socket.gethostname(), None, socket.AF_INET):
            ips.add(info[4][0])
    except OSError:
        pass
    return sorted(ip for ip in ips if not ip.startswith("127."))


def main():
    setup_console()
    ap = argparse.ArgumentParser(description="Kalimba 9-key trainer server")
    ap.add_argument("--port", type=int, default=8000)
    ap.add_argument("--host", default="0.0.0.0", help="0.0.0.0 = ให้มือถือเข้าได้")
    ap.add_argument("--no-browser", action="store_true", help="ไม่ต้องเปิดเบราว์เซอร์ให้")
    args = ap.parse_args()

    if not os.path.isdir(WEB_DIR):
        sys.exit(f"ไม่พบโฟลเดอร์ web/ ที่ {WEB_DIR}")

    handler = partial(Handler, directory=WEB_DIR)
    try:
        httpd = http.server.ThreadingHTTPServer((args.host, args.port), handler)
    except OSError as e:
        sys.exit(f"เปิดพอร์ต {args.port} ไม่ได้ ({e})  ลองใช้ --port 8080")

    ips = lan_ips()
    line = "─" * 52
    print(f"\n{line}")
    print("  🎵  Kalimba 9 คีย์ — เว็บฝึกเล่น")
    print(line)
    print(f"  บนคอมเครื่องนี้ :  http://localhost:{args.port}")
    if ips:
        print("  บนมือถือ        :  " + f"http://{ips[0]}:{args.port}")
        for ip in ips[1:]:
            print("                     " + f"http://{ip}:{args.port}")
        print("\n  (มือถือต้องต่อ Wi-Fi วงเดียวกับคอม)")
    else:
        print("  หา IP ในวง LAN ไม่เจอ — เช็คว่าต่อ Wi-Fi/LAN อยู่หรือเปล่า")
    print("\n  ถ้ามือถือเข้าไม่ได้ ให้เปิดพอร์ตใน Windows Firewall")
    print("  (รัน PowerShell แบบ Run as administrator):")
    print(f'    New-NetFirewallRule -DisplayName "Kalimba {args.port}" `')
    print(f"      -Direction Inbound -Protocol TCP -LocalPort {args.port} -Action Allow")
    print(f"\n  กด Ctrl+C เพื่อปิด")
    print(f"{line}\n")

    if not args.no_browser:
        webbrowser.open(f"http://localhost:{args.port}")

    try:
        httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n  ปิดเซิร์ฟเวอร์แล้ว 👋\n")
        httpd.server_close()


if __name__ == "__main__":
    main()
