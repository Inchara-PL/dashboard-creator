import { useState } from "react";
import { Sparkles, Send, Loader2, TrendingUp, AlertTriangle, Lightbulb } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import ReactMarkdown from "react-markdown";
import { DataSummary, generateAIPrompt } from "@/utils/dataAnalysis";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

interface AIInsightsProps {
  summary: DataSummary;
}

interface Insight {
  icon: React.ReactNode;
  title: string;
  content: string;
}

function generateLocalInsights(summary: DataSummary): Insight[] {
  const insights: Insight[] = [];
  const numericCols = summary.columns.filter((c) => c.type === "numeric");
  const categoricalCols = summary.columns.filter((c) => c.type === "categorical");
  const nullCols = summary.columns.filter((c) => c.nullCount > 0);

  // Overview
  insights.push({
    icon: <TrendingUp className="w-4 h-4" />,
    title: "Dataset Overview",
    content: `Your dataset contains **${summary.rowCount.toLocaleString()} rows** and **${summary.columnCount} columns** (${numericCols.length} numeric, ${categoricalCols.length} categorical). ${
      numericCols.length > 0
        ? `The numeric column "${numericCols[0].name}" ranges from ${numericCols[0].min?.toLocaleString()} to ${numericCols[0].max?.toLocaleString()} with an average of ${numericCols[0].mean?.toFixed(2)}.`
        : ""
    }`,
  });

  // Data quality
  if (nullCols.length > 0) {
    const worstCol = nullCols.reduce((a, b) => (a.nullCount > b.nullCount ? a : b));
    insights.push({
      icon: <AlertTriangle className="w-4 h-4" />,
      title: "Data Quality Alert",
      content: `Found missing values in **${nullCols.length} column(s)**. The column "${worstCol.name}" has the most gaps with ${worstCol.nullCount} missing values (${((worstCol.nullCount / worstCol.total) * 100).toFixed(1)}%). Consider imputing or removing these rows for better analysis accuracy.`,
    });
  } else {
    insights.push({
      icon: <TrendingUp className="w-4 h-4" />,
      title: "Data Quality",
      content: "Great news! Your dataset has **no missing values**. This means your analysis results will be more reliable.",
    });
  }

  // Distribution insights
  if (categoricalCols.length > 0 && categoricalCols[0].valueCounts) {
    const cat = categoricalCols[0];
    const entries = Object.entries(cat.valueCounts!).sort((a, b) => b[1] - a[1]);
    const top = entries[0];
    const topPercent = ((top[1] / cat.total) * 100).toFixed(1);
    insights.push({
      icon: <Lightbulb className="w-4 h-4" />,
      title: "Key Pattern",
      content: `In the "${cat.name}" column, **"${top[0]}"** is the most common value appearing ${top[1]} times (${topPercent}%). ${
        entries.length > 5
          ? `There are ${entries.length} unique values, suggesting good diversity in this dimension.`
          : `With only ${entries.length} unique values, this is a low-cardinality feature suitable for grouping.`
      }`,
    });
  }

  // Recommendations
  if (numericCols.length >= 2) {
    insights.push({
      icon: <Lightbulb className="w-4 h-4" />,
      title: "Recommendation",
      content: `With ${numericCols.length} numeric columns available, consider running **correlation analysis** between "${numericCols[0].name}" and "${numericCols[1].name}" to discover relationships. You could also create scatter plots to visualize potential clusters in the data.`,
    });
  }

  return insights;
}

const AIInsights = ({ summary }: AIInsightsProps) => {
  const [question, setQuestion] = useState("");
  const [answer, setAnswer] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const insights = generateLocalInsights(summary);

  const handleAsk = () => {
    if (!question.trim()) return;
    setLoading(true);

    // Simulate AI response based on the question and data context
    setTimeout(() => {
      const ctx = generateAIPrompt(summary);
      const numericCols = summary.columns.filter((c) => c.type === "numeric");
      const q = question.toLowerCase();

      let response = "";
      if (q.includes("trend") || q.includes("pattern")) {
        response = numericCols.length > 0
          ? `Based on the data, the column "${numericCols[0].name}" shows values ranging from ${numericCols[0].min} to ${numericCols[0].max}. The average is ${numericCols[0].mean?.toFixed(2)} and the median is ${numericCols[0].median?.toFixed(2)}. ${
              Math.abs((numericCols[0].mean ?? 0) - (numericCols[0].median ?? 0)) > (numericCols[0].mean ?? 1) * 0.1
                ? "The difference between mean and median suggests a **skewed distribution** — there may be outliers pulling the average."
                : "The mean and median are close, indicating a **fairly symmetrical distribution**."
            }`
          : "No numeric trends detected. Try analyzing categorical distributions instead.";
      } else if (q.includes("problem") || q.includes("issue") || q.includes("solution")) {
        const nullCols = summary.columns.filter((c) => c.nullCount > 0);
        response = nullCols.length > 0
          ? `**Identified Issues:**\n\n1. **Missing Data**: ${nullCols.map((c) => `"${c.name}" (${c.nullCount} missing)`).join(", ")}.\n\n**Solutions:**\n- Fill numeric columns with the median value\n- Fill categorical columns with the mode\n- Remove rows with excessive missing values\n- Use interpolation for time-series data`
          : "No critical issues found in your dataset. The data appears clean and well-structured. To improve analysis:\n\n1. Consider normalizing numeric columns for fair comparison\n2. Look for outliers using the IQR method\n3. Check for duplicate rows";
      } else {
        response = `Here's what I can tell you about your dataset:\n\n${ctx}\n\n**Tip:** Ask about "trends", "problems", or "solutions" for more specific insights.`;
      }

      setAnswer(response);
      setLoading(false);
    }, 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="space-y-5"
    >
      {/* Insights Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {insights.map((insight, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-xl p-5"
          >
            <div className="flex items-center gap-2 mb-3">
              <div className="w-7 h-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                {insight.icon}
              </div>
              <h4 className="font-semibold text-sm text-foreground">{insight.title}</h4>
            </div>
            <div className="text-sm text-muted-foreground leading-relaxed prose prose-sm prose-invert max-w-none">
              <ReactMarkdown>{insight.content}</ReactMarkdown>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Ask AI */}
      <div className="glass-card rounded-xl p-5 glow-border">
        <div className="flex items-center gap-2 mb-4">
          <Sparkles className="w-5 h-5 text-primary" />
          <h4 className="font-semibold text-foreground">Ask AI About Your Data</h4>
        </div>
        <div className="flex gap-3">
          <Input
            placeholder="e.g. What are the main trends? Any problems to solve?"
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAsk()}
            className="bg-muted/50 border-border/50"
          />
          <Button onClick={handleAsk} disabled={loading || !question.trim()} className="shrink-0">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </Button>
        </div>
        <AnimatePresence>
          {answer && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="mt-4 p-4 rounded-lg bg-muted/30 border border-border/30"
            >
              <div className="text-sm text-foreground/90 leading-relaxed prose prose-sm prose-invert max-w-none">
                <ReactMarkdown>{answer}</ReactMarkdown>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.div>
  );
};

export default AIInsights;
