import { useState, useRef, useEffect, useCallback } from 'react';
import { Send, Monitor, Square, Mic, Settings2, Trash2, Plus, MessageSquare, X, Paperclip, FileText } from 'lucide-react';
import { marked } from 'marked';
import { useAppStore } from '../../stores/appStore';
import { useAIStore, type AIMessage } from '../../stores/aiStore';
import { useSettingsStore } from '../../stores/settingsStore';

function AITab() {
  const { setActiveTab } = useAppStore();
  const {
    conversations,
    activeConversation,
    liveScreenActive,
    isStreaming,
    selectedModel,
    selectedProvider,
    setActiveConversation,
    setLiveScreenActive,
    setIsStreaming,
    createConversation,
    sendMessage,
    addAssistantMessage,
    deleteConversation,
    loadConversations,
  } = useAIStore();

  const settings = useSettingsStore();
  const { apiProviders, showCaptureIndicator, screenshotQuality } = settings;

  const [input, setInput] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [attachedFile, setAttachedFile] = useState<{ name: string; content: string; type: string } | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [showConversations, setShowConversations] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);

  // Load conversations on mount
  useEffect(() => {
    loadConversations();
  }, []);

  // Auto-scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConversation, conversations]);

  // Setup video element for screen capture
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // Setup speech recognition
  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    const recognition = new SpeechRecognition();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      setInput((prev) => {
        // Replace any existing listening content
        const lastInput = prev;
        return lastInput + (lastInput.endsWith(' ') ? '' : ' ') + transcript.trim();
      });
    };

    recognition.onerror = () => {
      setIsListening(false);
    };

    recognition.onend = () => {
      // Auto-restart if still in listening mode
      if (recognitionRef.current && isListening) {
        try {
          recognition.start();
        } catch {
          setIsListening(false);
        }
      }
    };

    recognitionRef.current = recognition;

    return () => {
      recognition.abort();
      recognitionRef.current = null;
    };
  }, [isListening]);

  const activeConv = conversations.find((c) => c.id === activeConversation);

  // Screen capture
  const startScreenCapture = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });
      setStream(mediaStream);
      setLiveScreenActive(true);
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
      const qualityMap = { low: 0.5, medium: 0.75, high: 0.95 };
      const quality = qualityMap[screenshotQuality] ?? 0.75;

      // Auto-crop: try to detect the proxy iframe
      if (showCaptureIndicator) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      } else {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }

      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }
      ctx.drawImage(video, 0, 0);
      canvas.toBlob(
        (blob) => {
          if (blob) {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result as string);
            reader.readAsDataURL(blob);
          } else {
            resolve(null);
          }
        },
        'image/jpeg',
        quality
      );
    });
  };

  // File upload handler
  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File too large. Maximum 10MB.');
      return;
    }

    try {
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFile({
            name: file.name,
            content: reader.result as string,
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      } else if (file.type.startsWith('text/') || file.name.endsWith('.json') || file.name.endsWith('.js') || file.name.endsWith('.ts') || file.name.endsWith('.py') || file.name.endsWith('.md')) {
        const text = await file.text();
        setAttachedFile({
          name: file.name,
          content: text,
          type: file.type || 'text/plain',
        });
      } else {
        // For other file types, read as base64
        const reader = new FileReader();
        reader.onloadend = () => {
          setAttachedFile({
            name: file.name,
            content: reader.result as string,
            type: file.type,
          });
        };
        reader.readAsDataURL(file);
      }
    } catch (err) {
      console.error('File processing failed:', err);
    }
  }, []);

  // Microphone toggle
  const toggleMicrophone = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
    } else {
      if (!recognitionRef.current) return;
      setInput((prev) => (prev ? prev + ' ' : ''));
      try {
        recognitionRef.current.start();
        setIsListening(true);
      } catch (err) {
        console.error('Speech recognition failed:', err);
        setIsListening(false);
      }
    }
  };

  // Suggested prompts handler
  const handlePromptClick = (prompt: string) => {
    setInput(prompt);
    // Auto-send after a brief delay to let the input update
    setTimeout(() => {
      handleSendWithText(prompt);
    }, 50);
  };

  // Get the active provider's config
  const getActiveProvider = () => {
    if (selectedProvider) {
      return apiProviders.find((p) => p.id === selectedProvider && p.active);
    }
    return apiProviders.find((p) => p.active);
  };

  // Send message with specific text (for prompts)
  const handleSendWithText = async (text: string) => {
    if (!text.trim() || isStreaming) return;
    await handleSendMessage(text.trim());
  };

  // Main send logic
  const handleSend = async () => {
    if (!input.trim() || isStreaming) return;
    await handleSendMessage(input.trim());
  };

  const handleSendMessage = async (text: string) => {
    let convId = activeConversation;

    // Create new conversation if none active
    if (!convId) {
      convId = await createConversation();
    }

    // Capture screenshot if live screen active
    let screenshot: string | null = null;
    if (liveScreenActive && stream) {
      screenshot = await captureScreenshot();
    }

    const userMessage: AIMessage = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: Date.now(),
      screenshot: screenshot || undefined,
    };

    setAttachedFile(null);
    setInput('');
    await sendMessage(convId, userMessage);
    setIsStreaming(true);

    // Call the real AI API
    const provider = getActiveProvider();
    if (!provider) {
      await addAssistantMessage(
        convId,
        'No AI API provider configured. Go to Settings > AI to add your API key and endpoint.'
      );
      return;
    }

    try {
      // Get all messages in current conversation for context
      const conv = conversations.find((c) => c.id === convId);
      const messageHistory = conv ? conv.messages : [];

      const systemPrompt = settings.systemPrompt
        ? [{ role: 'system' as const, content: settings.systemPrompt, timestamp: Date.now() }]
        : [];

      const requestBody = {
        messages: [...systemPrompt, ...messageHistory, userMessage],
        provider: provider.format,
        model: selectedModel,
        apiKey: provider.apiKey,
        baseUrl: provider.baseUrl,
        temperature: settings.temperature,
        maxTokens: settings.maxTokens,
      };

      const response = await fetch('/api/ai/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        const errData = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(errData.error || `API error: ${response.status}`);
      }

      // Read streaming response
      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error('No response body');
      }

      const decoder = new TextDecoder();
      let fullContent = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((line) => line.startsWith('data: '));

        for (const line of lines) {
          const data = line.slice(6);
          if (data === '[DONE]') continue;
          try {
            const parsed = JSON.parse(data);
            if (parsed.content) {
              fullContent += parsed.content;
            }
          } catch {
            // Skip invalid JSON
          }
        }
      }

      if (fullContent) {
        await addAssistantMessage(convId, fullContent);
      } else {
        await addAssistantMessage(convId, 'Received an empty response from the AI.');
      }
    } catch (error: any) {
      await addAssistantMessage(convId, `Error: ${error.message}`);
    }
  };

  const handleNewConversation = async () => {
    await createConversation();
    setInput('');
  };

  const handleDeleteConversation = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteConversation(id);
    if (activeConversation === id) {
      setActiveConversation(null);
    }
  };

  // Configure marked for markdown rendering
  marked.setOptions({ breaks: true, gfm: true });

  const renderMarkdown = (content: string) => {
    try {
      return { __html: marked.parse(content) };
    } catch {
      return { __html: content };
    }
  };

  return (
    <div className="h-full flex">
      {/* Hidden video for screen capture */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.py,.css,.html,.xml,.csv,.log"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) handleFileSelect(file);
          // Reset so same file can be re-selected
          e.target.value = '';
        }}
      />

      {/* Conversation sidebar (toggleable) */}
      {showConversations && (
        <div className="w-64 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex flex-col">
          <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-primary)]">
            <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
              Conversations
            </h3>
            <div className="flex gap-1">
              <button
                onClick={handleNewConversation}
                className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                title="New conversation"
              >
                <Plus size={14} />
              </button>
              <button
                onClick={() => setShowConversations(false)}
                className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
              >
                <X size={14} />
              </button>
            </div>
          </div>
          <div className="flex-1 overflow-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <p className="text-xs text-[var(--color-text-tertiary)] text-center py-4">
                No conversations yet
              </p>
            ) : (
              conversations.map((conv) => (
                <div
                  key={conv.id}
                  onClick={() => setActiveConversation(conv.id)}
                  className={`group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-colors ${
                    conv.id === activeConversation
                      ? 'bg-[var(--color-bg-primary)] text-[var(--color-text-primary)]'
                      : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]'
                  }`}
                >
                  <MessageSquare size={12} className="flex-shrink-0" />
                  <span className="flex-1 text-xs truncate">{conv.title}</span>
                  <button
                    onClick={(e) => handleDeleteConversation(conv.id, e)}
                    className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--color-text-tertiary)] hover:text-rose-500 transition-all"
                  >
                    <Trash2 size={10} />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* Main chat area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
          <div className="flex items-center gap-3">
            {!showConversations && (
              <button
                onClick={() => setShowConversations(true)}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
                title="Show conversations"
              >
                <MessageSquare size={14} />
              </button>
            )}
            <h2 className="text-sm font-semibold text-[var(--color-text-primary)]">
              {activeConv?.title || 'AI Assistant'}
            </h2>
            {liveScreenActive && stream && (
              <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                Screen sharing
              </span>
            )}
            {showCaptureIndicator && (
              <span
                className={`w-1.5 h-1.5 rounded-full transition-colors ${
                  isStreaming ? 'bg-amber-500 animate-pulse' : 'bg-[var(--color-text-tertiary)]'
                }`}
                title="AI activity"
              />
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
            <button
              onClick={() => setActiveTab('settings')}
              className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
            >
              <Settings2 size={14} />
            </button>
          </div>
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-auto p-4 space-y-4">
          {(!activeConv || activeConv.messages.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-[var(--color-text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                AI Assistant
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-sm">
                Ask anything. Use <strong>Live Screen</strong> to share your screen for context-aware responses.
              </p>
              <div className="flex gap-2 mt-4 flex-wrap justify-center">
                <button
                  onClick={() => handlePromptClick("What am I looking at?")}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  "What am I looking at?"
                </button>
                <button
                  onClick={() => handlePromptClick("Help me fill this form")}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  "Help me fill this form"
                </button>
                <button
                  onClick={() => handlePromptClick("Find the error")}
                  className="px-3 py-1.5 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors"
                >
                  "Find the error"
                </button>
              </div>
            </div>
          )}

          {activeConv?.messages.map((msg) => (
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
                {msg.role === 'assistant' ? (
                  <div
                    className="text-sm prose prose-sm prose-invert max-w-none"
                    dangerouslySetInnerHTML={renderMarkdown(msg.content)}
                  />
                ) : (
                  <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                )}
                {msg.screenshot && (
                  <img
                    src={msg.screenshot}
                    alt="Screenshot"
                    className="mt-2 rounded-lg max-w-full h-auto max-h-48 object-contain border border-[var(--color-border-primary)]"
                  />
                )}
                <div className="text-[10px] text-[var(--color-text-tertiary)] mt-1 opacity-60">
                  {new Date(msg.timestamp).toLocaleTimeString()}
                </div>
              </div>
            </div>
          ))}

          {isStreaming && (
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
          {/* Attached file preview */}
          {attachedFile && (
            <div className="flex items-center gap-2 mb-2 px-2 py-1.5 rounded-lg bg-[var(--color-bg-tertiary)] border border-[var(--color-border-primary)]">
              {attachedFile.type.startsWith('image/') ? (
                <img src={attachedFile.content} alt={attachedFile.name} className="w-10 h-10 rounded object-cover" />
              ) : (
                <FileText size={16} className="text-[var(--color-text-secondary)]" />
              )}
              <span className="text-xs text-[var(--color-text-secondary)] flex-1 truncate">
                {attachedFile.name}
              </span>
              <button
                onClick={() => setAttachedFile(null)}
                className="p-0.5 rounded hover:bg-[var(--color-bg-primary)] text-[var(--color-text-tertiary)]"
              >
                <X size={12} />
              </button>
            </div>
          )}
          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
              title="Attach image or file"
            >
              <Paperclip size={18} />
            </button>
            <button
              onClick={toggleMicrophone}
              className={`p-2 rounded-lg transition-colors ${
                isListening
                  ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                  : 'hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]'
              }`}
              title={isListening ? 'Stop listening' : 'Voice input'}
            >
              <Mic size={18} />
            </button>
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSend();
                }
              }}
              placeholder={isListening ? 'Listening...' : 'Ask anything...'}
              className="flex-1 input"
              disabled={isStreaming}
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || isStreaming}
              className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              <Send size={18} />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default AITab;
