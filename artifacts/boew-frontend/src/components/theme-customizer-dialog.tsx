import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  Palette, 
  Type, 
  Check, 
  Sparkles,
  Sun,
  Moon
} from "lucide-react";
import { 
  THEME_OPTIONS, 
  FONT_OPTIONS, 
  getStoredTheme, 
  getStoredFont, 
  applyTheme, 
  applyFont,
  type AppTheme, 
  type AppFont 
} from "@/lib/theme-config";

interface ThemeCustomizerDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ThemeCustomizerDialog({ open, onOpenChange }: ThemeCustomizerDialogProps) {
  const [currentTheme, setCurrentTheme] = useState<AppTheme>(getStoredTheme());
  const [currentFont, setCurrentFont] = useState<AppFont>(getStoredFont());

  const handleSelectTheme = (theme: AppTheme) => {
    setCurrentTheme(theme);
    applyTheme(theme);
  };

  const handleSelectFont = (font: AppFont) => {
    setCurrentFont(font);
    applyFont(font);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg bg-card/95 backdrop-blur-xl border-border text-foreground shadow-2xl rounded-2xl p-6">
        <DialogHeader className="border-b border-border/60 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="flex items-center gap-2.5 text-base font-bold tracking-tight text-foreground">
              <div className="p-2 rounded-lg bg-primary/10 text-primary">
                <Palette className="w-5 h-5" />
              </div>
              <span>Appearance & Styling</span>
            </DialogTitle>
            <Badge variant="outline" className="rounded-full text-xs font-semibold px-3 py-0.5 border-primary/30 text-primary bg-primary/5">
              Live Customizer
            </Badge>
          </div>
          <DialogDescription className="text-xs text-muted-foreground mt-1">
            Personalize the app color palette, typography font, and visual aesthetic.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-3">
          {/* Theme Palette Selection */}
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Sparkles className="w-3.5 h-3.5 text-primary" />
              <span>Color Themes</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {THEME_OPTIONS.map((theme) => {
                const isSelected = currentTheme === theme.id;
                return (
                  <button
                    key={theme.id}
                    onClick={() => handleSelectTheme(theme.id)}
                    className={`group relative p-3.5 rounded-xl border text-left transition-all duration-200 flex flex-col gap-2 ${
                      isSelected
                        ? "border-primary bg-primary/10 shadow-sm ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        {/* Swatch preview circles */}
                        <div className="flex -space-x-1.5">
                          <span
                            className="w-4 h-4 rounded-full border border-background shadow-xs"
                            style={{ backgroundColor: theme.bgColor }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-background shadow-xs"
                            style={{ backgroundColor: theme.primaryColor }}
                          />
                          <span
                            className="w-4 h-4 rounded-full border border-background shadow-xs"
                            style={{ backgroundColor: theme.accentColor }}
                          />
                        </div>
                        <span className="text-xs font-bold text-foreground group-hover:text-primary transition-colors">
                          {theme.name}
                        </span>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-primary text-primary-foreground flex items-center justify-center">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-muted-foreground/50">
                          {theme.isDark ? <Moon className="w-3.5 h-3.5" /> : <Sun className="w-3.5 h-3.5" />}
                        </span>
                      )}
                    </div>

                    <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-2">
                      {theme.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Typography Selection */}
          <div className="space-y-3 pt-2 border-t border-border/50">
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground">
              <Type className="w-3.5 h-3.5 text-primary" />
              <span>Typography Fonts</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {FONT_OPTIONS.map((font) => {
                const isSelected = currentFont === font.id;
                return (
                  <button
                    key={font.id}
                    onClick={() => handleSelectFont(font.id)}
                    className={`p-3 rounded-xl border text-left transition-all duration-200 flex flex-col justify-between ${
                      isSelected
                        ? "border-primary bg-primary/10 ring-1 ring-primary/30"
                        : "border-border hover:border-primary/40 bg-muted/20 hover:bg-muted/40"
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-foreground">
                        {font.name}
                      </span>
                      {isSelected && (
                        <Check className="w-3.5 h-3.5 text-primary stroke-[3]" />
                      )}
                    </div>
                    <span className="text-[10px] text-muted-foreground">
                      {font.sample}
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        <div className="flex justify-end pt-2 border-t border-border/50">
          <Button
            onClick={() => onOpenChange(false)}
            className="rounded-xl px-5 h-9 font-semibold text-xs bg-primary text-primary-foreground shadow-sm hover:opacity-90"
          >
            Done
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
