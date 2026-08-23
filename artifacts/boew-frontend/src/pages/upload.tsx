import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { Card, CardContent } from "@/components/ui/card";
import { UploadCloud, FileImage, X, CheckCircle, ShieldCheck } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useQueryClient } from "@tanstack/react-query";
import { getListDatasetImagesQueryKey, getGetDatasetStatsQueryKey } from "@workspace/api-client-react";
import { resolveApiUrl } from "@/lib/api-config";

export default function Upload() {
  const [files, setFiles] = useState<File[]>([]);
  const [category, setCategory] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();
  const queryClient = useQueryClient();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFiles = Array.from(e.dataTransfer.files).filter((f) => f.type.startsWith("image/"));
    setFiles((prev) => [...prev, ...droppedFiles]);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const selectedFiles = Array.from(e.target.files).filter((f) => f.type.startsWith("image/"));
      setFiles((prev) => [...prev, ...selectedFiles]);
    }
  };

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index));
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setIsUploading(true);
    setProgress(15);

    const formData = new FormData();
    files.forEach((file) => {
      formData.append("images", file);
    });
    if (category.trim()) {
      formData.append("category", category.trim());
    }

    try {
      const token = localStorage.getItem("boew_token");
      setProgress(40);
      const url = resolveApiUrl("/api/dataset/upload");

      const headers: Record<string, string> = {};
      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const res = await fetch(url, {
        method: "POST",
        headers,
        body: formData,
      });

      setProgress(80);

      if (!res.ok) {
        let errMsg = `Server returned HTTP ${res.status}`;
        try {
          const err = await res.json();
          errMsg = err.error || err.message || errMsg;
        } catch {
          const text = await res.text();
          if (text) errMsg = text.slice(0, 150);
        }
        throw new Error(errMsg);
      }

      const data = await res.json();
      setProgress(100);

      toast({
        title: "Upload Successful",
        description: `Successfully ingested and indexed ${data.indexed ?? data.uploaded} of ${data.uploaded} image assets.`,
      });

      queryClient.invalidateQueries({ queryKey: getListDatasetImagesQueryKey() });
      queryClient.invalidateQueries({ queryKey: getGetDatasetStatsQueryKey() });

      setTimeout(() => setLocation("/dataset"), 900);
    } catch (error: any) {
      console.error("Upload error:", error);
      toast({
        title: "Upload Error",
        description: error.message || "Failed to upload image dataset. Ensure backend server is reachable.",
        variant: "destructive",
      });
      setProgress(0);
      setIsUploading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 mt-4 pb-12">
      <div className="border-b border-border/70 pb-4">
        <div className="flex items-center gap-2 text-primary font-bold text-lg tracking-tight">
          <UploadCloud className="w-5 h-5 text-primary" />
          <span>Dataset Ingestion Protocol</span>
        </div>
        <p className="text-muted-foreground text-xs mt-0.5">
          Batch upload images for encrypted visual feature extraction & index creation.
        </p>
      </div>

      <Card className="rounded-2xl border-border/80 bg-card/90 backdrop-blur-md shadow-xl relative overflow-hidden">
        {isUploading && (
          <div className="absolute inset-0 bg-background/85 z-50 flex flex-col items-center justify-center p-8 backdrop-blur-md">
            <div className="w-full max-w-md space-y-4">
              <div className="flex justify-between text-xs tracking-wider font-bold text-primary">
                <span>ENCRYPTING & INDEXING ASSETS...</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <Progress value={progress} className="h-2 rounded-full bg-muted" />
              <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground animate-pulse">
                <ShieldCheck className="w-4 h-4 text-emerald-400" />
                <span>AES-256 CBC Feature Encryption Active</span>
              </div>
            </div>
          </div>
        )}

        <CardContent className="p-6 space-y-6">
          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Dataset Category (Optional)
            </Label>
            <Input
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              placeholder="e.g. natural_scenery, architecture, vehicles..."
              className="rounded-xl bg-background/60 border-border focus-visible:ring-primary font-sans text-sm h-10"
              disabled={isUploading}
            />
          </div>

          <div className="space-y-2">
            <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Image Payload Files
            </Label>
            <div
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-border hover:border-primary/60 rounded-2xl transition-all duration-200 bg-muted/10 hover:bg-primary/5 cursor-pointer flex flex-col items-center justify-center p-10 group"
            >
              <input
                type="file"
                multiple
                accept="image/*"
                className="hidden"
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isUploading}
              />
              <div className="p-3.5 rounded-2xl bg-primary/10 text-primary group-hover:scale-110 transition-transform mb-3">
                <UploadCloud className="w-8 h-8" />
              </div>
              <div className="text-sm font-bold tracking-tight text-foreground mb-1">
                Click to browse or drop images here
              </div>
              <div className="text-xs text-muted-foreground">
                Supported formats: PNG, JPG, JPEG, WEBP, BMP (up to 100 images per batch)
              </div>
            </div>
          </div>

          {files.length > 0 && (
            <div className="space-y-3">
              <div className="flex justify-between items-center text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                <span>Staged Assets</span>
                <span className="text-primary font-mono font-bold">{files.length} FILES SELECTED</span>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2.5 max-h-64 overflow-y-auto pr-1">
                {files.map((file, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-2 bg-background/80 border border-border/80 rounded-xl p-2.5 group relative shadow-xs"
                  >
                    <FileImage className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-xs truncate flex-1 text-foreground" title={file.name}>
                      {file.name}
                    </span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                      className="opacity-60 group-hover:opacity-100 text-destructive hover:bg-destructive/10 p-1 rounded-md transition-all"
                      title="Remove image"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button
            className="w-full rounded-xl tracking-wider uppercase font-bold text-xs h-11 bg-primary text-primary-foreground shadow-md hover:opacity-90"
            disabled={files.length === 0 || isUploading}
            onClick={handleUpload}
          >
            Initiate Batch Upload & Indexing
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
