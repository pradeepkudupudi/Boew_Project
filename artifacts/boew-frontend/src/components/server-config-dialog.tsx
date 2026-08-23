import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Server, Wifi, RefreshCw, CheckCircle2, XCircle, Smartphone, HelpCircle, Laptop } from "lucide-react";
import { getApiBaseUrl, setApiBaseUrl, testServerConnection, isNativePlatform } from "@/lib/api-config";
import { useQueryClient } from "@tanstack/react-query";

interface ServerConfigDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ServerConfigDialog({ open, onOpenChange }: ServerConfigDialogProps) {
  const [url, setUrl] = useState(getApiBaseUrl());
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<{
    tested: boolean;
    success?: boolean;
    latencyMs?: number;
    error?: string;
  }>({ tested: false });
  
  const queryClient = useQueryClient();

  useEffect(() => {
    if (open) {
      setUrl(getApiBaseUrl());
      setTestResult({ tested: false });
    }
  }, [open]);

  const handleTest = async (testUrl?: string) => {
    const target = testUrl !== undefined ? testUrl : url;
    setTesting(true);
    setTestResult({ tested: false });
    
    const res = await testServerConnection(target);
    setTestResult({
      tested: true,
      success: res.success,
      latencyMs: res.latencyMs,
      error: res.error,
    });
    setTesting(false);
  };

  const handleSave = () => {
    setApiBaseUrl(url);
    queryClient.invalidateQueries();
    onOpenChange(false);
  };

  const handleApplyPreset = (presetUrl: string) => {
    setUrl(presetUrl);
    handleTest(presetUrl);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md bg-card border-border text-foreground font-mono rounded-none">
        <DialogHeader className="border-b border-border pb-3">
          <DialogTitle className="flex items-center gap-2 text-sm font-bold tracking-widest uppercase text-primary">
            <Server className="w-4 h-4 text-primary" />
            SERVER_ENDPOINT_CONFIG
          </DialogTitle>
          <DialogDescription className="text-xs text-muted-foreground">
            Configure the backend API server address for this Android/Web client.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2 text-xs">
          {/* Active status */}
          <div className="flex items-center justify-between p-2.5 bg-muted/20 border border-border">
            <span className="text-muted-foreground uppercase tracking-wider text-[11px]">PLATFORM_MODE</span>
            <Badge variant="outline" className="rounded-none border-primary/40 text-primary text-[10px] uppercase">
              {isNativePlatform() ? "ANDROID_NATIVE" : "WEB_CLIENT"}
            </Badge>
          </div>

          {/* URL Input */}
          <div className="space-y-1.5">
            <label className="text-[11px] font-bold text-muted-foreground uppercase tracking-wider flex items-center justify-between">
              <span>API_BASE_URL</span>
              <span className="text-[10px] text-muted-foreground/80 lowercase">e.g. http://10.0.2.2:5000</span>
            </label>
            <div className="flex gap-2">
              <Input
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="http://10.0.2.2:5000 or http://localhost:5000"
                className="bg-background border-border font-mono text-xs rounded-none focus-visible:ring-primary h-9"
              />
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleTest()}
                disabled={testing}
                className="rounded-none border-border shrink-0 text-xs h-9 px-3"
              >
                {testing ? (
                  <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <Wifi className="w-3.5 h-3.5 mr-1" />
                )}
                TEST
              </Button>
            </div>
          </div>

          {/* Test Status Banner */}
          {testResult.tested && (
            <div
              className={`p-2.5 border flex items-center justify-between text-xs ${
                testResult.success
                  ? "bg-emerald-950/40 border-emerald-500/50 text-emerald-300"
                  : "bg-destructive/15 border-destructive/50 text-destructive"
              }`}
            >
              <div className="flex items-center gap-2">
                {testResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <XCircle className="w-4 h-4 text-destructive" />
                )}
                <span className="font-bold">
                  {testResult.success ? "SERVER_ONLINE" : "CONNECTION_FAILED"}
                </span>
              </div>
              <span className="text-[10px]">
                {testResult.success
                  ? `${testResult.latencyMs}ms latency`
                  : testResult.error}
              </span>
            </div>
          )}

          {/* Quick Presets */}
          <div className="space-y-1.5">
            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
              QUICK_PRESETS
            </span>
            <div className="grid grid-cols-2 gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyPreset("http://10.0.2.2:5000")}
                className="rounded-none border-border justify-start text-[11px] h-8 px-2 bg-muted/10 hover:bg-muted/30"
              >
                <Smartphone className="w-3 h-3 mr-1.5 text-primary" />
                Emulator (10.0.2.2)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleApplyPreset("http://localhost:5000")}
                className="rounded-none border-border justify-start text-[11px] h-8 px-2 bg-muted/10 hover:bg-muted/30"
              >
                <Laptop className="w-3 h-3 mr-1.5 text-primary" />
                Localhost (5000)
              </Button>
            </div>
          </div>

          {/* Connection Help */}
          <div className="p-2 bg-muted/10 border border-border/70 text-[10px] text-muted-foreground space-y-1">
            <div className="font-bold text-foreground flex items-center gap-1">
              <HelpCircle className="w-3 h-3 text-primary" />
              TIPS FOR ANDROID CONNECTIONS:
            </div>
            <p>• <strong>Android Emulator:</strong> Use <code className="text-primary">http://10.0.2.2:5000</code> to reach your PC.</p>
            <p>• <strong>Physical Phone (Wi-Fi):</strong> Use your PC's Wi-Fi IP (e.g. <code className="text-primary">http://192.168.1.50:5000</code>).</p>
          </div>
        </div>

        <DialogFooter className="border-t border-border pt-3 flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => onOpenChange(false)}
            className="rounded-none text-xs"
          >
            CANCEL
          </Button>
          <Button
            onClick={handleSave}
            size="sm"
            className="rounded-none bg-primary text-primary-foreground font-bold tracking-widest text-xs"
          >
            APPLY_ENDPOINT
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
