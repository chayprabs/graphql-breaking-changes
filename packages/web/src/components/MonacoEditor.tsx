import Editor from "@monaco-editor/react";
import { Loader2 } from "lucide-react";

interface MonacoEditorProps {
  value: string;
  onChange: (value: string) => void;
  height?: string;
  language?: string;
}

export function MonacoEditor({
  value,
  onChange,
  height = "280px",
  language = "graphql",
}: MonacoEditorProps) {
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 shadow-sm">
      <Editor
        height={height}
        language={language}
        value={value}
        onChange={(v) => onChange(v ?? "")}
        theme="vs"
        loading={
          <div className="flex h-[200px] items-center justify-center bg-white text-sm text-gray-500">
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            Loading editor…
          </div>
        }
        options={{
          minimap: { enabled: false },
          fontSize: 12,
          lineNumbers: "on",
          scrollBeyondLastLine: false,
          wordWrap: "on",
          automaticLayout: true,
          tabSize: 2,
        }}
      />
    </div>
  );
}
