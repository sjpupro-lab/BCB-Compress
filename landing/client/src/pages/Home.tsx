import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BcbLogo, CONTENT, type Lang } from "./bcbContent";

const EMAIL_RE = /^[^@\s]+@[^@\s]+\.[^@\s]+$/;
const SALES_EMAIL = "jahyag@gmail.com";

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

export default function Home() {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const [, navigate] = useLocation();
  const t = CONTENT[lang];

  useEffect(() => {
    window.localStorage.setItem("bcb_lang", lang);
    document.documentElement.lang = lang === "KO" ? "ko" : "en";
    document.title = t.title;
    // Reflect the active language in the URL (mirrors the original EN/KO link structure)
    const url = new URL(window.location.href);
    if (url.searchParams.get("lang") !== lang) {
      url.searchParams.set("lang", lang);
      window.history.replaceState({}, "", url.toString());
    }
  }, [lang, t.title]);

  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [useCase, setUseCase] = useState("");
  const [dataType, setDataType] = useState("");
  const [avgPacketSize, setAvgPacketSize] = useState("");
  const [packetsPerSec, setPacketsPerSec] = useState("");
  const [network, setNetwork] = useState("");
  const [msg, setMsg] = useState("");
  const [msgErr, setMsgErr] = useState(false);

  const submit = trpc.leads.submit.useMutation({
    onSuccess: (res) => {
      navigate(`/lead?id=${res.id}&lang=${lang}`);
    },
    onError: () => {
      setMsgErr(true);
      setMsg(lang === "KO" ? "전송에 실패했습니다. 잠시 후 다시 시도해 주세요." : "Submission failed. Please try again.");
    },
  });

  const handleSubmit = () => {
    const e = email.trim();
    if (!EMAIL_RE.test(e)) {
      setMsgErr(true);
      setMsg(t.contact.invalidEmail);
      return;
    }
    // Packet size / rate are optional; fall back to representative defaults
    // so a visitor can get an instant estimate with just an email.
    const sizeRaw = parseInt(avgPacketSize, 10);
    const ppsRaw = parseInt(packetsPerSec, 10);
    const size = Number.isFinite(sizeRaw) && sizeRaw >= 1 ? sizeRaw : 80;
    const pps = Number.isFinite(ppsRaw) && ppsRaw >= 1 ? ppsRaw : 50000;
    setMsgErr(false);
    setMsg("");
    submit.mutate({
      email: e,
      company: company.trim() || undefined,
      useCase: useCase || undefined,
      dataType: dataType || undefined,
      avgPacketSize: size,
      packetsPerSec: pps,
      networkType: network || undefined,
      lang,
    });
  };

  const scrollTo = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const formInvalid = useMemo(() => msgErr && !EMAIL_RE.test(email.trim()), [msgErr, email]);

  return (
    <div className="bcb">
      <nav className="nav">
        <div className="wrap">
          <a className="brand" href="#" onClick={(e) => { e.preventDefault(); window.scrollTo({ top: 0, behavior: "smooth" }); }}>
            <BcbLogo />
            <span className="labs">LABS</span>
          </a>
          <div className="navlinks">
            <a onClick={scrollTo("perf")}>{t.nav.perf}</a>
            <a onClick={scrollTo("specs")}>{t.nav.specs}</a>
            <a onClick={scrollTo("shine")}>{t.nav.shine}</a>
            <a className="cta" onClick={scrollTo("contact")}>{t.nav.contact}</a>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section className="hero">
        <div className="wrap">
          <div className="kick">{t.hero.kick}</div>
          <h1>{t.hero.h1}</h1>
          <p className="stand">{t.hero.stand}</p>
          <div className="act">
            <a className="btn btn-primary" onClick={scrollTo("contact")}>{t.hero.cta}</a>
            <a className="lnk" onClick={scrollTo("perf")}>{t.hero.seePerf}</a>
          </div>
        </div>
      </section>

      {/* METRICS */}
      <div className="metrics">
        <div className="wrap">
          {t.metrics.map((m, i) => (
            <div className="m" key={i}>
              <div className="mv">{m.v}</div>
              <div className="ml">{m.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* BEST */}
      <section className="best">
        <div className="wrap">
          <div>
            <div className="eyebrow">{t.best.eyebrow}</div>
            <h2>{t.best.h2}</h2>
            <p className="lead">{t.best.lead}</p>
          </div>
          <dl>
            {t.best.dl.map((d, i) => (
              <div key={i}>
                <dt>{d.dt}</dt>
                <dd>{d.dd}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* SAVINGS */}
      <section className="save">
        <div className="wrap">
          <div className="eyebrow">{t.save.eyebrow}</div>
          <h2>{t.save.h2}</h2>
          <div style={{ marginTop: 38 }}>
            {t.save.rows.map((r) => (
              <div className="row" key={r.n}>
                <div className="n">{r.n}</div>
                <div>
                  <h3>{r.h3}</h3>
                  <p>{r.p}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* BASE LAYER */}
      <section className="layer" id="layer">
        <div className="wrap">
          <div>
            <div className="eyebrow">{t.layer.eyebrow}</div>
            <h2>{t.layer.h2}</h2>
            <ul>
              {t.layer.items.map((it, i) => (
                <li key={i}>
                  <span className="mk">+</span>
                  <span>{it}</span>
                </li>
              ))}
            </ul>
          </div>
          <div className="stack">
            {t.layer.stack.map((s, i) => (
              <div className={`lrow${s.hl ? " hl" : ""}`} key={i}>
                <span className="lt">{s.lt}</span>
                {s.label}
                {s.tag && <span className="tag">{s.tag}</span>}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* PERFORMANCE */}
      <section id="perf">
        <div className="wrap">
          <div className="eyebrow">{t.perf.eyebrow}</div>
          <h2>{t.perf.h2}</h2>
          <p className="lead">{t.perf.lead}</p>
          <div className="scrollx">
            <table>
              <caption>{t.perf.caption}</caption>
              <thead>
                <tr>
                  {t.perf.headers.map((h, i) => (
                    <th key={i}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {t.perf.rows.map((row, ri) => (
                  <tr key={ri}>
                    {row.map((cell, ci) => (
                      <td key={ci} className={ci === 1 ? "best-cell" : undefined}>
                        {cell}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="tnote">{t.perf.note}</p>
        </div>
      </section>

      {/* SPECS */}
      <section className="specs" id="specs">
        <div className="wrap">
          <div className="eyebrow">{t.specs.eyebrow}</div>
          <h2>{t.specs.h2}</h2>
          <div className="specstrip">
            {t.specs.strip.map((c, i) => (
              <div className="c" key={i}>
                <div className="b">{c.b}</div>
                <div className="l">{c.l}</div>
              </div>
            ))}
          </div>
          <div className="specgrid">
            {t.specs.blocks.map((blk, i) => (
              <div className="blk" key={i}>
                <div className="bh">{blk.bh}</div>
                {blk.rows.map((r, ri) => (
                  <div className="specrow" key={ri}>
                    <span className="k">{r.k}</span>
                    <span className="v">{r.v}</span>
                  </div>
                ))}
              </div>
            ))}
          </div>
          <div className="specfoot">{t.specs.foot}</div>
        </div>
      </section>

      {/* SHINE */}
      <section className="shine" id="shine">
        <div className="wrap">
          <div className="eyebrow">{t.shine.eyebrow}</div>
          <h2>{t.shine.h2}</h2>
          <div className="grid">
            {t.shine.cards.map((c) => (
              <div className="u" key={c.t}>
                <h3>
                  <span className="t">{c.t}</span> {c.h3}
                </h3>
                <p>{c.p}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CONTACT / FORM */}
      <section className="end" id="contact">
        <div className="wrap">
          <div className="eyebrow">{t.contact.eyebrow}</div>
          <h2>{t.contact.h2}</h2>
          <p className="lead" style={{ marginBottom: 32 }}>{t.contact.lead}</p>

          <div className="fields">
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
            <div className="field">
              <label>{t.contact.fields.dataType}</label>
              <select value={dataType} onChange={(e) => setDataType(e.target.value)}>
                {t.contact.fields.dataTypeOpts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.contact.fields.network}</label>
              <select value={network} onChange={(e) => setNetwork(e.target.value)}>
                {t.contact.fields.networkOpts.map((o) => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>{t.contact.fields.avgPacketSize}</label>
              <input
                type="number"
                inputMode="numeric"
                value={avgPacketSize}
                onChange={(e) => setAvgPacketSize(e.target.value)}
                placeholder="80"
              />
            </div>
            <div className="field">
              <label>{t.contact.fields.packetsPerSec}</label>
              <input
                type="number"
                inputMode="numeric"
                value={packetsPerSec}
                onChange={(e) => setPacketsPerSec(e.target.value)}
                placeholder="50000"
              />
            </div>
          </div>

          <div className={`form${formInvalid ? " invalid" : ""}`}>
            <input
              type="email"
              placeholder={t.contact.emailPlaceholder}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") handleSubmit();
              }}
            />
            <button onClick={handleSubmit} disabled={submit.isPending}>
              {submit.isPending ? t.contact.submitting : t.contact.submit}
            </button>
          </div>
          <div id="msg" className={msgErr ? "err" : undefined}>{msg}</div>
          <p className="alt">
            {t.contact.altPrefix}
            <a href={`mailto:${SALES_EMAIL}`}>{SALES_EMAIL}</a>
          </p>
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div>{t.footer.rights}</div>
          <div className="lang">
            <button className={lang === "EN" ? "active" : ""} onClick={() => setLang("EN")}>EN</button>
            {" · "}
            <button className={lang === "KO" ? "active" : ""} onClick={() => setLang("KO")}>KO</button>
            {" · "}
            <a href="https://github.com/sjpupro-lab/BCB-Compress" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
