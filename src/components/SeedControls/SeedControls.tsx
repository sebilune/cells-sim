import { useState } from "react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { ClipboardCopy, Upload } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/components/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

interface SeedControlsProps {
  seed: string;
  onImport: (seed: string) => void;
}

export function SeedControls({ seed, onImport }: SeedControlsProps) {
  const [importValue, setImportValue] = useState("");
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(seed);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  const handleImport = () => {
    let trimmed = importValue.trim();
    if (trimmed.length > 66) trimmed = trimmed.slice(0, 66);
    if (/^[0-9a-zA-Z]{1,66}$/.test(trimmed)) {
      const padded = trimmed.padEnd(66, "0");
      onImport(padded);
      setImportValue("");
    }
  };

  return (
    <>
      {showCopied && (
        <div className="fixed bottom-6 left-6 z-50 w-fit flex justify-start pointer-events-none">
          <Alert className="w-fit shadow-lg">
            <CheckCircle2Icon className="h-4 w-4" />
            <AlertTitle>Copied!</AlertTitle>
            <AlertDescription>Seed copied to clipboard.</AlertDescription>
          </Alert>
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant="secondary" title="Seed controls">
            Seed
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="leading-none font-medium">Rules Seed</h4>
            </div>
            <div className="pt-2 border-t border-border">
              <h5 className="text-xs font-semibold mb-2 text-muted-foreground">
                Export Seed
              </h5>
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <Input
                    id="seed-export"
                    value={seed}
                    readOnly
                    className="font-mono text-xs flex-1"
                    style={{ minWidth: 0 }}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleCopy}
                    title="Copy seed"
                  >
                    <ClipboardCopy className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              <h5 className="text-xs font-semibold mb-2 text-muted-foreground">
                Import Seed (0-9, a-z, A-Z)
              </h5>
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <Input
                    id="seed-import"
                    value={importValue}
                    onChange={(e) =>
                      setImportValue(
                        e.target.value.replace(/[^0-9a-zA-Z]/g, "")
                      )
                    }
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleImport();
                      }
                    }}
                    placeholder="Paste or type seed"
                    className="font-mono text-xs flex-1"
                    style={{ minWidth: 0 }}
                    maxLength={66}
                  />
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={handleImport}
                    title="Import seed"
                  >
                    <Upload className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </>
  );
}
