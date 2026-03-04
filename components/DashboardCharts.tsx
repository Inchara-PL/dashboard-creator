import { useState, useCallback } from "react";
import { motion } from "framer-motion";
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
  AreaChart, Area, ScatterChart, Scatter,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  Treemap,
} from "recharts";
import { ChartConfig } from "@/utils/dataAnalysis";
import { Filter, X } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const COLORS = [
  "hsl(174 72% 50%)",
  "hsl(262 60% 60%)",
  "hsl(34 90% 60%)",
  "hsl(340 65% 58%)",
  "hsl(200 80% 55%)",
  "hsl(140 60% 50%)",
  "hsl(20 80% 55%)",
  "hsl(280 70% 55%)",
];

interface DashboardChartsProps {
  charts: ChartConfig[];
}

const tooltipStyle = {
  backgroundColor: "hsl(220 18% 12%)",
  border: "1px solid hsl(220 14% 20%)",
  borderRadius: "8px",
  color: "hsl(210 20% 92%)",
  fontSize: "13px",
};

const axisStyle = { fill: "hsl(215 12% 50%)", fontSize: 11 };

interface TreemapContentProps {
  x: number;
  y: number;
  width: number;
  height: number;
  name: string;
  index: number;
  value: number;
  isHighlighted: boolean;
}

const CustomTreemapContent = ({ x, y, width, height, name, index, isHighlighted }: TreemapContentProps) => {
  if (width < 30 || height < 20) return null;
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        style={{
          fill: COLORS[index % COLORS.length],
          stroke: "hsl(220 18% 10%)",
          strokeWidth: 2,
          opacity: isHighlighted ? 1 : 0.7,
          cursor: "pointer",
        }}
        rx={4}
      />
      {width > 50 && height > 30 && (
        <text
          x={x + width / 2}
          y={y + height / 2}
          textAnchor="middle"
          fill="hsl(210 20% 92%)"
          fontSize={11}
          fontWeight={600}
        >
          {name.length > 10 ? name.slice(0, 10) + "…" : name}
        </text>
      )}
    </g>
  );
};

const ChartCard = ({
  chart,
  index,
  activeFilter,
  onFilter,
}: {
  chart: ChartConfig;
  index: number;
  activeFilter: string | null;
  onFilter: (value: string | null, column?: string) => void;
}) => {
  const handleClick = (data: Record<string, unknown>) => {
    if (!data) return;
    const clickedValue = String(data.name ?? data.x ?? "");
    if (activeFilter === clickedValue) {
      onFilter(null);
    } else {
      onFilter(clickedValue, chart.filterColumn);
    }
  };

  const isHighlighted = (entry: Record<string, unknown>) => {
    if (!activeFilter) return true;
    const val = String(entry.name ?? entry.x ?? "");
    return val === activeFilter;
  };

  const chartData = chart.data.map((d) => ({
    ...d,
    _highlighted: isHighlighted(d),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08 }}
      className={`glass-card rounded-xl p-5 ${activeFilter ? "ring-1 ring-primary/20" : ""}`}
    >
      <h4 className="text-sm font-semibold text-foreground mb-4 flex items-center gap-2">
        {chart.title}
        {chart.filterColumn && (
          <span className="text-[10px] text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-full">
            click to filter
          </span>
        )}
      </h4>
      <ResponsiveContainer width="100%" height={260}>
        {chart.type === "bar" ? (
          <BarChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey={chart.nameKey} tick={axisStyle} axisLine={false} />
            <YAxis tick={axisStyle} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Bar
              dataKey={chart.dataKey}
              radius={[4, 4, 0, 0]}
              cursor="pointer"
              onClick={(data: Record<string, unknown>) => handleClick(data)}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  opacity={entry._highlighted ? 1 : 0.25}
                />
              ))}
            </Bar>
          </BarChart>
        ) : chart.type === "line" ? (
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey={chart.nameKey} tick={axisStyle} axisLine={false} />
            <YAxis tick={axisStyle} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Line
              type="monotone"
              dataKey={chart.dataKey}
              stroke={COLORS[0]}
              strokeWidth={2}
              dot={{ r: 3, fill: COLORS[0] }}
              activeDot={{ r: 6, fill: COLORS[1] }}
            />
          </LineChart>
        ) : chart.type === "area" ? (
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id={`gradient-${index}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor={COLORS[0]} stopOpacity={0.4} />
                <stop offset="95%" stopColor={COLORS[0]} stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis dataKey={chart.nameKey} tick={axisStyle} axisLine={false} />
            <YAxis tick={axisStyle} axisLine={false} />
            <Tooltip contentStyle={tooltipStyle} />
            <Area
              type="monotone"
              dataKey={chart.dataKey}
              stroke={COLORS[0]}
              fill={`url(#gradient-${index})`}
              strokeWidth={2}
            />
          </AreaChart>
        ) : chart.type === "scatter" ? (
          <ScatterChart>
            <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 14% 18%)" />
            <XAxis type="number" dataKey="x" tick={axisStyle} axisLine={false} name="X" />
            <YAxis type="number" dataKey="y" tick={axisStyle} axisLine={false} name="Y" />
            <Tooltip contentStyle={tooltipStyle} cursor={{ strokeDasharray: "3 3" }} />
            <Scatter data={chartData} fill={COLORS[1]}>
              {chartData.map((_, i) => (
                <Cell key={i} fill={COLORS[i % COLORS.length]} opacity={0.8} />
              ))}
            </Scatter>
          </ScatterChart>
        ) : chart.type === "radar" ? (
          <RadarChart data={chartData} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="hsl(220 14% 20%)" />
            <PolarAngleAxis dataKey={chart.nameKey} tick={axisStyle} />
            <PolarRadiusAxis tick={axisStyle} />
            <Radar
              dataKey={chart.dataKey}
              stroke={COLORS[0]}
              fill={COLORS[0]}
              fillOpacity={0.3}
            />
          </RadarChart>
        ) : chart.type === "treemap" ? (
          <Treemap
            data={chartData}
            dataKey={chart.dataKey}
            aspectRatio={4 / 3}
            stroke="hsl(220 18% 10%)"
            content={<CustomTreemapContent x={0} y={0} width={0} height={0} name="" index={0} value={0} isHighlighted={!activeFilter} /> as any}
            onClick={(data: any) => handleClick(data)}
          />
        ) : (
          <PieChart>
            <Pie
              data={chartData}
              dataKey={chart.dataKey}
              nameKey={chart.nameKey}
              cx="50%"
              cy="50%"
              outerRadius={90}
              innerRadius={50}
              paddingAngle={3}
              cursor="pointer"
              onClick={(data: Record<string, unknown>) => handleClick(data)}
              label={({ name, percent }: { name: string; percent: number }) =>
                `${name} ${(percent * 100).toFixed(0)}%`
              }
              labelLine={false}
            >
              {chartData.map((entry, i) => (
                <Cell
                  key={i}
                  fill={COLORS[i % COLORS.length]}
                  opacity={entry._highlighted ? 1 : 0.25}
                />
              ))}
            </Pie>
            <Tooltip contentStyle={tooltipStyle} />
            <Legend wrapperStyle={{ fontSize: "12px", color: "hsl(215 12% 50%)" }} />
          </PieChart>
        )}
      </ResponsiveContainer>
    </motion.div>
  );
};

const DashboardCharts = ({ charts }: DashboardChartsProps) => {
  const [activeFilter, setActiveFilter] = useState<string | null>(null);
  const [filterColumn, setFilterColumn] = useState<string | null>(null);

  const handleFilter = useCallback((value: string | null, column?: string) => {
    setActiveFilter(value);
    setFilterColumn(column ?? null);
  }, []);

  if (charts.length === 0) return null;

  return (
    <div className="space-y-4">
      {activeFilter && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-2"
        >
          <Filter className="w-3.5 h-3.5 text-primary" />
          <span className="text-xs text-muted-foreground">Filtered by:</span>
          <Badge variant="secondary" className="gap-1 text-xs">
            {filterColumn && <span className="text-muted-foreground">{filterColumn}:</span>}
            {activeFilter}
            <button onClick={() => handleFilter(null)} className="ml-1 hover:text-destructive">
              <X className="w-3 h-3" />
            </button>
          </Badge>
        </motion.div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {charts.map((chart, i) => (
          <ChartCard
            key={i}
            chart={chart}
            index={i}
            activeFilter={activeFilter}
            onFilter={handleFilter}
          />
        ))}
      </div>
    </div>
  );
};

export default DashboardCharts;
