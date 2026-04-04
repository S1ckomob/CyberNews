"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { isSaved, toggleSaved } from "@/lib/saved-articles";
import { Bookmark, BookmarkCheck, ExternalLink, Copy, Check, Twitter, Linkedin, Link2 } from "lucide-react";

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

  function getArticleUrl() {
    return `${window.location.origin}/article/${slug}`;
  }

  async function handleCopyLink() {
    await navigator.clipboard.writeText(getArticleUrl());
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function shareToX() {
    const url = getArticleUrl();
    const text = `${title}`;
    window.open(
      `https://x.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=550,height=420"
    );
  }

  function shareToLinkedIn() {
    const url = getArticleUrl();
    window.open(
      `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(url)}`,
      "_blank",
      "noopener,noreferrer,width=550,height=550"
    );
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

      {/* Save + Share actions */}
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
          className="gap-1.5 text-xs"
          onClick={shareToX}
          title="Share on X"
        >
          <Twitter className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={shareToLinkedIn}
          title="Share on LinkedIn"
        >
          <Linkedin className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={handleCopyLink}
          title="Copy link"
        >
          {copied ? <Check className="h-3.5 w-3.5 text-primary" /> : <Link2 className="h-3.5 w-3.5" />}
        </Button>
      </div>
    </div>
  );
}
