"use client";

import React, { useMemo } from "react";
import DOMPurify from "dompurify";

interface RichJobDescriptionProps {
  content: string;
  className?: string;
}

// Regex to check if content contains HTML tags like <p>, <br>, <div>, <ul>, etc.
const HTML_TAG_REGEX = /<[a-z][\s\S]*>/i;

export function RichJobDescription({ content, className = "" }: RichJobDescriptionProps) {
  const isHtml = useMemo(() => {
    return HTML_TAG_REGEX.test(content);
  }, [content]);

  // Clean and sanitize HTML content
  const cleanHtml = useMemo(() => {
    if (!isHtml) return "";
    if (typeof window === "undefined") {
      // Server-side fallback: strip tags for initial render to avoid hydrations mismatch
      return content.replace(/<[^>]*>?/gm, " ");
    }

    // Configure DOMPurify hooks once or sanitize
    const sanitized = DOMPurify.sanitize(content, {
      USE_PROFILES: { html: true },
      ADD_ATTR: ["target", "rel"],
    });

    return sanitized;
  }, [content, isHtml]);

  // Formatted plain text renderer if no HTML tags were present
  const renderPlainText = useMemo(() => {
    if (isHtml) return null;

    const lines = content.split("\n");
    return lines.map((line, idx) => {
      const trimmed = line.trim();
      if (!trimmed) {
        return <div key={idx} className="h-3" />;
      }

      // Section headers
      if (
        /^(about|responsibilities|key responsibilities|what you'?ll do|what we'?re looking for|requirements|required qualifications|qualifications|compensation|benefits|compensation & benefits|overview|perks|tech stack)/i.test(
          trimmed
        ) &&
        (trimmed.endsWith(":") || trimmed.length < 45)
      ) {
        return (
          <h4
            key={idx}
            className="mt-6 mb-2.5 text-sm font-bold uppercase tracking-wider text-teal flex items-center gap-2"
          >
            <span className="h-1.5 w-1.5 rounded-full bg-teal" />
            {trimmed.replace(/:$/, "")}
          </h4>
        );
      }

      // Bullet points
      if (trimmed.startsWith("•") || trimmed.startsWith("-") || trimmed.startsWith("*")) {
        const itemText = trimmed.replace(/^[•\-\*]\s*/, "");
        return (
          <li
            key={idx}
            className="ml-4 list-disc text-sm text-zinc-300 leading-relaxed pl-1 marker:text-teal mb-1.5"
          >
            {itemText}
          </li>
        );
      }

      // Standard paragraph
      return (
        <p key={idx} className="text-sm text-zinc-300 leading-relaxed mb-3">
          {trimmed}
        </p>
      );
    });
  }, [content, isHtml]);

  if (isHtml) {
    return (
      <div
        className={`rich-job-description ${className}`}
        dangerouslySetInnerHTML={{ __html: cleanHtml }}
      />
    );
  }

  return <div className={`space-y-1 text-zinc-300 ${className}`}>{renderPlainText}</div>;
}
