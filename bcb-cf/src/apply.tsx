import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BcbLogo, CONTENT, type Lang } from "./bcbContent";
import "./index.css";

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

  const [msg, setMsg] = useState("");
  const [msgErr, setMsgErr] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState(false);

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
    try {
      const res = await fetch("/api/lead", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: e,
          company: company.trim() || undefined,
          useCase: useCase || undefined,
          dataItems: items,
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
