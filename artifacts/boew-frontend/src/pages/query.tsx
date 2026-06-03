import { useState, useRef } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Slider } from "@/components/ui/slider";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { UploadCloud, Image as ImageIcon, Search, Crosshair } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

export default function Query() {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [metric, setMetric] = useState<"cosine" | "euclidean">("cosine");
  const [topK, setTopK] = useState([10]);
  const [isSearching, setIsSearching] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [_, setLocation] = useLocation();

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const droppedFile = Array.from(e.dataTransfer.files).find(f => f.type.startsWith('image/'));
    if (droppedFile) processFile(droppedFile);
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      const selectedFile = e.target.files[0];
      if (selectedFile.type.startsWith('image/')) processFile(selectedFile);
    }
  };

  const processFile = (file: File) => {
    setFile(file);
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  const handleSearch = async () => {
    if (!file) return;
    
    setIsSearching(true);
    
    const formData = new FormData();
    formData.append('image', file);
    formData.append('metric', metric);
    formData.append('topK', topK[0].toString());

    try {
      const token = localStorage.getItem("boew_token");
      const res = await fetch("/api/retrieve", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`
        },
        body: formData
      });

      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error || "Retrieval failed");
      }

      const data = await res.json();
      
      // Store results in sessionStorage to pass to the results page securely
      sessionStorage.setItem("boew_last_result", JSON.stringify(data));
      
      toast({
        title: "QUERY_COMPLETE",
        description: `Found ${data.results.length} matches in ${data.retrievalTimeMs}ms`,
      });
      
      setLocation("/results");
    } catch (error: any) {
      toast({
        title: "QUERY_ERROR",
        description: error.message,
        variant: "destructive"
      });
      setIsSearching(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 mt-8">
      <div className="border-b border-border pb-4">
        <h1 className="text-2xl font-bold tracking-widest text-primary uppercase">EXECUTE_QUERY</h1>
        <p className="text-muted-foreground text-xs tracking-wider mt-1">CONTENT-BASED IMAGE RETRIEVAL ENGINE</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="rounded-none border-border bg-card shadow-xl relative overflow-hidden h-[400px]">
          <CardContent className="p-0 h-full">
            <div 
              onDragOver={handleDragOver}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`w-full h-full border-2 border-dashed transition-colors flex flex-col items-center justify-center relative cursor-pointer
                ${previewUrl ? 'border-primary/30' : 'border-border hover:border-primary/50 bg-muted/5'}`}
            >
              <input 
                type="file" 
                accept="image/*" 
                className="hidden" 
                ref={fileInputRef}
                onChange={handleFileSelect}
                disabled={isSearching}
              />
              
              {previewUrl ? (
                <>
                  <img src={previewUrl} alt="Query preview" className="absolute inset-0 w-full h-full object-contain p-2" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 hover:opacity-100 transition-opacity flex items-center justify-center">
                    <span className="text-sm tracking-widest font-bold text-white bg-black/60 px-4 py-2">CHANGE_TARGET</span>
                  </div>
                  {isSearching && (
                    <div className="absolute inset-0 bg-background/80 backdrop-blur-sm flex flex-col items-center justify-center border border-primary">
                      <Crosshair className="w-12 h-12 text-primary animate-spin-slow mb-4" />
                      <span className="text-primary font-bold tracking-widest uppercase animate-pulse">EXTRACTING_FEATURES...</span>
                    </div>
                  )}
                </>
              ) : (
                <div className="text-center p-6 flex flex-col items-center">
                  <UploadCloud className="w-12 h-12 text-muted-foreground mb-4" />
                  <div className="text-sm font-bold tracking-widest uppercase mb-1">SELECT_TARGET_IMAGE</div>
                  <div className="text-xs text-muted-foreground uppercase tracking-widest">DRAG & DROP SECURE PAYLOAD</div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="rounded-none border-border bg-card shadow-xl">
          <CardContent className="p-6 space-y-8 flex flex-col h-full">
            <div className="space-y-4">
              <h3 className="text-sm font-bold tracking-widest text-muted-foreground uppercase border-b border-border pb-2">QUERY_PARAMETERS</h3>
              
              <div className="space-y-3 pt-2">
                <Label className="text-xs uppercase tracking-widest text-primary flex justify-between">
                  <span>RESULT_LIMIT (TOP-K)</span>
                  <span className="text-foreground">{topK[0]}</span>
                </Label>
                <Slider 
                  value={topK} 
                  onValueChange={setTopK} 
                  max={50} 
                  min={1} 
                  step={1}
                  disabled={isSearching}
                  className="py-2"
                />
              </div>

              <div className="space-y-3 pt-4">
                <Label className="text-xs uppercase tracking-widest text-primary">DISTANCE_METRIC</Label>
                <Select value={metric} onValueChange={(val: any) => setMetric(val)} disabled={isSearching}>
                  <SelectTrigger className="w-full rounded-none bg-background border-border font-mono text-sm tracking-widest h-10">
                    <SelectValue placeholder="Select metric" />
                  </SelectTrigger>
                  <SelectContent className="rounded-none border-border bg-card font-mono text-xs tracking-widest">
                    <SelectItem value="cosine">COSINE_SIMILARITY</SelectItem>
                    <SelectItem value="euclidean">EUCLIDEAN_DISTANCE</SelectItem>
                  </SelectContent>
                </Select>
                <p className="text-[10px] text-muted-foreground tracking-widest leading-relaxed">
                  {metric === 'cosine' 
                    ? "OPTIMAL FOR HIGH-DIMENSIONAL FEATURE VECTORS. MEASURES ANGLE BETWEEN VECTORS." 
                    : "STANDARD SPATIAL DISTANCE. SENSITIVE TO VECTOR MAGNITUDE."}
                </p>
              </div>
            </div>

            <div className="mt-auto pt-8">
              <Button 
                className="w-full rounded-none tracking-widest uppercase font-bold h-12 flex gap-2"
                disabled={!file || isSearching}
                onClick={handleSearch}
              >
                <Search className="w-4 h-4" />
                {isSearching ? "ANALYZING..." : "EXECUTE_RETRIEVAL"}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
