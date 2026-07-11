import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Card, formatNaira } from "./UiKit";

const STATUS_LABEL = { PAID: "Paid", PARTIAL: "Partial", OWING: "Owing" };
const PIE_COLORS = { PAID: "#26b568", PARTIAL: "#d97706", OWING: "#dc2626" };

export function IncomeOverviewChart({ series, className = "lg:col-span-2" }) {
  return (
    <Card title="Income Overview" className={className}>
      <div className="h-56">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={series} margin={{ top: 5, right: 10, left: 0, bottom: 0 }}>
            <defs>
              <linearGradient id="incomeFill" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#26b568" stopOpacity={0.35} />
                <stop offset="100%" stopColor="#26b568" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis dataKey="month" tick={{ fontSize: 12, fill: "#8792a2" }} axisLine={false} tickLine={false} />
            <YAxis
              tick={{ fontSize: 11, fill: "#8792a2" }}
              axisLine={false}
              tickLine={false}
              tickFormatter={(v) => (v >= 1000 ? `₦${(v / 1000).toFixed(0)}k` : `₦${v}`)}
              width={50}
            />
            <Tooltip formatter={(value) => formatNaira(value)} labelStyle={{ color: "#1f2329" }} />
            <Area type="monotone" dataKey="total" stroke="#26b568" strokeWidth={2.5} fill="url(#incomeFill)" name="Collected" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

export function PaymentStatusChart({ byStatus }) {
  const segments = ["PAID", "PARTIAL", "OWING"].map((key) => ({ key, count: byStatus[key].count }));
  const total = segments.reduce((sum, s) => sum + s.count, 0);

  return (
    <Card title="Payment Status">
      {total === 0 ? (
        <p className="text-sm text-ink-400">No payments recorded yet.</p>
      ) : (
        <>
          <div className="h-40">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={segments} dataKey="count" nameKey="key" innerRadius={45} outerRadius={70} paddingAngle={2}>
                  {segments.map((s) => (
                    <Cell key={s.key} fill={PIE_COLORS[s.key]} />
                  ))}
                </Pie>
                <Tooltip formatter={(value, name) => [value, STATUS_LABEL[name]]} />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="mt-2 space-y-1.5">
            {segments.map((s) => (
              <div key={s.key} className="flex items-center justify-between text-xs">
                <span className="flex items-center gap-1.5 text-ink-500">
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: PIE_COLORS[s.key] }} />
                  {STATUS_LABEL[s.key]}
                </span>
                <span className="font-semibold text-ink-800">
                  {s.count} ({total > 0 ? Math.round((s.count / total) * 100) : 0}%)
                </span>
              </div>
            ))}
          </div>
        </>
      )}
    </Card>
  );
}
