"use client";

import { useRef, useEffect } from "react";

interface ResumePreviewProps {
  htmlContent: string;
  showHighlights?: boolean;
  scale?: number;
  className?: string;
}

export default function ResumePreview({
  htmlContent,
  showHighlights = true,
  scale = 1,
  className = "",
}: ResumePreviewProps) {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe?.contentDocument || !htmlContent) return;

    let doc = htmlContent;
    if (!showHighlights) {
      doc = doc.replace(/\s*style=['"]([^'"]*background:\s*#fffde7[^'"]*)['"]/gi, "");
    }

    iframe.contentDocument.open();
    iframe.contentDocument.write(doc);
    iframe.contentDocument.close();
  }, [htmlContent, showHighlights]);

  return (
    <div
      className={`overflow-hidden rounded bg-[#1a1a1a] ${className}`}
      style={{ maxHeight: 800 }}
    >
      <div
        className="flex origin-top-left justify-center overflow-y-auto p-4"
        style={{ transform: `scale(${scale})`, minHeight: 800 / scale }}
      >
        <iframe
          ref={iframeRef}
          title="Resume preview"
          className="min-h-[1000px] w-[210mm] border-0 bg-white shadow-lg"
          style={{ minHeight: "1000px" }}
          sandbox="allow-same-origin"
        />
      </div>
    </div>
  );
}
