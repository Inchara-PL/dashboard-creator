import { useState, useMemo } from "react";
import { ArrowUpDown, ArrowUp, ArrowDown, Search } from "lucide-react";
import { motion } from "framer-motion";
import { sortData } from "@/utils/dataAnalysis";
import { Input } from "@/components/ui/input";

interface DataTableViewProps {
  data: Record<string, unknown>[];
  headers: string[];
  onSort: (data: Record<string, unknown>[], column: string, direction: "asc" | "desc") => void;
}

const DataTableView = ({ data, headers, onSort }: DataTableViewProps) => {
  const [sortCol, setSortCol] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<"asc" | "desc">("asc");
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(0);
  const perPage = 25;

  const filteredData = useMemo(() => {
    if (!search) return data;
    const lower = search.toLowerCase();
    return data.filter((row) =>
      headers.some((h) => String(row[h] ?? "").toLowerCase().includes(lower))
    );
  }, [data, search, headers]);

  const paginatedData = filteredData.slice(page * perPage, (page + 1) * perPage);
  const totalPages = Math.ceil(filteredData.length / perPage);

  const handleSort = (col: string) => {
    const newDir = sortCol === col && sortDir === "asc" ? "desc" : "asc";
    setSortCol(col);
    setSortDir(newDir);
    const sorted = sortData(data, col, newDir);
    onSort(sorted, col, newDir);
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="glass-card rounded-xl overflow-hidden"
    >
      <div className="flex items-center justify-between p-4 border-b border-border/50">
        <h3 className="font-semibold text-foreground">
          Data Table
          <span className="ml-2 text-sm text-muted-foreground font-normal">
            {filteredData.length.toLocaleString()} rows
          </span>
        </h3>
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search data..."
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(0);
            }}
            className="pl-9 bg-muted/50 border-border/50"
          />
        </div>
      </div>

      <div className="overflow-auto max-h-[500px] scrollbar-thin">
        <table className="w-full text-sm">
          <thead className="sticky top-0 bg-card z-10">
            <tr>
              {headers.map((header) => (
                <th
                  key={header}
                  onClick={() => handleSort(header)}
                  className="px-4 py-3 text-left font-medium text-muted-foreground cursor-pointer hover:text-foreground transition-colors whitespace-nowrap border-b border-border/50"
                >
                  <span className="flex items-center gap-1.5">
                    {header}
                    {sortCol === header ? (
                      sortDir === "asc" ? (
                        <ArrowUp className="w-3.5 h-3.5 text-primary" />
                      ) : (
                        <ArrowDown className="w-3.5 h-3.5 text-primary" />
                      )
                    ) : (
                      <ArrowUpDown className="w-3.5 h-3.5 opacity-30" />
                    )}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {paginatedData.map((row, i) => (
              <tr
                key={i}
                className="border-b border-border/30 hover:bg-muted/30 transition-colors"
              >
                {headers.map((header) => (
                  <td
                    key={header}
                    className="px-4 py-2.5 whitespace-nowrap text-foreground/80 max-w-[200px] truncate"
                  >
                    {String(row[header] ?? "—")}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-between px-4 py-3 border-t border-border/50 text-sm">
          <span className="text-muted-foreground">
            Page {page + 1} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-3 py-1.5 rounded-md bg-muted/50 text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
            >
              Previous
            </button>
            <button
              onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
              disabled={page >= totalPages - 1}
              className="px-3 py-1.5 rounded-md bg-muted/50 text-foreground disabled:opacity-30 hover:bg-muted transition-colors"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </motion.div>
  );
};

export default DataTableView;
