import { useState, useCallback, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart3, Sparkles, Table, LayoutDashboard } from "lucide-react";
import FileUpload from "@/components/FileUpload";
import DataTableView from "@/components/DataTableView";
import DashboardCharts from "@/components/DashboardCharts";
import AIInsights from "@/components/AIInsights";
import StatsCards from "@/components/StatsCards";
import VoiceNarrator from "@/components/VoiceNarrator";
import { analyzeData, generateChartData, generateVoiceNarration, DataSummary } from "@/utils/dataAnalysis";

type TabId = "dashboard" | "table" | "insights";

const Index = () => {
  const [rawData, setRawData] = useState<Record<string, unknown>[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [displayData, setDisplayData] = useState<Record<string, unknown>[]>([]);
  const [activeTab, setActiveTab] = useState<TabId>("dashboard");

  const summary: DataSummary | null = useMemo(
    () => (rawData.length > 0 ? analyzeData(rawData, headers) : null),
    [rawData, headers]
  );

  const charts = useMemo(
    () => (summary ? generateChartData(summary, displayData) : []),
    [summary, displayData]
  );

  const narrationText = useMemo(
    () => (summary ? generateVoiceNarration(summary) : ""),
    [summary]
  );

  const handleDataLoaded = useCallback(
    (data: Record<string, unknown>[], h: string[]) => {
      setRawData(data);
      setHeaders(h);
      setDisplayData(data);
    },
    []
  );

  const handleSort = useCallback(
    (sorted: Record<string, unknown>[]) => {
      setDisplayData(sorted);
    },
    []
  );

  const tabs: { id: TabId; label: string; icon: React.ReactNode }[] = [
    { id: "dashboard", label: "Dashboard", icon: <LayoutDashboard className="w-4 h-4" /> },
    { id: "table", label: "Data Table", icon: <Table className="w-4 h-4" /> },
    { id: "insights", label: "AI Insights", icon: <Sparkles className="w-4 h-4" /> },
  ];

  const hasData = rawData.length > 0;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-primary/10 flex items-center justify-center">
              <BarChart3 className="w-5 h-5 text-primary" />
            </div>
            <div>
              <h1 className="text-lg font-bold text-foreground">DataLens</h1>
              <p className="text-xs text-muted-foreground">AI-Powered Analytics</p>
            </div>
          </div>

          {hasData && (
            <nav className="flex gap-1 bg-muted/50 rounded-lg p-1">
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-md text-sm font-medium transition-all
                    ${activeTab === tab.id
                      ? "bg-primary text-primary-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                    }`}
                >
                  {tab.icon}
                  <span className="hidden sm:inline">{tab.label}</span>
                </button>
              ))}
            </nav>
          )}
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-6 py-8">
        <AnimatePresence mode="wait">
          {!hasData ? (
            <motion.div
              key="upload"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0, y: -20 }}
              className="flex flex-col items-center justify-center min-h-[70vh] gap-8"
            >
              <div className="text-center">
                <h2 className="text-4xl font-bold text-foreground mb-3">
                  Analyze your data with{" "}
                  <span className="text-gradient">AI</span>
                </h2>
                <p className="text-muted-foreground text-lg max-w-md mx-auto">
                  Upload a CSV file to automatically generate dashboards, discover insights, and get AI-powered recommendations.
                </p>
              </div>
              <FileUpload onDataLoaded={handleDataLoaded} />
              <div className="flex gap-6 text-sm text-muted-foreground">
                <span className="flex items-center gap-1.5">
                  <LayoutDashboard className="w-4 h-4 text-primary/60" />
                  Auto Dashboard
                </span>
                <span className="flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-primary/60" />
                  AI Insights
                </span>
                <span className="flex items-center gap-1.5">
                  <Table className="w-4 h-4 text-primary/60" />
                  Sort & Search
                </span>
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="content"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              {summary && <StatsCards summary={summary} />}

              {narrationText && <VoiceNarrator text={narrationText} />}

              {activeTab === "dashboard" && <DashboardCharts charts={charts} />}

              {activeTab === "table" && (
                <DataTableView data={displayData} headers={headers} onSort={handleSort} />
              )}

              {activeTab === "insights" && summary && <AIInsights summary={summary} />}
            </motion.div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
};

export default Index;
