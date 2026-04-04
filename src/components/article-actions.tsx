"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { isSaved, toggleSaved } from "@/lib/saved-articles";
import { Bookmark, BookmarkCheck, ExternalLink, Copy, Check, Link2 } from "lucide-react";

function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

function LinkedInIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className}>
      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
    </svg>
  );
}

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
          <XIcon className="h-3.5 w-3.5" />
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="gap-1.5 text-xs"
          onClick={shareToLinkedIn}
          title="Share on LinkedIn"
        >
          <LinkedInIcon className="h-3.5 w-3.5" />
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
