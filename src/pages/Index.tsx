import { useState, useCallback, useRef, useEffect } from "react";
import { Play, Pause, RotateCcw, Zap, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { StatsGrid } from "@/components/StatsGrid";
import { DeathsTreatedChart, ResourceChart, WaitTimeChart, RewardChart } from "@/components/SimCharts";
import { PatientList } from "@/components/PatientList";
import {
  CareFlowEnv, EASY_CONFIG, MEDIUM_CONFIG, HARD_CONFIG,
  runBaselineStep, grade,
  type EnvConfig, type SnapshotData,
} from "@/lib/careflow-engine";

const TASKS = [
  { id: "easy", label: "Easy", config: EASY_CONFIG, desc: "Stable arrivals, ample resources" },
  { id: "medium", label: "Medium", config: MEDIUM_CONFIG, desc: "Emergency spikes, ICU constraints" },
  { id: "hard", label: "Hard", config: HARD_CONFIG, desc: "Waves, shortages, stochastic" },
] as const;

type Speed = 1 | 5 | 20 | 100;
const SPEEDS: { value: Speed; label: string }[] = [
  { value: 1, label: "1×" },
  { value: 5, label: "5×" },
  { value: 20, label: "20×" },
  { value: 100, label: "Max" },
];

export default function Dashboard() {
  const [taskIdx, setTaskIdx] = useState(0);
  const [running, setRunning] = useState(false);
  const [speed, setSpeed] = useState<Speed>(5);
  const [snapshots, setSnapshots] = useState<SnapshotData[]>([]);
  const [currentSnap, setCurrentSnap] = useState<SnapshotData | null>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);
  const [showTaskMenu, setShowTaskMenu] = useState(false);

  const envRef = useRef<CareFlowEnv | null>(null);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const task = TASKS[taskIdx];

  const initEnv = useCallback(async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setRunning(false);
    setFinalScore(null);
    const env = new CareFlowEnv(task.config);
    await env.reset();
    envRef.current = env;
    const snap = env.snapshot();
    setSnapshots([snap]);
    setCurrentSnap(snap);
  }, [task]);

  useEffect(() => { initEnv(); }, [initEnv]);

  const doStep = useCallback(async () => {
    const env = envRef.current;
    if (!env || env.isDone()) {
      if (env) setFinalScore(grade(env));
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
      return;
    }
    await runBaselineStep(env);
    const snap = env.snapshot();
    setSnapshots(prev => [...prev, snap]);
    setCurrentSnap(snap);
    if (env.isDone()) {
      setFinalScore(grade(env));
      setRunning(false);
      if (intervalRef.current) clearInterval(intervalRef.current);
    }
  }, []);

  const toggleRun = useCallback(() => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      setRunning(false);
    } else {
      setRunning(true);
      const delay = speed >= 100 ? 5 : Math.max(10, 200 / speed);
      intervalRef.current = setInterval(async () => {
        const stepsPerTick = speed >= 100 ? 10 : 1;
        for (let i = 0; i < stepsPerTick; i++) await doStep();
      }, delay);
    }
  }, [running, speed, doStep]);

  useEffect(() => {
    return () => { if (intervalRef.current) clearInterval(intervalRef.current); };
  }, []);

  // Restart interval when speed changes while running
  useEffect(() => {
    if (running) {
      if (intervalRef.current) clearInterval(intervalRef.current);
      const delay = speed >= 100 ? 5 : Math.max(10, 200 / speed);
      intervalRef.current = setInterval(async () => {
        const stepsPerTick = speed >= 100 ? 10 : 1;
        for (let i = 0; i < stepsPerTick; i++) await doStep();
      }, delay);
    }
  }, [speed, running, doStep]);

  const progress = currentSnap ? (currentSnap.time / task.config.maxSteps) * 100 : 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b px-4 md:px-6 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="pulse-dot bg-primary" />
          <h1 className="font-heading text-lg font-bold tracking-tight text-foreground glow-text">
            CareFlow
          </h1>
          <span className="text-xs font-mono text-muted-foreground hidden sm:inline">Hospital Simulation</span>
        </div>

        {finalScore !== null && (
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-md border bg-card">
            <Zap className="w-4 h-4 text-primary" />
            <span className="font-heading text-sm font-bold text-primary">{finalScore.toFixed(4)}</span>
            <span className="text-xs text-muted-foreground">score</span>
          </div>
        )}
      </header>

      <main className="max-w-7xl mx-auto px-4 md:px-6 py-4 space-y-4">
        {/* Controls */}
        <div className="flex flex-wrap items-center gap-3">
          {/* Task selector */}
          <div className="relative">
            <button
              onClick={() => setShowTaskMenu(!showTaskMenu)}
              className="flex items-center gap-2 px-3 py-2 rounded-md border bg-card text-sm font-mono hover:bg-secondary transition-colors"
            >
              <span className="text-muted-foreground">Task:</span>
              <span className="font-semibold text-foreground">{task.label}</span>
              <ChevronDown className="w-3.5 h-3.5 text-muted-foreground" />
            </button>
            {showTaskMenu && (
              <div className="absolute top-full left-0 mt-1 z-50 bg-card border rounded-md shadow-lg min-w-[200px]">
                {TASKS.map((t, i) => (
                  <button
                    key={t.id}
                    onClick={() => { setTaskIdx(i); setShowTaskMenu(false); }}
                    className={`w-full text-left px-3 py-2 text-sm hover:bg-secondary transition-colors ${i === taskIdx ? "bg-secondary" : ""}`}
                  >
                    <span className="font-mono font-semibold text-foreground">{t.label}</span>
                    <span className="block text-xs text-muted-foreground">{t.desc}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Speed */}
          <div className="flex items-center gap-1 rounded-md border bg-card p-1">
            {SPEEDS.map(s => (
              <button
                key={s.value}
                onClick={() => setSpeed(s.value)}
                className={`px-2.5 py-1 rounded text-xs font-mono transition-colors ${
                  speed === s.value
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:text-foreground"
                }`}
              >
                {s.label}
              </button>
            ))}
          </div>

          {/* Play/Pause */}
          <Button
            onClick={toggleRun}
            variant={running ? "secondary" : "default"}
            size="sm"
            disabled={envRef.current?.done}
          >
            {running ? <Pause className="w-4 h-4 mr-1" /> : <Play className="w-4 h-4 mr-1" />}
            {running ? "Pause" : "Run"}
          </Button>

          {/* Reset */}
          <Button onClick={initEnv} variant="outline" size="sm">
            <RotateCcw className="w-4 h-4 mr-1" /> Reset
          </Button>

          {/* Progress */}
          <div className="flex-1 min-w-[120px]">
            <div className="flex justify-between text-xs font-mono text-muted-foreground mb-1">
              <span>Step {currentSnap?.time ?? 0}</span>
              <span>{task.config.maxSteps}</span>
            </div>
            <div className="h-1.5 bg-secondary rounded-full overflow-hidden">
              <div
                className="h-full bg-primary rounded-full transition-all duration-200"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        </div>

        {/* Patient Data */}
        <PatientList />

        {/* Stats */}
        {currentSnap && (
          <StatsGrid data={currentSnap} config={task.config} />
        )}

        {/* Charts */}
        <div className="grid md:grid-cols-2 gap-4">
          <DeathsTreatedChart data={snapshots} />
          <ResourceChart data={snapshots} />
          <WaitTimeChart data={snapshots} />
          <RewardChart data={snapshots} />
        </div>
      </main>
    </div>
  );
}
