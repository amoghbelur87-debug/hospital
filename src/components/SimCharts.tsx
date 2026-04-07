import { useMemo } from "react";
import {
  LineChart, Line, AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import type { SnapshotData } from "@/lib/careflow-engine";

interface ChartProps {
  data: SnapshotData[];
}

const axisStyle = { fontSize: 10, fill: "hsl(215, 12%, 55%)" };
const gridColor = "hsl(220, 14%, 18%)";

function ChartTooltipContent({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-md border bg-card p-2.5 shadow-lg text-xs font-mono">
      <p className="text-muted-foreground mb-1">Step {label}</p>
      {payload.map((entry: any) => (
        <p key={entry.name} style={{ color: entry.color }}>
          {entry.name}: <span className="font-semibold">{typeof entry.value === "number" ? entry.value.toFixed(2) : entry.value}</span>
        </p>
      ))}
    </div>
  );
}

export function DeathsTreatedChart({ data }: ChartProps) {
  return (
    <div className="chart-container">
      <h3 className="text-sm font-heading font-semibold text-foreground mb-3">Deaths & Treated Over Time</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="time" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="deaths" name="Deaths" stackId="1" stroke="hsl(0, 75%, 55%)" fill="hsl(0, 75%, 55%)" fillOpacity={0.3} />
          <Area type="monotone" dataKey="treated" name="Treated" stackId="2" stroke="hsl(160, 70%, 45%)" fill="hsl(160, 70%, 45%)" fillOpacity={0.3} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ResourceChart({ data }: ChartProps) {
  return (
    <div className="chart-container">
      <h3 className="text-sm font-heading font-semibold text-foreground mb-3">Resource Utilization</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="time" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="bedsUsed" name="Beds" stroke="hsl(200, 80%, 55%)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="icuUsed" name="ICU" stroke="hsl(280, 65%, 60%)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="staffAvailable" name="Staff" stroke="hsl(38, 92%, 50%)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function WaitTimeChart({ data }: ChartProps) {
  return (
    <div className="chart-container">
      <h3 className="text-sm font-heading font-semibold text-foreground mb-3">Wait Time & Severity</h3>
      <ResponsiveContainer width="100%" height={220}>
        <LineChart data={data}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="time" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Line type="monotone" dataKey="avgWaitTime" name="Avg Wait" stroke="hsl(330, 70%, 55%)" strokeWidth={2} dot={false} />
          <Line type="monotone" dataKey="avgSeverity" name="Avg Severity" stroke="hsl(15, 85%, 55%)" strokeWidth={2} dot={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export function RewardChart({ data }: ChartProps) {
  const chartData = useMemo(() => {
    let cumulative = 0;
    return data.map(d => {
      cumulative += d.reward;
      return { ...d, cumulativeReward: +cumulative.toFixed(2) };
    });
  }, [data]);

  return (
    <div className="chart-container">
      <h3 className="text-sm font-heading font-semibold text-foreground mb-3">Reward Signal</h3>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={chartData}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="time" tick={axisStyle} />
          <YAxis tick={axisStyle} />
          <Tooltip content={<ChartTooltipContent />} />
          <Legend wrapperStyle={{ fontSize: 11 }} />
          <Area type="monotone" dataKey="reward" name="Step Reward" stroke="hsl(160, 70%, 45%)" fill="hsl(160, 70%, 45%)" fillOpacity={0.15} />
          <Area type="monotone" dataKey="cumulativeReward" name="Cumulative" stroke="hsl(200, 80%, 55%)" fill="hsl(200, 80%, 55%)" fillOpacity={0.1} />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
