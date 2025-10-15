import DOMPurify from 'dompurify';
import type { ICommand, MDEditorProps } from '@uiw/react-md-editor';

/**
 * Markdown Editor Configuration
 *
 * This file contains configuration for the markdown editor including:
 * - Security settings with DOMPurify
 * - Editor commands and toolbar options
 * - Validation rules for markdown content
 */

// ============================================================================
// Security Configuration
// ============================================================================

/**
 * DOMPurify configuration for sanitizing markdown HTML output
 * Prevents XSS attacks while allowing safe HTML elements
 */
export const sanitizerConfig: any = {
  ALLOWED_TAGS: [
    // Text formatting
    'p',
    'br',
    'strong',
    'em',
    'u',
    's',
    'code',
    'pre',
    // Headers
    'h1',
    'h2',
    'h3',
    'h4',
    'h5',
    'h6',
    // Lists
    'ul',
    'ol',
    'li',
    // Links and images
    'a',
    'img',
    // Tables
    'table',
    'thead',
    'tbody',
    'tr',
    'th',
    'td',
    // Block elements
    'blockquote',
    'hr',
    'div',
    'span',
    // Task lists
    'input',
  ],
  ALLOWED_ATTR: [
    'href',
    'src',
    'alt',
    'title',
    'class',
    'id',
    'type',
    'checked',
    'disabled',
    'align',
    'width',
    'height',
  ],
  ALLOWED_URI_REGEXP:
    /^(?:(?:(?:f|ht)tps?|mailto|tel|callto|sms|cid|xmpp):|[^a-z]|[a-z+.\-]+(?:[^a-z+.\-:]|$))/i,
  KEEP_CONTENT: true,
  RETURN_DOM: false,
  RETURN_DOM_FRAGMENT: false,
};

/**
 * Sanitize markdown HTML content
 * @param html - Raw HTML string from markdown
 * @returns Sanitized HTML string
 */
export const sanitizeMarkdown = (html: string): string => {
  return DOMPurify.sanitize(html, sanitizerConfig) as unknown as string;
};

// ============================================================================
// Editor Configuration
// ============================================================================

/**
 * Default editor options
 */
export const defaultEditorOptions: Partial<MDEditorProps> = {
  preview: 'live',
  height: 500,
  enableScroll: true,
  highlightEnable: true,
  toolbarBottom: false,
};

/**
 * Preview mode options
 */
export type PreviewMode = 'edit' | 'live' | 'preview';

export const previewModes: Record<PreviewMode, string> = {
  edit: 'Edit only',
  live: 'Split view',
  preview: 'Preview only',
};

// ============================================================================
// Custom Commands
// ============================================================================

/**
 * Custom toolbar commands for the markdown editor
 * These extend the default commands provided by @uiw/react-md-editor
 */
export const customCommands: ICommand[] = [
  // Add custom commands here as needed
];

// ============================================================================
// Validation
// ============================================================================

/**
 * Maximum content length for markdown (in characters)
 */
export const MAX_CONTENT_LENGTH = 50000;

/**
 * Maximum file size for uploads (in bytes)
 * Default: 5MB
 */
export const MAX_FILE_SIZE = 5 * 1024 * 1024;

/**
 * Allowed image types for markdown
 */
export const ALLOWED_IMAGE_TYPES = [
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/gif',
  'image/webp',
  'image/svg+xml',
];

/**
 * Validation result type
 */
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * Validate markdown content
 * @param content - Markdown content to validate
 * @returns Validation result with errors if any
 */
export const validateMarkdownContent = (content: string): ValidationResult => {
  const errors: string[] = [];

  // Check content length
  if (content.length > MAX_CONTENT_LENGTH) {
    errors.push(
      `Content exceeds maximum length of ${MAX_CONTENT_LENGTH} characters`,
    );
  }

  // Check for empty content
  if (!content.trim()) {
    errors.push('Content cannot be empty');
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

/**
 * Validate file upload
 * @param file - File to validate
 * @returns Validation result with errors if any
 */
export const validateFileUpload = (file: File): ValidationResult => {
  const errors: string[] = [];

  // Check file size
  if (file.size > MAX_FILE_SIZE) {
    errors.push(
      `File size exceeds maximum of ${MAX_FILE_SIZE / 1024 / 1024}MB`,
    );
  }

  // Check file type for images
  if (
    file.type.startsWith('image/') &&
    !ALLOWED_IMAGE_TYPES.includes(file.type)
  ) {
    errors.push(`Image type ${file.type} is not allowed`);
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// Utility Functions
// ============================================================================

/**
 * Get word count from markdown content
 * @param content - Markdown content
 * @returns Word count
 */
export const getWordCount = (content: string): number => {
  // Remove markdown syntax and count words
  const plainText = content
    .replace(/[#*_~`\[\]()]/g, '') // Remove markdown syntax
    .replace(/!\[.*?\]\(.*?\)/g, '') // Remove images
    .replace(/\[.*?\]\(.*?\)/g, '') // Remove links
    .trim();

  if (!plainText) return 0;

  return plainText.split(/\s+/).length;
};

/**
 * Get character count from markdown content
 * @param content - Markdown content
 * @returns Character count
 */
export const getCharCount = (content: string): number => {
  return content.length;
};

/**
 * Estimate reading time based on content
 * @param content - Markdown content
 * @returns Reading time in minutes
 */
export const getReadingTime = (content: string): number => {
  const wordsPerMinute = 200;
  const wordCount = getWordCount(content);
  return Math.ceil(wordCount / wordsPerMinute);
};

// ============================================================================
// Export all
