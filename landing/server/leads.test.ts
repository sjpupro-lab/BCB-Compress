import { beforeEach, describe, expect, it, vi } from "vitest";

// Mock DB layer and notification before importing the router.
const store = new Map<string, any>();

vi.mock("./db", () => ({
  insertLead: vi.fn(async (lead: any) => {
    store.set(lead.id, { ...lead });
  }),
  getLeadById: vi.fn(async (id: string) => store.get(id)),
  updateLeadStatus: vi.fn(async (id: string, status: string, clickedAt?: Date) => {
    const row = store.get(id);
    if (row) {
      row.status = status;
      if (clickedAt) row.clickedAt = clickedAt;
    }
  }),
  listLeads: vi.fn(async () => Array.from(store.values())),
}));

const notifyOwnerMock = vi.fn(async () => true);
vi.mock("./_core/notification", () => ({
  notifyOwner: (...args: any[]) => notifyOwnerMock(...args),
}));

import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

function publicCtx(): TrpcContext {
  return {
    user: null,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: () => {} } as unknown as TrpcContext["res"],
  };
}

describe("leads.submit", () => {
  beforeEach(() => {
    store.clear();
    notifyOwnerMock.mockClear();
  });

  it("computes savings, stores lead, and notifies owner", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const res = await caller.leads.submit({
      email: "test@acme.com",
      company: "Acme",
      useCase: "IoT",
      dataType: "int_telemetry",
      avgPacketSize: 80,
      packetsPerSec: 50000,
      networkType: "셀룰러",
      lang: "KO",
    });

    expect(res.savingsPct).toBe(63);
    expect(res.ratioUsed).toBeCloseTo(2.73, 2);
    expect(res.monthlySaved).toMatch(/TB$/);
    expect(notifyOwnerMock).toHaveBeenCalledTimes(1);

    // Lead persisted and marked notified.
    const stored = store.get(res.id);
    expect(stored).toBeTruthy();
    expect(stored.status).toBe("notified");
    expect(stored.lang).toBe("KO");
  });

  it("getResult returns English copy for EN leads", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const submitted = await caller.leads.submit({
      email: "en@x.com",
      avgPacketSize: 80,
      packetsPerSec: 50000,
      dataType: "int_telemetry",
      lang: "EN",
    });
    const res = await caller.leads.getResult({ id: submitted.id });
    expect(res.lang).toBe("EN");
    // English hwNote should contain english words, not Korean.
    expect(res.hwNote ?? "").toMatch(/[A-Za-z]/);
    expect(res.hwNote ?? "").not.toMatch(/다운그레이드/);
  });

  it("rejects invalid email", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(
      caller.leads.submit({
        email: "not-an-email",
        avgPacketSize: 80,
        packetsPerSec: 50000,
        lang: "EN",
      } as any)
    ).rejects.toBeTruthy();
  });
});

describe("leads.requestConsult", () => {
  beforeEach(() => {
    store.clear();
    notifyOwnerMock.mockClear();
  });

  it("marks lead interested and notifies owner once", async () => {
    const caller = appRouter.createCaller(publicCtx());
    const submitted = await caller.leads.submit({
      email: "lead@x.com",
      avgPacketSize: 40,
      packetsPerSec: 10000,
      lang: "EN",
    });
    notifyOwnerMock.mockClear();

    const r1 = await caller.leads.requestConsult({ id: submitted.id });
    expect(r1.success).toBe(true);
    expect(r1.email).toBe("lead@x.com");
    expect(store.get(submitted.id).status).toBe("interested");
    expect(store.get(submitted.id).clickedAt).toBeInstanceOf(Date);
    expect(notifyOwnerMock).toHaveBeenCalledTimes(1);

    // Idempotent: second click does not re-notify.
    await caller.leads.requestConsult({ id: submitted.id });
    expect(notifyOwnerMock).toHaveBeenCalledTimes(1);
  });

  it("throws NOT_FOUND for unknown id", async () => {
    const caller = appRouter.createCaller(publicCtx());
    await expect(
      caller.leads.requestConsult({ id: "nope" })
    ).rejects.toMatchObject({ code: "NOT_FOUND" });
  });
});
