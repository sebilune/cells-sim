import { useState } from "react";

import { Button } from "@/lib/ui/button";
import { Input } from "@/lib/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/lib/ui/popover";
import { ClipboardCopy, Upload } from "lucide-react";
import { Alert, AlertTitle, AlertDescription } from "@/lib/ui/alert";
import { CheckCircle2Icon } from "lucide-react";

interface SeedBtnProps {
  seed: string;
  onImport: (seed: string) => void;
  variant?: "default" | "outline";
  title?: string;
  className?: string;
}

export function SeedBtn({
  seed,
  onImport,
  variant,
  title,
  className,
}: SeedBtnProps) {
  const [importValue, setImportValue] = useState("");
  const [showCopied, setShowCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(seed);
    setShowCopied(true);
    setTimeout(() => setShowCopied(false), 1500);
  };

  const handleImport = () => {
    let trimmed = importValue.trim();
    if (trimmed.length > 47) trimmed = trimmed.slice(0, 47);
    if (/^[0-9a-zA-Z]{47}$/.test(trimmed)) {
      onImport(trimmed);
      setImportValue("");
    }
  };

  return (
    <>
      {showCopied && (
        <div className="fixed z-50 flex justify-end pointer-events-none bottom-6 right-6 w-fit">
          <Alert className="shadow-lg w-fit">
            <CheckCircle2Icon className="w-4 h-4" />
            <AlertTitle>Copied!</AlertTitle>
            <AlertDescription>Seed copied to clipboard.</AlertDescription>
          </Alert>
        </div>
      )}
      <Popover>
        <PopoverTrigger asChild>
          <Button variant={variant} title={title} className={className}>
            Seed
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-80 dark:bg-zinc-950">
          <div className="grid gap-4">
            <div className="space-y-2">
              <h4 className="font-medium leading-none">Rules Seed</h4>
            </div>
            <div className="pt-2 border-t border-border">
              <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                Export Seed
              </h5>
              <div className="flex flex-col gap-2 mb-2">
                <div className="flex items-center gap-3">
                  <Input
                    id="seed-export"
                    value={seed}
                    readOnly
                    className="flex-1 font-mono text-xs"
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
              <h5 className="mb-2 text-xs font-semibold text-muted-foreground">
                Import Seed (0-9, a-z, A-Z, 47 chars)
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
                    className="flex-1 font-mono text-xs"
                    style={{ minWidth: 0 }}
                    maxLength={47}
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
