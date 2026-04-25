import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkMath from 'remark-math';
import rehypeKatex from 'rehype-katex';
import remarkGfm from 'remark-gfm';
import 'katex/dist/katex.min.css';

interface MathTextProps {
  text: string;
  className?: string;
}

const MathText: React.FC<MathTextProps> = ({ text, className = '' }) => {
  return (
    <div className={`math-wrapper ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkMath, remarkGfm]}
        rehypePlugins={[rehypeKatex]}
        components={{
          // Custom styling for markdown elements to match our dashboard
          p: ({ children }) => <p className="mb-2 leading-relaxed">{children}</p>,
          ul: ({ children }) => <ul className="list-disc ml-6 mb-4 space-y-1">{children}</ul>,
          ol: ({ children }) => <ol className="list-decimal ml-6 mb-4 space-y-1">{children}</ol>,
          li: ({ children }) => <li className="opacity-90">{children}</li>,
          strong: ({ children }) => <strong className="font-bold text-indigo-300">{children}</strong>,
          em: ({ children }) => <em className="italic opacity-80">{children}</em>,
        }}
      >
        {text}
      </ReactMarkdown>

      <style>{`
        .math-wrapper ul {
          list-style-type: disc;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .math-wrapper ol {
          list-style-type: decimal;
          margin-left: 1.5rem;
          margin-bottom: 1rem;
        }
        .math-wrapper li {
          margin-bottom: 0.25rem;
        }
        .math-wrapper p:last-child {
          margin-bottom: 0;
        }
        /* KaTeX specific tweaks */
        .katex-display {
          margin: 1rem 0;
          overflow-x: auto;
          overflow-y: hidden;
        }
      `}</style>
    </div>
  );
};

export default MathText;
