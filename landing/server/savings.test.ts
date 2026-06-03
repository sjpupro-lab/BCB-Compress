import { describe, expect, it } from "vitest";
import { computeSavings, interpolateRatio, useCaseToDataType } from "./savings";

describe("interpolateRatio", () => {
  it("A) int_telemetry @80 -> ~2.73", () => {
    const { ratio, overLimit } = interpolateRatio("int_telemetry", 80);
    expect(ratio).toBeCloseTo(2.73, 2);
    expect(overLimit).toBe(false);
  });

  it("B) mqtt @256 -> ~4.31", () => {
    const { ratio } = interpolateRatio("mqtt", 256);
    expect(ratio).toBeCloseTo(4.31, 2);
  });

  it("C) iot_binary @128 -> ~1.54", () => {
    const { ratio } = interpolateRatio("iot_binary", 128);
    expect(ratio).toBeCloseTo(1.54, 2);
  });

  it("D) http_header @256 -> over limit (64B), fixed to max-key 6.07", () => {
    const { ratio, overLimit } = interpolateRatio("http_header", 256);
    expect(overLimit).toBe(true);
    expect(ratio).toBeCloseTo(6.07, 2);
  });

  it("linear interpolation: int_telemetry @60 -> 2.39", () => {
    const { ratio } = interpolateRatio("int_telemetry", 60);
    expect(ratio).toBeCloseTo(2.39, 2);
  });

  it("clamps below smallest key", () => {
    const { ratio } = interpolateRatio("int_telemetry", 10);
    expect(ratio).toBeCloseTo(1.3, 2);
  });
});

describe("useCaseToDataType", () => {
  it("defaults unknown to int_telemetry", () => {
    expect(useCaseToDataType(undefined)).toBe("int_telemetry");
    expect(useCaseToDataType("something")).toBe("int_telemetry");
  });
  it("maps game to rpc", () => {
    expect(useCaseToDataType("게임")).toBe("rpc");
    expect(useCaseToDataType("game")).toBe("rpc");
  });
});

describe("computeSavings", () => {
  it("spec section 9: int_telemetry @80, 50000 pps, cellular", () => {
    const r = computeSavings({
      useCase: "IoT",
      dataType: "int_telemetry",
      avgPacketSize: 80,
      packetsPerSec: 50000,
      networkType: "셀룰러",
    });
    expect(r.ratioUsed).toBeCloseTo(2.73, 2);
    expect(r.savingsPct).toBe(63);
    // monthly original = 80 * 50000 * 86400 * 30 = 1.03680e13 bytes ~= 10.368 TB
    // saved ~ 63% -> ~6.5 TB
    expect(r.monthlySaved).toMatch(/TB$/);
    expect(r.monthlySavedBytes / 1e12).toBeGreaterThan(6);
    expect(r.monthlySavedBytes / 1e12).toBeLessThan(7);
    // cost = saved GB * 5
    expect(r.monthlyCostSaved).toBeCloseTo((r.monthlySavedBytes / 1e9) * 5, 0);
    expect(r.hwNote).toContain("다운그레이드");
    expect(r.hwNote).toContain("배터리");
  });

  it("E) data_type unset @40 -> int_telemetry default, r~2.05, savings~51%", () => {
    const r = computeSavings({
      avgPacketSize: 40,
      packetsPerSec: 10000,
    });
    expect(r.dataType).toBe("int_telemetry");
    expect(r.ratioUsed).toBeCloseTo(2.05, 2);
    expect(r.savingsPct).toBe(51);
  });

  it("D) http_header @256 sets overLimit note", () => {
    const r = computeSavings({
      dataType: "http_header",
      avgPacketSize: 256,
      packetsPerSec: 1000,
    });
    expect(r.overLimit).toBe(true);
    expect(r.overLimitNote).toContain("최적 구간");
    expect(r.ratioUsed).toBeCloseTo(6.07, 2);
  });

  it("uses explicit data price when provided", () => {
    const r = computeSavings({
      dataType: "int_telemetry",
      avgPacketSize: 80,
      packetsPerSec: 50000,
      dataPricePerGb: 10,
    });
    expect(r.monthlyCostSaved).toBeCloseTo((r.monthlySavedBytes / 1e9) * 10, 0);
  });
});
