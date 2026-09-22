"use client";

import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";

type Point = { label: string; rate: number | null; completed: number; expected: number };

export function ProgressCharts({ points }: { points: readonly Point[] }) {
  return (
    <div className="h-72 w-full" aria-label="Évolution du taux d’exécution sur huit semaines">
      <ResponsiveContainer width="100%" height="100%">
        <LineChart data={points} margin={{ top: 8, right: 12, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" vertical={false} />
          <XAxis dataKey="label" tickLine={false} axisLine={false} fontSize={12} />
          <YAxis domain={[0, 100]} tickLine={false} axisLine={false} fontSize={12} unit="%" />
          <Tooltip formatter={(value) => [`${value ?? "—"}%`, "Exécution"]} />
          <Line type="monotone" dataKey="rate" stroke="#175c4a" strokeWidth={3} dot={{ r: 3 }} connectNulls={false} />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}
