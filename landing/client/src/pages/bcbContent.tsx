export type Lang = "EN" | "KO";

export const BcbLogo = () => (
  <svg
    className="bcblogo"
    viewBox="0 0 300 120"
    xmlns="http://www.w3.org/2000/svg"
    role="img"
    aria-label="BCB"
  >
    <rect x="4.0" y="46" width="20" height="62.0" fill="currentColor" />
    <rect x="4.0" y="44" width="20" height="6" rx="3" fill="currentColor" />
    <circle cx="44" cy="78" r="30" fill="none" stroke="currentColor" strokeWidth="20" />
    <path
      d="M 159.00 52.02 A 30 30 0 1 1 159.00 103.98"
      fill="none"
      stroke="#e2618a"
      strokeWidth="20"
      strokeLinecap="round"
    />
    <rect x="214.0" y="46" width="20" height="62.0" fill="currentColor" />
    <rect x="214.0" y="44" width="20" height="6" rx="3" fill="currentColor" />
    <circle cx="254.0" cy="78" r="30" fill="none" stroke="currentColor" strokeWidth="20" />
  </svg>
);

type Content = {
  title: string;
  nav: { perf: string; specs: string; shine: string; contact: string };
  hero: { kick: string; h1: React.ReactNode; stand: React.ReactNode; cta: string; seePerf: string };
  metrics: { v: React.ReactNode; l: string }[];
  best: { eyebrow: string; h2: React.ReactNode; lead: string; dl: { dt: string; dd: React.ReactNode }[] };
  save: { eyebrow: string; h2: React.ReactNode; rows: { n: string; h3: string; p: string }[] };
  layer: { eyebrow: string; h2: React.ReactNode; items: React.ReactNode[]; stack: { lt: string; label: string; tag?: string; hl?: boolean }[] };
  perf: { eyebrow: string; h2: string; lead: string; caption: string; headers: string[]; rows: string[][]; note: React.ReactNode };
  specs: {
    eyebrow: string;
    h2: React.ReactNode;
    strip: { b: React.ReactNode; l: string }[];
    blocks: { bh: string; rows: { k: string; v: React.ReactNode }[] }[];
    foot: string;
  };
  shine: { eyebrow: string; h2: React.ReactNode; cards: { t: string; h3: string; p: React.ReactNode }[] };
  contact: {
    eyebrow: string;
    h2: React.ReactNode;
    lead: string;
    fields: {
      company: string;
      useCase: string;
      useCaseOpts: { value: string; label: string }[];
      dataType: string;
      dataTypeOpts: { value: string; label: string }[];
      avgPacketSize: string;
      packetsPerSec: string;
      network: string;
      networkOpts: { value: string; label: string }[];
    };
    emailPlaceholder: string;
    submit: string;
    submitting: string;
    invalidEmail: string;
    invalidNumbers: string;
    success: string;
    altPrefix: string;
  };
  result: {
    title: React.ReactNode;
    intro: string;
    labels: { ratio: string; bandwidth: string; cost: string; hw: string };
    costNote: string;
    caveat: string;
    consult: string;
    consulting: string;
    consultDone: string;
    backHome: string;
    loading: string;
    notFound: string;
  };
  footer: { rights: string };
};

export const CONTENT: Record<Lang, Content> = {
  KO: {
    title: "BCB — 작은 패킷을 위한 무손실 압축",
    nav: { perf: "성능", specs: "사양", shine: "활용", contact: "문의" },
    hero: {
      kick: "Binary Compression by BT · 무손실",
      h1: (<>작은 패킷을 <em>더 작게.</em></>),
      stand: (<><b>20–512 byte</b> 구간의 정형 패킷과 bit-packed 레코드를 위한 무손실 압축. IoT·임베디드·게임 네트워킹에 바로 얹습니다.</>),
      cta: "도입 문의 →",
      seePerf: "성능 보기",
    },
    metrics: [
      { v: (<>2.73<span className="x">×</span></>), l: "80 B 센서 패킷 · 실측" },
      { v: (<>1.53<small style={{ fontFamily: "var(--serif)", fontSize: 22 }}> KB</small></>), l: "디코드 스택 · 측정" },
      { v: <>0</>, l: "외부 의존성 · libm 불필요" },
    ],
    best: {
      eyebrow: "핵심",
      h2: (<>이미 짠 패킷에서 <em>한 번 더.</em></>),
      lead: "bit-packing이 필드 크기를 줄인 뒤에도, 값에는 규칙적인 패턴이 남습니다. BCB는 그 패턴을 압축합니다.",
      dl: [
        { dt: "대상", dd: (<>작고 정형화된 패킷 — 센서 텔레메트리, 고정 레코드, 게임 상태 <span>패킷.</span></>) },
        { dt: "방식", dd: (<>송수신단이 공유하는 패킷 프로파일 기반의 무손실 압축. <span>round-trip 검증.</span></>) },
        { dt: "탑재", dd: (<>정수 연산 전용 코어. <span>MCU부터 서버까지 동일 코드.</span></>) },
      ],
    },
    save: {
      eyebrow: "절약",
      h2: (<>한 번 얹으면, <em>여러 곳이</em> 줄어듭니다.</>),
      rows: [
        { n: "01", h3: "대역폭", p: "패킷당 전송 바이트가 줄어 월 전송량이 함께 내려갑니다." },
        { n: "02", h3: "회선·데이터 요금", p: "종량제 회선, 셀룰러, 위성 백홀에서 요금이 직접 절감됩니다." },
        { n: "03", h3: "전력·배터리", p: "무선 송신 시간이 줄어 엣지·배터리 기기의 수명이 늘어납니다." },
        { n: "04", h3: "지연시간", p: "작은 페이로드는 직렬화·전송이 빨라 실시간 시스템의 지연이 낮아집니다." },
        { n: "05", h3: "하드웨어 증설 여유", p: "회선·모뎀·MCU를 늘리기 전에 소프트웨어만으로 여유를 확보합니다." },
      ],
    },
    layer: {
      eyebrow: "도입",
      h2: (<>얇은 한 겹.<br /><em>그대로 얹습니다.</em></>),
      items: [
        (<><b>프로토콜·스키마 변경 없음.</b> 기존 패킷 구조를 그대로 둡니다.</>),
        (<><b>송신 직전·수신 직후 한 번씩.</b> 호출 두 줄로 연결됩니다.</>),
        (<><b>의존성 0 · libm 불필요.</b> MCU부터 서버까지 동일 코어.</>),
        (<><b>가역적.</b> 한 겹을 빼면 기존 전송 그대로입니다.</>),
      ],
      stack: [
        { lt: "app", label: "애플리케이션 · 패킷 생성" },
        { lt: "bcb", label: "BCB 압축 레이어", tag: "drop-in", hl: true },
        { lt: "net", label: "기존 전송 · TCP/UDP · CAN · 셀룰러" },
      ],
    },
    perf: {
      eyebrow: "성능 · 공개 데이터",
      h2: "측정값으로 말합니다.",
      lead: "실제 센서 텔레메트리(Intel Berkeley Lab) 기준, 패킷 단위 압축비. 평가판에서 같은 수치를 직접 확인할 수 있습니다.",
      caption: "// 패킷 단위 압축비 — 높을수록 좋음",
      headers: ["패킷 크기", "BCB", "zlib", "brotli", "zstd"],
      rows: [
        ["20 byte", "1.30×", "1.16×", "0.83×", "0.70×"],
        ["40 byte", "2.05×", "1.61×", "0.99×", "0.95×"],
        ["80 byte", "2.73×", "2.03×", "1.40×", "1.38×"],
        ["88 byte · float32", "2.20×", "1.86×", "1.29×", "1.60×"],
      ],
      note: (<>bit-packed 게임 패킷 2.20× (zlib 1.28× · brotli 1.00×) · HTTP/2 헤더 cold-start ~3× vs HPACK<br />gcc 13.3 · brotli 1.1.0 · zstd 1.5.5 · 패킷 단위 독립 · 전 입력 무손실 검증</>),
    },
    specs: {
      eyebrow: "사양 · 실측",
      h2: (<>임베디드에 들어가는 <em>크기.</em></>),
      strip: [
        { b: (<>1.53<small> KB</small></>), l: "디코드 스택" },
        { b: (<>26.9<small> KB</small></>), l: "MCU 코어 .text" },
        { b: <>0</>, l: "의존성 · libm" },
        { b: <>CRC32</>, l: "무결성 · 기본" },
      ],
      blocks: [
        { bh: "플랫폼 · 탑재", rows: [
          { k: "linux / win / macos", v: (<>x86-64 <span className="vs">CI</span></>) },
          { k: "iot 게이트웨이", v: (<>임베디드 Linux <span className="vs">탑재</span></>) },
          { k: "mcu", v: (<span className="vn">ESP32 · RP2040</span>) },
          { k: "코어", v: <>정수 전용 · libm-free</> },
        ] },
        { bh: "메모리 · 측정", rows: [
          { k: "decode stack", v: (<><span className="vn">1.53 KB</span><span className="vs">1,568 B</span></>) },
          { k: "encode stack", v: (<><span className="vn">1.61 KB</span><span className="vs">1,648 B</span></>) },
          { k: "codec handle", v: (<><span className="vn">~33 KB</span><span className="vs">1회·재사용</span></>) },
          { k: "shared prior", v: (<>flash/PSRAM <span className="vs">설정 가능</span></>) },
        ] },
        { bh: "라이브러리", rows: [
          { k: "static (.a)", v: (<span className="vn">59.4 KB</span>) },
          { k: "shared (.so)", v: (<span className="vn">49.8 KB</span>) },
          { k: "api", v: <>C v0.2.0 · bcb.h</> },
          { k: "bindings", v: <>Python 3.8–3.13</> },
        ] },
        { bh: "동시성 · 무결성", rows: [
          { k: "thread model", v: <>핸들별 독립</> },
          { k: "concurrent", v: (<><span className="vn">8×4000×2</span><span className="vs">0 fail</span></>) },
          { k: "integrity", v: <>CRC32 · 기본</> },
          { k: "losslessness", v: <>전 입력 보장</> },
        ] },
      ],
      foot: "측정: x86-64 · gcc 13.3.0 · Ubuntu 24.04 LTS · 크기·스택은 해당 플랫폼 codegen 기준.",
    },
    shine: {
      eyebrow: "활용",
      h2: (<>여기서 <em>빛납니다.</em></>),
      cards: [
        { t: "01", h3: "IoT · 텔레메트리", p: (<><code>Modbus</code> · <code>CAN</code> · <code>MQTT</code> · <code>CoAP</code> 패킷을 단위로 압축. 게이트웨이·엣지에 탑재.</>) },
        { t: "02", h3: "임베디드 · MCU", p: (<>정수 연산만으로 <code>ESP32</code> · <code>RP2040</code>에서 구동. 펌웨어에 바로 링크.</>) },
        { t: "03", h3: "게임 네트워킹", p: <>엔진 기본 전송 위에 얹어 bit-packed 패킷을 한 번 더 압축. 대역폭·지연 동시 개선.</> },
        { t: "04", h3: "RPC · 헤더", p: <>무상태 헤더와 소형 페이로드. cold-start에서 HPACK 대비 우위.</> },
      ],
    },
    contact: {
      eyebrow: "도입 문의",
      h2: (<>당신의 패킷으로 <em>확인하세요.</em></>),
      lead: "이메일과 패킷 정보를 남기시면 예상 절감 리포트를 즉시 보여드리고, 30일 평가판 안내를 드립니다. 상업·평가 라이선스.",
      fields: {
        company: "회사",
        useCase: "용도",
        useCaseOpts: [
          { value: "", label: "선택" },
          { value: "IoT", label: "IoT" },
          { value: "임베디드", label: "임베디드" },
          { value: "게임", label: "게임" },
          { value: "RPC", label: "RPC" },
        ],
        dataType: "데이터 종류",
        dataTypeOpts: [
          { value: "", label: "자동 추정" },
          { value: "int_telemetry", label: "정수 텔레메트리" },
          { value: "float_telemetry", label: "실수 텔레메트리" },
          { value: "iot_binary", label: "IoT 바이너리" },
          { value: "mqtt", label: "MQTT" },
          { value: "log", label: "로그" },
          { value: "rpc", label: "RPC" },
          { value: "http_header", label: "HTTP 헤더" },
        ],
        avgPacketSize: "평균 패킷 크기 (B)",
        packetsPerSec: "초당 패킷 수",
        network: "네트워크",
        networkOpts: [
          { value: "", label: "선택" },
          { value: "셀룰러", label: "셀룰러" },
          { value: "위성", label: "위성" },
          { value: "일반회선", label: "일반회선" },
          { value: "LoRa", label: "LoRa" },
        ],
      },
      emailPlaceholder: "회사 이메일",
      submit: "문의 →",
      submitting: "전송 중…",
      invalidEmail: "올바른 이메일을 입력해 주세요.",
      invalidNumbers: "평균 패킷 크기와 초당 패킷 수를 입력해 주세요.",
      success: "문의가 접수되었습니다. 예상 절감 결과를 확인해 보세요.",
      altPrefix: "또는 ",
    },
    result: {
      title: (<>예상 절감 <em>요약</em></>),
      intro: "입력하신 값을 기준으로 추정한 결과입니다. 실제 압축비는 평가판 실측으로 확정됩니다.",
      labels: { ratio: "적용 압축비", bandwidth: "월 대역폭 절감", cost: "월 데이터 요금 절감 (추정)", hw: "하드웨어 여유" },
      costNote: "* 요금 절감은 네트워크 기준 단가를 적용한 추정치입니다.",
      caveat: "수치는 입력값 기반 추정이며, 실제 압축비는 평가판 실측으로 확정됩니다.",
      consult: "도입 상담 받기 →",
      consulting: "요청 중…",
      consultDone: "상담 요청이 접수되었습니다. 영업일 기준 1~2일 내 회신드리겠습니다.",
      backHome: "← 처음으로",
      loading: "결과를 불러오는 중…",
      notFound: "결과를 찾을 수 없습니다.",
    },
    footer: { rights: "BCB Labs · © 2026 Hoshi · Proprietary, all rights reserved" },
  },

  EN: {
    title: "BCB — Lossless compression for small packets",
    nav: { perf: "Performance", specs: "Specs", shine: "Use cases", contact: "Contact" },
    hero: {
      kick: "Binary Compression by BT · lossless",
      h1: (<>Small packets, <em>smaller.</em></>),
      stand: (<>Lossless compression for structured packets and bit-packed records in the <b>20–512 byte</b> range. Drops straight into IoT, embedded and game networking.</>),
      cta: "Get in touch →",
      seePerf: "See performance",
    },
    metrics: [
      { v: (<>2.73<span className="x">×</span></>), l: "80 B sensor packet · measured" },
      { v: (<>1.53<small style={{ fontFamily: "var(--serif)", fontSize: 22 }}> KB</small></>), l: "decode stack · measured" },
      { v: <>0</>, l: "external deps · no libm" },
    ],
    best: {
      eyebrow: "Core",
      h2: (<>One more pass on <em>already-packed</em> data.</>),
      lead: "After bit-packing shrinks the fields, regular patterns still remain in the values. BCB compresses those.",
      dl: [
        { dt: "For", dd: (<>Small, structured packets — sensor telemetry, fixed records, game-state <span>packets.</span></>) },
        { dt: "How", dd: (<>Lossless compression against a shared packet profile. <span>round-trip verified.</span></>) },
        { dt: "Runs on", dd: (<>Integer-only core. <span>Same code from MCU to server.</span></>) },
      ],
    },
    save: {
      eyebrow: "Savings",
      h2: (<>One drop-in, <em>savings in many places.</em></>),
      rows: [
        { n: "01", h3: "Bandwidth", p: "Fewer bytes per packet brings monthly traffic down with it." },
        { n: "02", h3: "Link & data cost", p: "Direct savings on metered links, cellular and satellite backhaul." },
        { n: "03", h3: "Power & battery", p: "Less radio-on time extends the life of edge and battery devices." },
        { n: "04", h3: "Latency", p: "Smaller payloads serialize and send faster, lowering latency in real-time systems." },
        { n: "05", h3: "Hardware headroom", p: "Buy room in software before adding links, modems or MCUs." },
      ],
    },
    layer: {
      eyebrow: "Integration",
      h2: (<>A thin layer.<br /><em>Drop it in.</em></>),
      items: [
        (<><b>No protocol or schema change.</b> Your packet structure stays as-is.</>),
        (<><b>Once before send, once after receive.</b> Two calls and it is wired in.</>),
        (<><b>Zero deps · no libm.</b> The same core from MCU to server.</>),
        (<><b>Reversible.</b> Remove the layer and transport is exactly as before.</>),
      ],
      stack: [
        { lt: "app", label: "Application · builds packets" },
        { lt: "bcb", label: "BCB compression layer", tag: "drop-in", hl: true },
        { lt: "net", label: "Existing transport · TCP/UDP · CAN · cellular" },
      ],
    },
    perf: {
      eyebrow: "Performance · public data",
      h2: "It speaks in measurements.",
      lead: "Per-packet compression ratio on real sensor telemetry (Intel Berkeley Lab). You can confirm the same numbers during evaluation.",
      caption: "// per-packet compression ratio — higher is better",
      headers: ["Packet size", "BCB", "zlib", "brotli", "zstd"],
      rows: [
        ["20 byte", "1.30×", "1.16×", "0.83×", "0.70×"],
        ["40 byte", "2.05×", "1.61×", "0.99×", "0.95×"],
        ["80 byte", "2.73×", "2.03×", "1.40×", "1.38×"],
        ["88 byte · float32", "2.20×", "1.86×", "1.29×", "1.60×"],
      ],
      note: (<>bit-packed game packets 2.20× (zlib 1.28× · brotli 1.00×) · HTTP/2 headers cold-start ~3× vs HPACK<br />gcc 13.3 · brotli 1.1.0 · zstd 1.5.5 · per-packet · all inputs round-trip lossless</>),
    },
    specs: {
      eyebrow: "Specs · measured",
      h2: (<>Sized to fit <em>embedded.</em></>),
      strip: [
        { b: (<>1.53<small> KB</small></>), l: "decode stack" },
        { b: (<>26.9<small> KB</small></>), l: "MCU core .text" },
        { b: <>0</>, l: "deps · libm" },
        { b: <>CRC32</>, l: "integrity · default" },
      ],
      blocks: [
        { bh: "Platform · runs on", rows: [
          { k: "linux / win / macos", v: (<>x86-64 <span className="vs">CI</span></>) },
          { k: "iot gateway", v: (<>embedded Linux <span className="vs">supported</span></>) },
          { k: "mcu", v: (<span className="vn">ESP32 · RP2040</span>) },
          { k: "core", v: <>integer-only · libm-free</> },
        ] },
        { bh: "Memory · measured", rows: [
          { k: "decode stack", v: (<><span className="vn">1.53 KB</span><span className="vs">1,568 B</span></>) },
          { k: "encode stack", v: (<><span className="vn">1.61 KB</span><span className="vs">1,648 B</span></>) },
          { k: "codec handle", v: (<><span className="vn">~33 KB</span><span className="vs">once · reused</span></>) },
          { k: "shared prior", v: (<>flash/PSRAM <span className="vs">configurable</span></>) },
        ] },
        { bh: "Library", rows: [
          { k: "static (.a)", v: (<span className="vn">59.4 KB</span>) },
          { k: "shared (.so)", v: (<span className="vn">49.8 KB</span>) },
          { k: "api", v: <>C v0.2.0 · bcb.h</> },
          { k: "bindings", v: <>Python 3.8–3.13</> },
        ] },
        { bh: "Concurrency · integrity", rows: [
          { k: "thread model", v: <>per-instance</> },
          { k: "concurrent", v: (<><span className="vn">8×4000×2</span><span className="vs">0 fail</span></>) },
          { k: "integrity", v: <>CRC32 · default</> },
          { k: "losslessness", v: <>all inputs</> },
        ] },
      ],
      foot: "Measured: x86-64 · gcc 13.3.0 · Ubuntu 24.04 LTS · size and stack per that platform's codegen.",
    },
    shine: {
      eyebrow: "Use cases",
      h2: (<>Where it <em>shines.</em></>),
      cards: [
        { t: "01", h3: "IoT · telemetry", p: (<>Compresses <code>Modbus</code> · <code>CAN</code> · <code>MQTT</code> · <code>CoAP</code> per packet. Runs on gateways and edge.</>) },
        { t: "02", h3: "Embedded · MCU", p: (<>Integer-only, running on <code>ESP32</code> · <code>RP2040</code>. Links straight into firmware.</>) },
        { t: "03", h3: "Game networking", p: <>Sits on the engine transport and compresses bit-packed packets again — bandwidth and latency together.</> },
        { t: "04", h3: "RPC · headers", p: <>Stateless headers and small payloads. Ahead of HPACK on cold-start.</> },
      ],
    },
    contact: {
      eyebrow: "Get in touch",
      h2: (<>Verify it on <em>your packets.</em></>),
      lead: "Leave your email and packet details — we show your estimated savings instantly and send a 30-day evaluation build. Commercial and evaluation licensing.",
      fields: {
        company: "Company",
        useCase: "Use case",
        useCaseOpts: [
          { value: "", label: "Select" },
          { value: "IoT", label: "IoT" },
          { value: "embedded", label: "Embedded" },
          { value: "game", label: "Game" },
          { value: "RPC", label: "RPC" },
        ],
        dataType: "Data type",
        dataTypeOpts: [
          { value: "", label: "Auto-detect" },
          { value: "int_telemetry", label: "Integer telemetry" },
          { value: "float_telemetry", label: "Float telemetry" },
          { value: "iot_binary", label: "IoT binary" },
          { value: "mqtt", label: "MQTT" },
          { value: "log", label: "Log" },
          { value: "rpc", label: "RPC" },
          { value: "http_header", label: "HTTP header" },
        ],
        avgPacketSize: "Avg packet size (B)",
        packetsPerSec: "Packets / sec",
        network: "Network",
        networkOpts: [
          { value: "", label: "Select" },
          { value: "cellular", label: "Cellular" },
          { value: "satellite", label: "Satellite" },
          { value: "wired", label: "Wired" },
          { value: "LoRa", label: "LoRa" },
        ],
      },
      emailPlaceholder: "Work email",
      submit: "Send →",
      submitting: "Sending…",
      invalidEmail: "Please enter a valid email.",
      invalidNumbers: "Please enter avg packet size and packets per second.",
      success: "Inquiry received. See your estimated savings below.",
      altPrefix: "or ",
    },
    result: {
      title: (<>Your estimated <em>savings</em></>),
      intro: "An estimate based on the values you provided. Actual ratios are confirmed during evaluation.",
      labels: { ratio: "Applied ratio", bandwidth: "Monthly bandwidth saved", cost: "Monthly data cost saved (est.)", hw: "Hardware headroom" },
      costNote: "* Cost savings use a per-network reference rate as an estimate.",
      caveat: "Figures are estimates from your inputs; actual ratios are confirmed by measurement during evaluation.",
      consult: "Request a consultation →",
      consulting: "Requesting…",
      consultDone: "Consultation requested. We will get back to you within 1–2 business days.",
      backHome: "← Back home",
      loading: "Loading your result…",
      notFound: "Result not found.",
    },
    footer: { rights: "BCB Labs · © 2026 Hoshi · Proprietary, all rights reserved" },
  },
};
