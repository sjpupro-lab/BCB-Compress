import { double, int, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

/**
 * Inbound landing-page inquiries (leads).
 * One row per form submission. Stores the customer input, the auto-computed
 * savings estimate, and the lifecycle status for the sales team.
 */
export const leads = mysqlTable("leads", {
  /** Public lead id used in the tracking link (`/lead?id=...`). 21-char nanoid. */
  id: varchar("id", { length: 32 }).primaryKey(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),

  // --- customer input ---
  email: varchar("email", { length: 320 }).notNull(),
  company: varchar("company", { length: 255 }),
  /** IoT / embedded / game / RPC */
  useCase: varchar("useCase", { length: 64 }),
  /** iot_binary / int_telemetry / float_telemetry / mqtt / log / rpc / http_header */
  dataType: varchar("dataType", { length: 32 }),
  avgPacketSize: int("avgPacketSize"),
  packetsPerSec: int("packetsPerSec"),
  deviceCount: int("deviceCount"),
  /** 셀룰러 / 위성 / 일반회선 / LoRa */
  networkType: varchar("networkType", { length: 32 }),
  dataPricePerGb: double("dataPricePerGb"),

  // --- computed estimate ---
  ratioUsed: double("ratioUsed"),
  savingsPct: int("savingsPct"),
  monthlySaved: varchar("monthlySaved", { length: 64 }),
  monthlyCostSaved: double("monthlyCostSaved"),
  hwNote: text("hwNote"),
  hwNoteEn: text("hwNoteEn"),
  /** When the input packet size exceeds BCB's optimal range. */
  overLimitNote: text("overLimitNote"),
  overLimitNoteEn: text("overLimitNoteEn"),

  /** Submission language: EN or KO */
  lang: mysqlEnum("lang", ["EN", "KO"]).default("EN").notNull(),

  /** new -> notified -> interested -> contacted */
  status: mysqlEnum("status", ["new", "notified", "interested", "contacted"]).default("new").notNull(),
  /** Timestamp of the "consult" button click (null until clicked). */
  clickedAt: timestamp("clickedAt"),
});

export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;
