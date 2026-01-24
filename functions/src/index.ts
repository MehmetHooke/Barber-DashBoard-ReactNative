import cors from "cors";
import * as admin from "firebase-admin";
import { defineSecret } from "firebase-functions/params";
import { onRequest } from "firebase-functions/v2/https";

import { GoogleGenAI } from "@google/genai";
import { z } from "zod";
import { zodToJsonSchema } from "zod-to-json-schema";

admin.initializeApp();
const db = admin.firestore();

const GEMINI_API_KEY = defineSecret("GEMINI_API_KEY");
const corsHandler = cors({ origin: true });

// ----------------------------
// Helpers
// ----------------------------
function weekKeyFromISO(dateISO: string) {
  // Basit MVP: "YYYY-WW" üretimi (yaklaşık). İstersen daha kesin ISO-week yaparız.
  const d = new Date(dateISO);
  const oneJan = new Date(d.getFullYear(), 0, 1);
  const days = Math.floor(
    (d.getTime() - oneJan.getTime()) / (24 * 60 * 60 * 1000),
  );
  const week = Math.ceil((days + oneJan.getDay() + 1) / 7);
  return `${d.getFullYear()}-${String(week).padStart(2, "0")}`;
}

async function requireUser(req: any) {
  const authHeader = req.headers.authorization || "";
  const match = authHeader.match(/^Bearer (.+)$/);
  if (!match) throw new Error("UNAUTHENTICATED");

  const idToken = match[1];
  const decoded = await admin.auth().verifyIdToken(idToken);
  return { uid: decoded.uid, decoded };
}

function badRequest(res: any, msg: string) {
  res.status(400).json({ error: msg });
}

function serverError(res: any, msg: string) {
  res.status(500).json({ error: msg });
}

// ----------------------------
// Zod Schemas (input + output)
// ----------------------------
const WeeklyCoachInputSchema = z.object({
  shopId: z.string().min(1),
  range: z.object({
    start: z.string().min(8),
    end: z.string().min(8),
  }),
  currency: z.string().default("TRY"),
  dailyRevenue: z
    .array(z.object({ date: z.string(), value: z.number() }))
    .min(1),
  appointments: z.object({
    total: z.number(),
    cancelled: z.number(),
    completed: z.number(),
    pending: z.number(),
  }),
  timeBuckets: z
    .array(z.object({ label: z.string(), count: z.number() }))
    .optional()
    .default([]),
});

const WeeklyCoachOutputSchema = z.object({
  title: z.string(),
  insights: z.array(
    z.object({
      label: z.string(),
      value: z.string(),
      detail: z.string().optional().default(""),
    }),
  ),
  warnings: z.array(z.object({ text: z.string() })),
  actions: z.array(
    z.object({
      title: z.string(),
      why: z.string(),
      how: z.string(),
    }),
  ),
  oneLineSummary: z.string(),
});

const ServicePricingInputSchema = z.object({
  shopId: z.string().min(1),
  service: z.object({
    name: z.string().min(1),
    durationMin: z.number(),
    price: z.number(),
  }),
  history: z.object({
    last4WeeksCount: z.number(),
    cancelRate: z.number(),
  }),
  demand: z.object({
    peakHours: z.array(z.string()),
    peakShare: z.number(),
  }),
  currency: z.string().default("TRY"),
});

const ServicePricingOutputSchema = z.object({
  recommendedPriceRange: z.object({ min: z.number(), max: z.number() }),
  recommendedDurationMin: z.number(),
  rationale: z.array(z.string()),
  testPlan: z.string(),
});

// ----------------------------
// Gemini call helper (Structured Output)
// ----------------------------
async function generateStructuredJSON<T extends z.ZodTypeAny>(opts: {
  apiKey: string;
  model: string;
  system: string;
  prompt: string;
  schema: T;
}) {
  const ai = new GoogleGenAI({ apiKey: opts.apiKey });

  const response = await ai.models.generateContent({
    model: opts.model,
    contents: opts.prompt,
    config: {
      // Structured output: JSON + schema
      responseMimeType: "application/json",
      responseJsonSchema: zodToJsonSchema(opts.schema),
      systemInstruction: opts.system,
      temperature: 0.4,
    },
  });

  // SDK response.text -> JSON string
  const raw = response.text || "";
  const parsed = JSON.parse(raw);
  return opts.schema.parse(parsed) as z.infer<T>;
}

// ----------------------------
// Endpoint 1: Weekly Coach
// ----------------------------
export const aiWeeklyCoach = onRequest(
  { region: "europe-west1", secrets: [GEMINI_API_KEY] },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== "POST") return badRequest(res, "POST required");

        const { uid } = await requireUser(req);

        const input = WeeklyCoachInputSchema.safeParse(req.body);
        if (!input.success) return badRequest(res, input.error.message);

        const payload = input.data;
        const cacheId = `${payload.shopId}_${payload.range.start}_${payload.range.end}`;
        const cacheRef = db.collection("aiWeeklyCache").doc(cacheId);

        // Cache first
        const cacheSnap = await cacheRef.get();
        if (cacheSnap.exists) {
          return res
            .status(200)
            .json({ cached: true, data: cacheSnap.data()?.data });
        }

        // Rate limit (1 request / week / user / shop)
        const wk = weekKeyFromISO(payload.range.start);
        const usageRef = db
          .collection("aiUsage")
          .doc(`${uid}_${payload.shopId}_${wk}`);
        const usageSnap = await usageRef.get();
        if (usageSnap.exists) {
          return res.status(429).json({
            error: "WEEKLY_LIMIT",
            message:
              "Bu hafta için analiz limiti doldu. Aynı hafta için cache kullanılıyor olmalı.",
          });
        }

        const system = [
          "Türkçe yaz.",
          "Kısa, net ve uygulanabilir ol.",
          "Sadece verilen veriye dayan. Uydurma veri/varsayım yapma.",
          "Kesinlikle JSON dışında hiçbir şey döndürme.",
          "actions alanında tam 3 aksiyon üret. Her biri uygulanabilir olsun.",
        ].join(" ");

        const prompt = `
Aşağıdaki berber dükkanı haftalık verisini analiz et ve istenen JSON formatında koçluk özeti çıkar.

VERİ (JSON):
${JSON.stringify(payload)}
        `.trim();

        const apiKey = GEMINI_API_KEY.value();
        const data = await generateStructuredJSON({
          apiKey,
          // Free tier için genelde hızlı/ucuz model tercih edilir:
          model: "gemini-3-flash-preview",
          system,
          prompt,
          schema: WeeklyCoachOutputSchema,
        });

        // write usage + cache
        await usageRef.set({
          uid,
          shopId: payload.shopId,
          week: wk,
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
        });

        await cacheRef.set({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          data,
        });

        return res.status(200).json({ cached: false, data });
      } catch (e: any) {
        if (String(e?.message).includes("UNAUTHENTICATED")) {
          return res.status(401).json({ error: "UNAUTHENTICATED" });
        }
        return serverError(res, e?.message || "Unknown error");
      }
    });
  },
);

// ----------------------------
// Endpoint 2: Service Pricing
// ----------------------------
export const aiServicePricing = onRequest(
  { region: "europe-west1", secrets: [GEMINI_API_KEY] },
  async (req, res) => {
    corsHandler(req, res, async () => {
      try {
        if (req.method !== "POST") return badRequest(res, "POST required");

        const { uid } = await requireUser(req);

        const input = ServicePricingInputSchema.safeParse(req.body);
        if (!input.success) return badRequest(res, input.error.message);

        const payload = input.data;

        // Cache key: shop+service+price+stats (MVP)
        const cacheId = `${payload.shopId}_${payload.service.name}_${payload.service.price}_${payload.history.last4WeeksCount}_${payload.demand.peakShare}`;
        const cacheRef = db.collection("aiPricingCache").doc(cacheId);
        const cacheSnap = await cacheRef.get();
        if (cacheSnap.exists) {
          return res
            .status(200)
            .json({ cached: true, data: cacheSnap.data()?.data });
        }

        const system = [
          "Türkçe yaz.",
          "Sadece verilen veriye dayan.",
          "Kesinlikle JSON dışında hiçbir şey döndürme.",
          "Fiyat önerisi bir aralık (min/max) olmalı.",
          "Rationale en fazla 3 madde olsun.",
        ].join(" ");

        const prompt = `
Aşağıdaki servis için fiyat önerisi üret.

VERİ (JSON):
${JSON.stringify(payload)}
        `.trim();

        const apiKey = GEMINI_API_KEY.value();
        const data = await generateStructuredJSON({
          apiKey,
          model: "gemini-3-flash-preview",
          system,
          prompt,
          schema: ServicePricingOutputSchema,
        });

        await cacheRef.set({
          createdAt: admin.firestore.FieldValue.serverTimestamp(),
          uid,
          data,
        });

        return res.status(200).json({ cached: false, data });
      } catch (e: any) {
        if (String(e?.message).includes("UNAUTHENTICATED")) {
          return res.status(401).json({ error: "UNAUTHENTICATED" });
        }
        return serverError(res, e?.message || "Unknown error");
      }
    });
  },
);
