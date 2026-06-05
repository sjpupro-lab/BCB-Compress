import { useEffect, useState } from "react";
import { createRoot } from "react-dom/client";
import { BcbLogo, CONTENT, type Lang } from "./bcbContent";
import "./index.css";

const APPLY_URL = "/apply";

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

function openApply(lang: Lang) {
  // Open the application form in a new window/tab, carrying the active language.
  window.open(`${APPLY_URL}?lang=${lang}`, "_blank", "noopener");
}

function Landing() {
  const [lang, setLang] = useState<Lang>(detectInitialLang);
  const t = CONTENT[lang];

  useEffect(() => {
    window.localStorage.setItem("bcb_lang", lang);
    document.documentElement.lang = lang === "KO" ? "ko" : "en";
    document.title = t.title;
  }, [lang, t.title]);

  const scrollTo = (id: string) => (ev: React.MouseEvent) => {
    ev.preventDefault();
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
  };

  const apply = (ev: React.MouseEvent) => {
    ev.preventDefault();
    openApply(lang);
  };

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
            <a className="cta" href={APPLY_URL} onClick={apply}>{t.nav.contact}</a>
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
            <a className="btn btn-primary" href={APPLY_URL} onClick={apply}>{t.hero.cta}</a>
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

      {/* CONTACT — opens the application form in a new window */}
      <section className="end" id="contact">
        <div className="wrap">
          <div className="eyebrow">{t.contact.eyebrow}</div>
          <h2>{t.contact.h2}</h2>
          <p className="lead" style={{ marginBottom: 32 }}>{t.contact.lead}</p>
          <div className="act">
            <a className="btn btn-primary" href={APPLY_URL} onClick={apply}>{t.contact.submit}</a>
          </div>
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

createRoot(document.getElementById("root")!).render(<Landing />);
