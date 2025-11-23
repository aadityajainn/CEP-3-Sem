import React from 'react';
import ReactMarkdown from 'react-markdown';

interface MarkdownRendererProps {
  content: string;
}

export const MarkdownRenderer: React.FC<MarkdownRendererProps> = ({ content }) => {
  return (
    <div className="prose prose-sm prose-slate max-w-none dark:prose-invert">
      <ReactMarkdown
        components={{
          ul: ({ node, ...props }) => <ul className="list-disc pl-4 my-2 space-y-1" {...props} />,
          ol: ({ node, ...props }) => <ol className="list-decimal pl-4 my-2 space-y-1" {...props} />,
          h1: ({ node, ...props }) => <h1 className="text-xl font-bold my-3" {...props} />,
          h2: ({ node, ...props }) => <h2 className="text-lg font-bold my-2" {...props} />,
          h3: ({ node, ...props }) => <h3 className="text-md font-semibold my-1" {...props} />,
          p: ({ node, ...props }) => <p className="my-2 leading-relaxed" {...props} />,
          code: ({ node, ...props }) => {
            // Extract inline from props. This is a common pattern in ReactMarkdown v9+ types
            // But for simple usage, we can just check className or presence of children
            const inline = props.className ? false : true;
             return inline ? (
              <code className="bg-slate-200 px-1 py-0.5 rounded text-slate-800 text-sm font-mono" {...props} />
            ) : (
              <div className="bg-slate-900 text-slate-100 p-3 rounded-md overflow-x-auto my-2">
                <code className="font-mono text-sm" {...props} />
              </div>
            );
          },
          blockquote: ({ node, ...props }) => (
            <blockquote className="border-l-4 border-primary-500 pl-4 italic my-2 text-slate-600 bg-slate-50 py-1" {...props} />
          ),
          table: ({ node, ...props }) => (
             <div className="overflow-x-auto my-4">
                <table className="min-w-full divide-y divide-gray-200 border border-gray-200" {...props} />
             </div>
          ),
          th: ({ node, ...props }) => (
            <th className="px-3 py-2 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider border-b" {...props} />
          ),
          td: ({ node, ...props }) => (
            <td className="px-3 py-2 whitespace-nowrap text-sm text-gray-500 border-b" {...props} />
          ),
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};