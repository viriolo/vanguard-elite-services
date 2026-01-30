'use client';

import { useEffect, useRef, useState } from 'react';
import Prism from 'prismjs';
import 'prismjs/components/prism-markdown';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export default function MarkdownEditor({ value, onChange, placeholder }: MarkdownEditorProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const preRef = useRef<HTMLPreElement>(null);
  const [scrollTop, setScrollTop] = useState(0);

  // Sync scroll between textarea and highlighted code
  const handleScroll = () => {
    if (textareaRef.current && preRef.current) {
      preRef.current.scrollTop = textareaRef.current.scrollTop;
      preRef.current.scrollLeft = textareaRef.current.scrollLeft;
    }
  };

  // Highlight the markdown
  const highlightedCode = Prism.highlight(
    value,
    Prism.languages.markdown,
    'markdown'
  );

  return (
    <div className="relative w-full h-full overflow-hidden">
      {/* Highlighted code layer (background) */}
      <pre
        ref={preRef}
        className="absolute inset-0 m-0 p-6 overflow-hidden pointer-events-none font-mono text-sm leading-relaxed whitespace-pre-wrap break-words"
        aria-hidden="true"
      >
        <code
          className="language-markdown"
          dangerouslySetInnerHTML={{ __html: highlightedCode + '<br />' }}
        />
      </pre>

      {/* Textarea layer (foreground) */}
      <textarea
        ref={textareaRef}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        onScroll={handleScroll}
        className="markdown-editor-textarea absolute inset-0 w-full h-full p-6 font-mono text-sm leading-relaxed resize-none focus:outline-none bg-transparent text-transparent caret-slate-800 selection:bg-blue-200 selection:text-transparent"
        placeholder={placeholder}
        spellCheck={false}
        style={{ 
          tabSize: 2,
          lineHeight: '1.8',
        }}
      />

      <style jsx>{`
        pre[class*="language-"],
        code[class*="language-"] {
          color: #334155;
          text-shadow: none;
          font-family: 'JetBrains Mono', 'Fira Code', monospace;
        }
        
        /* Markdown token colors */
        .token.title,
        .token.title.important {
          color: #dc2626;
          font-weight: bold;
        }
        
        .token.bold {
          color: #2563eb;
          font-weight: bold;
        }
        
        .token.italic {
          color: #7c3aed;
          font-style: italic;
        }
        
        .token.list {
          color: #059669;
        }
        
        .token.code {
          color: #ea580c;
          background: #f1f5f9;
          padding: 0.1rem 0.3rem;
          border-radius: 0.25rem;
        }
        
        .token.code-block {
          color: #334155;
          background: #f8fafc;
          display: block;
          padding: 0.5rem;
          border-radius: 0.375rem;
          margin: 0.25rem 0;
        }
        
        .token.blockquote {
          color: #64748b;
          border-left: 3px solid #cbd5e1;
          padding-left: 0.75rem;
          margin-left: 0;
          font-style: italic;
        }
        
        .token.url,
        .token.link {
          color: #2563eb;
          text-decoration: underline;
        }
        
        .token.table {
          color: #475569;
        }
        
        .token.table-header {
          color: #1e293b;
          font-weight: bold;
        }
        
        .token.hr {
          color: #cbd5e1;
        }
        
        .token.comment {
          color: #94a3b8;
          font-style: italic;
        }
        
        .token.strike {
          color: #64748b;
          text-decoration: line-through;
        }
      `}</style>
    </div>
  );
}
