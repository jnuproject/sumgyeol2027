#!/usr/bin/env python3
"""Serve this standalone game on loopback using only Python's standard library."""
import argparse
import errno
from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import threading
import webbrowser

parser = argparse.ArgumentParser(description='제주 캠퍼스 산책 로컬 실행')
parser.add_argument('--no-browser', action='store_true', help='브라우저 자동 열기 생략')
args = parser.parse_args()
root = Path(__file__).resolve().parent / 'dist'
if not (root / 'index.html').is_file():
    raise SystemExit('dist/index.html을 찾을 수 없습니다. 프로젝트 파일을 확인하세요.')
handler = partial(SimpleHTTPRequestHandler, directory=str(root))
server = None
for port in range(8000, 8011):
    try:
        server = ThreadingHTTPServer(('127.0.0.1', port), handler)
        break
    except OSError as error:
        if error.errno != errno.EADDRINUSE:
            raise
if server is None:
    raise SystemExit('8000~8010 포트가 사용 중입니다. README의 수동 실행 방법을 사용하세요.')
url = f'http://127.0.0.1:{server.server_port}'
print(f'제주 캠퍼스 산책: {url}\n종료하려면 이 창에서 Control+C를 누르세요.', flush=True)
if not args.no_browser:
    threading.Timer(0.4, lambda: webbrowser.open(url)).start()
try:
    server.serve_forever()
except KeyboardInterrupt:
    pass
finally:
    server.server_close()
