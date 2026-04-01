"use client";

import { Button } from "@/components/ui/button";
import { FileDown } from "lucide-react";

export function PDFExportButton() {
  return (
    <Button
      variant="outline"
      size="sm"
      className="gap-1.5 text-xs"
      onClick={() => window.print()}
    >
      <FileDown className="h-3.5 w-3.5" />
      Export PDF
    </Button>
  );
}
