"""Loopback-only preview. Public maintenance page and revoked server access stay intact."""
from http.server import ThreadingHTTPServer,SimpleHTTPRequestHandler
from pathlib import Path
from urllib.parse import urlsplit
ROOT=Path(__file__).resolve().parents[1]
class Preview(SimpleHTTPRequestHandler):
 def __init__(self,*args,**kwargs):super().__init__(*args,directory=str(ROOT/'dist'),**kwargs)
 def do_GET(self):
  route=urlsplit(self.path).path
  content=None
  if route in ('/','/index.html','/walk.html'):content=(ROOT/'verification/game-shell.html').read_bytes()
  elif route=='/game.js':
   s=(ROOT/'dist/game.js').read_text().replace("location.replace(new URL('./index.html',import.meta.url));","try { await initialize(); } catch(error){ fail(error); }")
   content=s.encode()
  elif route=='/multiplayer.js':content=b"export function createMultiplayer({onStatus}){onStatus({state:'offline',count:1});return {peers:new Map(),update(){},disconnect(){},reconnect(){},dispose(){},metadata:()=>({connected:false,count:1,preview:true})};}"
  if content is not None:
   self.send_response(200);self.send_header('Content-Type','text/html; charset=utf-8' if route in ('/','/index.html','/walk.html') else 'text/javascript; charset=utf-8');self.send_header('Cache-Control','no-store');self.send_header('Content-Length',str(len(content)));self.send_header('Connection','close');self.end_headers();self.wfile.write(content)
  else:super().do_GET()
if __name__=='__main__':ThreadingHTTPServer(('127.0.0.1',18161),Preview).serve_forever()
