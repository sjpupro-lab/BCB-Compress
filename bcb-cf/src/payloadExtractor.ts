// @ts-nocheck
/* BCB payload extractor — 의존성 없음
   입력: 고객이 붙여넣은 텍스트 (플랫폼 JSON / base64 / hex)
   출력: { ok, platform, sourceKey, bytes, hex, len } 또는 { ok:false, reason }

   순수 브라우저 JS. 외부 패키지·빌드 단계 없음. 아래 본문은 통합 사양 그대로다.
   apply.tsx 폼이 `extractPayload`만 import 해 사용한다. */

/** Successful extraction — raw payload bytes pulled from the input. */
export interface ExtractOk {
  ok: true;
  platform: string;
  sourceKey: string;
  bytes: Uint8Array;
  hex: string;
  len: number;
}
/** Failed extraction. `reason` distinguishes guidance (e.g. "decoded_only")
 * from plain parse failures. */
export interface ExtractFail {
  ok: false;
  reason: string;
}
export type ExtractResult = ExtractOk | ExtractFail;

export function extractPayload(raw: string, mode?: string): ExtractResult {
  const text = (raw || "").trim();
  if(!text) return { ok:false, reason:"empty" };
  let obj = null;
  try { obj = JSON.parse(text); } catch(_) {}
  if(obj && typeof obj === "object") return fromJson(obj);
  return fromString(text, mode || "auto");
}

function fromJson(obj){
  let v = findKey(obj,"frm_payload") ?? findKey(obj,"frmPayload");
  if(typeof v === "string") return b64Result(v,"The Things Stack (TTN)","frm_payload");
  v = findKey(obj,"PayloadData");
  if(typeof v === "string") return b64Result(v,"AWS IoT Core","PayloadData");
  v = findKey(obj,"data");
  if(typeof v === "string" && looksB64(v)) return b64Result(v,"ChirpStack","data");
  v = findKey(obj,"payload");
  if(typeof v === "string" && looksB64(v)) return b64Result(v,"MQTT payload","payload");
  for(const k of ["decoded_payload","object","objectJSON","object_json"]){
    if(findKey(obj,k) !== undefined) return { ok:false, reason:"decoded_only" };
  }
  return { ok:false, reason:"no_key" };
}

function fromString(text, mode){
  const noWs = text.replace(/\s/g,"");
  const hexCore = noWs.replace(/0x/gi,"").replace(/[:,]/g,"");
  const pureHex = /^[0-9a-fA-F]+$/.test(hexCore) && hexCore.length % 2 === 0;
  const hasB64Only = /[G-Zg-z+/=_\-]/.test(noWs.replace(/[a-fA-F]/g,""));
  let useHex;
  if(mode === "hex") useHex = true;
  else if(mode === "base64") useHex = false;
  else useHex = pureHex && !hasB64Only;
  try{
    const bytes = useHex ? hexToBytes(hexCore) : b64ToBytes(noWs);
    return ok(bytes, useHex ? "Hex 입력" : "Base64 입력", useHex ? "hex" : "base64");
  }catch(e){ return { ok:false, reason:"unparseable" }; }
}

function findKey(o,key){
  if(o == null || typeof o !== "object") return undefined;
  if(Object.prototype.hasOwnProperty.call(o,key)) return o[key];
  for(const k of Object.keys(o)){
    const r = findKey(o[k],key);
    if(r !== undefined) return r;
  }
  return undefined;
}
function looksB64(s){ return /^[A-Za-z0-9+/]+={0,2}$/.test(s) && s.length % 4 === 0 && s.length >= 4; }
function b64ToBytes(b64){
  let s = b64.replace(/\s/g,"").replace(/-/g,"+").replace(/_/g,"/");
  while(s.length % 4) s += "=";
  const bin = atob(s);
  const out = new Uint8Array(bin.length);
  for(let i=0;i<bin.length;i++) out[i]=bin.charCodeAt(i);
  return out;
}
function hexToBytes(hex){
  const s = hex.replace(/0x/gi,"").replace(/[\s:,]/g,"");
  if(s.length % 2) throw new Error("odd length");
  if(!/^[0-9a-fA-F]*$/.test(s)) throw new Error("bad hex");
  const out = new Uint8Array(s.length/2);
  for(let i=0;i<out.length;i++) out[i]=parseInt(s.substr(i*2,2),16);
  return out;
}
function b64Result(v,platform,key){
  try{ return ok(b64ToBytes(v),platform,key); }
  catch(_){ return { ok:false, reason:"bad_b64" }; }
}
function ok(bytes,platform,key){
  return { ok:true, platform, sourceKey:key, bytes, hex:bytesToHex(bytes), len:bytes.length };
}
function bytesToHex(bytes){
  let h=""; for(const b of bytes) h += b.toString(16).padStart(2,"0");
  return h;
}
