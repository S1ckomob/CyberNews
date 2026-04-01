"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { isSaved, toggleSaved } from "@/lib/saved-articles";
import { Bookmark, BookmarkCheck, Share2, ExternalLink, Copy, Check } from "lucide-react";

interface ArticleActionsProps {
  slug: string;
  title: string;
  sourceUrl: string;
  source: string;
}

export function ArticleActions({ slug, title, sourceUrl, source }: ArticleActionsProps) {
  const [saved, setSaved] = useState(false);
  const [copied, setCopied] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setSaved(isSaved(slug));
  }, [slug]);

  function handleSave() {
    const nowSaved = toggleSaved(slug);
    setSaved(nowSaved);
  }

  async function handleShare() {
    const url = `${window.location.origin}/article/${slug}`;
    if (navigator.share) {
      try {
        await navigator.share({ title, url });
      } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  if (!mounted) return null;

  return (
    <div className="space-y-3">
      {/* Prominent source link */}
      {sourceUrl && (
        <a href={sourceUrl} target="_blank" rel="noopener noreferrer" className="block">
          <Button className="w-full gap-2 text-sm font-semibold">
            <ExternalLink className="h-4 w-4" />
            Read Full Advisory — {source}
          </Button>
        </a>
      )}

      {/* Secondary actions */}
      <div className="flex gap-2">
        <Button
          variant={saved ? "default" : "outline"}
          size="sm"
          className="flex-1 gap-1.5 text-xs"
          onClick={handleSave}
        >
          {saved ? <BookmarkCheck className="h-3.5 w-3.5" /> : <Bookmark className="h-3.5 w-3.5" />}
          {saved ? "Saved" : "Save"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="flex-1 gap-1.5 text-xs"
          onClick={handleShare}
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Share2 className="h-3.5 w-3.5" />}
          {copied ? "Copied!" : "Share"}
        </Button>
      </div>

      {/* CVE external links */}
    </div>
  );
}
