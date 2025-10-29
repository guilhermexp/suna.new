# Requirements: kb-document-preview

## 1. Overview

Goal: Add document preview and download functionality to the Knowledge Base page, allowing users to view the full content of uploaded files directly in the UI, similar to the preview functionality available in agent chat threads.

User Problem: Currently, users can only see LLM-generated summaries of their Knowledge Base files (200-300 words). They cannot view the original document content, download files, or verify what was actually uploaded. This limitation prevents users from confirming file contents and makes the Knowledge Base feel incomplete.

## 2. Functional Requirements

### 2.1 Document Preview Modal

FR-1: Users shall be able to click on any Knowledge Base entry to open a full-screen preview modal showing the original file content.

WHEN a user clicks on a Knowledge Base file entry THEN the system SHALL open a preview modal displaying the file content using the same rendering system as agent chat threads.

FR-2: The preview modal shall support all file types currently supported by the file rendering system.

WHEN the modal opens THEN the system SHALL render the file using FileRenderer component supporting: markdown, code files (JS/TS/Python/etc), PDF, images (PNG/JPG/GIF/etc), CSV, XLSX, HTML, and plain text.

FR-3: Users shall be able to download the original file from the preview modal.

WHEN a user clicks the Download button in the preview modal THEN the system SHALL fetch a signed URL from the backend AND initiate a browser download of the original file with its original filename.

FR-4: Users shall be able to copy the file content to clipboard.

WHEN a user clicks Copy Content button AND the file is text-based THEN the system SHALL copy the full file content to the user's clipboard AND show a success toast notification.

### 2.2 Preview Cards in File List

FR-5: File entries in the Knowledge Base tree shall display thumbnail/icon previews.

WHEN displaying files in the expanded folder view THEN each file entry SHALL show an appropriate icon or thumbnail based on file type (document icon for text, image thumbnail for images, PDF icon for PDFs, etc).

FR-6: File cards shall display metadata including filename, size, and upload date.

WHEN hovering over a file entry THEN the system SHALL show a tooltip with full filename AND file size AND upload date in a readable format.

### 2.3 Backend API Endpoints

FR-7: Backend shall provide an endpoint to fetch file content from S3 storage.

WHEN frontend requests GET /knowledge-base/entries/{entry_id}/content THEN the system SHALL verify user ownership AND return the file content with appropriate Content-Type header.

FR-8: Backend shall provide an endpoint to generate signed download URLs.

WHEN frontend requests GET /knowledge-base/entries/{entry_id}/download-url THEN the system SHALL verify ownership AND generate a time-limited signed S3 URL valid for 5 minutes AND return the URL to the client.

FR-9: Backend shall support streaming large files efficiently.

WHEN serving file content over 10MB THEN the system SHALL stream the response in chunks to avoid memory issues AND support HTTP range requests for partial content.

### 2.4 Integration with Existing Components

FR-10: Preview functionality shall reuse existing FileRenderer components from agent chat.

WHEN rendering file content THEN the system SHALL use the same FileRenderer, MarkdownRenderer, CodeRenderer, PdfRenderer, ImageRenderer, CsvRenderer, and XlsxRenderer components used in thread/file-viewer-modal.tsx.

FR-11: Preview modal shall maintain consistent UI/UX with the rest of the Knowledge Base page.

WHEN the preview modal is displayed THEN it SHALL use the same design system (shadcn/ui components) AND color scheme AND typography as the Knowledge Base page.

## 3. Technical Requirements

### 3.1 Performance

TR-1: File content shall be cached to avoid redundant S3 requests.

WHEN a file is previewed THEN the system SHALL cache the content in browser memory for the session duration AND reuse cached content on subsequent previews of the same file.

TR-2: Large file previews shall load progressively.

WHEN previewing files over 5MB THEN the system SHALL show a loading indicator AND render content progressively as it loads.

TR-3: Thumbnail generation shall not block UI rendering.

WHEN displaying file lists with many entries THEN thumbnail loading SHALL be lazy-loaded AND use placeholder icons while loading.

### 3.2 Security

TR-4: All file access shall verify user ownership.

WHEN any file content or download URL is requested THEN the backend SHALL verify the requesting user's account_id matches the file's account_id through RLS policies AND JWT authentication.

TR-5: Download URLs shall be time-limited and single-use where possible.

WHEN generating signed download URLs THEN the system SHALL set expiration to 5 minutes AND URLs SHALL be revoked after first use if S3 configuration allows.

TR-6: File content shall be sanitized before rendering.

WHEN rendering HTML or markdown content THEN the system SHALL sanitize content to prevent XSS attacks using the existing sanitization in FileRenderer components.

### 3.3 Constraints

TR-7: Implementation shall use existing Supabase Storage infrastructure.

The system SHALL fetch files from the existing Supabase Storage bucket 'file-uploads' using the file_path stored in knowledge_base_entries table.

TR-8: Implementation shall not modify existing database schema.

The system SHALL work with the current knowledge_base_folders and knowledge_base_entries tables without adding new columns or tables.

TR-9: Implementation shall maintain backward compatibility.

The system SHALL not break existing Knowledge Base functionality including folder management, file upload, summary editing, and agent assignments.

## 4. Acceptance Criteria

AC-1: GIVEN I have uploaded a markdown file to my Knowledge Base WHEN I click on the file entry THEN I SHALL see a modal displaying the full formatted markdown content with proper styling and images rendered.

AC-2: GIVEN I am viewing a file preview WHEN I click the Download button THEN the original file SHALL download to my browser with the correct filename and file type.

AC-3: GIVEN I have uploaded a PDF document WHEN I open the preview modal THEN I SHALL see the PDF rendered inline with page navigation controls.

AC-4: GIVEN I have uploaded an image file WHEN I click on it THEN I SHALL see the full-resolution image displayed in the preview modal with zoom controls.

AC-5: GIVEN I have uploaded a CSV or XLSX file WHEN I preview it THEN I SHALL see the data rendered in a formatted table with column headers and proper alignment.

AC-6: GIVEN I am viewing a code file (JS, Python, etc) WHEN I open the preview THEN I SHALL see syntax-highlighted code with line numbers.

AC-7: GIVEN I have multiple files in a folder WHEN I open preview for one file THEN I SHALL be able to navigate to next/previous files using arrow keys or navigation buttons.

AC-8: GIVEN I open a file preview WHEN I click Copy Content button THEN the full text content SHALL be copied to clipboard AND I SHALL see a success notification.

AC-9: GIVEN I try to preview a file I do not own WHEN the backend receives the request THEN it SHALL return 404 Not Found AND no content SHALL be exposed.

AC-10: GIVEN the Knowledge Base page loads WHEN I expand a folder with files THEN I SHALL see file entries with appropriate icons and metadata displayed in a grid or list layout.

## 5. Out of Scope

The following features are explicitly NOT included in this implementation:

- Inline editing of file content (read-only preview only)
- Annotation or commenting on documents
- Version history or file diffing
- Real-time collaboration on documents
- Converting file formats (e.g., Word to PDF)
- OCR for scanned documents
- Video or audio file playback
- Archive file (.zip, .tar) extraction and browsing
- Search within document content (full-text search)
- Automatic thumbnail generation for PDF first pages
- File comparison side-by-side view

These may be considered for future iterations but are not part of the current scope.