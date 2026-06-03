/**
 * BCB packet-savings estimator.
 *
 * Implements the spec from BCB_Manus_자동응대_사양서 (sections 3-x) plus the
 * data-type compression-ratio refinement. All numbers are ESTIMATES — the reply
 * copy must always carry the "추정 · 평가판 실측으로 확정" caveat.
 */

export type DataType =
  | "iot_binary"
  | "int_telemetry"
  | "float_telemetry"
  | "mqtt"
  | "log"
  | "rpc"
  | "http_header";

export const DATA_TYPES: DataType[] = [
  "iot_binary",
  "int_telemetry",
  "float_telemetry",
  "mqtt",
  "log",
  "rpc",
  "http_header",
];

/** Compression-ratio tables: size(bytes) -> ratio r. From BCB repo measurements. */
const R_TABLE: Record<DataType, Record<number, number>> = {
  iot_binary: { 64: 1.54, 128: 1.54, 256: 1.53, 512: 1.52 },
  int_telemetry: { 20: 1.3, 40: 2.05, 80: 2.73 },
  float_telemetry: { 22: 0.85, 44: 1.45, 88: 2.2 },
  mqtt: { 64: 4.03, 128: 4.22, 256: 4.31, 512: 4.39 },
  log: { 64: 3.18, 128: 3.33, 256: 3.38, 512: 3.38 },
  rpc: { 64: 3.49, 128: 3.7, 256: 3.81, 512: 3.82 },
  http_header: { 64: 5.19, 128: 5.95, 256: 5.96, 512: 6.07 },
};

/** Packet size (bytes) above which brotli/zstd overtake BCB. */
const ADVANTAGE_LIMIT: Record<DataType, number> = {
  http_header: 64,
  iot_binary: 256,
  int_telemetry: 512,
  float_telemetry: 256,
  mqtt: 512,
  log: 256,
  rpc: 256,
};

/** Map a use_case to the most likely data_type when data_type is not provided. */
export function useCaseToDataType(useCase?: string | null): DataType {
  switch ((useCase ?? "").toLowerCase()) {
    case "iot":
    case "임베디드":
    case "embedded":
      return "int_telemetry";
    case "게임":
    case "game":
      return "rpc";
    case "rpc":
      return "rpc";
    default:
      // Most conservative default to avoid over-promising.
      return "int_telemetry";
  }
}

/** Conservative default data price (USD/GB) by network type. */
function defaultDataPrice(networkType?: string | null): number {
  switch ((networkType ?? "").toLowerCase()) {
    case "위성":
    case "satellite":
      return 50;
    case "셀룰러":
    case "cellular":
      return 5;
    case "lora":
      return 8;
    case "일반회선":
    case "wired":
    case "fixed":
      return 0.05;
    default:
      return 1; // most conservative
  }
}

/**
 * Linear interpolation of the compression ratio for `size` within the table for
 * `dataType`. Clamps below the smallest key, and at/above the advantage limit
 * fixes the ratio to the largest-key value and flags overLimit.
 */
export function interpolateRatio(
  dataType: DataType,
  size: number
): { ratio: number; overLimit: boolean } {
  const table = R_TABLE[dataType];
  const sizes = Object.keys(table)
    .map(Number)
    .sort((a, b) => a - b);
  const limit = ADVANTAGE_LIMIT[dataType];

  const maxKey = sizes[sizes.length - 1];
  const maxRatio = table[maxKey];

  // Over the advantage limit -> fix to the largest-key ratio and flag.
  if (size > limit) {
    return { ratio: maxRatio, overLimit: true };
  }

  // Below the smallest measured key -> clamp to first value.
  if (size <= sizes[0]) {
    return { ratio: table[sizes[0]], overLimit: false };
  }
  // At/above the largest measured key (but <= limit) -> clamp to last value.
  if (size >= maxKey) {
    return { ratio: maxRatio, overLimit: false };
  }

  // Find bracketing points and linearly interpolate.
  for (let i = 0; i < sizes.length - 1; i++) {
    const s0 = sizes[i];
    const s1 = sizes[i + 1];
    if (size >= s0 && size <= s1) {
      const r0 = table[s0];
      const r1 = table[s1];
      const ratio = r0 + ((r1 - r0) * (size - s0)) / (s1 - s0);
      return { ratio, overLimit: false };
    }
  }
  return { ratio: maxRatio, overLimit: false };
}

export type SavingsInput = {
  useCase?: string | null;
  dataType?: string | null;
  avgPacketSize: number;
  packetsPerSec: number;
  deviceCount?: number | null;
  networkType?: string | null;
  dataPricePerGb?: number | null;
};

export type SavingsResult = {
  dataType: DataType;
  ratioUsed: number; // rounded to 2 decimals
  savingsPct: number; // integer percent
  monthlySaved: string; // human string "6.5 TB" or "640 GB"
  monthlySavedBytes: number;
  monthlyCostSaved: number; // USD, rounded to 2 decimals
  hwNote: string;
  hwNoteEn: string;
  overLimit: boolean;
  overLimitNote: string | null;
  overLimitNoteEn: string | null;
};

function formatBytes(bytes: number): string {
  const tb = bytes / 1e12;
  if (tb >= 1) {
    return `${tb >= 10 ? Math.round(tb) : tb.toFixed(1)} TB`;
  }
  const gb = bytes / 1e9;
  return `${gb >= 10 ? Math.round(gb) : gb.toFixed(1)} GB`;
}

export function computeSavings(input: SavingsInput): SavingsResult {
  const dataType: DataType = isDataType(input.dataType)
    ? (input.dataType as DataType)
    : useCaseToDataType(input.useCase);

  const size = Math.max(0, input.avgPacketSize || 0);
  const { ratio, overLimit } = interpolateRatio(dataType, size);
  const ratioUsed = Math.round(ratio * 100) / 100;

  // Bandwidth savings.
  const monthlyOriginalBytes = size * (input.packetsPerSec || 0) * 86400 * 30;
  const savingFraction = ratio > 0 ? 1 - 1 / ratio : 0;
  const monthlySavedBytes = Math.max(0, monthlyOriginalBytes * savingFraction);
  const savingsPct = Math.round(savingFraction * 100);

  // Data/link cost savings.
  const price =
    input.dataPricePerGb != null && input.dataPricePerGb > 0
      ? input.dataPricePerGb
      : defaultDataPrice(input.networkType);
  const monthlyCostSaved =
    Math.round((monthlySavedBytes / 1e9) * price * 100) / 100;

  // Hardware headroom (qualitative).
  const { hwNote, hwNoteEn } = buildHwNote(savingsPct, dataType, input.useCase);

  // Over-limit advisory.
  let overLimitNote: string | null = null;
  let overLimitNoteEn: string | null = null;
  if (overLimit) {
    const limit = ADVANTAGE_LIMIT[dataType];
    overLimitNote = `입력하신 패킷 크기(${size}B)는 BCB의 최적 구간(${limit}B 이하)보다 큽니다. 이 구간은 평가판에서 BCB와 기존 압축기를 함께 측정해 비교해 드립니다.`;
    overLimitNoteEn = `Your packet size (${size}B) is larger than BCB's optimal range (≤ ${limit}B). We will benchmark BCB against existing compressors on this range during evaluation.`;
  }

  return {
    dataType,
    ratioUsed,
    savingsPct,
    monthlySaved: formatBytes(monthlySavedBytes),
    monthlySavedBytes,
    monthlyCostSaved,
    hwNote,
    hwNoteEn,
    overLimit,
    overLimitNote,
    overLimitNoteEn,
  };
}

function isDataType(value: unknown): value is DataType {
  return typeof value === "string" && (DATA_TYPES as string[]).includes(value);
}

function buildHwNote(
  savingsPct: number,
  dataType: DataType,
  useCase?: string | null
): { hwNote: string; hwNoteEn: string } {
  let hwNote: string;
  let hwNoteEn: string;
  if (savingsPct >= 50) {
    hwNote = "회선·모뎀 한 등급 다운그레이드 또는 다음 증설 1주기 연기 가능";
    hwNoteEn =
      "Downgrade a link/modem tier, or defer the next capacity expansion by one cycle";
  } else if (savingsPct >= 30) {
    hwNote = "다음 하드웨어 증설 시점을 미룰 여유 확보";
    hwNoteEn = "Headroom to push back the next hardware expansion";
  } else {
    hwNote = "트래픽 피크 여유 확보";
    hwNoteEn = "Extra headroom for traffic peaks";
  }

  const uc = (useCase ?? "").toLowerCase();
  const isEdge =
    dataType === "int_telemetry" ||
    dataType === "float_telemetry" ||
    dataType === "iot_binary" ||
    dataType === "mqtt" ||
    uc === "iot" ||
    uc === "임베디드" ||
    uc === "embedded";
  if (isEdge) {
    hwNote += ` · 무선 송신량 ${savingsPct}% 감소 → 배터리 구동 기기의 수명 연장 여지`;
    hwNoteEn += ` · ${savingsPct}% less radio traffic → room to extend battery-powered device life`;
  }
  return { hwNote, hwNoteEn };
}
