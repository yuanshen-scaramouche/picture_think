import React, { useState } from 'react';
import { ChatMessage } from '../types';
import { User, Bot, Sparkles, Copy, Check } from 'lucide-react';

interface ChatBubbleProps {
  message: ChatMessage;
}

export const ChatBubble: React.FC<ChatBubbleProps> = ({ message }) => {
  const isUser = message.role === 'user';
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    if (message.text) {
      navigator.clipboard.writeText(message.text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  return (
    <div className={`flex w-full mb-6 ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`flex max-w-[85%] md:max-w-[70%] ${isUser ? 'flex-row-reverse' : 'flex-row'} gap-3 group`}>
        {/* Avatar */}
        <div className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
          isUser ? 'bg-indigo-600' : 'bg-emerald-600'
        }`}>
          {isUser ? <User size={16} className="text-white" /> : <Bot size={16} className="text-white" />}
        </div>

        {/* Content */}
        <div className={`flex flex-col ${isUser ? 'items-end' : 'items-start'} min-w-0`}>
          <div className={`relative px-4 py-3 rounded-2xl ${
            isUser 
              ? 'bg-indigo-600 text-white rounded-tr-sm' 
              : 'bg-panel border border-slate-700 text-slate-200 rounded-tl-sm'
          }`}>
            {message.image && (
              <div className="mb-3 rounded-lg overflow-hidden border border-white/10 bg-black/20">
                <img 
                  src={message.image} 
                  alt="用户上传图片" 
                  className="max-w-full max-h-[300px] object-contain" 
                />
              </div>
            )}
            <div className="prose prose-invert prose-sm max-w-none whitespace-pre-wrap leading-relaxed break-words font-mono text-[13px] md:text-sm">
              {message.text || (message.isStreaming && <span className="animate-pulse">思考中...</span>)}
              {!message.text && !message.isStreaming && <span className="italic opacity-50">发送了一张图片</span>}
            </div>

            {/* Copy Button (Only for text content) */}
            {message.text && !message.isStreaming && (
              <button 
                onClick={handleCopy}
                className={`absolute ${isUser ? '-left-8' : '-right-8'} top-2 p-1.5 rounded-full 
                  opacity-0 group-hover:opacity-100 transition-all duration-200
                  ${isUser ? 'text-indigo-200 hover:bg-indigo-500' : 'text-slate-400 hover:bg-slate-700'}`}
                title="复制文本"
              >
                {copied ? <Check size={14} className="text-emerald-400" /> : <Copy size={14} />}
              </button>
            )}
          </div>
          
          {/* Timestamp/Status */}
          <div className="mt-1 text-xs text-slate-500 h-4">
            {message.role === 'model' && message.isStreaming && (
              <div className="flex items-center gap-1 text-emerald-400">
                <Sparkles size={10} />
                <span>生成中...</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};