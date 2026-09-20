import { apiData, apiError, databaseError, isApiResponse, requireUser } from "@/lib/api";
import { calculateFinancialTotals } from "@/lib/domain/finance";
import { getHealthTrendWindow } from "@/lib/domain/health";
import { getIsoWeek } from "@/lib/domain/dates";
import { classifyKpiValue, type KpiTargetType } from "@/lib/domain/kpis";

export const dynamic = "force-dynamic";

type RouteContext = { params: Promise<{ section: string }> };

export async function GET(_request: Request, context: RouteContext) {
  const auth = await requireUser();
  if (isApiResponse(auth)) return auth;
  const { section } = await context.params;
  if (section === "arabic") return arabicInsights(auth);
  if (section === "finances") return financeInsights(auth);
  if (section === "health") return healthInsights(auth);
  if (section === "kpis") return kpiInsights(auth);
  return apiError("NOT_FOUND", "Indicateur inconnu.", 404);
}

async function arabicInsights(auth: AuthContext) {
  const now = new Date();
  const profileResult = await auth.supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle();
  if (profileResult.error) return databaseError(profileResult.error);
  const timezone = profileResult.data?.timezone || "Europe/Paris";
  const week = getIsoWeek(now, timezone);
  const from = new Date(`${week.startsOn}T00:00:00.000Z`);
  from.setUTCDate(from.getUTCDate() - 1);
  const to = new Date(`${week.endsOn}T23:59:59.999Z`);
  to.setUTCDate(to.getUTCDate() + 1);
  const [arabicProfile, sessionsResult] = await Promise.all([
    auth.supabase.from("arabic_profiles").select("weekly_target_minutes").eq("user_id", auth.userId).maybeSingle(),
    auth.supabase.from("arabic_sessions").select("duration_minutes,skill,occurred_at").eq("user_id", auth.userId).gte("occurred_at", from.toISOString()).lte("occurred_at", to.toISOString()).limit(1_000),
  ]);
  if (arabicProfile.error) return databaseError(arabicProfile.error);
  if (sessionsResult.error) return databaseError(sessionsResult.error);
  const sessions = (sessionsResult.data ?? []).filter((entry) => {
    const day = calendarDateInZone(new Date(entry.occurred_at), timezone);
    return day >= week.startsOn && day <= week.endsOn;
  });
  const bySkill: Record<string, number> = {};
  for (const session of sessions) bySkill[session.skill] = (bySkill[session.skill] ?? 0) + Number(session.duration_minutes ?? 0);
  const minutes = sessions.reduce((sum, session) => sum + Number(session.duration_minutes ?? 0), 0);
  return apiData({ week, minutes, targetMinutes: Number(arabicProfile.data?.weekly_target_minutes ?? 0), sessions: sessions.length, bySkill });
}

async function financeInsights(auth: AuthContext) {
  const now = new Date();
  const profileResult = await auth.supabase.from("profiles").select("timezone").eq("id", auth.userId).maybeSingle();
  if (profileResult.error) return databaseError(profileResult.error);
  const month = calendarDateInZone(now, profileResult.data?.timezone || "Europe/Paris").slice(0, 7);
  const from = `${month}-01`;
  const monthStart = new Date(`${from}T00:00:00.000Z`);
  const nextMonth = new Date(Date.UTC(monthStart.getUTCFullYear(), monthStart.getUTCMonth() + 1, 1)).toISOString().slice(0, 10);
  const { data, error } = await auth.supabase
    .from("financial_transactions")
    .select("amount,tx_type,currency")
    .eq("user_id", auth.userId)
    .gte("occurred_on", from)
    .lt("occurred_on", nextMonth)
    .limit(5_000);
  if (error) return databaseError(error);
  const transactions = (data ?? []).map((row) => ({ amount: Number(row.amount), txType: row.tx_type as "income" | "expense" | "transfer", currency: row.currency }));
  const currencies = [...new Set(transactions.map((row) => row.currency.toUpperCase()))].sort();
  const totals = currencies.map((currency) => calculateFinancialTotals(transactions, currency));
  return apiData({ month, totals });
}

async function healthInsights(auth: AuthContext) {
  const now = new Date();
  const from = new Date(now.getTime() - 91 * 86_400_000).toISOString();
  const [metricsResult, entriesResult] = await Promise.all([
    auth.supabase.from("health_metrics").select("id,name,unit").eq("user_id", auth.userId).eq("active", true).order("name").limit(100),
    auth.supabase.from("health_entries").select("metric_id,value,measured_at").eq("user_id", auth.userId).gte("measured_at", from).lte("measured_at", now.toISOString()).order("measured_at").limit(5_000),
  ]);
  if (metricsResult.error) return databaseError(metricsResult.error);
  if (entriesResult.error) return databaseError(entriesResult.error);
  const trends = (metricsResult.data ?? []).map((metric) => {
    const raw = (entriesResult.data ?? []).filter((entry) => entry.metric_id === metric.id).map((entry) => ({ measuredAt: entry.measured_at, value: Number(entry.value) }));
    const window = getHealthTrendWindow(raw, { windowDays: 90, now });
    return { id: metric.id, name: metric.name, unit: metric.unit, change: window.change, points: window.points.map((point) => ({ measuredAt: String(point.measuredAt), value: point.value })) };
  });
  return apiData({ windowDays: 90, trends });
}

async function kpiInsights(auth: AuthContext) {
  const [kpisResult, entriesResult] = await Promise.all([
    auth.supabase.from("kpis").select("id,name,unit,target_type,target_value,target_min,target_max,active").eq("user_id", auth.userId).eq("active", true).order("name").limit(100),
    auth.supabase.from("kpi_entries").select("kpi_id,value,measured_at").eq("user_id", auth.userId).order("measured_at", { ascending: false }).limit(5_000),
  ]);
  if (kpisResult.error) return databaseError(kpisResult.error);
  if (entriesResult.error) return databaseError(entriesResult.error);
  const trends = (kpisResult.data ?? []).map((kpi) => {
    const points = (entriesResult.data ?? []).filter((entry) => entry.kpi_id === kpi.id).slice(0, 30).reverse().map((entry) => ({ measuredAt: entry.measured_at, value: Number(entry.value) }));
    const latest = points.at(-1)?.value ?? null;
    const targetValue = numberOrNull(kpi.target_value);
    const targetMin = numberOrNull(kpi.target_min);
    const targetMax = numberOrNull(kpi.target_max);
    const reference = targetValue ?? (targetMin !== null && targetMax !== null ? Math.abs(targetMax - targetMin) : null);
    const status = classifyKpiValue({ targetType: kpi.target_type as KpiTargetType, targetValue, targetMin, targetMax, watchMargin: reference === null ? 0 : Math.max(Math.abs(reference) * 0.1, 0.01) }, latest);
    return { id: kpi.id, name: kpi.name, unit: kpi.unit, status, points };
  });
  return apiData({ trends });
}

function calendarDateInZone(value: Date, timeZone: string): string {
  const parts = new Intl.DateTimeFormat("en-CA-u-ca-iso8601-nu-latn", { timeZone, year: "numeric", month: "2-digit", day: "2-digit" }).formatToParts(value);
  const part = (type: Intl.DateTimeFormatPartTypes) => parts.find((item) => item.type === type)?.value ?? "";
  return `${part("year")}-${part("month")}-${part("day")}`;
}

type AuthContext = Exclude<Awaited<ReturnType<typeof requireUser>>, Response>;
function numberOrNull(value: unknown): number | null { const number = Number(value); return value !== null && value !== "" && Number.isFinite(number) ? number : null; }
