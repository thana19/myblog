import MDEditor, { commands } from "@uiw/react-md-editor";
import type { TextAreaTextApi } from "@uiw/react-md-editor";
import "@uiw/react-md-editor/markdown-editor.css";
import { useRef, useState } from "react";

interface RichEditorProps {
  content: string;
  onChange: (value: string) => void;
}

export default function RichEditor({ content, onChange }: RichEditorProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const editorApiRef = useRef<TextAreaTextApi | null>(null);
  const [uploading, setUploading] = useState(false);

  const uploadImageCommand: commands.ICommand = {
    name: "upload-image",
    keyCommand: "upload-image",
    buttonProps: { "aria-label": "Upload image", title: "Upload image to R2" },
    icon: (
      <span className="material-symbols-outlined" style={{ fontSize: 14, lineHeight: 1 }}>
        add_photo_alternate
      </span>
    ),
    execute: (_state, api) => {
      editorApiRef.current = api;
      fileInputRef.current?.click();
    },
  };

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/upload-image", { method: "POST", body: formData });
      const json = await res.json() as { url?: string; error?: string };
      if (json.url && editorApiRef.current) {
        editorApiRef.current.replaceSelection(`![](${json.url})`);
      }
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  }

  return (
    <div data-color-mode="dark" className="relative">
      {uploading && (
        <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 rounded-lg">
          <div className="flex items-center gap-2 bg-surface-container px-4 py-2 rounded-lg text-sm text-on-surface">
            <span className="material-symbols-outlined text-base animate-spin" style={{ animationDuration: "1s" }}>
              progress_activity
            </span>
            Uploading...
          </div>
        </div>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
        className="hidden"
        onChange={handleFileChange}
      />
      <MDEditor
        value={content}
        onChange={(val) => onChange(val ?? "")}
        height={500}
        preview="live"
        hideToolbar={false}
        visibleDragbar={false}
        commands={[
          commands.bold,
          commands.italic,
          commands.strikethrough,
          commands.hr,
          commands.title,
          commands.divider,
          commands.link,
          commands.quote,
          commands.code,
          commands.codeBlock,
          uploadImageCommand,
          commands.divider,
          commands.unorderedListCommand,
          commands.orderedListCommand,
          commands.checkedListCommand,
        ]}
        style={{
          backgroundColor: "var(--color-surface-container-lowest)",
          borderRadius: "0.5rem",
          border: "1px solid var(--color-outline-variant)",
        }}
      />
    </div>
  );
}
