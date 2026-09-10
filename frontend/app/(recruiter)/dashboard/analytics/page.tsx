"use client";

import { useEffect, useState } from "react";
import { Topbar } from "@/components/dashboard/Topbar";
import { StatCardSkeleton, ChartSkeleton } from "@/components/ui/SkeletonCard";
import { ErrorBoundary } from "@/components/ui/ErrorBoundary";
import { fetchRecruiterAnalytics } from "@/lib/api/jobs";
import {
  AreaChart,
  Area,
  BarChart,
  Bar,
  RadialBarChart,
  RadialBar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts";
import {
  Clock,
  Users,
  CheckCircle2,
  ShieldCheck,
  TrendingDown,
  TrendingUp,
  Briefcase,
  AlertTriangle,
} from "lucide-react";

// ── Types ──────────────────────────────────────────────────────────────────────

interface AnalyticsData {
  kpis: {
    totalRequisitions: number;
    openRequisitions: number;
    closedRequisitions: number;
    avgTimeToFillDays: number;
    avgGhostScore: number;
    industryBenchmarkTtf: number;
    pipelineConversionRate: number;
    offerAcceptanceRate: number;
  };
  weeklyTtfTrend: Array<{ week: string; days: number; reqs: number }>;
  pipelineFunnel: Array<{ stage: string; count: number; fill: string }>;
  statusBreakdown: Array<{ name: string; value: number; fill: string }>;
  ghostRiskTrend: Array<{ day: string; score: number }>;
}

// ── Custom Tooltip ─────────────────────────────────────────────────────────────

function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload || !payload.length) return null;
  return (
    <div className="rounded-card border border-border bg-surface px-3 py-2 shadow-2xl text-xs">
      <p className="font-semibold text-ink mb-1">{label}</p>
      {payload.map((entry: any, i: number) => (
        <p key={i} style={{ color: entry.color ?? "#2FBFA8" }}>
          {entry.name}: <span className="font-mono font-bold">{entry.value}</span>
          {entry.unit ?? ""}
        </p>
      ))}
    </div>
  );
}

// ── KPI Card ───────────────────────────────────────────────────────────────────

interface KpiCardProps {
  label: string;
  value: string | number;
  subtitle?: string;
  trend?: "up" | "down" | "neutral";
  trendLabel?: string;
  icon: React.ReactNode;
  color?: "teal" | "amber" | "red" | "default";
}

function KpiCard({ label, value, subtitle, trend, trendLabel, icon, color = "teal" }: KpiCardProps) {
  const colorMap = {
    teal: "text-teal",
    amber: "text-amber",
    red: "text-red",
    default: "text-ink",
  };

  return (
    <div className="rounded-card border border-border bg-surface p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-ink-dim uppercase tracking-wider">{label}</span>
        <span className={`${colorMap[color]}`}>{icon}</span>
      </div>
      <div>
        <p className={`text-3xl font-bold font-mono ${colorMap[color]}`}>{value}</p>
        {subtitle && <p className="mt-1 text-xs text-ink-faint">{subtitle}</p>}
      </div>
      {trend && trendLabel && (
        <div className={`flex items-center gap-1 text-xs ${trend === "down" ? "text-teal" : trend === "up" ? "text-red" : "text-ink-dim"}`}>
          {trend === "down" ? <TrendingDown size={12} /> : trend === "up" ? <TrendingUp size={12} /> : null}
          <span>{trendLabel}</span>
        </div>
      )}
    </div>
  );
}

// ── Main Component ─────────────────────────────────────────────────────────────

export default function AnalyticsPage() {
  const [data, setData] = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const res = await fetchRecruiterAnalytics();
      setLoading(false);
      if (res.data) {
        setData(res.data);
      } else {
        setError(res.error || "Failed to load analytics data.");
      }
    }
    load();
  }, []);

  return (
    <>
      <Topbar title="Hiring Analytics" />
      <main className="flex flex-1 flex-col gap-6 px-8 py-8">

        {/* ── Header ─────────────────────────────────────────────────────── */}
        <div>
          <h2 className="text-xl font-semibold text-ink">Recruiter Analytics & Velocity</h2>
          <p className="mt-1 text-sm text-ink-dim">
            Time-to-fill trends, pipeline conversion funnel, requisition health, and ghost risk signals — computed from live data.
          </p>
        </div>

        {/* ── Error State ────────────────────────────────────────────────── */}
        {error && (
          <div role="alert" className="flex items-center gap-2 rounded-card border border-red/30 bg-red/5 p-4 text-sm text-red">
            <AlertTriangle size={16} />
            {error}
          </div>
        )}

        {/* ── KPI Row ──────────────────────────────────────────────────────── */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {loading ? (
            Array.from({ length: 4 }).map((_, i) => <StatCardSkeleton key={i} />)
          ) : data ? (
            <>
              <KpiCard
                label="Avg Time-to-Fill"
                value={`${data.kpis.avgTimeToFillDays}d`}
                subtitle={`Industry avg: ${data.kpis.industryBenchmarkTtf}d`}
                trend={data.kpis.avgTimeToFillDays < data.kpis.industryBenchmarkTtf ? "down" : "up"}
                trendLabel={
                  data.kpis.avgTimeToFillDays < data.kpis.industryBenchmarkTtf
                    ? `${data.kpis.industryBenchmarkTtf - data.kpis.avgTimeToFillDays}d faster than benchmark`
                    : `${data.kpis.avgTimeToFillDays - data.kpis.industryBenchmarkTtf}d above benchmark`
                }
                icon={<Clock size={16} />}
                color={data.kpis.avgTimeToFillDays < data.kpis.industryBenchmarkTtf ? "teal" : "amber"}
              />
              <KpiCard
                label="Pipeline Conversion"
                value={`${data.kpis.pipelineConversionRate}%`}
                subtitle="Applicants → Hired"
                icon={<Users size={16} />}
                color="teal"
              />
              <KpiCard
                label="Offer Acceptance"
                value={`${data.kpis.offerAcceptanceRate}%`}
                subtitle="Offers accepted"
                trend={data.kpis.offerAcceptanceRate >= 85 ? "down" : "up"}
                trendLabel={data.kpis.offerAcceptanceRate >= 85 ? "Strong conversion" : "Below 85% target"}
                icon={<CheckCircle2 size={16} />}
                color={data.kpis.offerAcceptanceRate >= 85 ? "teal" : "amber"}
              />
              <KpiCard
                label="Avg Ghost Score"
                value={`${data.kpis.avgGhostScore}/100`}
                subtitle={data.kpis.avgGhostScore < 30 ? "Verified Active Employer" : data.kpis.avgGhostScore < 60 ? "Moderate risk — monitor" : "High risk signals"}
                trend={data.kpis.avgGhostScore < 30 ? "down" : "up"}
                trendLabel={data.kpis.avgGhostScore < 30 ? "Low ghost risk" : "Review open reqs"}
                icon={<ShieldCheck size={16} />}
                color={data.kpis.avgGhostScore < 30 ? "teal" : data.kpis.avgGhostScore < 60 ? "amber" : "red"}
              />
            </>
          ) : null}
        </div>

        {/* ── Charts Row 1: TTF Trend + Pipeline Funnel ─────────────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Area Chart — Time-to-Fill Trend (12 weeks) */}
          <div className="lg:col-span-3 rounded-card border border-border bg-surface p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ink">Time-to-Fill Trend</h3>
              <p className="text-xs text-ink-dim mt-0.5">Weekly average days to close requisitions (12 weeks)</p>
            </div>
            <ErrorBoundary>
              {loading ? (
                <ChartSkeleton height={200} />
              ) : data ? (
                <ResponsiveContainer width="100%" height={220}>
                  <AreaChart data={data.weeklyTtfTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <defs>
                      <linearGradient id="ttfGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#2FBFA8" stopOpacity={0.25} />
                        <stop offset="100%" stopColor="#2FBFA8" stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="benchmarkGradient" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#D69A45" stopOpacity={0.1} />
                        <stop offset="100%" stopColor="#D69A45" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="week"
                      tick={{ fontSize: 10, fill: "#5C5C64" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#5C5C64" }}
                      tickLine={false}
                      axisLine={false}
                      unit="d"
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Industry benchmark line */}
                    <Area
                      type="monotone"
                      dataKey={() => data.kpis.industryBenchmarkTtf}
                      name="Industry Benchmark"
                      stroke="#D69A45"
                      strokeDasharray="4 4"
                      strokeWidth={1.5}
                      fill="url(#benchmarkGradient)"
                      dot={false}
                      unit="d"
                    />
                    <Area
                      type="monotone"
                      dataKey="days"
                      name="Avg Days"
                      stroke="#2FBFA8"
                      strokeWidth={2}
                      fill="url(#ttfGradient)"
                      dot={{ fill: "#2FBFA8", r: 3, strokeWidth: 0 }}
                      activeDot={{ r: 5, fill: "#2FBFA8" }}
                      unit="d"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              ) : null}
            </ErrorBoundary>
          </div>

          {/* Bar Chart — Pipeline Funnel */}
          <div className="lg:col-span-2 rounded-card border border-border bg-surface p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ink">Pipeline Funnel</h3>
              <p className="text-xs text-ink-dim mt-0.5">Candidates per stage</p>
            </div>
            <ErrorBoundary>
              {loading ? (
                <ChartSkeleton height={200} />
              ) : data ? (
                <ResponsiveContainer width="100%" height={220}>
                  <BarChart
                    data={data.pipelineFunnel}
                    layout="vertical"
                    margin={{ top: 0, right: 20, bottom: 0, left: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" horizontal={false} />
                    <XAxis type="number" tick={{ fontSize: 10, fill: "#5C5C64" }} tickLine={false} axisLine={false} />
                    <YAxis
                      type="category"
                      dataKey="stage"
                      tick={{ fontSize: 10, fill: "#9A9AA2" }}
                      tickLine={false}
                      axisLine={false}
                      width={65}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="count" name="Candidates" radius={[0, 4, 4, 0]}>
                      {data.pipelineFunnel.map((entry, index) => (
                        <Cell
                          key={index}
                          fill={index === 0 ? "#2FBFA8" : index < 3 ? "#D69A45" : "#2FBFA8"}
                          fillOpacity={1 - index * 0.12}
                        />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              ) : null}
            </ErrorBoundary>
          </div>
        </div>

        {/* ── Charts Row 2: Ghost Risk Trend + Status Breakdown ────────────── */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-5">
          {/* Ghost Risk Trend (7 days) */}
          <div className="lg:col-span-3 rounded-card border border-border bg-surface p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ink">Ghost Risk Score Trend</h3>
              <p className="text-xs text-ink-dim mt-0.5">7-day rolling average anti-ghost score (lower = healthier)</p>
            </div>
            <ErrorBoundary>
              {loading ? (
                <ChartSkeleton height={180} />
              ) : data ? (
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={data.ghostRiskTrend} margin={{ top: 4, right: 8, bottom: 0, left: -10 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                    <XAxis
                      dataKey="day"
                      tick={{ fontSize: 10, fill: "#5C5C64" }}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      tick={{ fontSize: 10, fill: "#5C5C64" }}
                      tickLine={false}
                      axisLine={false}
                      domain={[0, 100]}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    {/* Risk thresholds */}
                    <Line type="monotone" dataKey={() => 30} name="Safe Threshold" stroke="#2FBFA8" strokeDasharray="4 4" strokeWidth={1} dot={false} />
                    <Line type="monotone" dataKey={() => 60} name="High Risk Threshold" stroke="#D9564D" strokeDasharray="4 4" strokeWidth={1} dot={false} />
                    <Line
                      type="monotone"
                      dataKey="score"
                      name="Ghost Score"
                      stroke="#D69A45"
                      strokeWidth={2.5}
                      dot={{ fill: "#D69A45", r: 4, strokeWidth: 0 }}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              ) : null}
            </ErrorBoundary>

            {/* Legend labels */}
            <div className="mt-3 flex items-center gap-4 text-[11px]">
              <div className="flex items-center gap-1.5"><span className="h-2 w-3 rounded-sm bg-amber opacity-80" /><span className="text-ink-dim">Your Score</span></div>
              <div className="flex items-center gap-1.5"><span className="h-px w-4 bg-teal" /><span className="text-ink-dim">Safe (&lt;30)</span></div>
              <div className="flex items-center gap-1.5"><span className="h-px w-4 bg-red" /><span className="text-ink-dim">High Risk (&gt;60)</span></div>
            </div>
          </div>

          {/* Requisition Status Donut */}
          <div className="lg:col-span-2 rounded-card border border-border bg-surface p-5">
            <div className="mb-4">
              <h3 className="text-sm font-semibold text-ink">Requisition Status</h3>
              <p className="text-xs text-ink-dim mt-0.5">Current breakdown</p>
            </div>
            <ErrorBoundary>
              {loading ? (
                <ChartSkeleton height={180} />
              ) : data ? (
                <div className="flex flex-col items-center gap-4">
                  <ResponsiveContainer width="100%" height={180}>
                    <PieChart>
                      <Pie
                        data={data.statusBreakdown}
                        dataKey="value"
                        nameKey="name"
                        cx="50%"
                        cy="50%"
                        innerRadius={55}
                        outerRadius={80}
                        paddingAngle={3}
                        strokeWidth={0}
                      >
                        {data.statusBreakdown.map((entry, index) => (
                          <Cell key={index} fill={entry.fill} />
                        ))}
                      </Pie>
                      <Tooltip content={<CustomTooltip />} />
                    </PieChart>
                  </ResponsiveContainer>

                  {/* Legend */}
                  <div className="flex flex-col gap-1.5 w-full text-xs">
                    {data.statusBreakdown.map((entry) => (
                      <div key={entry.name} className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <span className="h-2.5 w-2.5 rounded-sm" style={{ background: entry.fill }} />
                          <span className="text-ink-dim">{entry.name}</span>
                        </div>
                        <span className="font-mono font-bold text-ink">{entry.value}</span>
                      </div>
                    ))}
                  </div>

                  {/* Center stat */}
                  <div className="text-center -mt-2">
                    <p className="text-2xl font-bold font-mono text-ink">{data.kpis.totalRequisitions}</p>
                    <p className="text-xs text-ink-faint">Total Requisitions</p>
                  </div>
                </div>
              ) : null}
            </ErrorBoundary>
          </div>
        </div>

        {/* ── Bottom Row: Insights ──────────────────────────────────────────── */}
        {data && !loading && (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            {/* Insight: TTF vs Benchmark */}
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Clock size={14} className="text-teal" />
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">Hiring Velocity</span>
              </div>
              <p className="text-sm text-ink-dim leading-relaxed">
                {data.kpis.avgTimeToFillDays < data.kpis.industryBenchmarkTtf
                  ? `You're hiring ${data.kpis.industryBenchmarkTtf - data.kpis.avgTimeToFillDays} days faster than the ${data.kpis.industryBenchmarkTtf}-day industry benchmark. Strong talent acquisition efficiency.`
                  : `Your average time-to-fill is ${data.kpis.avgTimeToFillDays - data.kpis.industryBenchmarkTtf} days above the ${data.kpis.industryBenchmarkTtf}-day benchmark. Consider streamlining your screening stage.`}
              </p>
            </div>

            {/* Insight: Pipeline health */}
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <Users size={14} className="text-teal" />
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">Pipeline Health</span>
              </div>
              <p className="text-sm text-ink-dim leading-relaxed">
                {data.kpis.pipelineConversionRate >= 10
                  ? `Your ${data.kpis.pipelineConversionRate}% applicant-to-hire conversion is strong. Each role attracts ${(100 / data.kpis.pipelineConversionRate).toFixed(0)} qualified applicants per hire.`
                  : `Pipeline conversion at ${data.kpis.pipelineConversionRate}% — consider expanding outreach or refining JD targeting to attract higher-quality applicants.`}
              </p>
            </div>

            {/* Insight: Ghost risk */}
            <div className="rounded-card border border-border bg-surface p-5">
              <div className="flex items-center gap-2 mb-3">
                <ShieldCheck size={14} className="text-teal" />
                <span className="text-xs font-semibold text-ink uppercase tracking-wider">Ghost Risk Status</span>
              </div>
              <p className="text-sm text-ink-dim leading-relaxed">
                {data.kpis.avgGhostScore < 30
                  ? `Ghost risk score of ${data.kpis.avgGhostScore}/100 — your requisitions are fresh, active, and candidate-facing. Candidates see your roles as legitimate open positions.`
                  : data.kpis.avgGhostScore < 60
                  ? `Score of ${data.kpis.avgGhostScore}/100 — moderate risk. Some requisitions may be going stale. Review openings older than 30 days.`
                  : `Score of ${data.kpis.avgGhostScore}/100 — high ghost risk detected. Multiple positions have been open too long. Take immediate action to close or refresh them.`}
              </p>
            </div>
          </div>
        )}
      </main>
    </>
  );
}
