import React, { useState, useEffect, useRef } from 'react';
import { Send, ImagePlus, Zap, Info, Download, Trash2, Menu } from 'lucide-react';
import { ChatMessage } from './types';
import { streamResponse } from './services/geminiService';
import { ChatBubble } from './components/ChatBubble';
import { ImageUploader } from './components/ImageUploader';

export default function App() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachedImage, setAttachedImage] = useState<{ data: string; mimeType: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleImageSelected = (base64: string, mimeType: string) => {
    setAttachedImage({ data: base64, mimeType });
  };

  const handleClearChat = () => {
    if (window.confirm("确定要清空所有聊天记录吗？")) {
      setMessages([]);
      setAttachedImage(null);
      setInput('');
    }
  };

  const handleExportChat = () => {
    if (messages.length === 0) return;
    
    const content = messages.map(msg => {
      const role = msg.role === 'user' ? '用户' : '模型';
      return `### ${role}\n${msg.text}\n`;
    }).join('\n---\n\n');

    const blob = new Blob([content], { type: 'text/markdown' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `vision-chat-export-${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSendMessage = async () => {
    if ((!input.trim() && !attachedImage) || isLoading) return;

    const newUserMessage: ChatMessage = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
      image: attachedImage?.data,
    };

    setMessages(prev => [...prev, newUserMessage]);
    setInput('');
    setAttachedImage(null);
    setIsLoading(true);

    const botMessageId = (Date.now() + 1).toString();
    const initialBotMessage: ChatMessage = {
      id: botMessageId,
      role: 'model',
      text: '',
      isStreaming: true
    };

    setMessages(prev => [...prev, initialBotMessage]);

    try {
      await streamResponse(
        messages, 
        newUserMessage.text,
        newUserMessage.image ? { data: newUserMessage.image, mimeType: 'image/png' } : null,
        (chunk) => {
          setMessages(prev => prev.map(msg => 
            msg.id === botMessageId 
              ? { ...msg, text: msg.text + chunk }
              : msg
          ));
        }
      );
    } catch (error) {
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, text: "抱歉，处理您的请求时遇到了错误，请稍后重试。" }
          : msg
      ));
    } finally {
      setIsLoading(false);
      setMessages(prev => prev.map(msg => 
        msg.id === botMessageId 
          ? { ...msg, isStreaming: false }
          : msg
      ));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex h-screen w-full bg-darker text-slate-200 overflow-hidden font-sans">
      
      {/* Sidebar */}
      <div className="hidden md:flex flex-col w-64 bg-dark border-r border-slate-800 p-4">
        <div className="flex items-center gap-2 mb-8 px-2">
          <div className="w-8 h-8 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
            <Zap size={20} className="text-white" />
          </div>
          <h1 className="font-bold text-lg tracking-tight">视觉助手</h1>
        </div>
        
        <div className="flex-1 overflow-y-auto">
          <div className="px-2 py-1 text-xs font-semibold text-slate-500 uppercase tracking-wider mb-2">
            核心功能
          </div>
          <ul className="space-y-1">
            <li className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md transition-colors cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
              图像智能分析
            </li>
            <li className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md transition-colors cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
              ASCII 艺术解读
            </li>
            <li className="flex items-center gap-3 px-3 py-2 text-sm text-slate-400 hover:text-slate-200 hover:bg-slate-800/50 rounded-md transition-colors cursor-default">
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500"></span>
              代码截图识别
            </li>
          </ul>

          <div className="mt-8 px-4 py-4 rounded-xl bg-slate-800/30 border border-slate-800">
             <div className="flex items-start gap-2">
                <Info size={16} className="text-indigo-400 mt-0.5 shrink-0" />
                <p className="text-xs text-slate-400 leading-relaxed">
                  上传任何图片、截图或字符画。Gemini 2.5 Flash 模型将为您提供精准的视觉解读。
                </p>
             </div>
          </div>
        </div>

        <div className="mt-auto pt-4 border-t border-slate-800 text-xs text-slate-600 text-center">
          由 Gemini 2.5 Flash 驱动
        </div>
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col relative bg-gradient-to-b from-darker to-[#050b1d]">
        
        {/* Chat Header */}
        <div className="h-14 border-b border-slate-800 bg-dark/50 backdrop-blur-sm flex items-center justify-between px-4 md:px-6">
          <div className="md:hidden flex items-center gap-2">
            <div className="w-6 h-6 rounded bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="font-bold text-sm">视觉助手</span>
          </div>
          <div className="hidden md:block"></div> {/* Spacer */}
          
          <div className="flex items-center gap-2">
            <button 
              onClick={handleExportChat}
              disabled={messages.length === 0}
              className="p-2 text-slate-400 hover:text-indigo-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="导出为 Markdown"
            >
              <Download size={18} />
            </button>
            <button 
              onClick={handleClearChat}
              disabled={messages.length === 0}
              className="p-2 text-slate-400 hover:text-red-400 hover:bg-slate-800 rounded-lg transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              title="清空聊天"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-8 scroll-smooth">
          <div className="max-w-3xl mx-auto">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-[50vh] text-center text-slate-500">
                <div className="w-16 h-16 bg-slate-800/50 rounded-2xl flex items-center justify-center mb-4">
                  <ImagePlus size={32} className="text-indigo-500 opacity-80" />
                </div>
                <h2 className="text-xl font-medium text-slate-300 mb-2">想要分析什么？</h2>
                <p className="max-w-sm text-sm">上传图片、图表或 ASCII 字符画即可开始对话。</p>
              </div>
            ) : (
              messages.map(msg => <ChatBubble key={msg.id} message={msg} />)
            )}
            <div ref={messagesEndRef} />
          </div>
        </div>

        {/* Input Area */}
        <div className="p-4 bg-dark/80 backdrop-blur-md border-t border-slate-800">
          <div className="max-w-3xl mx-auto">
            <div className="flex flex-col gap-2 p-2 bg-panel rounded-xl border border-slate-700 shadow-2xl">
              
              {/* Text Area */}
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="关于这张图，想问点什么..."
                className="w-full bg-transparent text-slate-200 placeholder-slate-500 resize-none outline-none p-2 h-12 max-h-32 font-medium font-mono text-sm"
                rows={1}
              />

              {/* Toolbar */}
              <div className="flex items-center justify-between px-1 pb-1">
                <div className="flex items-center gap-2">
                  <ImageUploader 
                    onImageSelected={handleImageSelected} 
                    selectedImage={attachedImage?.data || null}
                    onClear={() => setAttachedImage(null)}
                  />
                </div>
                
                <button
                  onClick={handleSendMessage}
                  disabled={(!input.trim() && !attachedImage) || isLoading}
                  className={`p-2 rounded-lg transition-all duration-200 flex items-center gap-2
                    ${(!input.trim() && !attachedImage) || isLoading
                      ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                      : 'bg-indigo-600 text-white hover:bg-indigo-500 shadow-lg shadow-indigo-500/20'
                    }`}
                >
                  <span className="text-sm font-medium hidden sm:inline">发送</span>
                  <Send size={16} />
                </button>
              </div>
            </div>
            <div className="text-center mt-2">
              <p className="text-[10px] text-slate-600">
                Gemini 可能会产生不准确的信息（包括关于人物的信息），请注意核查。
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}