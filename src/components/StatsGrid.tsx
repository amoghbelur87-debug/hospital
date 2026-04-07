import { Activity, Skull, UserCheck, Clock, BedDouble, HeartPulse, Users, AlertTriangle } from "lucide-react";
import type { SnapshotData } from "@/lib/careflow-engine";

interface StatCardProps {
  label: string;
  value: string | number;
  icon: React.ReactNode;
  variant?: "default" | "critical" | "success" | "warning";
  subtitle?: string;
}

function StatCard({ label, value, icon, variant = "default", subtitle }: StatCardProps) {
  const cardClass = variant === "critical" ? "stat-card stat-card-critical" : "stat-card";
  const valueColor =
    variant === "critical" ? "text-destructive" :
    variant === "success" ? "text-primary" :
    variant === "warning" ? "text-warning" :
    "text-foreground";

  return (
    <div className={cardClass}>
      <div className="flex items-center justify-between mb-2">
        <span className="text-xs font-mono uppercase tracking-wider text-muted-foreground">{label}</span>
        <span className="text-muted-foreground">{icon}</span>
      </div>
      <p className={`text-2xl font-heading font-bold ${valueColor}`}>{value}</p>
      {subtitle && <p className="text-xs text-muted-foreground mt-1">{subtitle}</p>}
    </div>
  );
}

interface StatsGridProps {
  data: SnapshotData;
  config: { totalBeds: number; totalIcu: number; totalStaff: number; maxDeaths: number };
}

export function StatsGrid({ data, config }: StatsGridProps) {
  const deathVariant = data.deaths > 0 ? "critical" as const : "default" as const;
  const staffVariant = data.staffAvailable < 3 ? "warning" as const : "default" as const;

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      <StatCard
        label="Deaths"
        value={data.deaths}
        icon={<Skull className="w-4 h-4" />}
        variant={deathVariant}
        subtitle={`Max: ${config.maxDeaths}`}
      />
      <StatCard
        label="Treated"
        value={data.treated}
        icon={<UserCheck className="w-4 h-4" />}
        variant="success"
      />
      <StatCard
        label="Beds"
        value={`${data.bedsUsed}/${config.totalBeds}`}
        icon={<BedDouble className="w-4 h-4" />}
        subtitle={`${data.icuUsed}/${config.totalIcu} ICU`}
      />
      <StatCard
        label="Staff"
        value={`${data.staffAvailable}/${config.totalStaff}`}
        icon={<Users className="w-4 h-4" />}
        variant={staffVariant}
        subtitle={`Fatigue: ${(data.staffFatigue * 100).toFixed(0)}%`}
      />
      <StatCard
        label="Waiting"
        value={data.waitingPatients}
        icon={<Clock className="w-4 h-4" />}
        subtitle={`Avg: ${data.avgWaitTime}s`}
      />
      <StatCard
        label="Avg Severity"
        value={data.avgSeverity.toFixed(2)}
        icon={<HeartPulse className="w-4 h-4" />}
        variant={data.avgSeverity > 0.6 ? "warning" : "default"}
      />
      <StatCard
        label="Active Patients"
        value={data.totalPatients}
        icon={<Activity className="w-4 h-4" />}
      />
      <StatCard
        label="Emergency"
        value={data.emergency ? "ACTIVE" : "None"}
        icon={<AlertTriangle className="w-4 h-4" />}
        variant={data.emergency ? "critical" : "default"}
      />
    </div>
  );
}
