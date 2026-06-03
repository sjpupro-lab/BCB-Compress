import { TRPCError } from "@trpc/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import {
  getLeadById,
  insertLead,
  listLeads,
  updateLeadStatus,
} from "../db";
import { notifyOwner } from "../_core/notification";
import { computeSavings } from "../savings";
import { adminProcedure, publicProcedure, router } from "../_core/trpc";

const langSchema = z.enum(["EN", "KO"]).default("EN");

const submitInput = z.object({
  email: z.string().email(),
  company: z.string().max(255).optional(),
  useCase: z.string().max(64).optional(),
  dataType: z.string().max(32).optional(),
  avgPacketSize: z.number().int().min(1).max(100000),
  packetsPerSec: z.number().int().min(1).max(100000000),
  deviceCount: z.number().int().min(0).max(1000000000).optional(),
  networkType: z.string().max(32).optional(),
  dataPricePerGb: z.number().min(0).max(100000).optional(),
  lang: langSchema,
});

function fmtTime(d: Date, lang: "EN" | "KO"): string {
  return d.toLocaleString(lang === "KO" ? "ko-KR" : "en-US", {
    timeZone: "Asia/Seoul",
  });
}

export const leadsRouter = router({
  /**
   * Public form submission. Validates input, computes the savings estimate,
   * stores the lead, and notifies the project owner (sales team).
   */
  submit: publicProcedure
    .input(submitInput)
    .mutation(async ({ input }) => {
      const result = computeSavings({
        useCase: input.useCase,
        dataType: input.dataType,
        avgPacketSize: input.avgPacketSize,
        packetsPerSec: input.packetsPerSec,
        deviceCount: input.deviceCount,
        networkType: input.networkType,
        dataPricePerGb: input.dataPricePerGb,
      });

      const id = nanoid();
      const now = new Date();

      await insertLead({
        id,
        createdAt: now,
        email: input.email,
        company: input.company ?? null,
        useCase: input.useCase ?? null,
        dataType: result.dataType,
        avgPacketSize: input.avgPacketSize,
        packetsPerSec: input.packetsPerSec,
        deviceCount: input.deviceCount ?? null,
        networkType: input.networkType ?? null,
        dataPricePerGb: input.dataPricePerGb ?? null,
        ratioUsed: result.ratioUsed,
        savingsPct: result.savingsPct,
        monthlySaved: result.monthlySaved,
        hwNote: result.hwNote,
        hwNoteEn: result.hwNoteEn,
        monthlyCostSaved: result.monthlyCostSaved,
        overLimitNote: result.overLimitNote,
        overLimitNoteEn: result.overLimitNoteEn,
        lang: input.lang,
        status: "new",
      });

      // Notify the sales team (project owner). Non-fatal if it fails.
      const title = `[BCB 리드] ${input.company || input.email} 문의 (${input.useCase || result.dataType})`;
      const content = [
        `새 리드가 접수되었습니다. (${input.lang})`,
        ``,
        `• 이메일: ${input.email}`,
        `• 회사: ${input.company || "-"}`,
        `• 용도: ${input.useCase || "-"}`,
        `• 데이터 종류: ${result.dataType}`,
        `• 평균 패킷 크기: ${input.avgPacketSize} B`,
        `• 초당 패킷 수: ${input.packetsPerSec}`,
        `• 기기 수: ${input.deviceCount ?? "-"}`,
        `• 네트워크: ${input.networkType || "-"}`,
        `• 제출 시각: ${fmtTime(now, input.lang)} (KST)`,
        ``,
        `― 추정 결과 ───────────`,
        `• 적용 압축비: ${result.ratioUsed}×`,
        `• 월 대역폭 절감: ${result.savingsPct}% (${result.monthlySaved})`,
        `• 월 데이터 요금 절감: $${result.monthlyCostSaved} (추정)`,
        `• 하드웨어 여유: ${result.hwNote}`,
        result.overLimitNote ? `• 참고: ${result.overLimitNote}` : ``,
        `────────────────────`,
        ``,
        `리드 ID: ${id}`,
        `수치는 입력값 기반 추정이며, 실제 압축비는 평가판 실측으로 확정됩니다.`,
      ]
        .filter(Boolean)
        .join("\n");

      let notified = false;
      try {
        notified = await notifyOwner({ title, content });
      } catch (err) {
        console.warn("[leads.submit] notifyOwner failed:", err);
      }

      if (notified) {
        try {
          await updateLeadStatus(id, "notified");
        } catch (err) {
          console.warn("[leads.submit] status update failed:", err);
        }
      }

      // Return the estimate so the frontend can show the result page.
      return {
        id,
        savingsPct: result.savingsPct,
        monthlySaved: result.monthlySaved,
        monthlyCostSaved: result.monthlyCostSaved,
        hwNote: input.lang === "KO" ? result.hwNote : result.hwNoteEn,
        ratioUsed: result.ratioUsed,
        dataType: result.dataType,
        overLimitNote:
          input.lang === "KO" ? result.overLimitNote : result.overLimitNoteEn,
      };
    }),

  /** Fetch a lead's public estimate by id (used by the result / consult page). */
  getResult: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .query(async ({ input }) => {
      const lead = await getLeadById(input.id);
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }
      const isKo = lead.lang === "KO";
      return {
        id: lead.id,
        email: lead.email,
        company: lead.company,
        lang: lead.lang,
        savingsPct: lead.savingsPct,
        monthlySaved: lead.monthlySaved,
        monthlyCostSaved: lead.monthlyCostSaved,
        hwNote: isKo ? lead.hwNote : lead.hwNoteEn ?? lead.hwNote,
        overLimitNote: isKo
          ? lead.overLimitNote
          : lead.overLimitNoteEn ?? lead.overLimitNote,
        ratioUsed: lead.ratioUsed,
        status: lead.status,
      };
    }),

  /**
   * Customer clicks the "도입 상담 받기" button. Marks the lead as interested
   * and notifies the sales team that the customer wants a consultation.
   */
  requestConsult: publicProcedure
    .input(z.object({ id: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const lead = await getLeadById(input.id);
      if (!lead) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Lead not found" });
      }

      const now = new Date();
      // Idempotent: only update if not already interested/contacted.
      if (lead.status === "new" || lead.status === "notified") {
        await updateLeadStatus(input.id, "interested", now);

        const title = `[BCB 리드] ${lead.company || lead.email} 상담 요청 (${lead.useCase || lead.dataType})`;
        const content = [
          `고객이 상담을 요청했습니다.`,
          ``,
          `• 이메일(회신용): ${lead.email}`,
          `• 회사: ${lead.company || "-"}`,
          `• 용도: ${lead.useCase || "-"}`,
          `• 데이터 종류: ${lead.dataType || "-"}`,
          `• 평균 패킷 크기: ${lead.avgPacketSize ?? "-"} B`,
          `• 초당 패킷 수: ${lead.packetsPerSec ?? "-"}`,
          `• 네트워크: ${lead.networkType || "-"}`,
          `• 클릭 시각: ${fmtTime(now, lead.lang)} (KST)`,
          ``,
          `― 추정 결과 ───────────`,
          `• 적용 압축비: ${lead.ratioUsed}×`,
          `• 월 대역폭 절감: ${lead.savingsPct}% (${lead.monthlySaved})`,
          `• 월 데이터 요금 절감: $${lead.monthlyCostSaved} (추정)`,
          `────────────────────`,
          ``,
          `리드 ID: ${lead.id}`,
          `영업일 기준 1~2일 내 ${lead.email}로 연락 바랍니다.`,
        ].join("\n");

        try {
          await notifyOwner({ title, content });
        } catch (err) {
          console.warn("[leads.requestConsult] notifyOwner failed:", err);
        }
      }

      return {
        success: true,
        email: lead.email,
        lang: lead.lang,
      };
    }),

  /** Admin: list recent leads (for an internal dashboard if needed). */
  list: adminProcedure.query(async () => {
    return listLeads(200);
  }),
});
