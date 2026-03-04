import { useCallback, useState } from "react";
import { Upload, FileSpreadsheet, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Papa from "papaparse";

interface FileUploadProps {
  onDataLoaded: (data: Record<string, unknown>[], headers: string[]) => void;
}

const FileUpload = ({ onDataLoaded }: FileUploadProps) => {
  const [isDragging, setIsDragging] = useState(false);
  const [fileName, setFileName] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const processFile = useCallback(
    (file: File) => {
      setError(null);
      if (!file.name.endsWith(".csv") && !file.name.endsWith(".tsv")) {
        setError("Please upload a CSV or TSV file");
        return;
      }
      setFileName(file.name);
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        dynamicTyping: true,
        complete: (results) => {
          if (results.errors.length > 0) {
            console.warn("Parse warnings:", results.errors.slice(0, 3));
          }
          const headers = results.meta.fields ?? [];
          onDataLoaded(results.data as Record<string, unknown>[], headers);
        },
        error: () => {
          setError("Failed to parse file");
          setFileName(null);
        },
      });
    },
    [onDataLoaded]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) processFile(file);
    },
    [processFile]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div
        onDragOver={(e) => {
          e.preventDefault();
          setIsDragging(true);
        }}
        onDragLeave={() => setIsDragging(false)}
        onDrop={handleDrop}
        className={`relative rounded-xl border-2 border-dashed p-12 text-center transition-all duration-300 cursor-pointer
          ${isDragging ? "border-primary bg-primary/5 glow-border" : "border-border hover:border-primary/40 hover:bg-card/50"}
        `}
      >
        <input
          type="file"
          accept=".csv,.tsv"
          onChange={handleChange}
          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
        />
        <AnimatePresence mode="wait">
          {fileName ? (
            <motion.div
              key="loaded"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-3"
            >
              <FileSpreadsheet className="w-12 h-12 text-primary" />
              <p className="text-foreground font-medium">{fileName}</p>
              <p className="text-sm text-muted-foreground">File loaded successfully</p>
            </motion.div>
          ) : (
            <motion.div
              key="empty"
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="flex flex-col items-center gap-4"
            >
              <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Upload className="w-8 h-8 text-primary" />
              </div>
              <div>
                <p className="text-foreground font-semibold text-lg">
                  Drop your dataset here
                </p>
                <p className="text-sm text-muted-foreground mt-1">
                  Supports CSV and TSV files
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="mt-3 flex items-center gap-2 text-destructive text-sm bg-destructive/10 rounded-lg px-4 py-2"
          >
            <X className="w-4 h-4" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};

export default FileUpload;
