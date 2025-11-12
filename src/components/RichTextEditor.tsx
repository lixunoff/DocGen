import React, { useEffect, useRef } from 'react';

interface RichTextEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}

const RichTextEditor: React.FC<RichTextEditorProps> = ({
  value,
  onChange,
  placeholder = '',
  label = ''
}) => {
  const editorRef = useRef<HTMLDivElement>(null);
  const quillRef = useRef<any>(null);

  useEffect(() => {
    if (typeof window !== 'undefined' && editorRef.current && !quillRef.current) {
      // Check if Quill is already initialized on this element
      if (editorRef.current.querySelector('.ql-editor')) {
        return;
      }

      // Dynamically import Quill to avoid SSR issues
      import('quill').then((Quill) => {
        if (!editorRef.current || quillRef.current) return; // Double check

        const quill = new Quill.default(editorRef.current as HTMLElement, {
          theme: 'snow',
          placeholder: placeholder,
          modules: {
            toolbar: [
              // Видалили [{ 'header': [1, 2, 3, false] }] - це і був випадаючий список "Normal"
              ['bold', 'italic', 'underline'],
              [{ 'list': 'ordered' }, { 'list': 'bullet' }],
              ['link'],
              ['clean']
            ]
          }
        });

        // Set initial content
        if (value) {
          quill.root.innerHTML = value;
        }

        // Listen for changes
        quill.on('text-change', () => {
          const html = quill.root.innerHTML;
          onChange(html);
        });

        quillRef.current = quill;
      });
    }

    // Cleanup
    return () => {
      if (quillRef.current) {
        quillRef.current = null;
      }
    };
  }, []); // Remove dependencies to prevent re-initialization

  // Update content when value prop changes externally
  useEffect(() => {
    if (quillRef.current && value !== quillRef.current.root.innerHTML) {
      quillRef.current.root.innerHTML = value;
    }
  }, [value]);

  return (
    <div className="w-full">
      {label && (
        <label className="block text-sm font-medium text-gray-700 mb-2">
          {label}
        </label>
      )}
      
      {/* Quill CSS */}
      <link 
        href="https://cdnjs.cloudflare.com/ajax/libs/quill/2.0.2/quill.snow.min.css" 
        rel="stylesheet" 
      />
      
      <div className="border border-gray-300 rounded-lg">
        <div ref={editorRef} style={{ minHeight: '200px' }} />
      </div>
      
      <style jsx>{`
        .ql-editor {
          min-height: 180px;
          font-family: 'Inter', sans-serif;
          font-size: 14px;
          line-height: 1.6;
        }
        
        .ql-toolbar {
          border-top-left-radius: 8px;
          border-top-right-radius: 8px;
          border-bottom: 1px solid #e5e7eb;
        }
        
        .ql-container {
          border-bottom-left-radius: 8px;
          border-bottom-right-radius: 8px;
          font-family: 'Inter', sans-serif;
        }
        
        .ql-editor.ql-blank::before {
          color: #9ca3af;
          font-style: normal;
        }
      `}</style>
    </div>
  );
};

export default RichTextEditor;