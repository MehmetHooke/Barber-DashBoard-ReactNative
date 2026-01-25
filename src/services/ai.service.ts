import { getAuth } from "firebase/auth";
//personal link you should take your link on terminal with firebase!!
const BASE = "https://europe-west1-berber-randevu-8650d.cloudfunctions.net";

async function authedPost<T>(
  path: "/aiWeeklyCoach" | "/aiServicePricing",
  body: any,
): Promise<T> {
  const user = getAuth().currentUser;
  if (!user) throw new Error("Giriş yapılmamış.");

  const token = await user.getIdToken();

  const res = await fetch(`${BASE}${path}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  // ✅ önce text al
  const raw = await res.text();

  // ✅ boş body yakala
  if (!raw) {
    throw new Error(`Sunucudan boş cevap geldi. Status: ${res.status}`);
  }

  // ✅ JSON parse güvenli
  let json: any;
  try {
    json = JSON.parse(raw);
  } catch {
    // JSON değilse raw'ı göster (çoğu zaman HTML error page olur)
    throw new Error(
      `JSON parse edilemedi. Status: ${res.status}\n${raw.slice(0, 200)}`,
    );
  }

  if (!res.ok) {
    const err: any = new Error(
      json?.message || json?.error || `İstek başarısız. Status: ${res.status}`,
    );
    err.status = res.status;
    err.code = json?.error; // ör: "WEEKLY_LIMIT"
    err.payload = json; // upsell dahil her şey
    throw err;
  }

  return json as T;
}

export type WeeklyCoachData = {
  title: string;
  insights: { label: string; value: string; detail?: string }[];
  warnings: { text: string }[];
  actions: { title: string; why: string; how: string }[];
  oneLineSummary: string;
};

export type WeeklyCoachResponse = {
  cached: boolean;
  data: WeeklyCoachData;
  meta?: { createdAtMs?: number };
};

export function fetchWeeklyCoach(payload: any) {
  return authedPost<WeeklyCoachResponse>("/aiWeeklyCoach", payload);
}

export type ServicePricingData = {
  recommendedPriceRange: { min: number; max: number };
  recommendedDurationMin: number;
  rationale: string[];
  testPlan: string;
};

export type ServicePricingResponse = {
  cached: boolean;
  data: ServicePricingData;
};

export function fetchServicePricing(payload: any) {
  return authedPost<ServicePricingResponse>("/aiServicePricing", payload);
}
