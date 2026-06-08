import { useEffect, useRef, useState } from "react";
import { createRoot } from "react-dom/client";
import { BcbLogo, CONTENT, type Lang } from "./bcbContent";
import { extractPayload, type ExtractOk } from "./payloadExtractor";
import "./index.css";

type ExtractMode = "auto" | "hex" | "base64";

/** Status line shown under the payload textarea. `note` is informational
 * guidance (e.g. already-decoded export), not an error. */
type PayloadStatus = { kind: "ok" | "note"; text: string } | null;

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;

function detectInitialLang(): Lang {
  if (typeof window !== "undefined") {
    const p = new URLSearchParams(window.location.search).get("lang");
    if (p === "EN" || p === "KO") return p;
    const stored = window.localStorage.getItem("bcb_lang");
    if (stored === "EN" || stored === "KO") return stored;
    if (navigator.language?.toLowerCase().startsWith("ko")) return "KO";
  }
  return "EN";
}

interface DataItem {
  type: string;
  label: string;
  value: string;
}

function Apply() {
  const [lang] = useState<Lang>(detectInitialLang);
  const t = CONTENT[lang];
  const a = t.apply;

  useEffect(() => {
    document.documentElement.lang = lang === "KO" ? "ko" : "en";
    document.title = `${lang === "KO" ? "테스터 신청" : "Become a tester"} · BCB`;
  }, [lang]);

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");

  // Dropdown-driven data builder.
  const dataTypeOpts = t.contact.fields.dataTypeOpts.filter((o) => o.value !== "");
  const [draftType, setDraftType] = useState(dataTypeOpts[0]?.value ?? "");
  const [draftValue, setDraftValue] = useState("");
  const [items, setItems] = useState<DataItem[]>([]);

  // Raw payload extractor. The customer pastes a platform export (or a plain
  // hex/base64 string) and we pull the raw payload bytes out client-side. On
  // submit the result rides along in `dataItems` as a {type:'payload'} entry —
  // the /api/lead schema is unchanged.
  const [payloadText, setPayloadText] = useState("");
  const [payloadMode, setPayloadMode] = useState<ExtractMode>("auto");
  const [payloadResult, setPayloadResult] = useState<ExtractOk | null>(null);
  const [payloadStatus, setPayloadStatus] = useState<PayloadStatus>(null);
  const payloadRef = useRef<HTMLTextAreaElement>(null);

  const [msg, setMsg] = useState("");
  const [msgErr, setMsgErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

  // Run extraction against the given text + mode and reflect the outcome in the
  // status line. Byte count is shown neutrally (no min/max judgement).
  const runExtract = (text: string, mode: ExtractMode) => {
    if (!text.trim()) {
      setPayloadResult(null);
      setPayloadStatus(null);
      return;
    }
    const res = extractPayload(text, mode);
    if (res.ok) {
      setPayloadResult(res);
      setPayloadStatus({ kind: "ok", text: a.payload.detected(res.platform, res.len) });
      return;
    }
    setPayloadResult(null);
    if (res.reason === "empty") {
      setPayloadStatus(null);
    } else if (res.reason === "decoded_only") {
      setPayloadStatus({ kind: "note", text: a.payload.decodedOnly });
    } else {
      setPayloadStatus({ kind: "note", text: a.payload.checkFormat });
    }
  };

  const setMode = (mode: ExtractMode) => {
    setPayloadMode(mode);
    // Re-run with the new mode so a manual Hex/Base64 override takes effect
    // immediately for ambiguous plain strings.
    runExtract(payloadText, mode);
  };

  const addItem = () => {
    const value = draftValue.trim();
    if (!value) return;
    const opt = dataTypeOpts.find((o) => o.value === draftType);
    setItems((prev) => [
      ...prev,
      { type: draftType, label: opt?.label ?? draftType, value },
    ]);
    setDraftValue("");
  };

  const removeItem = (idx: number) => {
    setItems((prev) => prev.filter((_, i) => i !== idx));
  };

  const handleSubmit = async () => {
    const e = email.trim();
    if (!EMAIL_RE.test(e)) {
      setMsgErr(true);
      setMsg(t.contact.invalidEmail);
      return;
    }
    setMsgErr(false);
    setMsg("");
    setSubmitting(true);
    // Append the extracted raw payload (if any) to dataItems. Shape matches the
    // existing /api/lead schema: { type, label, value }.
    const dataItems = payloadResult
      ? [...items, { type: "payload", label: payloadResult.platform, value: payloadResult.hex }]
      : items;
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: e,
          company: company.trim() || undefined,
          useCase: useCase || undefined,
          dataItems,
          lang,
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      setDone(true);
      setMsg(t.contact.success);
    } catch (err) {
      console.error("[apply] submit failed:", err);
      setMsgErr(true);
      setMsg(
        lang === "KO"
          ? "전송에 실패했습니다. 잠시 후 다시 시도해 주세요."
          : "Submission failed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const formInvalid = msgErr && !EMAIL_RE.test(email.trim());

  return (
    <div className="bcb">
      <div className="apply-page">
        <a className="brand" href={`/?lang=${lang}`}>
          <BcbLogo />
          <span className="labs">LABS</span>
        </a>

        <div className="eyebrow" style={{ marginTop: 28 }}>{t.contact.eyebrow}</div>
        <h2 className="apply-title">{a.title}</h2>
        <p className="lead">{a.intro}</p>

        {done ? (
          <div className="apply-done">
            <div id="msg">{msg}</div>
            <p className="alt">
              <a href={`/?lang=${lang}`}>{a.back}</a>
            </p>
          </div>
        ) : (
          <>
            <div className="fields" style={{ marginTop: 30 }}>
              <div className="field">
                <label>{t.contact.fields.company}</label>
                <input value={company} onChange={(e) => setCompany(e.target.value)} />
              </div>
              <div className="field">
                <label>{t.contact.fields.useCase}</label>
                <select value={useCase} onChange={(e) => setUseCase(e.target.value)}>
                  {t.contact.fields.useCaseOpts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Dropdown-driven data builder */}
            <div className="field full" style={{ marginTop: 18 }}>
              <label>{a.addLabel}</label>
              <div className="adder">
                <select value={draftType} onChange={(e) => setDraftType(e.target.value)}>
                  {dataTypeOpts.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
                <input
                  value={draftValue}
                  placeholder={a.valuePlaceholder}
                  onChange={(e) => setDraftValue(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addItem(); } }}
                />
                <button type="button" className="add" onClick={addItem}>{a.addBtn}</button>
              </div>
              <span className="hint">{a.note}</span>
            </div>

            {/* Added items */}
            {items.length === 0 ? (
              <p className="empty-hint">{a.emptyHint}</p>
            ) : (
              <ul className="items">
                {items.map((it, i) => (
                  <li key={i}>
                    <span className="it-type">{it.label}</span>
                    <span className="it-val">{it.value}</span>
                    <button type="button" className="rm" onClick={() => removeItem(i)} aria-label={a.removeLabel}>×</button>
                  </li>
                ))}
              </ul>
            )}

            {/* Raw payload extractor — paste a platform export / hex / base64 */}
            <div className="field full payload-extract" style={{ marginTop: 22 }}>
              <div className="payload-head">
                <label htmlFor="payload-sample">{a.payload.label}</label>
                <div className="mode-toggle" role="group" aria-label={a.payload.modeLabel}>
                  <span className="mt-label">{a.payload.modeLabel}</span>
                  {(["auto", "hex", "base64"] as ExtractMode[]).map((m) => (
                    <button
                      key={m}
                      type="button"
                      className={`mt-btn${payloadMode === m ? " active" : ""}`}
                      aria-pressed={payloadMode === m}
                      onClick={() => setMode(m)}
                    >
                      {m === "auto" ? a.payload.modeAuto : m === "hex" ? a.payload.modeHex : a.payload.modeBase64}
                    </button>
                  ))}
                </div>
              </div>
              <textarea
                id="payload-sample"
                ref={payloadRef}
                value={payloadText}
                placeholder={a.payload.placeholder}
                onChange={(e) => setPayloadText(e.target.value)}
                onBlur={() => runExtract(payloadText, payloadMode)}
                onPaste={() => {
                  // Value isn't updated until after the paste event; read it next tick.
                  setTimeout(() => runExtract(payloadRef.current?.value ?? "", payloadMode), 0);
                }}
              />
              <div className="payload-foot">
                <button type="button" className="add" onClick={() => runExtract(payloadText, payloadMode)}>
                  {a.payload.extractBtn}
                </button>
                {payloadStatus && (
                  <span className={`payload-status${payloadStatus.kind === "ok" ? " is-ok" : " is-note"}`}>
                    {payloadStatus.text}
                  </span>
                )}
              </div>
              <span className="hint">{a.payload.hint}</span>
            </div>

            <div className={`form${formInvalid ? " invalid" : ""}`} style={{ marginTop: 22 }}>
              <input
                type="email"
                placeholder={t.contact.emailPlaceholder}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") handleSubmit(); }}
              />
              <button onClick={handleSubmit} disabled={submitting}>
                {submitting ? t.contact.submitting : t.contact.submit}
              </button>
            </div>
            <div id="msg" className={msgErr ? "err" : undefined}>{msg}</div>
            <p className="alt">
              <a href={`/?lang=${lang}`}>{a.back}</a>
            </p>
          </>
        )}
      </div>
    </div>
  );
}

createRoot(document.getElementById("root")!).render(<Apply />);
