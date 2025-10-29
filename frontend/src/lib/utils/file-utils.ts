import {
  File,
  FileText,
  FileCode,
  FileSpreadsheet,
  FileImage,
  FileVideo,
  FileAudio,
  FileArchive,
  type LucideIcon,
} from "lucide-react";

/**
 * File type categories
 */
export type FileCategory =
  | "image"
  | "pdf"
  | "markdown"
  | "code"
  | "csv"
  | "xlsx"
  | "video"
  | "audio"
  | "archive"
  | "text"
  | "unknown";

/**
 * Get the appropriate Lucide icon for a file based on its extension
 */
export function getFileIcon(filename: string): LucideIcon {
  const extension = filename.split(".").pop()?.toLowerCase() || "";

  // Images
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"].includes(extension)) {
    return FileImage;
  }

  // Documents
  if (["pdf", "doc", "docx"].includes(extension)) {
    return FileText;
  }

  // Spreadsheets
  if (["xlsx", "xls", "csv"].includes(extension)) {
    return FileSpreadsheet;
  }

  // Code files
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "h",
      "hpp",
      "cs",
      "go",
      "rs",
      "php",
      "rb",
      "swift",
      "kt",
      "scala",
      "sh",
      "bash",
      "json",
      "xml",
      "yaml",
      "yml",
      "html",
      "css",
      "scss",
      "sass",
      "less",
      "sql",
    ].includes(extension)
  ) {
    return FileCode;
  }

  // Video
  if (["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv"].includes(extension)) {
    return FileVideo;
  }

  // Audio
  if (["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"].includes(extension)) {
    return FileAudio;
  }

  // Archives
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(extension)) {
    return FileArchive;
  }

  // Text files
  if (["txt", "md", "markdown", "log", "rtf"].includes(extension)) {
    return FileText;
  }

  // Default
  return File;
}

/**
 * Get the file type category for a file based on its extension
 */
export function getFileType(filename: string): FileCategory {
  const extension = filename.split(".").pop()?.toLowerCase() || "";

  // Images
  if (["png", "jpg", "jpeg", "gif", "svg", "webp", "ico", "bmp"].includes(extension)) {
    return "image";
  }

  // PDF
  if (extension === "pdf") {
    return "pdf";
  }

  // Markdown
  if (["md", "markdown"].includes(extension)) {
    return "markdown";
  }

  // CSV
  if (extension === "csv") {
    return "csv";
  }

  // Excel
  if (["xlsx", "xls"].includes(extension)) {
    return "xlsx";
  }

  // Code files
  if (
    [
      "js",
      "ts",
      "jsx",
      "tsx",
      "py",
      "java",
      "cpp",
      "c",
      "h",
      "hpp",
      "cs",
      "go",
      "rs",
      "php",
      "rb",
      "swift",
      "kt",
      "scala",
      "sh",
      "bash",
      "json",
      "xml",
      "yaml",
      "yml",
      "html",
      "css",
      "scss",
      "sass",
      "less",
      "sql",
    ].includes(extension)
  ) {
    return "code";
  }

  // Video
  if (["mp4", "avi", "mov", "mkv", "webm", "flv", "wmv"].includes(extension)) {
    return "video";
  }

  // Audio
  if (["mp3", "wav", "ogg", "flac", "aac", "wma", "m4a"].includes(extension)) {
    return "audio";
  }

  // Archives
  if (["zip", "rar", "7z", "tar", "gz", "bz2", "xz"].includes(extension)) {
    return "archive";
  }

  // Text files
  if (["txt", "log", "rtf"].includes(extension)) {
    return "text";
  }

  return "unknown";
}

/**
 * Format file size in bytes to human-readable string
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return "0 Bytes";

  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB", "TB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}
