export interface ColumnStats {
  name: string;
  type: "numeric" | "categorical" | "date";
  min?: number;
  max?: number;
  mean?: number;
  median?: number;
  stdDev?: number;
  uniqueValues?: string[];
  valueCounts?: Record<string, number>;
  nullCount: number;
  total: number;
}

export interface DataSummary {
  rowCount: number;
  columnCount: number;
  columns: ColumnStats[];
  sortedBy?: { column: string; direction: "asc" | "desc" };
}

export interface ChartConfig {
  type: "bar" | "line" | "pie" | "area" | "scatter" | "radar" | "treemap";
  title: string;
  data: Record<string, unknown>[];
  dataKey: string;
  nameKey: string;
  secondaryKey?: string;
  filterColumn?: string;
}

export function analyzeData(data: Record<string, unknown>[], headers: string[]): DataSummary {
  const columns: ColumnStats[] = headers.map((header) => {
    const values = data.map((row) => row[header]);
    const nonNull = values.filter((v) => v !== null && v !== undefined && v !== "");
    const nullCount = values.length - nonNull.length;

    const numericValues = nonNull
      .map((v) => parseFloat(String(v)))
      .filter((n) => !isNaN(n));

    if (numericValues.length > nonNull.length * 0.7) {
      const sorted = [...numericValues].sort((a, b) => a - b);
      const mean = numericValues.reduce((a, b) => a + b, 0) / numericValues.length;
      const variance = numericValues.reduce((sum, v) => sum + (v - mean) ** 2, 0) / numericValues.length;
      return {
        name: header,
        type: "numeric",
        min: sorted[0],
        max: sorted[sorted.length - 1],
        mean,
        median: sorted[Math.floor(sorted.length / 2)],
        stdDev: Math.sqrt(variance),
        nullCount,
        total: values.length,
      };
    }

    const counts: Record<string, number> = {};
    nonNull.forEach((v) => {
      const key = String(v);
      counts[key] = (counts[key] || 0) + 1;
    });

    return {
      name: header,
      type: "categorical",
      uniqueValues: Object.keys(counts).slice(0, 20),
      valueCounts: counts,
      nullCount,
      total: values.length,
    };
  });

  return { rowCount: data.length, columnCount: headers.length, columns };
}

export function sortData(
  data: Record<string, unknown>[],
  column: string,
  direction: "asc" | "desc"
): Record<string, unknown>[] {
  return [...data].sort((a, b) => {
    const aVal = a[column];
    const bVal = b[column];
    const aNum = parseFloat(String(aVal));
    const bNum = parseFloat(String(bVal));

    if (!isNaN(aNum) && !isNaN(bNum)) {
      return direction === "asc" ? aNum - bNum : bNum - aNum;
    }

    const aStr = String(aVal ?? "");
    const bStr = String(bVal ?? "");
    return direction === "asc" ? aStr.localeCompare(bStr) : bStr.localeCompare(aStr);
  });
}

export function generateChartData(summary: DataSummary, data: Record<string, unknown>[]): ChartConfig[] {
  const charts: ChartConfig[] = [];
  const numericCols = summary.columns.filter((c) => c.type === "numeric");
  const categoricalCols = summary.columns.filter((c) => c.type === "categorical");

  // 1. Bar chart for top categorical
  if (categoricalCols.length > 0) {
    const cat = categoricalCols[0];
    if (cat.valueCounts) {
      const entries = Object.entries(cat.valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10);
      charts.push({
        type: "bar",
        title: `${cat.name} Distribution`,
        data: entries.map(([name, value]) => ({ name, value })),
        dataKey: "value",
        nameKey: "name",
        filterColumn: cat.name,
      });
    }
  }

  // 2. Pie chart for second categorical
  if (categoricalCols.length > 1) {
    const cat = categoricalCols[1];
    if (cat.valueCounts) {
      const entries = Object.entries(cat.valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 8);
      charts.push({
        type: "pie",
        title: `${cat.name} Breakdown`,
        data: entries.map(([name, value]) => ({ name, value })),
        dataKey: "value",
        nameKey: "name",
        filterColumn: cat.name,
      });
    }
  }

  // 3. Area chart for first numeric column trend
  if (numericCols.length > 0) {
    const numCol = numericCols[0];
    const sliced = data.slice(0, 60);
    charts.push({
      type: "area",
      title: `${numCol.name} Trend`,
      data: sliced.map((row, i) => ({
        name: String(i + 1),
        value: parseFloat(String(row[numCol.name] ?? 0)) || 0,
      })),
      dataKey: "value",
      nameKey: "name",
    });
  }

  // 4. Scatter plot for two numeric columns
  if (numericCols.length >= 2) {
    const col1 = numericCols[0];
    const col2 = numericCols[1];
    const sliced = data.slice(0, 100);
    charts.push({
      type: "scatter",
      title: `${col1.name} vs ${col2.name}`,
      data: sliced.map((row) => ({
        x: parseFloat(String(row[col1.name] ?? 0)) || 0,
        y: parseFloat(String(row[col2.name] ?? 0)) || 0,
      })),
      dataKey: "y",
      nameKey: "x",
      secondaryKey: col2.name,
    });
  }

  // 5. Radar chart for numeric stats comparison
  if (numericCols.length >= 3) {
    const maxValues = numericCols.slice(0, 6).map((c) => c.max ?? 1);
    const globalMax = Math.max(...maxValues, 1);
    charts.push({
      type: "radar",
      title: "Numeric Stats Radar",
      data: numericCols.slice(0, 6).map((col) => ({
        name: col.name.length > 10 ? col.name.slice(0, 10) + "…" : col.name,
        value: Math.round(((col.mean ?? 0) / globalMax) * 100),
        fullMark: 100,
      })),
      dataKey: "value",
      nameKey: "name",
    });
  }

  // 6. Treemap for categorical distribution
  if (categoricalCols.length > 0) {
    const cat = categoricalCols[0];
    if (cat.valueCounts) {
      const entries = Object.entries(cat.valueCounts)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 12);
      charts.push({
        type: "treemap",
        title: `${cat.name} Treemap`,
        data: entries.map(([name, value]) => ({ name, value })),
        dataKey: "value",
        nameKey: "name",
        filterColumn: cat.name,
      });
    }
  }

  // 7. Line chart for second numeric or averages
  if (numericCols.length > 1) {
    charts.push({
      type: "line",
      title: "Numeric Averages",
      data: numericCols.slice(0, 8).map((col) => ({
        name: col.name.length > 12 ? col.name.slice(0, 12) + "…" : col.name,
        value: Math.round((col.mean ?? 0) * 100) / 100,
      })),
      dataKey: "value",
      nameKey: "name",
    });
  }

  return charts;
}

export function generateAIPrompt(summary: DataSummary): string {
  const numericCols = summary.columns.filter((c) => c.type === "numeric");
  const categoricalCols = summary.columns.filter((c) => c.type === "categorical");

  let prompt = `Dataset has ${summary.rowCount} rows and ${summary.columnCount} columns.\n\n`;

  if (numericCols.length > 0) {
    prompt += "**Numeric columns:**\n";
    numericCols.forEach((c) => {
      prompt += `- ${c.name}: min=${c.min?.toFixed(2)}, max=${c.max?.toFixed(2)}, mean=${c.mean?.toFixed(2)}, median=${c.median?.toFixed(2)}\n`;
    });
  }

  if (categoricalCols.length > 0) {
    prompt += "\n**Categorical columns:**\n";
    categoricalCols.forEach((c) => {
      const topValues = c.valueCounts
        ? Object.entries(c.valueCounts)
            .sort((a, b) => b[1] - a[1])
            .slice(0, 5)
            .map(([k, v]) => `${k}(${v})`)
            .join(", ")
        : "";
      prompt += `- ${c.name}: ${c.uniqueValues?.length ?? 0} unique values. Top: ${topValues}\n`;
    });
  }

  const nullCols = summary.columns.filter((c) => c.nullCount > 0);
  if (nullCols.length > 0) {
    prompt += "\n**Missing data:**\n";
    nullCols.forEach((c) => {
      prompt += `- ${c.name}: ${c.nullCount} missing (${((c.nullCount / c.total) * 100).toFixed(1)}%)\n`;
    });
  }

  return prompt;
}

export function generateVoiceNarration(summary: DataSummary): string {
  const numericCols = summary.columns.filter((c) => c.type === "numeric");
  const categoricalCols = summary.columns.filter((c) => c.type === "categorical");
  const nullCols = summary.columns.filter((c) => c.nullCount > 0);

  let narration = `Let me walk you through your data. `;
  narration += `Your dataset contains ${summary.rowCount} rows and ${summary.columnCount} columns. `;
  narration += `There are ${numericCols.length} numeric and ${categoricalCols.length} categorical columns. `;

  if (numericCols.length > 0) {
    const col = numericCols[0];
    narration += `Looking at the "${col.name}" column, values range from ${col.min?.toFixed(1)} to ${col.max?.toFixed(1)}, with an average of ${col.mean?.toFixed(1)}. `;
    if (col.stdDev && col.mean) {
      const cv = (col.stdDev / col.mean) * 100;
      if (cv > 50) {
        narration += `This column shows high variability, which could indicate outliers or diverse subgroups. `;
      } else if (cv < 15) {
        narration += `Values are tightly clustered around the average, showing good consistency. `;
      }
    }
  }

  if (categoricalCols.length > 0) {
    const cat = categoricalCols[0];
    if (cat.valueCounts) {
      const entries = Object.entries(cat.valueCounts).sort((a, b) => b[1] - a[1]);
      narration += `For the "${cat.name}" category, "${entries[0][0]}" is dominant with ${entries[0][1]} occurrences. `;
      if (entries.length > 3) {
        narration += `There are ${entries.length} unique values total. `;
      }
    }
  }

  if (nullCols.length > 0) {
    narration += `I noticed some data quality issues. ${nullCols.length} columns have missing values. `;
    const worst = nullCols.reduce((a, b) => (a.nullCount > b.nullCount ? a : b));
    narration += `The "${worst.name}" column has the most gaps with ${worst.nullCount} missing entries. I'd recommend filling these with median values for numeric columns or mode values for categories. `;
  } else {
    narration += `Great news, your data has no missing values, which makes analysis more reliable. `;
  }

  if (numericCols.length >= 2) {
    narration += `Since you have multiple numeric columns, I recommend looking at the scatter plot to discover correlations between "${numericCols[0].name}" and "${numericCols[1].name}". Clicking on any chart element will highlight related data across all visualizations. `;
  }

  narration += `You can click on any bar, pie slice, or data point and all connected charts will update to show you the same data from different angles. Try it out!`;

  return narration;
}
