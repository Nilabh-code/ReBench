#!/usr/bin/env python3
"""ReBench Local Studio: standalone universal OpenAI-compatible benchmark UI.
Run: python run.py [--host 127.0.0.1] [--port 8765]
No third-party Python packages required.
"""
from __future__ import annotations
import argparse, json, os, platform, re, subprocess, sys, threading, time, urllib.error, urllib.request, webbrowser
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from datetime import datetime, timezone

APP_VERSION = "2.0.0"
SUITES = {
 "performance-v1": {"name":"Performance / deterministic", "prompt":"Explain why reproducible benchmarks need pinned workloads in exactly three concise sentences.", "max_tokens":128, "repetitions":3},
 "deep-swe-v1": {"name":"Deep SWE / code reasoning", "prompt":"Review this Python function for correctness, security, and maintainability. Identify three concrete issues and propose a corrected implementation. Function: def parse_items(text): return [x.strip() for x in text.split(',') if x]", "max_tokens":384, "repetitions":3},
 "deep-swa-v1": {"name":"Deep SWA / systems reasoning", "prompt":"Design a production architecture for a fault-tolerant local LLM inference service. Cover scheduling, streaming, observability, retries, backpressure, security, and benchmark methodology in a structured answer.", "max_tokens":384, "repetitions":3},
}


def cmd(args, fallback=""):
    try: return subprocess.check_output(args, text=True, stderr=subprocess.DEVNULL, timeout=3).strip() or fallback
    except Exception: return fallback

def hardware():
    cpu = cmd(["bash","-lc","grep -m1 'model name' /proc/cpuinfo | cut -d: -f2"], "") or platform.processor() or "unknown"
    ram = 0.0
    raw = cmd(["bash","-lc","awk '/MemTotal/ {printf \"%.3f\", $2/1024/1024}' /proc/meminfo"], "0")
    try: ram=float(raw)
    except ValueError: pass
    gpu = cmd(["nvidia-smi","--query-gpu=name,memory.total","--format=csv,noheader,nounits"], "")
    if gpu:
        name,_,mem=gpu.splitlines()[0].partition(",")
        try: vram=float(mem.strip())/1024
        except ValueError: vram=0
        return {"hardware":name.strip(),"gpuVendor":"NVIDIA","vramGB":round(vram,3),"ramGB":ram,"cpu":cpu,"source":"local host"}
    if platform.system()=="Darwin" and platform.machine()=="arm64":
        raw=cmd(["sysctl","-n","hw.memsize"],"0")
        try: ram=float(raw)/1024**3
        except ValueError: pass
        return {"hardware":"Apple Silicon","gpuVendor":"APPLE","vramGB":ram,"ramGB":ram,"cpu":cpu,"source":"local host"}
    if cmd(["bash","-lc","command -v rocm-smi"],""):
        return {"hardware":"AMD GPU","gpuVendor":"AMD","vramGB":0,"ramGB":ram,"cpu":cpu,"source":"local host","vramNote":"ROCm VRAM unavailable"}
    return {"hardware":"CPU-only / GPU unavailable","gpuVendor":"CPU","vramGB":0,"ramGB":ram,"cpu":cpu,"source":"local host"}

def base_url(url): return url.rstrip('/').removesuffix('/chat/completions').removesuffix('/models')
def headers(key): return {"Content-Type":"application/json","Accept":"application/json", **({"Authorization":"Bearer "+key} if key else {})}
def request_json(url,key,method="GET",payload=None,timeout=30):
    data=json.dumps(payload).encode() if payload is not None else None
    req=urllib.request.Request(url,data=data,headers=headers(key),method=method)
    with urllib.request.urlopen(req,timeout=timeout) as r: return json.load(r)

def models(url,key):
    data=request_json(base_url(url)+"/models",key)
    return data.get("data",[]) if isinstance(data,dict) else []

def stream_trial(url,key,model,prompt,max_tokens,thinking=True):
    payload={"model":model,"messages":[{"role":"user","content":prompt}],"temperature":0,"top_p":1,"max_tokens":max_tokens,"stream":True,"stream_options":{"include_usage":True}}
    if not thinking: payload["chat_template_kwargs"]={"enable_thinking":False}
    req=urllib.request.Request(base_url(url)+"/chat/completions",data=json.dumps(payload).encode(),headers={**headers(key),"Accept":"text/event-stream"},method="POST")
    start=time.perf_counter(); first=None; visible=[]; reasoning=[]; usage={}; chunks=0
    with urllib.request.urlopen(req,timeout=300) as resp:
        for raw in resp:
            line=raw.decode("utf-8","replace").strip()
            if not line.startswith("data:"): continue
            data=line[5:].strip()
            if data=="[DONE]": break
            try: chunk=json.loads(data)
            except json.JSONDecodeError: continue
            chunks+=1; usage.update(chunk.get("usage") or {})
            delta=((chunk.get("choices") or [{}])[0].get("delta") or {})
            text=delta.get("content") or ""; think=delta.get("reasoning_content") or ""
            if text:
                if first is None: first=time.perf_counter()
                visible.append(text)
            if think: reasoning.append(think)
    if not chunks: raise RuntimeError("No SSE chunks returned")
    end=time.perf_counter()
    generated=int(usage.get("completion_tokens") or max(1,len("".join(visible).split())))
    prompt_tokens=int(usage.get("prompt_tokens") or max(1,len(prompt.split())))
    ttft=(first-start)*1000 if first else (end-start)*1000
    gen_ms=max((end-(first or start))*1000,.001)
    return {"promptTokens":prompt_tokens,"generatedTokens":generated,"visibleCharacters":len("".join(visible)),"reasoningCharacters":len("".join(reasoning)),"ttftMs":round(ttft,3),"generationMs":round(gen_ms,3),"generationTPS":round(generated/(gen_ms/1000),3),"promptTPS":round(prompt_tokens/(ttft/1000),3),"usage":usage}

HTML=r'''<!doctype html><html><head><meta charset=utf-8><meta name=viewport content="width=device-width"><title>ReBench Local Studio</title><style>
:root{color-scheme:dark}body{margin:0;background:#0d1117;color:#e6edf3;font:15px system-ui;max-width:1100px;margin:auto;padding:28px}h1{letter-spacing:.08em}small,.muted{color:#8b949e}.grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}.card{border:1px solid #30363d;border-radius:10px;padding:18px;background:#161b22;margin:16px 0}label{display:block;color:#8b949e;margin:10px 0 5px}input,select,button{box-sizing:border-box;width:100%;padding:11px;border:1px solid #484f58;border-radius:6px;background:#0d1117;color:#e6edf3}button{background:#238636;border:0;font-weight:700;cursor:pointer;margin-top:14px}button.secondary{background:#21262d}button:disabled{opacity:.5}.models{display:grid;gap:8px;max-height:260px;overflow:auto}.model{padding:12px;border:1px solid #30363d;border-radius:7px;cursor:pointer}.model.selected{border-color:#2f81f7;background:#172b4d}.suite{display:flex;gap:8px;align-items:center;padding:10px;border:1px solid #30363d;margin:8px 0;border-radius:7px}.suite input{width:auto}.stats{display:grid;grid-template-columns:repeat(4,1fr);gap:8px}.stat{background:#0d1117;padding:12px;border-radius:7px}.stat b{display:block;font-size:20px;color:#58a6ff}pre{white-space:pre-wrap;max-height:300px;overflow:auto;color:#8b949e}@media(max-width:700px){.grid{grid-template-columns:1fr}.stats{grid-template-columns:1fr 1fr}}</style></head><body>
<h1>REBΞNCH LOCAL STUDIO</h1><p class=muted>Universal OpenAI-compatible benchmark runner · local hardware provenance · JSON export</p>
<div class=card><h2>1. Connect API</h2><label>Base URL</label><input id=url value="http://localhost:8888/v1" placeholder="http://localhost:11434/v1"><label>API key <span class=muted>(kept in browser memory only)</span></label><input id=key type=password placeholder="optional"><button class=secondary onclick=discover()>Detect models</button><p id=connect class=muted></p><div id=models class=models></div></div>
<div class=grid><div class=card><h2>2. Scan version</h2><div id=suites></div><label>Thinking</label><select id=thinking><option value=on>Enabled (default)</option><option value=off>Disabled compatibility mode</option></select><button id=run onclick=runScan() disabled>Run scan</button></div><div class=card><h2>3. Local hardware</h2><pre id=hardware>Loading…</pre></div></div>
<div class=card><h2>Run output</h2><p id=status class=muted>Connect an endpoint, select a model, then run a scan.</p><div id=result></div><button id=download class=secondary style="display:none" onclick=download()>Download JSON</button></div>
<script>
let selected=null,last=null; const $=x=>document.getElementById(x);
fetch('/api/hardware').then(r=>r.json()).then(x=>$('hardware').textContent=JSON.stringify(x,null,2));
fetch('/api/suites').then(r=>r.json()).then(xs=>{$('suites').innerHTML=xs.map((x,i)=>`<label class=suite><input type=radio name=suite value="${x.id}" ${i?'':'checked'}>${x.name} <span class=muted>(${x.repetitions} trials)</span></label>`).join('')});
async function discover(){let u=$('url').value,k=$('key').value;$('connect').textContent='Querying /v1/models…';try{let r=await fetch('/api/models',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:u,key:k})});let x=await r.json();if(!r.ok)throw Error(x.error);$('models').innerHTML=x.map(m=>`<div class=model onclick="selectModel(this,'${encodeURIComponent(m.id)}')"><b>${m.id}</b><br><small>${m.owned_by||''} ${m.context_length?'· context '+m.context_length:''} ${m.quantization||m.quant?'· '+(m.quantization||m.quant):''}</small></div>`).join('');$('connect').textContent=`${x.length} model(s) found`; }catch(e){$('connect').textContent='Error: '+e.message}}
function selectModel(el,id){document.querySelectorAll('.model').forEach(x=>x.classList.remove('selected'));el.classList.add('selected');selected=decodeURIComponent(id);$('run').disabled=false}
async function runScan(){let suite=document.querySelector('input[name=suite]:checked').value;$('run').disabled=true;$('status').textContent='Running warmup + measurements…';$('result').innerHTML='';try{let r=await fetch('/api/run',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({url:$('url').value,key:$('key').value,model:selected,suite,thinking:$('thinking').value==='on'})});let x=await r.json();if(!r.ok)throw Error(x.error);last=x;$('status').textContent='Complete — validated JSON record generated';$('result').innerHTML='<div class=stats>'+[['generationTPS','Generation TPS'],['promptTPS','Prompt TPS'],['ttftMs','TTFT ms'],['generatedTokens','Output tokens']].map(([k,n])=>`<div class=stat><small>${n}</small><b>${x[k]}</b></div>`).join('')+'</div><pre>'+JSON.stringify(x,null,2)+'</pre>';$('download').style.display='block'}catch(e){$('status').textContent='Failed: '+e.message}finally{$('run').disabled=!selected}}
function download(){let a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(last,null,2)],{type:'application/json'}));a.download=last.id+'.json';a.click()}
</script></body></html>'''

class Handler(BaseHTTPRequestHandler):
    def send(self,code,obj,ctype="application/json"):
        raw=obj.encode() if isinstance(obj,str) else json.dumps(obj,indent=2).encode(); self.send_response(code);self.send_header("Content-Type",ctype);self.send_header("Content-Length",str(len(raw)));self.end_headers();self.wfile.write(raw)
    def do_GET(self):
        if self.path=="/": return self.send(200,HTML,"text/html; charset=utf-8")
        if self.path=="/api/hardware": return self.send(200,hardware())
        if self.path=="/api/suites": return self.send(200,[{"id":k,**v} for k,v in SUITES.items()])
        self.send(404,{"error":"not found"})
    def do_POST(self):
        try: body=json.loads(self.rfile.read(int(self.headers.get("Content-Length",0))))
        except Exception: return self.send(400,{"error":"invalid JSON"})
        try:
            if self.path=="/api/models": return self.send(200,models(body["url"],body.get("key", "")))
            if self.path=="/api/run": return self.send(200,run(body))
            self.send(404,{"error":"not found"})
        except Exception as e: self.send(502,{"error":type(e).__name__+": "+str(e)})
    def log_message(self,*args): pass

def run(x):
    suite=SUITES[x["suite"]]; hw=hardware(); trials=[]
    for _ in range(1): stream_trial(x["url"],x.get("key",""),x["model"],suite["prompt"],suite["max_tokens"],x.get("thinking",True))
    for _ in range(suite["repetitions"]): trials.append(stream_trial(x["url"],x.get("key",""),x["model"],suite["prompt"],suite["max_tokens"],x.get("thinking",True)))
    avg=lambda k: round(sum(t[k] for t in trials)/len(trials),3)
    now=datetime.now(timezone.utc).replace(microsecond=0).strftime("%Y-%m-%dT%H:%M:%SZ")
    rec={"schemaVersion":"2.0","id":"RUN-"+now.replace('-','').replace(':','')+"-"+os.urandom(3).hex(),"model":x["model"],"suite":x["suite"],"suiteName":suite["name"],"thinkingEnabled":bool(x.get("thinking",True)),"hardware":hw,"contextLength":"provider metadata not exposed","prompt":suite["prompt"],"promptTokens":round(sum(t["promptTokens"] for t in trials)/len(trials)),"generatedTokens":round(sum(t["generatedTokens"] for t in trials)/len(trials)),"promptTPS":avg("promptTPS"),"generationTPS":avg("generationTPS"),"ttftMs":avg("ttftMs"),"trials":trials,"timestamp":now,"status":"PENDING","provenance":"measured locally by ReBench Local Studio"}
    out=Path("results")/"local";out.mkdir(parents=True,exist_ok=True);(out/(rec["id"]+".json")).write_text(json.dumps(rec,indent=2)+"\n");return rec

def main():
    p=argparse.ArgumentParser();p.add_argument('--host',default='127.0.0.1');p.add_argument('--port',type=int,default=8765);a=p.parse_args()
    server=ThreadingHTTPServer((a.host,a.port),Handler);url=f'http://{a.host}:{a.port}';print(f'ReBench Local Studio: {url}',flush=True)
    try: webbrowser.open(url)
    except Exception: pass
    server.serve_forever()
if __name__=='__main__': main()
