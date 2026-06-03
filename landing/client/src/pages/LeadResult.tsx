import { useEffect, useMemo, useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { BcbLogo, CONTENT, type Lang } from "./bcbContent";

function getParams() {
  const sp = new URLSearchParams(window.location.search);
  return { id: sp.get("id") || "", lang: (sp.get("lang") as Lang) || null };
}

export default function LeadResult() {
  const [, navigate] = useLocation();
  const [{ id, lang: urlLang }] = useState(getParams);

  const query = trpc.leads.getResult.useQuery({ id }, { enabled: !!id, retry: false });

  // Prefer the lang stored on the lead; fall back to URL param, then EN.
  const lang: Lang = (query.data?.lang as Lang) || urlLang || "EN";
  const t = CONTENT[lang];

  useEffect(() => {
    document.documentElement.lang = lang === "KO" ? "ko" : "en";
    document.title = t.title;
    window.scrollTo({ top: 0 });
  }, [lang, t.title]);

  const [done, setDone] = useState(false);
  const [consultErr, setConsultErr] = useState("");
  const consult = trpc.leads.requestConsult.useMutation({
    onSuccess: () => {
      setConsultErr("");
      setDone(true);
    },
    onError: () => {
      setConsultErr(
        lang === "KO"
          ? "요청에 실패했습니다. 잠시 후 다시 시도해 주세요."
          : "Request failed. Please try again.",
      );
    },
  });

  const alreadyInterested = useMemo(
    () => query.data?.status === "interested" || query.data?.status === "contacted",
    [query.data?.status],
  );

  const isDone = done || alreadyInterested;

  return (
    <div className="bcb">
      <nav className="nav">
        <div className="wrap">
          <a
            className="brand"
            href="#"
            onClick={(e) => {
              e.preventDefault();
              navigate("/");
            }}
          >
            <BcbLogo />
            <span className="labs">LABS</span>
          </a>
          <div className="navlinks">
            <a onClick={() => navigate("/")}>{t.result.backHome}</a>
          </div>
        </div>
      </nav>

      <section className="end" style={{ borderBottom: "1px solid var(--rule)" }}>
        <div className="wrap">
          {!id || query.isError ? (
            <>
              <div className="eyebrow">BCB</div>
              <h2>{t.result.notFound}</h2>
              <p className="lead" style={{ marginTop: 12 }}>
                <a className="lnk" onClick={() => navigate("/")}>{t.result.backHome}</a>
              </p>
            </>
          ) : query.isLoading || !query.data ? (
            <>
              <div className="eyebrow">BCB</div>
              <h2>{t.result.loading}</h2>
            </>
          ) : (
            <>
              <div className="eyebrow">{t.contact.eyebrow}</div>
              <h2>{t.result.title}</h2>
              <p className="lead" style={{ marginBottom: 28 }}>{t.result.intro}</p>

              <div className="result">
                <div className="rrow">
                  <span className="rk">{t.result.labels.ratio}</span>
                  <span className="rv"><span className="big">{query.data.ratioUsed}×</span></span>
                </div>
                <div className="rrow">
                  <span className="rk">{t.result.labels.bandwidth}</span>
                  <span className="rv"><span className="big">{query.data.savingsPct}%</span> · {query.data.monthlySaved}</span>
                </div>
                <div className="rrow">
                  <span className="rk">{t.result.labels.cost}</span>
                  <span className="rv">${query.data.monthlyCostSaved}</span>
                </div>
                <div className="rrow">
                  <span className="rk">{t.result.labels.hw}</span>
                  <span className="rv">{query.data.hwNote}</span>
                </div>
              </div>

              {query.data.overLimitNote && (
                <p className="notice">{query.data.overLimitNote}</p>
              )}
              <p className="caveat">{t.result.labels && t.result.caveat}</p>
              <p className="caveat">{t.result.costNote}</p>

              <div className="act" style={{ marginTop: 30, display: "flex", gap: 22, alignItems: "center", flexWrap: "wrap" }}>
                {isDone ? (
                  <div id="msg" style={{ marginTop: 0 }}>{t.result.consultDone}</div>
                ) : (
                  <button
                    className="btn btn-primary"
                    onClick={() => consult.mutate({ id })}
                    disabled={consult.isPending}
                  >
                    {consult.isPending ? t.result.consulting : t.result.consult}
                  </button>
                )}
                <a className="lnk" onClick={() => navigate("/")}>{t.result.backHome}</a>
              </div>
              {consultErr && (
                <div id="msg" className="err">{consultErr}</div>
              )}
            </>
          )}
        </div>
      </section>

      <footer>
        <div className="wrap">
          <div>{t.footer.rights}</div>
          <div className="lang">
            <a href="https://github.com/sjpupro-lab/BCB-Compress" target="_blank" rel="noreferrer">GitHub</a>
          </div>
        </div>
      </footer>
    </div>
  );
}
