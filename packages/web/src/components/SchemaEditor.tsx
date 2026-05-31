import { lazy, Suspense, useCallback, useState } from "react";
import { Upload, FileCode } from "lucide-react";

const MonacoEditor = lazy(() =>
  import("./MonacoEditor").then((m) => ({ default: m.MonacoEditor })),
);

interface SchemaEditorProps {
  label: string;
  value: string;
  onChange: (v: string) => void;
  height?: string;
  accept?: string;
  onFilesDrop?: (files: FileList) => void;
}

export function SchemaEditor({
  label,
  value,
  onChange,
  height = "280px",
  accept = ".graphql,.gql,.json,.txt",
  onFilesDrop,
}: SchemaEditorProps) {
  const [dragOver, setDragOver] = useState(false);

  const readFile = useCallback(
    (file: File, onError?: (msg: string) => void) => {
      const reader = new FileReader();
      reader.onload = () => onChange(String(reader.result ?? ""));
      reader.onerror = () => onError?.(`Failed to read file: ${file.name}`);
      reader.readAsText(file);
    },
    [onChange],
  );

  const onFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files?.length) return;
    if (onFilesDrop) {
      onFilesDrop(files);
      return;
    }
    readFile(files[0]);
  };

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const files = e.dataTransfer.files;
    if (!files.length) return;
    if (onFilesDrop) {
      onFilesDrop(files);
      return;
    }
    readFile(files[0]);
  };

  return (
    <div
      className={`flex flex-col gap-1 ${dragOver ? "ring-2 ring-blue-400 ring-offset-2 rounded-xl" : ""}`}
      onDragOver={(e) => {
        e.preventDefault();
        setDragOver(true);
      }}
      onDragLeave={() => setDragOver(false)}
      onDrop={onDrop}
    >
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-gray-700">{label}</label>
        <label className="inline-flex cursor-pointer items-center gap-1 text-xs text-gray-500 hover:text-gray-800">
          <Upload className="h-3.5 w-3.5" />
          Upload
          <input type="file" accept={accept} className="hidden" onChange={onFileInput} multiple={!!onFilesDrop} />
        </label>
      </div>
      <Suspense
        fallback={
          <div
            className="flex items-center justify-center rounded-xl border border-gray-200 bg-white text-sm text-gray-500"
            style={{ height }}
          >
            <FileCode className="mr-2 h-4 w-4" />
            Loading editor…
          </div>
        }
      >
        <MonacoEditor value={value} onChange={onChange} height={height} />
      </Suspense>
    </div>
  );
}
