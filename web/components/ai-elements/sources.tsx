"use client";

import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  HoverCard,
  HoverCardContent,
  HoverCardTrigger,
} from "@/components/ui/hover-card";
import { cn } from "@/lib/utils";
import {
  BookOpenIcon,
  ChevronDownIcon,
  ExternalLinkIcon,
  FileTextIcon,
  GlobeIcon,
  SparklesIcon,
} from "lucide-react";
import type { ComponentProps, ReactNode } from "react";
import { useState } from "react";

export interface SourceData {
  sourceId: string;
  url: string;
  title: string;
  type?: string;
  content?: string;
  chunkIdx?: number;
  similarity?: number;
}

export type SourcesProps = ComponentProps<"div"> & {
  sources: SourceData[];
};

export const Sources = ({ className, sources, ...props }: SourcesProps) => {
  const [isOpen, setIsOpen] = useState(false);

  if (!sources.length) return null;

  return (
    <Collapsible
      open={isOpen}
      onOpenChange={setIsOpen}
      className={cn("not-prose w-full", className)}
      {...props}
    >
      <CollapsibleTrigger className="group flex w-full items-center gap-3 rounded-xl border border-border/50 bg-linear-to-r from-muted/30 to-muted/10 px-4 py-3 transition-all hover:border-border hover:bg-muted/50">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary/10">
            <BookOpenIcon className="h-4 w-4 text-primary" />
          </div>
          <div className="flex flex-col items-start">
            <span className="text-sm font-medium text-foreground">
              {sources.length} {sources.length === 1 ? "source" : "sources"}{" "}
              referenced
            </span>
            <span className="text-xs text-muted-foreground">
              {isOpen ? "Click to collapse" : "Click to view sources"}
            </span>
          </div>
        </div>
        <ChevronDownIcon
          className={cn(
            "ml-auto h-4 w-4 text-muted-foreground transition-transform duration-200",
            isOpen && "rotate-180"
          )}
        />
      </CollapsibleTrigger>

      <CollapsibleContent className="overflow-hidden data-[state=closed]:animate-collapse data-[state=open]:animate-expand">
        <div className="mt-3 grid gap-2">
          {sources.map((source, idx) => (
            <SourceCard key={`${source.sourceId}-${idx}`} source={source} />
          ))}
        </div>
      </CollapsibleContent>
    </Collapsible>
  );
};

export type SourceCardProps = {
  source: SourceData;
};

const SourceCard = ({ source }: SourceCardProps) => {
  const isPdf = source.type === "pdf" || source.url?.endsWith(".pdf");
  const viewUrl = isPdf ? `/api/pdf/${source.sourceId}` : source.url;

  return (
    <HoverCard openDelay={200} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="group/card flex items-start gap-3 rounded-lg border border-transparent bg-muted/30 p-3 transition-all hover:border-border hover:bg-muted/60 hover:shadow-sm"
        >
          <div
            className={cn(
              "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg transition-colors",
              isPdf
                ? "bg-rose-500/10 text-rose-600 group-hover/card:bg-rose-500/20"
                : "bg-blue-500/10 text-blue-600 group-hover/card:bg-blue-500/20"
            )}
          >
            {isPdf ? (
              <FileTextIcon className="h-5 w-5" />
            ) : (
              <GlobeIcon className="h-5 w-5" />
            )}
          </div>

          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <h4 className="truncate text-sm font-medium text-foreground">
                {source.title || "Untitled Document"}
              </h4>
              {source.similarity !== undefined && source.similarity > 0.7 && (
                <span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/10 px-2 py-0.5 text-[10px] font-medium text-emerald-600">
                  <SparklesIcon className="h-3 w-3" />
                  High relevance
                </span>
              )}
            </div>

            <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
              <span className="truncate max-w-[200px]">
                {isPdf ? "PDF Document" : new URL(source.url || "").hostname}
              </span>
              {source.chunkIdx !== undefined && (
                <>
                  <span className="text-border">•</span>
                  <span>Section {source.chunkIdx + 1}</span>
                </>
              )}
            </div>

            {source.content && (
              <p className="mt-2 line-clamp-2 text-xs text-muted-foreground/80">
                {source.content}
              </p>
            )}
          </div>

          <ExternalLinkIcon className="h-4 w-4 shrink-0 text-muted-foreground opacity-0 transition-opacity group-hover/card:opacity-100" />
        </a>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        align="start"
        className="w-80 border-border/50 bg-popover/95 backdrop-blur-sm"
      >
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div
              className={cn(
                "flex h-10 w-10 shrink-0 items-center justify-center rounded-lg",
                isPdf
                  ? "bg-rose-500/10 text-rose-600"
                  : "bg-blue-500/10 text-blue-600"
              )}
            >
              {isPdf ? (
                <FileTextIcon className="h-5 w-5" />
              ) : (
                <GlobeIcon className="h-5 w-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h4 className="font-medium text-foreground">
                {source.title || "Untitled Document"}
              </h4>
              <p className="mt-0.5 text-xs text-muted-foreground">
                {isPdf ? "PDF Document" : source.url}
              </p>
            </div>
          </div>

          {source.content && (
            <div className="rounded-md bg-muted/50 p-3">
              <p className="text-xs leading-relaxed text-muted-foreground">
                "{source.content.slice(0, 300)}
                {source.content.length > 300 ? "..." : ""}"
              </p>
            </div>
          )}

          {source.similarity !== undefined && (
            <div className="flex items-center justify-between border-t border-border/50 pt-3">
              <span className="text-xs text-muted-foreground">
                Relevance score
              </span>
              <div className="flex items-center gap-2">
                <div className="h-1.5 w-20 overflow-hidden rounded-full bg-muted">
                  <div
                    className={cn(
                      "h-full rounded-full transition-all",
                      source.similarity > 0.7
                        ? "bg-emerald-500"
                        : source.similarity > 0.6
                        ? "bg-amber-500"
                        : "bg-muted-foreground"
                    )}
                    style={{ width: `${Math.round(source.similarity * 100)}%` }}
                  />
                </div>
                <span className="text-xs font-medium text-foreground">
                  {Math.round(source.similarity * 100)}%
                </span>
              </div>
            </div>
          )}
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Compact inline source pills for inline citations
export type SourcePillsProps = ComponentProps<"div"> & {
  sources: SourceData[];
  max?: number;
};

export const SourcePills = ({
  className,
  sources,
  max = 3,
  ...props
}: SourcePillsProps) => {
  if (!sources.length) return null;

  const visibleSources = sources.slice(0, max);
  const remainingCount = sources.length - max;

  return (
    <div
      className={cn("flex flex-wrap items-center gap-1.5", className)}
      {...props}
    >
      {visibleSources.map((source, idx) => (
        <SourcePill key={`${source.sourceId}-${idx}`} source={source} />
      ))}
      {remainingCount > 0 && (
        <span className="rounded-full bg-muted px-2 py-1 text-[10px] font-medium text-muted-foreground">
          +{remainingCount} more
        </span>
      )}
    </div>
  );
};

const SourcePill = ({ source }: { source: SourceData }) => {
  const isPdf = source.type === "pdf" || source.url?.endsWith(".pdf");
  const viewUrl = isPdf ? `/api/pdf/${source.sourceId}` : source.url;

  return (
    <HoverCard openDelay={300} closeDelay={100}>
      <HoverCardTrigger asChild>
        <a
          href={viewUrl}
          target="_blank"
          rel="noopener noreferrer"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-medium transition-colors",
            isPdf
              ? "bg-rose-500/10 text-rose-700 hover:bg-rose-500/20 dark:text-rose-400"
              : "bg-blue-500/10 text-blue-700 hover:bg-blue-500/20 dark:text-blue-400"
          )}
        >
          {isPdf ? (
            <FileTextIcon className="h-3 w-3" />
          ) : (
            <GlobeIcon className="h-3 w-3" />
          )}
          <span className="max-w-[100px] truncate">
            {source.title || "Source"}
          </span>
        </a>
      </HoverCardTrigger>

      <HoverCardContent
        side="top"
        className="w-72 border-border/50 bg-popover/95 backdrop-blur-sm"
      >
        <div className="space-y-2">
          <h4 className="font-medium text-foreground text-sm">
            {source.title || "Untitled"}
          </h4>
          {source.content && (
            <p className="text-xs text-muted-foreground line-clamp-4">
              {source.content}
            </p>
          )}
          <p className="text-[10px] text-muted-foreground/70">
            Click to view full document
          </p>
        </div>
      </HoverCardContent>
    </HoverCard>
  );
};

// Legacy exports for backwards compatibility
export type SourcesTriggerProps = ComponentProps<typeof CollapsibleTrigger> & {
  count: number;
};

export const SourcesTrigger = ({
  className,
  count,
  children,
  ...props
}: SourcesTriggerProps) => (
  <CollapsibleTrigger
    className={cn("flex items-center gap-2", className)}
    {...props}
  >
    {children ?? (
      <>
        <p className="font-medium">Used {count} sources</p>
        <ChevronDownIcon className="h-4 w-4" />
      </>
    )}
  </CollapsibleTrigger>
);

export type SourcesContentProps = ComponentProps<typeof CollapsibleContent>;

export const SourcesContent = ({
  className,
  ...props
}: SourcesContentProps) => (
  <CollapsibleContent
    className={cn(
      "mt-3 flex w-fit flex-col gap-2",
      "data-[state=closed]:fade-out-0 data-[state=closed]:slide-out-to-top-2 data-[state=open]:slide-in-from-top-2 outline-none data-[state=closed]:animate-out data-[state=open]:animate-in",
      className
    )}
    {...props}
  />
);

export type SourceProps = ComponentProps<"a">;

export const Source = ({ href, title, children, ...props }: SourceProps) => (
  <a
    className="flex items-center gap-2"
    href={href}
    rel="noreferrer"
    target="_blank"
    {...props}
  >
    {children ?? (
      <>
        <BookOpenIcon className="h-4 w-4" />
        <span className="block font-medium">{title}</span>
      </>
    )}
  </a>
);
