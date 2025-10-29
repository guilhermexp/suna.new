'use client';

import React, { useState, useEffect } from 'react';
import { toast } from 'sonner';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import {
    X,
    Download,
    Copy,
    Check,
    Edit,
    ChevronLeft,
    ChevronRight,
    AlertCircle,
    Loader2,
} from 'lucide-react';
import { type Entry } from '@/hooks/react-query/knowledge-base/use-folders';
import { getFileIcon, formatFileSize } from '@/lib/utils/file-utils';
import { fileContentCache } from '@/lib/cache/file-content-cache';
import { createClient } from '@/lib/supabase/client';
import { FileRenderer } from '@/components/file-renderers';

interface KbDocumentViewerModalProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    entry: Entry | null;
    entries: Entry[];
    onRefresh?: () => void;
}

export function KbDocumentViewerModal({
    open,
    onOpenChange,
    entry,
    entries,
    onRefresh,
}: KbDocumentViewerModalProps) {
    const [currentEntryIndex, setCurrentEntryIndex] = useState(0);
    const [fileContent, setFileContent] = useState<string | Blob | null>(null);
    const [contentType, setContentType] = useState<string>('');
    const [binaryUrl, setBinaryUrl] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [isDownloading, setIsDownloading] = useState(false);
    const [isCopying, setIsCopying] = useState(false);
    const [copySuccess, setCopySuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const currentEntry = entry || entries[currentEntryIndex];
    const FileIcon = currentEntry ? getFileIcon(currentEntry.filename) : null;
    const showNavigation = entries.length > 1;

    // Update current entry index when entry prop changes
    useEffect(() => {
        if (entry && entries.length > 0) {
            const index = entries.findIndex(e => e.entry_id === entry.entry_id);
            if (index !== -1) {
                setCurrentEntryIndex(index);
            }
        }
    }, [entry, entries]);

    // Fetch file content when entry changes
    useEffect(() => {
        if (!currentEntry || !open) {
            return;
        }

        const fetchContent = async () => {
            setIsLoading(true);
            setError(null);
            // Clear previous binary URL
            if (binaryUrl) {
                URL.revokeObjectURL(binaryUrl);
                setBinaryUrl(null);
            }

            try {
                // Check cache first
                const cached = fileContentCache.get(currentEntry.entry_id);
                if (cached) {
                    setFileContent(cached.content);
                    setContentType(cached.contentType);

                    // Create blob URL for binary content
                    if (cached.content instanceof Blob) {
                        const url = URL.createObjectURL(cached.content);
                        setBinaryUrl(url);
                    }

                    setIsLoading(false);
                    return;
                }

                // Fetch from API
                const supabase = createClient();
                const response = await fetch(
                    `/api/knowledge-base/entries/${currentEntry.entry_id}/content`,
                    {
                        headers: {
                            'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
                        },
                    }
                );

                if (!response.ok) {
                    throw new Error(`Failed to fetch file content: ${response.statusText}`);
                }

                const contentTypeHeader = response.headers.get('Content-Type') || 'application/octet-stream';
                setContentType(contentTypeHeader);

                // Handle different content types
                if (contentTypeHeader.startsWith('text/') ||
                    contentTypeHeader.includes('json') ||
                    contentTypeHeader.includes('javascript') ||
                    contentTypeHeader.includes('xml') ||
                    contentTypeHeader.includes('csv')) {
                    const text = await response.text();
                    setFileContent(text);
                    fileContentCache.set(currentEntry.entry_id, text, contentTypeHeader);
                } else {
                    // Binary content (PDF, images, xlsx, etc.)
                    const blob = await response.blob();
                    setFileContent(blob);
                    fileContentCache.set(currentEntry.entry_id, blob, contentTypeHeader);

                    // Create blob URL for rendering
                    const url = URL.createObjectURL(blob);
                    setBinaryUrl(url);
                }
            } catch (err) {
                console.error('Error fetching file content:', err);
                setError(err instanceof Error ? err.message : 'Failed to load file content');
            } finally {
                setIsLoading(false);
            }
        };

        fetchContent();
    }, [currentEntry, open]);

    // Cleanup blob URL when component unmounts or URL changes
    useEffect(() => {
        return () => {
            if (binaryUrl) {
                URL.revokeObjectURL(binaryUrl);
            }
        };
    }, [binaryUrl]);

    // Handle keyboard shortcuts
    useEffect(() => {
        if (!open) return;

        const handleKeyDown = (e: KeyboardEvent) => {
            if (e.key === 'Escape') {
                onOpenChange(false);
            } else if (e.key === 'ArrowLeft' && showNavigation && currentEntryIndex > 0) {
                handlePrevious();
            } else if (e.key === 'ArrowRight' && showNavigation && currentEntryIndex < entries.length - 1) {
                handleNext();
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [open, currentEntryIndex, entries.length, showNavigation]);

    const handlePrevious = () => {
        if (currentEntryIndex > 0) {
            setCurrentEntryIndex(currentEntryIndex - 1);
        }
    };

    const handleNext = () => {
        if (currentEntryIndex < entries.length - 1) {
            setCurrentEntryIndex(currentEntryIndex + 1);
        }
    };

    const handleDownload = async () => {
        if (!currentEntry || isDownloading) return;

        setIsDownloading(true);

        try {
            const supabase = createClient();
            const session = await supabase.auth.getSession();

            // Fetch signed download URL
            const response = await fetch(
                `/api/knowledge-base/entries/${currentEntry.entry_id}/download-url`,
                {
                    headers: {
                        'Authorization': `Bearer ${session.data.session?.access_token}`,
                    },
                }
            );

            if (!response.ok) {
                throw new Error('Failed to get download URL');
            }

            const data = await response.json();

            // Create temporary anchor element to trigger download
            const anchor = document.createElement('a');
            anchor.href = data.download_url;
            anchor.download = data.filename;
            anchor.style.display = 'none';
            document.body.appendChild(anchor);

            // Trigger download
            anchor.click();

            // Clean up
            document.body.removeChild(anchor);

            toast.success('Download started');
        } catch (error) {
            console.error('Download error:', error);
            toast.error('Failed to download file. Please try again.');
        } finally {
            setIsDownloading(false);
        }
    };

    const handleCopy = async () => {
        if (!fileContent || isCopying) return;

        // Check if content is text-based (not Blob)
        if (fileContent instanceof Blob) {
            toast.error('Cannot copy binary files. Please use download instead.');
            return;
        }

        setIsCopying(true);

        try {
            // Check if clipboard API is available
            if (!navigator.clipboard || !navigator.clipboard.writeText) {
                throw new Error('Clipboard API not available');
            }

            // Copy text content to clipboard
            await navigator.clipboard.writeText(fileContent);

            // Show success state
            setCopySuccess(true);
            toast.success('Content copied to clipboard');

            // Reset success state after 2 seconds
            setTimeout(() => {
                setCopySuccess(false);
            }, 2000);
        } catch (error) {
            console.error('Copy error:', error);

            // Handle specific error cases
            if (error instanceof Error && error.name === 'NotAllowedError') {
                toast.error('Clipboard permission denied. Please allow clipboard access.');
            } else {
                toast.error('Failed to copy content. Please try again.');
            }
        } finally {
            setIsCopying(false);
        }
    };

    const handleEditSummary = () => {
        // Placeholder for edit summary functionality
        console.log('Edit summary clicked');
    };

    const handleRetry = () => {
        // Clear cache and refetch
        if (currentEntry) {
            fileContentCache.delete(currentEntry.entry_id);
            setError(null);
            setFileContent(null);
        }
    };

    if (!currentEntry) {
        return null;
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-5xl h-[85vh] flex flex-col gap-0 p-0">
                {/* Header */}
                <DialogHeader className="px-6 py-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3 flex-1 min-w-0">
                            {FileIcon && (
                                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-muted shrink-0">
                                    <FileIcon className="h-5 w-5 text-foreground" />
                                </div>
                            )}
                            <div className="flex-1 min-w-0">
                                <DialogTitle className="text-lg truncate">
                                    {currentEntry.filename}
                                </DialogTitle>
                                <div className="text-sm text-muted-foreground">
                                    {formatFileSize(currentEntry.file_size)}
                                    {showNavigation && (
                                        <span className="ml-2">
                                            {currentEntryIndex + 1} of {entries.length}
                                        </span>
                                    )}
                                </div>
                            </div>
                        </div>
                        <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => onOpenChange(false)}
                            className="shrink-0"
                        >
                            <X className="h-4 w-4" />
                        </Button>
                    </div>
                </DialogHeader>

                {/* Toolbar */}
                <div className="px-6 py-3 border-b bg-muted/30 shrink-0">
                    <div className="flex items-center gap-2">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleDownload}
                            disabled={isDownloading}
                            className="gap-2"
                        >
                            {isDownloading ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Downloading...
                                </>
                            ) : (
                                <>
                                    <Download className="h-4 w-4" />
                                    Download
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleCopy}
                            disabled={isCopying || fileContent instanceof Blob}
                            className="gap-2"
                        >
                            {isCopying ? (
                                <>
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Copying...
                                </>
                            ) : copySuccess ? (
                                <>
                                    <Check className="h-4 w-4 text-green-600" />
                                    Copied!
                                </>
                            ) : (
                                <>
                                    <Copy className="h-4 w-4" />
                                    Copy
                                </>
                            )}
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleEditSummary}
                            className="gap-2"
                        >
                            <Edit className="h-4 w-4" />
                            Edit Summary
                        </Button>
                    </div>
                </div>

                {/* Content Area */}
                <div className="flex-1 overflow-auto px-6 py-4">
                    {isLoading && (
                        <div className="space-y-3">
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-3/4" />
                            <Skeleton className="h-4 w-full" />
                            <Skeleton className="h-4 w-2/3" />
                        </div>
                    )}

                    {error && !isLoading && (
                        <div className="flex flex-col items-center justify-center h-full gap-4">
                            <AlertCircle className="h-12 w-12 text-destructive" />
                            <div className="text-center">
                                <h3 className="text-lg font-semibold mb-2">Failed to load file</h3>
                                <p className="text-sm text-muted-foreground mb-4">{error}</p>
                                <Button onClick={handleRetry} variant="outline">
                                    Retry
                                </Button>
                            </div>
                        </div>
                    )}

                    {!isLoading && !error && fileContent && (
                        <FileRenderer
                            content={typeof fileContent === 'string' ? fileContent : null}
                            binaryUrl={binaryUrl}
                            fileName={currentEntry.filename}
                            className="w-full h-full"
                        />
                    )}
                </div>

                {/* Navigation Footer */}
                {showNavigation && (
                    <div className="px-6 py-3 border-t bg-muted/30 flex items-center justify-between shrink-0">
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handlePrevious}
                            disabled={currentEntryIndex === 0 || isLoading}
                            className="gap-2"
                        >
                            <ChevronLeft className="h-4 w-4" />
                            Previous
                        </Button>
                        <span className="text-sm text-muted-foreground">
                            {currentEntryIndex + 1} of {entries.length}
                        </span>
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={handleNext}
                            disabled={currentEntryIndex === entries.length - 1 || isLoading}
                            className="gap-2"
                        >
                            Next
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    );
}
