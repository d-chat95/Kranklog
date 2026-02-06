import { Layout } from "@/components/Layout";
import { useE1RMStats } from "@/hooks/use-stats";
import { LoadingSpinner } from "@/components/ui/Loading";
import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format } from "date-fns";
import { TrendingUp, Dumbbell } from "lucide-react";

type ViewMode = "e1rm" | "actual" | "both";
type DataSource = "anchors" | "all";

const METRIC_COLORS = {
  actual: "#3B82F6",
  e1rm: "#22C55E",
};

function ChartTooltip({ active, payload, label, viewMode }: any) {
  if (!active || !payload || payload.length === 0) return null;
  const d = payload[0]?.payload;
  if (!d) return null;

  return (
    <div className="rounded-md border border-border bg-card px-3 py-2 text-sm shadow-md">
      <p className="font-medium text-foreground mb-1">{label}</p>
      {(viewMode === "actual" || viewMode === "both") && (
        <p style={{ color: METRIC_COLORS.actual }}>
          Actual: {d.weight} &times; {d.reps} @ RPE {d.rpe}
        </p>
      )}
      {(viewMode === "e1rm" || viewMode === "both") && (
        <p style={{ color: METRIC_COLORS.e1rm }}>
          e1RM: {d.e1rm} lbs
        </p>
      )}
    </div>
  );
}

export default function Progress() {
  const [family, setFamily] = useState("Squat");
  const [viewMode, setViewMode] = useState<ViewMode>("e1rm");
  const [dataSource, setDataSource] = useState<DataSource>("anchors");
  const isAnchor = dataSource === "anchors" ? true : undefined;
  const { data: stats, isLoading } = useE1RMStats(family, isAnchor);

  const chartData = (() => {
    if (!stats || stats.length === 0) return [];
    const sorted = [...stats].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
    const byDay = new Map<string, typeof sorted[0]>();
    for (const s of sorted) {
      const dayKey = s.date.slice(0, 10);
      byDay.set(dayKey, s);
    }
    return Array.from(byDay.entries()).map(([dayKey, s]) => ({
      date: format(new Date(dayKey + "T12:00:00"), 'MMM d'),
      e1rm: Math.round(s.e1rm),
      weight: s.weight,
      reps: s.reps,
      rpe: s.rpe
    }));
  })();

  const currentMax = chartData.length > 0 
    ? Math.max(...chartData.map(d => d.e1rm)) 
    : 0;

  const viewOptions: { value: ViewMode; label: string }[] = [
    { value: "e1rm", label: "E1RM" },
    { value: "actual", label: "Actual" },
    { value: "both", label: "Both" },
  ];

  const dataSourceOptions: { value: DataSource; label: string }[] = [
    { value: "anchors", label: "Anchors" },
    { value: "all", label: "All Sets" },
  ];

  return (
    <Layout
      header={
        <div className="flex justify-between items-center">
          <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground">Progress</h1>
          <div className="w-40">
            <Select value={family} onValueChange={setFamily}>
              <SelectTrigger className="bg-card border-border" data-testid="select-movement-family">
                <SelectValue placeholder="Movement" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Squat">Squat</SelectItem>
                <SelectItem value="Bench">Bench</SelectItem>
                <SelectItem value="Deadlift">Deadlift</SelectItem>
                <SelectItem value="Row">Row</SelectItem>
                <SelectItem value="Carry">Carry</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      }
    >
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="gym-card p-6 bg-gradient-to-br from-card to-card/50">
          <div className="flex items-center gap-3 mb-2 text-muted-foreground">
            <TrendingUp className="w-5 h-5 text-primary" />
            <span className="font-bold uppercase text-xs tracking-wider">All-Time e1RM</span>
          </div>
          <div className="text-4xl font-display font-bold" data-testid="text-all-time-e1rm">{currentMax} <span className="text-lg text-muted-foreground">lbs</span></div>
        </div>
        
        <div className="gym-card p-6 col-span-1 md:col-span-2 flex flex-col justify-center">
          <h3 className="text-lg font-bold mb-1">Analyst Notes</h3>
          <p className="text-muted-foreground text-sm" data-testid="text-analyst-notes">
            Based on your {dataSource === "anchors" ? "anchor sets" : "logged sets"}, your estimated 1RM for {family} is trending {
              chartData && chartData.length > 1 && chartData[chartData.length-1].e1rm > chartData[0].e1rm ? "upwards" : "stable"
            }.
          </p>
        </div>
      </div>

      <div className="gym-card p-6 h-[450px]">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <h3 className="text-xl font-bold flex items-center gap-2">
            <Dumbbell className="w-5 h-5 text-primary" /> e1RM Trend
          </h3>
          <div className="flex items-center gap-2 flex-wrap">
            <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5" data-testid="toggle-data-source">
              {dataSourceOptions.map(opt => (
                <button
                  key={opt.value}
                  data-testid={`button-source-${opt.value}`}
                  onClick={() => setDataSource(opt.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${
                    dataSource === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover-elevate"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
            <div className="inline-flex rounded-md border border-border bg-muted/30 p-0.5" data-testid="toggle-chart-view">
              {viewOptions.map(opt => (
                <button
                  key={opt.value}
                  data-testid={`button-view-${opt.value}`}
                  onClick={() => setViewMode(opt.value)}
                  className={`px-3 py-1 text-xs font-semibold rounded-sm transition-colors ${
                    viewMode === opt.value
                      ? "bg-primary text-primary-foreground"
                      : "text-muted-foreground hover-elevate"
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>
        </div>
        
        {isLoading ? <LoadingSpinner /> : (
          stats && stats.length > 0 ? (
            <ResponsiveContainer width="100%" height="85%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                <XAxis 
                  dataKey="date" 
                  stroke="hsl(var(--muted-foreground))" 
                  fontSize={12} 
                  tickLine={false}
                  axisLine={false}
                />

                <YAxis
                  yAxisId="left"
                  hide={viewMode === "e1rm"}
                  stroke={METRIC_COLORS.actual}
                  tick={{ fill: METRIC_COLORS.actual, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  label={viewMode !== "e1rm" ? { value: "Weight (lbs)", angle: -90, position: "insideLeft", style: { fill: METRIC_COLORS.actual, fontSize: 11 } } : undefined}
                />
                <YAxis
                  yAxisId="right"
                  orientation="right"
                  hide={viewMode === "actual"}
                  stroke={METRIC_COLORS.e1rm}
                  tick={{ fill: METRIC_COLORS.e1rm, fontSize: 12 }}
                  tickLine={false}
                  axisLine={false}
                  domain={['auto', 'auto']}
                  label={viewMode !== "actual" ? { value: "e1RM (lbs)", angle: 90, position: "insideRight", style: { fill: METRIC_COLORS.e1rm, fontSize: 11 } } : undefined}
                />

                <Tooltip content={<ChartTooltip viewMode={viewMode} />} />

                {(viewMode === "actual" || viewMode === "both") && (
                  <Line 
                    yAxisId="left"
                    type="monotone" 
                    dataKey="weight"
                    name="Weight"
                    stroke={METRIC_COLORS.actual}
                    strokeWidth={3} 
                    dot={{ r: 4, fill: METRIC_COLORS.actual, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}

                {(viewMode === "e1rm" || viewMode === "both") && (
                  <Line 
                    yAxisId="right"
                    type="monotone" 
                    dataKey="e1rm"
                    name="e1RM"
                    stroke={METRIC_COLORS.e1rm}
                    strokeWidth={3} 
                    strokeDasharray={viewMode === "both" ? "6 4" : undefined}
                    dot={{ r: 4, fill: METRIC_COLORS.e1rm, strokeWidth: 0 }}
                    activeDot={{ r: 6, strokeWidth: 0 }}
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-center px-4">
              <p className="text-muted-foreground max-w-md" data-testid="text-no-anchor-logs">
                No anchor logs yet. Log a set in a workout row marked as an anchor to start tracking e1RM.
              </p>
            </div>
          )
        )}
      </div>
    </Layout>
  );
}
