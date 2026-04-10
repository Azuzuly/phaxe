import { useState, useRef, useEffect } from 'react';
import { Send, Monitor, Square, Image, Mic, Settings2 } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
  screenshot?: string;
}

function AITab() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [liveScreenActive, setLiveScreenActive] = useState(false);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  const startScreenCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { cursor: 'always' },
        audio: false,
      });
      setStream(mediaStream);
      mediaStream.getVideoTracks()[0].onended = () => {
        setStream(null);
        setLiveScreenActive(false);
      };
    } catch (err) {
      console.error('Screen capture failed:', err);
    }
  };

  const stopScreenCapture = () => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setLiveScreenActive(false);
  };

  const captureScreenshot = (): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!videoRef.current || !stream) {
        resolve(null);
        return;
      }
      const video = videoRef.current;
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob((blob) => {
        if (blob) {
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        } else {
          resolve(null);
        }
      }, 'image/jpeg', 0.8);
    });
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input.trim(),
      timestamp: Date.now(),
    };

    let screenshot: string | null = null;
    if (liveScreenActive && stream) {
      screenshot = await captureScreenshot();
      userMessage.screenshot = screenshot || undefined;
    }

    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Simulate AI response (replace with actual API call)
    setTimeout(() => {
      const aiMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: screenshot
          ? "I can see your screen. Based on what you're showing me, here's my analysis..."
          : "I'm ready to help! Connect your AI API in Settings to get started.",
        timestamp: Date.now(),
      };
      setMessages((prev) => [...prev, aiMessage]);
      setIsLoading(false);
    }, 1500);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Hidden video element for screen capture */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-3">
          <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
            AI Assistant
          </h2>
          {liveScreenActive && (
            <span className="flex items-center gap-1.5 text-xs text-emerald-500">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Screen sharing
            </span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={liveScreenActive ? stopScreenCapture : startScreenCapture}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              liveScreenActive
                ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
            }`}
          >
            {liveScreenActive ? <Square size={12} /> : <Monitor size={12} />}
            {liveScreenActive ? 'Stop' : 'Live Screen'}
          </button>
          <button className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors">
            <Settings2 size={14} />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-auto p-4 space-y-4">
        {messages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4">
              <Monitor size={24} className="text-[var(--color-text-tertiary)]" />
            </div>
            <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
              AI Assistant
            </h3>
            <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
              Ask anything. Use <strong>Live Screen</strong> to share your screen for context-aware responses.
            </p>
            <div className="flex gap-2 mt-4">
              <button className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                "What am I looking at?"
              </button>
              <button className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                "Help me fill this form"
              </button>
              <button className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors">
                "Find the error"
              </button>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
          >
            <div
              className={`max-w-[80%] rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-primary-600 text-white rounded-br-md'
                  : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-bl-md'
              }`}
            >
              <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
              {msg.screenshot && (
                <img
                  src={msg.screenshot}
                  alt="Screenshot"
                  className="mt-2 rounded-lg max-w-full h-auto max-h-48 object-contain"
                />
              )}
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start animate-slide-up">
            <div className="bg-[var(--color-bg-tertiary)] rounded-2xl rounded-bl-md px-4 py-3">
              <div className="flex gap-1">
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse" style={{ animationDelay: '0ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse" style={{ animationDelay: '200ms' }} />
                <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse" style={{ animationDelay: '400ms' }} />
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="px-4 py-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
        <div className="flex items-center gap-2">
          <button className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors" title="Attach image">
            <Image size={18} />
          </button>
          <button className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors" title="Voice input">
            <Mic size={18} />
          </button>
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && handleSend()}
            placeholder="Ask anything..."
            className="flex-1 input"
            disabled={isLoading}
          />
          <button
            onClick={handleSend}
            disabled={!input.trim() || isLoading}
            className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  );
}

export default AITab;
