"use client";

import React, { useRef, useState } from "react";
import { Camera, Download, FileText, UploadCloud } from "lucide-react";

export interface StagedFile {
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  data_url_or_path: string;
  caption?: string;
}

export const MAX_FILE_BYTES = 5 * 1024 * 1024;

export function readFiles(list: FileList | File[]): Promise<{ files: StagedFile[]; errors: string[] }> {
  const arr = Array.from(list);
  const errors: string[] = [];
  return Promise.all(
    arr.map(
      (f) =>
        new Promise<StagedFile | null>((resolve) => {
          if (!(f.type.startsWith("image/") || f.type === "application/pdf")) {
            errors.push(`${f.name}: only images and PDFs are allowed`);
            return resolve(null);
          }
          if (f.size > MAX_FILE_BYTES) {
            errors.push(`${f.name}: exceeds 5 MB`);
            return resolve(null);
          }
          const r = new FileReader();
          r.onload = () => resolve({ file_name: f.name, mime_type: f.type, file_size_bytes: f.size, data_url_or_path: String(r.result) });
          r.onerror = () => resolve(null);
          r.readAsDataURL(f);
        })
    )
  ).then((res) => ({ files: res.filter(Boolean) as StagedFile[], errors }));
}

/** Multi-file drag-and-drop / camera picker. Calls onFiles with parsed files. */
export function FileDrop({ onFiles, label = "Drag & drop photos or PDFs, or click to browse" }: { onFiles: (f: StagedFile[]) => void | Promise<void>; label?: string }) {
  const input = useRef<HTMLInputElement>(null);
  const cam = useRef<HTMLInputElement>(null);
  const [over, setOver] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const handle = async (list: FileList | null) => {
    if (!list || list.length === 0) return;
    const { files, errors } = await readFiles(list);
    setErr(errors.length ? errors.join("; ") : null);
    if (files.length) await onFiles(files);
  };

  return (
    <div>
      <div
        data-testid="file-drop"
        onDragOver={(e) => { e.preventDefault(); setOver(true); }}
        onDragLeave={() => setOver(false)}
        onDrop={(e) => { e.preventDefault(); setOver(false); handle(e.dataTransfer.files); }}
        className={`rounded-xl border-2 border-dashed p-4 text-center text-xs transition-colors ${over ? "border-agios-blue bg-blue-50" : "border-slate-300 bg-slate-50"}`}
      >
        <UploadCloud className="w-6 h-6 mx-auto text-slate-400 mb-1" />
        <div className="text-slate-600">{label}</div>
        <div className="flex justify-center gap-2 mt-3">
          <button type="button" onClick={() => input.current?.click()} className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold">
            Choose files
          </button>
          <button type="button" onClick={() => cam.current?.click()} className="px-3 py-1.5 rounded-md bg-white border border-slate-300 text-slate-700 font-semibold flex items-center gap-1">
            <Camera className="w-3.5 h-3.5" /> Take photo
          </button>
        </div>
        <input ref={input} type="file" multiple accept="image/*,application/pdf" hidden onChange={(e) => { handle(e.target.files); e.target.value = ""; }} />
        <input ref={cam} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { handle(e.target.files); e.target.value = ""; }} />
      </div>
      {err && <div className="mt-1.5 text-[11px] text-rose-600">{err}</div>}
    </div>
  );
}

export interface AttachmentRow {
  id: string;
  uploaded_by_role: "contractor" | "client";
  uploader_name?: string | null;
  file_name: string;
  mime_type: string;
  file_size_bytes: number;
  data_url_or_path: string;
  caption?: string | null;
  created_at?: string;
}

export function AttachmentList({ items, emptyText = "No attachments yet." }: { items: AttachmentRow[]; emptyText?: string }) {
  if (!items || items.length === 0) return <div className="text-xs text-slate-400">{emptyText}</div>;
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {items.map((a) => (
        <div key={a.id} className="rounded-lg border border-slate-200 bg-white overflow-hidden text-[11px]">
          <div className="h-24 bg-slate-100 flex items-center justify-center">
            {a.mime_type.startsWith("image/") ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={a.data_url_or_path} alt={a.file_name} className="w-full h-full object-cover" />
            ) : (
              <FileText className="w-8 h-8 text-slate-400" />
            )}
          </div>
          <div className="p-2 space-y-0.5">
            <div className="font-semibold text-slate-800 truncate" title={a.file_name}>{a.file_name}</div>
            <div className="text-slate-500">
              <span className={`px-1.5 py-0.5 rounded font-mono ${a.uploaded_by_role === "client" ? "bg-amber-100 text-amber-800" : "bg-blue-100 text-blue-800"}`}>
                {a.uploaded_by_role}
              </span>{" "}
              {(a.file_size_bytes / 1024).toFixed(1)} KB
            </div>
            {a.caption && <div className="text-slate-600 italic truncate">“{a.caption}”</div>}
            <a href={a.data_url_or_path} download={a.file_name} className="inline-flex items-center gap-1 text-agios-blue font-semibold hover:underline">
              <Download className="w-3 h-3" /> Download
            </a>
          </div>
        </div>
      ))}
    </div>
  );
}

/** Upload then POST to `endpoint` (contractor or public). */
export function AttachmentUploader({ endpoint, onUploaded, withCaption = false }: { endpoint: string; onUploaded: () => void; withCaption?: boolean }) {
  const [caption, setCaption] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  return (
    <div className="space-y-2">
      {withCaption && (
        <input
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Optional caption (e.g. ‘Existing unit’)"
          className="w-full px-3 py-2 rounded-lg border border-slate-300 text-xs"
        />
      )}
      <FileDrop
        onFiles={async (files) => {
          setBusy(true);
          setErr(null);
          try {
            const res = await fetch(endpoint, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ files: files.map((f) => ({ ...f, caption: caption || null })) }),
            });
            const d = await res.json();
            if (!d.success) setErr(d.error || "Upload failed");
            else { setCaption(""); onUploaded(); }
          } finally {
            setBusy(false);
          }
        }}
      />
      {busy && <div className="text-[11px] text-slate-500">Uploading…</div>}
      {err && <div className="text-[11px] text-rose-600">{err}</div>}
    </div>
  );
}
