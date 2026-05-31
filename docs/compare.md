# BCB vs. Oodle Network vs. SEGGER emCompress

### Small-message & structured-binary lossless compression — a technical comparison

**BCB** is a lossless compressor for **small messages (≤~512 B) and fixed-layout binary records** that
share a *learned, frozen prior*. Encoder and decoder hold the same prior; it is never transmitted. Each
message is range-coded against that prior. Target: **IoT / embedded edge, industrial protocols, and
small structured packets** — the size range where general-purpose LZ compressors fail or inflate.

> **Bit-packing removes layout waste. BCB removes probability waste.**
> Tight field widths (3-bit enum, 11-bit position, 9-bit angle) only fix the *number of bits per field*.
> They do not fix skewed *value* distributions: enums that are 75 % one value, deltas clustered near 0,
> flag bytes where one bit is hot. A shared prior + range coder reclaims that residual. (And on truly
> random/encrypted data, BCB correctly does nothing — verified below.)

-----

## Two paradigms, not three

Read this space by **whether a shared trained model exists**, not by marketing labels.

- **BCB and Oodle Network share one paradigm.** Both pre-train a model on representative data, share it on
  both ends, never transmit it, and compress each message independently. They differ in **model class and
  target hardware**, not in the core idea. (“BCB has a dedicated prior, Oodle has a generic dictionary” is
  false — Oodle’s model is also trained on the customer’s own packet captures.)
- **emCompress is the LZ family** (DEFLATE / LZMA / LZ4). It builds its model *from within each block*, so
  on a single small message there is little redundancy to exploit — it behaves like zstd/brotli/zlib and
  often **inflates** small per-packet payloads.

|                                |**BCB**                                                          |**Oodle Network**                                      |**SEGGER emCompress**                            |
|--------------------------------|-----------------------------------------------------------------|-------------------------------------------------------|-------------------------------------------------|
|Core method                     |Shared learned prior: context model (PPM/CM, ≤24 B) + range coder|Shared trained model: static LZP / dictionary + entropy|LZ family: LZMA / DEFLATE / LZ4 + range/Huffman  |
|Model transmitted?              |No (held both ends)                                              |No (held both ends)                                    |N/A — block self-contained                       |
|Model size                      |Frozen read-only prior; MCU build ~3.56 MB incl. tables          |~4–8 MB shared model                                   |Small decompressor; optional preset dict         |
|Primary target                  |IoT/embedded edge, structured binary, small packets              |Game network packets (servers / consoles)              |Firmware-update accel, static data in flash      |
|Small per-packet                |**Compresses** (≥~20 B; see results)                             |Works on tiny UDP packets                              |**Inflates / near 1×** on a small record         |
|Structured-record specialization|**Yes** — position-aware byte/delta schema                       |No                                                     |No                                               |
|Runs on small MCU (ESP32/RP2040)|**Yes** — libm-free, integer-only hot path                       |Not a target (heavyweight game lib)                    |Decompressor yes (8/16/32-bit); encoder host-side|
|Maturity                        |Pre-deployment; reproducible synthetic + real-data benchmarks    |Proven at scale (~6:1 on real game packets)            |Large automotive / industrial install base       |
|Licensing                       |Proprietary, commercial                                          |Commercial (Epic / RAD)                                |Commercial, embeddable without source disclosure |

-----

## A note on methodology (why we do not quote competitors’ headline numbers)

Oodle’s “6:1” is on *private game-packet captures*; emCompress’s “2–4×” is on *firmware images* (tens of
KB–MB). Neither input is public, and both sit in a different regime than BCB’s target. Comparing ratios
across *different datasets* is meaningless. So we instead (1) run a **direct, same-data head-to-head vs
HPACK** — a real standardized small-message competitor we can execute on identical input — and (2) run
**BCB on real and realistic data** against the LZ family, the fair proxy for emCompress (and the codecs
most teams actually deploy: zlib / LZ4 / brotli / zstd).

-----

## Evidence A — vs HPACK (RFC 7541 reference), identical header blocks

2825 real-shaped HTTP/2 header blocks; same baseline; shared training history for both. HPACK measured
**cold** (first request of a connection — static table + Huffman only) and **warm** (dynamic table
pre-populated with the same history).

|header set           |BCB (stateless/block)|HPACK cold|HPACK warm|
|---------------------|---------------------|----------|----------|
|all (2825, avg 295 B)|5.87×                |1.99×     |**6.58×** |
|request              |6.73×                |1.88×     |**11.12×**|
|response             |**4.70×**            |2.23×     |3.67×     |

**Read:** BCB beats HPACK cold-start ~3× (CDN / stateless / first-request, and any path without a
long-lived connection). HPACK *warm* wins overall and dominates repeated requests on a persistent
connection; BCB still wins on responses even warm.

-----

## Evidence B — real public sensor data (Intel Berkeley Lab), per-packet

Real telemetry (54 motes, 2004; 120 k readings, ordered per device). Each packet = N readings; every codec
compresses each packet independently (true edge behavior). **Best LZ rival shown is zlib+dict.**

### Quantized-integer wire format (10 B / reading — how Modbus/CAN/sensors transmit)

|packet          |BCB+struct|zlib+dict|brotli+dict|zstd+dict|
|----------------|----------|---------|-----------|---------|
|10 B (1 reading)|0.81×     |0.89×    |0.72×      |0.53×    |
|20 B (2)        |**1.30×** |1.16×    |0.83×      |0.70×    |
|40 B (4)        |**2.05×** |1.61×    |0.99×      |0.95×    |
|80 B (8)        |**2.73×** |2.03×    |1.40×      |1.38×    |

### Raw float32 wire format (22 B / reading)

|packet           |BCB+struct|zlib+dict|zstd+dict|brotli+dict|
|-----------------|----------|---------|---------|-----------|
|88 B (4 readings)|**2.20×** |1.86×    |1.60×    |1.29×      |

**Read:** below ~20 B (a single reading) *every* codec inflates, so compression is simply off for all of
them — that band is out of scope, not a contest. From 2 readings up BCB leads and the gap widens (~35 %
over the best LZ rival at 80 B; brotli/zstd are roughly half BCB). Real packets bundle several fields, so
the ≥20 B range is representative.

-----

## Evidence C — already bit-packed game packets, per-packet (real BCB)

Synthetic but **genuinely sub-byte bit-packed**: 7 entities/packet, no padding, no free header. Fields are
quantized and tight (flags 8 b with one hot bit, action enum 3 b skewed 75/10/5…, stance 3 b, tick-delta
4 b, position-delta 11 b clustered near 0, yaw/pitch-delta 8 b near 0). This is *not* “wasteful JSON” —
it is a hand-optimized binary packet. Each packet compressed independently against a shared prior.

|63 B bit-packed packet      |ratio    |                 |
|----------------------------|---------|-----------------|
|**BCB + structural**        |**2.20×**|16000 / 16000 win|
|zlib + dict                 |1.28×    |                 |
|brotli + dict               |1.00×    |no gain          |
|zstd + dict                 |0.92×    |inflates         |
|gzip                        |0.78×    |inflates         |
|*control: fully random 64 B*|BCB 0.99×|no false gain    |

**Read:** even after tight bit-packing, skewed field distributions leave ~2× of probability waste that the
LZ family cannot touch (zlib 1.28×, brotli 1.00×) but BCB reclaims. On random data BCB does nothing — the
gain is real structure, not an artifact. *(A version with realistic padding/headers reads ~2.27×; the
2.20× above is the conservative, tight-packed figure.)*

-----

## Evidence D — synthetic, reproducible (seed-fixed, CI-verified)

Controlled upper reference (generators are more regular than real data). All round-trip lossless.

- **Fixed-record binary:** binary_record 32 B **5.35×**, IoT 18 B **3.99×**, Modbus 25 B **3.67×**,
  CAN 16 B **3.91×** — vs LZ family ~0.95× (inflates).
- **Small text-like (per-message + shared prior):** HTTP 256 B **8.52×** (brotli+dict 7.98×),
  MQTT 64 B **4.60×** (2.24×), RPC 64 B **4.00×** (1.91×), syslog 64 B **3.44×** (1.95×).

```
make msgbench-landmark · make structural-bench · python3 tools/bcb_vs_hpack.py --bcb-build build
```

-----

## Markets & honest limits

**Primary target — byte-aligned industrial / IoT (Modbus, CAN, sensor telemetry).** Uncontested: Oodle
does not deploy here (4–8 MB model, not an MCU lib), emCompress (LZ) inflates on small records. Clean win
(Evidence B, D).

**Second target — game networking that uses engine LZ4 / zlib (most studios).** Evidence C shows ~2.2×
where zlib gets 1.28× and brotli/LZ4-class get ~1×. The “your packets are already bit-packed, nothing
left” assumption is false where field distributions are skewed.

**Not claimed — beating Oodle.** Oodle is the same paradigm (shared trained model), mature, and tuned for
game packets. We have no same-data number against it; settle it with a **customer bake-off** — let the
prospect run BCB and Oodle on *their own* captures during the 30-day trial.

**Hard limits:** below ~20 B no codec helps; above ~1–2 KB brotli/zstd/LZMA win via long-range matching;
HPACK warm beats BCB on long-lived connections; no shareable prior, or random / already-compressed data →
no advantage (Shannon).

-----

## One-line positioning

> **Bit-packing removes layout waste; BCB removes probability waste.** BCB is a prior-based compression
> layer for the size band where LZ breaks down — small structured packets (≈20–512 B) at the IoT/embedded
> edge, and bit-packed game packets carried over LZ4/zlib. Verified on real public sensor data (~35 % over
> the best LZ rival), on bit-packed packets (~2.2× vs zlib 1.28×), and vs HPACK cold-start (~3×). Runs on
> MCUs Oodle does not target; compresses small records emCompress inflates.

**Toolchain of record:** gcc 13.3.0 · libbrotli 1.1.0 · libzstd 1.5.5 · zlib (system) · hpack 4.1.0 ·
Ubuntu 24.04 · x86_64. Real data: Intel Berkeley Lab sensor set (public). Absolute ratios shift with
corpus, skew, and codec versions; cite your toolchain when quoting.

**Commercial licensing / evaluation:** 호시 [jahyag@gmail.com](mailto:jahyag@gmail.com)
