import { Database, Columns, Hash, Tag } from "lucide-react";
import { motion } from "framer-motion";
import { DataSummary } from "@/utils/dataAnalysis";

interface StatsCardsProps {
  summary: DataSummary;
}

const StatsCards = ({ summary }: StatsCardsProps) => {
  const numericCols = summary.columns.filter((c) => c.type === "numeric").length;
  const categoricalCols = summary.columns.filter((c) => c.type === "categorical").length;
  const nullTotal = summary.columns.reduce((sum, c) => sum + c.nullCount, 0);

  const stats = [
    { label: "Total Rows", value: summary.rowCount.toLocaleString(), icon: Database, color: "text-primary" },
    { label: "Columns", value: summary.columnCount.toString(), icon: Columns, color: "text-chart-2" },
    { label: "Numeric Fields", value: numericCols.toString(), icon: Hash, color: "text-chart-3" },
    { label: "Categories", value: categoricalCols.toString(), icon: Tag, color: "text-chart-5" },
  ];

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
      {stats.map((stat, i) => (
        <motion.div
          key={stat.label}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: i * 0.05 }}
          className="glass-card rounded-xl p-5"
        >
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs text-muted-foreground uppercase tracking-wider font-medium">
              {stat.label}
            </span>
            <stat.icon className={`w-4 h-4 ${stat.color}`} />
          </div>
          <p className="text-2xl font-bold text-foreground">{stat.value}</p>
        </motion.div>
      ))}
    </div>
  );
};

export default StatsCards;
