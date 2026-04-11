import { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import {
  Send,
  Monitor,
  Square,
  Mic,
  Settings2,
  Trash2,
  Plus,
  MessageSquare,
  X,
  Paperclip,
  FileText,
  ChevronDown,
  Search,
  Pin,
  PinOff,
  Info,
  Copy,
  Edit3,
  RefreshCw,
  PictureInPicture2,
  Maximize2,
} from 'lucide-react';
import { marked } from 'marked';
import { useAppStore } from '../../stores/appStore';
import { useAIStore, type AIFileAttachment, type AIMessage } from '../../stores/aiStore';
import { useSettingsStore } from '../../stores/settingsStore';
import { buildApiUrl } from '../../config';
import { MODEL_CATALOG, type ModelSpec } from '../../lib/models';
import { chatWithPuterStream, isSignedIn, signIn } from '../../lib/puter';

type ProviderFormat = 'openai' | 'anthropic' | 'gemini' | 'custom' | 'puter';

interface ProviderOption {
  id: string;
  name: string;
  baseUrl: string;
  apiKey: string;
  format: ProviderFormat;
  active: boolean;
  unavailable?: boolean;
}

interface MessageImagePreview {
  src: string;
  label: string;
}

const modalityIcon: Record<string, string> = {
  text: '📝',
  image: '🖼️',
  video: '🎬',
  audio: '🔊',
  file: '📎',
};

const normalizeProviderLabel = (name: string) => {
  if (name === 'OpenRouter (Free)') return 'Phaxe';
  if (name === 'OpenRouter (Blocked)') return 'Phaxe (Unavailable)';
  return name.replace(/puter/gi, 'Phaxe');
};

const cleanModelName = (modelId: string) => {
  if (!modelId) return 'Select a model';
  const known = MODEL_CATALOG.find((m) => m.id === modelId);
  if (known) return known.name;

  const tail = modelId.includes('/') ? modelId.split('/').pop() || modelId : modelId;
  return tail
    .replace(/[:_-]free$/i, '')
    .replace(/[-_]+/g, ' ')
    .replace(/\b\w/g, (c) => c.toUpperCase());
};

const getMimeFromDataUrl = (value: string) => {
  const match = value.match(/^data:(.*?);base64,/);
  return match?.[1] || 'image/jpeg';
};

const getBase64FromDataUrl = (value: string) => {
  if (!value) return '';
  if (value.startsWith('data:')) return value.split(',')[1] || '';
  return value;
};

const decodeHtmlEntities = (value: string) =>
  value
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'");

const injectCodeCopyButtons = (html: string) =>
  html.replace(/<pre><code([^>]*)>([\s\S]*?)<\/code><\/pre>/g, (_m, codeAttrs, codeHtml) => {
    const plain = decodeHtmlEntities(codeHtml);
    const encoded = encodeURIComponent(plain);
    return `<div class="phx-code-block"><button type="button" class="code-copy-btn" data-code="${encoded}">Copy</button><pre><code${codeAttrs}>${codeHtml}</code></pre></div>`;
  });

const formatRelativeTime = (timestamp: number) => {
  const diffMs = Date.now() - timestamp;
  const sec = Math.floor(diffMs / 1000);
  if (sec < 10) return 'just now';
  if (sec < 60) return `${sec}s ago`;
  const min = Math.floor(sec / 60);
  if (min < 60) return `${min} min ago`;
  const hr = Math.floor(min / 60);
  if (hr < 24) return `${hr} hr ago`;
  const day = Math.floor(hr / 24);
  return `${day} day${day > 1 ? 's' : ''} ago`;
};

const attachmentToText = (attachment: AIFileAttachment) => {
  if (attachment.type.startsWith('image/')) return '';

  const raw = attachment.content || '';
  const clipped = raw.length > 12000 ? `${raw.slice(0, 12000)}\n...[truncated]` : raw;

  return `Attached file: ${attachment.name}\n\n\`\`\`\n${clipped}\n\`\`\``;
};

const collectImages = (msg: AIMessage): string[] => {
  const unique = new Set<string>();
  if (msg.screenshot) unique.add(msg.screenshot);
  (msg.imageAttachments || []).forEach((img) => unique.add(img));
  (msg.fileAttachments || [])
    .filter((file) => file.type.startsWith('image/') && file.content.startsWith('data:image/'))
    .forEach((file) => unique.add(file.content));
  return Array.from(unique);
};

const collectImagePreviews = (msg: AIMessage): MessageImagePreview[] => {
  const seen = new Set<string>();
  const previews: MessageImagePreview[] = [];

  if (msg.screenshot && !seen.has(msg.screenshot)) {
    previews.push({ src: msg.screenshot, label: 'Live screenshot' });
    seen.add(msg.screenshot);
  }

  (msg.fileAttachments || [])
    .filter((file) => file.type.startsWith('image/') && file.content.startsWith('data:image/'))
    .forEach((file) => {
      if (!seen.has(file.content)) {
        previews.push({ src: file.content, label: file.name });
        seen.add(file.content);
      }
    });

  (msg.imageAttachments || []).forEach((image, idx) => {
    if (!seen.has(image)) {
      previews.push({ src: image, label: `Image ${idx + 1}` });
      seen.add(image);
    }
  });

  return previews;
};

const getMessageText = (msg: AIMessage) => {
  const fileText = (msg.fileAttachments || [])
    .map(attachmentToText)
    .filter(Boolean)
    .join('\n\n');

  if (!fileText) return msg.content || '';
  return `${msg.content || ''}${msg.content ? '\n\n' : ''}${fileText}`;
};

marked.setOptions({ breaks: true, gfm: true });

function AITab() {
  const { setActiveTab } = useAppStore();
  const {
    conversations,
    activeConversation,
    liveScreenActive,
    pipActive,
    isStreaming,
    selectedModel,
    selectedProvider,
    setActiveConversation,
    setLiveScreenActive,
    setPipActive,
    setIsStreaming,
    setSelectedModel,
    setSelectedProvider,
    createConversation,
    sendMessage,
    addAssistantMessage,
    deleteConversation,
    loadConversations,
    deleteMessage,
    editMessage,
    regenerateMessage,
  } = useAIStore();

  const settings = useSettingsStore();
  const { apiProviders, showCaptureIndicator, screenshotQuality } = settings;

  const [input, setInput] = useState('');
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [attachedFile, setAttachedFile] = useState<AIFileAttachment | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [screenCaptureError, setScreenCaptureError] = useState<string | null>(null);
  const [showModelDropdown, setShowModelDropdown] = useState(false);
  const [showProviderDropdown, setShowProviderDropdown] = useState(false);
  const [showModelHelp, setShowModelHelp] = useState(false);
  const [showConversationSidebar, setShowConversationSidebar] = useState(true);
  const [modelSearch, setModelSearch] = useState('');
  const [customModelId, setCustomModelId] = useState('');
  const [enlargedImage, setEnlargedImage] = useState<string | null>(null);
  const [editingMessageId, setEditingMessageId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [copyFeedback, setCopyFeedback] = useState<string | null>(null);
  const [pinnedModels, setPinnedModels] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem('phaxe-pinned-models') || '[]');
    } catch {
      return [];
    }
  });
  const [phaxeAvailable, setPhaxeAvailable] = useState(false);
  const [phaxeSignedIn, setPhaxeSignedIn] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const captureVideoRef = useRef<HTMLVideoElement>(null);
  const pipPreviewVideoRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<SpeechRecognition | null>(null);
  const modelDropdownRef = useRef<HTMLDivElement>(null);
  const providerDropdownRef = useRef<HTMLDivElement>(null);
  const modelCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const providerCloseTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const activeConv = useMemo(
    () => conversations.find((c) => c.id === activeConversation) || null,
    [conversations, activeConversation]
  );

  const selectedModelSpec = useMemo(
    () => MODEL_CATALOG.find((model) => model.id === selectedModel),
    [selectedModel]
  );

  const providerOptions = useMemo<ProviderOption[]>(() => {
    const configuredProviders: ProviderOption[] = apiProviders
      .map((provider) => ({
        id: provider.id,
        name: normalizeProviderLabel(provider.name),
        baseUrl: provider.baseUrl,
        apiKey: provider.apiKey,
        format: provider.format as ProviderFormat,
        active: provider.active,
      }))
      .filter((provider) => provider.active);

    const freeProvider: ProviderOption = {
      id: 'phaxe-free',
      name: phaxeAvailable ? 'Phaxe' : 'Phaxe (Unavailable)',
      baseUrl: '',
      apiKey: '',
      format: 'puter',
      active: phaxeAvailable,
      unavailable: !phaxeAvailable,
    };

    return [freeProvider, ...configuredProviders];
  }, [apiProviders, phaxeAvailable]);

  const activeProvider = useMemo(() => {
    if (selectedProvider) {
      return providerOptions.find((provider) => provider.id === selectedProvider) || null;
    }
    return providerOptions.find((provider) => provider.active) || providerOptions[0] || null;
  }, [providerOptions, selectedProvider]);

  const pinnedSet = useMemo(() => new Set(pinnedModels), [pinnedModels]);

  const filteredModels = useMemo(() => {
    const query = modelSearch.trim().toLowerCase();
    if (!query) return MODEL_CATALOG;

    return MODEL_CATALOG.filter((model) => {
      const haystack = [
        model.name,
        model.id,
        model.provider,
        model.description,
        model.modalities.join(' '),
      ]
        .join(' ')
        .toLowerCase();

      return haystack.includes(query);
    });
  }, [modelSearch]);

  const pinnedVisibleModels = useMemo(
    () => filteredModels.filter((model) => pinnedSet.has(model.id)),
    [filteredModels, pinnedSet]
  );

  const groupedUnpinnedModels = useMemo(() => {
    const groups = new Map<string, ModelSpec[]>();

    filteredModels
      .filter((model) => !pinnedSet.has(model.id))
      .forEach((model) => {
        if (!groups.has(model.provider)) groups.set(model.provider, []);
        groups.get(model.provider)!.push(model);
      });

    return Array.from(groups.entries()).sort((a, b) => a[0].localeCompare(b[0]));
  }, [filteredModels, pinnedSet]);

  const clearCopyFeedbackLater = useCallback(() => {
    setTimeout(() => setCopyFeedback(null), 1200);
  }, []);

  const renderMarkdown = useCallback((content: string) => {
    try {
      const html = marked.parse(content || '') as string;
      return { __html: injectCodeCopyButtons(html) };
    } catch {
      return { __html: content || '' };
    }
  }, []);

  const getConversationMessages = useCallback((conversationId: string) => {
    return useAIStore.getState().conversations.find((conv) => conv.id === conversationId)?.messages || [];
  }, []);

  const buildRequestMessages = useCallback(
    (format: ProviderFormat, history: AIMessage[]) => {
      const systemMessages: AIMessage[] = settings.systemPrompt
        ? [
            {
              id: `system-${Date.now()}`,
              role: 'system',
              content: settings.systemPrompt,
              timestamp: Date.now(),
            },
          ]
        : [];

      const messages = [...systemMessages, ...history];

      if (format === 'anthropic') {
        return messages.map((msg) => {
          if (msg.role === 'system') {
            return {
              role: 'system',
              content: getMessageText(msg),
              timestamp: msg.timestamp,
            };
          }

          const text = getMessageText(msg);
          const images = collectImages(msg);
          const parts: any[] = [];

          if (text.trim()) {
            parts.push({ type: 'text', text });
          }

          images.forEach((image) => {
            parts.push({
              type: 'image',
              source: {
                type: 'base64',
                media_type: getMimeFromDataUrl(image),
                data: getBase64FromDataUrl(image),
              },
            });
          });

          return {
            role: msg.role === 'assistant' ? 'assistant' : 'user',
            content: parts.length ? parts : [{ type: 'text', text: ' ' }],
            timestamp: msg.timestamp,
          };
        });
      }

      if (format === 'gemini') {
        return messages
          .filter((msg) => msg.role !== 'system')
          .map((msg) => {
            const text = getMessageText(msg);
            const images = collectImages(msg);
            const parts: any[] = [];

            if (text.trim()) parts.push({ text });

            images.forEach((image) => {
              parts.push({
                inline_data: {
                  mime_type: getMimeFromDataUrl(image),
                  data: getBase64FromDataUrl(image),
                },
              });
            });

            return {
              role: msg.role === 'assistant' ? 'model' : 'user',
              content: { parts },
              timestamp: msg.timestamp,
            };
          });
      }

      return messages.map((msg) => {
        const text = getMessageText(msg);
        const images = collectImages(msg);

        if (msg.role === 'system') {
          return { role: 'system', content: text, timestamp: msg.timestamp };
        }

        if (images.length > 0) {
          return {
            role: msg.role,
            content: [
              { type: 'text', content: text || ' ' },
              ...images.map((image) => ({
                type: 'image_url',
                image_url: { url: image },
              })),
            ],
            timestamp: msg.timestamp,
          };
        }

        return {
          role: msg.role,
          content: text,
          timestamp: msg.timestamp,
        };
      });
    },
    [settings.systemPrompt]
  );

  const parseStreamingResponse = useCallback(async (response: Response) => {
    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response stream available from provider.');

    const decoder = new TextDecoder();
    let fullContent = '';
    let buffer = '';

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const events = buffer.split('\n\n');
      buffer = events.pop() || '';

      for (const event of events) {
        const lines = event.split('\n').filter((line) => line.startsWith('data: '));
        for (const line of lines) {
          const data = line.slice(6).trim();
          if (!data || data === '[DONE]') continue;

          try {
            const parsed = JSON.parse(data);
            if (parsed.error) {
              throw new Error(parsed.error);
            }
            if (parsed.content) {
              fullContent += parsed.content;
            }
          } catch {
            // ignore malformed chunks
          }
        }
      }
    }

    return fullContent;
  }, []);

  const streamAssistantResponse = useCallback(
    async (conversationId: string, history: AIMessage[]) => {
      const provider = activeProvider;
      if (!provider) {
        await addAssistantMessage(
          conversationId,
          'No AI provider is configured. Open Settings → AI and add a provider/API key.'
        );
        return;
      }

      if (provider.unavailable) {
        await addAssistantMessage(
          conversationId,
          'Phaxe (free mode) is currently unavailable in this session. Add an API provider in Settings → AI.'
        );
        return;
      }

      const providerFormat: ProviderFormat = provider.format === 'custom' ? 'openai' : provider.format;
      const requestMessages = buildRequestMessages(providerFormat, history);

      setIsStreaming(true);

      try {
        if (providerFormat === 'puter') {
          if (!phaxeAvailable) {
            throw new Error('Phaxe free mode is unavailable right now.');
          }
          if (!phaxeSignedIn) {
            throw new Error('Sign in to Phaxe before using free mode.');
          }

          let content = '';
          await chatWithPuterStream(requestMessages as any, selectedModel, (chunk) => {
            content += chunk;
          });

          await addAssistantMessage(
            conversationId,
            content.trim() || 'I received an empty response. Try again with a shorter prompt.'
          );
          return;
        }

        const response = await fetch(buildApiUrl('/api/ai/chat'), {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            messages: requestMessages,
            provider: providerFormat,
            model: selectedModel,
            apiKey: provider.apiKey,
            baseUrl: provider.baseUrl,
            temperature: settings.temperature,
            maxTokens: settings.maxTokens,
          }),
        });

        if (!response.ok) {
          const errPayload = await response.json().catch(() => ({ error: 'Unknown provider error' }));
          throw new Error(errPayload.error || `Provider failed with status ${response.status}`);
        }

        const fullContent = await parseStreamingResponse(response);

        await addAssistantMessage(
          conversationId,
          fullContent.trim() || 'I received an empty response. Try again with a clearer prompt.'
        );
      } catch (error: any) {
        const providerName = provider.name || 'provider';
        const errorMessage = String(error?.message || 'Unknown error');
        const actionable = [
          `I couldn't complete the request with ${providerName}.`,
          `Reason: ${errorMessage}`,
          'Try this:',
          '1) Verify API key and endpoint in Settings → AI',
          '2) Try a different model',
          '3) Retry with a shorter prompt or smaller image',
        ].join('\n');

        await addAssistantMessage(conversationId, actionable);
        setIsStreaming(false);
      }
    },
    [
      activeProvider,
      addAssistantMessage,
      buildRequestMessages,
      parseStreamingResponse,
      phaxeAvailable,
      phaxeSignedIn,
      selectedModel,
      setIsStreaming,
      settings.temperature,
      settings.maxTokens,
    ]
  );

  const captureScreenshot = useCallback((): Promise<string | null> => {
    return new Promise((resolve) => {
      if (!captureVideoRef.current || !stream) {
        resolve(null);
        return;
      }

      const video = captureVideoRef.current;
      const canvas = document.createElement('canvas');
      const qualityMap = { low: 0.5, medium: 0.75, high: 0.95 };
      const quality = qualityMap[screenshotQuality] ?? 0.75;

      canvas.width = video.videoWidth;
      canvas.height = video.videoHeight;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(null);
        return;
      }

      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
      canvas.toBlob(
        (blob) => {
          if (!blob) {
            resolve(null);
            return;
          }
          const reader = new FileReader();
          reader.onloadend = () => resolve(reader.result as string);
          reader.readAsDataURL(blob);
        },
        'image/jpeg',
        quality
      );
    });
  }, [screenshotQuality, stream]);

  const stopScreenCapture = useCallback(() => {
    stream?.getTracks().forEach((track) => track.stop());
    setStream(null);
    setLiveScreenActive(false);
  }, [stream, setLiveScreenActive]);

  const startScreenCapture = useCallback(async () => {
    try {
      setScreenCaptureError(null);

      const mediaStream = await navigator.mediaDevices.getDisplayMedia({
        video: { width: 1280, height: 720 },
        audio: false,
      });

      setStream(mediaStream);
      setLiveScreenActive(true);

      const [videoTrack] = mediaStream.getVideoTracks();
      if (videoTrack) {
        videoTrack.onended = () => {
          setStream(null);
          setLiveScreenActive(false);
          setPipActive(false);
        };
      }
    } catch (error: any) {
      const denied = error?.name === 'NotAllowedError' || error?.name === 'SecurityError';
      setScreenCaptureError(
        denied
          ? 'Screen sharing permission was denied. Please allow screen capture and try again.'
          : 'Unable to start screen sharing. Check browser permissions and try again.'
      );
      setLiveScreenActive(false);
    }
  }, [setLiveScreenActive, setPipActive]);

  const togglePiP = useCallback(async () => {
    if (!liveScreenActive || !captureVideoRef.current) return;

    try {
      if (document.pictureInPictureElement) {
        await document.exitPictureInPicture();
        setPipActive(false);
      } else {
        await captureVideoRef.current.requestPictureInPicture();
        setPipActive(true);
      }
    } catch {
      setPipActive(false);
    }
  }, [liveScreenActive, setPipActive]);

  const handleFileSelect = useCallback(async (file: File) => {
    if (!file) return;

    const maxSize = 10 * 1024 * 1024;
    if (file.size > maxSize) {
      setScreenCaptureError('Attachment is too large. Maximum supported file size is 10MB.');
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
        return;
      }

      if (
        file.type.startsWith('text/') ||
        file.name.endsWith('.json') ||
        file.name.endsWith('.js') ||
        file.name.endsWith('.ts') ||
        file.name.endsWith('.tsx') ||
        file.name.endsWith('.py') ||
        file.name.endsWith('.md')
      ) {
        const text = await file.text();
        setAttachedFile({
          name: file.name,
          content: text,
          type: file.type || 'text/plain',
        });
        return;
      }

      const reader = new FileReader();
      reader.onloadend = () => {
        setAttachedFile({
          name: file.name,
          content: reader.result as string,
          type: file.type || 'application/octet-stream',
        });
      };
      reader.readAsDataURL(file);
    } catch {
      setScreenCaptureError('Could not process attachment. Try another file.');
    }
  }, []);

  const handleSendMessage = useCallback(
    async (rawText: string) => {
      if ((!rawText.trim() && !attachedFile) || isStreaming) return;

      let conversationId = activeConversation;
      if (!conversationId) {
        conversationId = await createConversation();
      }

      let screenshot: string | null = null;
      if (liveScreenActive && stream) {
        screenshot = await captureScreenshot();
      }

      const imageAttachments: string[] = [];
      const fileAttachments: AIFileAttachment[] = [];

      if (screenshot) {
        imageAttachments.push(screenshot);
      }

      if (attachedFile) {
        if (attachedFile.type.startsWith('image/')) {
          imageAttachments.push(attachedFile.content);
        } else {
          fileAttachments.push(attachedFile);
        }
      }

      const contentFallback = rawText.trim() || (attachedFile ? `Attached file: ${attachedFile.name}` : 'Shared context');
      const userMessage: AIMessage = {
        id: Date.now().toString(),
        role: 'user',
        content: contentFallback,
        timestamp: Date.now(),
        screenshot: screenshot || undefined,
        imageAttachments: imageAttachments.length ? imageAttachments : undefined,
        fileAttachments: fileAttachments.length ? fileAttachments : undefined,
      };

      const previousMessages = getConversationMessages(conversationId);

      setInput('');
      setAttachedFile(null);
      await sendMessage(conversationId, userMessage);

      await streamAssistantResponse(conversationId, [...previousMessages, userMessage]);
    },
    [
      activeConversation,
      attachedFile,
      captureScreenshot,
      createConversation,
      getConversationMessages,
      isStreaming,
      liveScreenActive,
      sendMessage,
      stream,
      streamAssistantResponse,
    ]
  );

  const handleSend = useCallback(async () => {
    await handleSendMessage(input);
  }, [handleSendMessage, input]);

  const handlePromptClick = useCallback(
    async (prompt: string) => {
      setInput(prompt);
      await handleSendMessage(prompt);
    },
    [handleSendMessage]
  );

  const handleNewConversation = useCallback(async () => {
    await createConversation();
    setInput('');
    setAttachedFile(null);
    setEditingMessageId(null);
  }, [createConversation]);

  const handleDeleteConversation = useCallback(
    async (id: string, e: React.MouseEvent) => {
      e.stopPropagation();
      await deleteConversation(id);
      if (activeConversation === id) {
        setActiveConversation(null);
      }
    },
    [activeConversation, deleteConversation, setActiveConversation]
  );

  const copyText = useCallback(
    async (text: string, feedback: string) => {
      try {
        await navigator.clipboard.writeText(text);
        setCopyFeedback(feedback);
        clearCopyFeedbackLater();
      } catch {
        setCopyFeedback('Copy failed');
        clearCopyFeedbackLater();
      }
    },
    [clearCopyFeedbackLater]
  );

  const handleDeleteMsg = useCallback(
    async (messageId: string) => {
      if (!activeConversation) return;
      await deleteMessage(activeConversation, messageId);
    },
    [activeConversation, deleteMessage]
  );

  const handleStartEdit = useCallback((message: AIMessage) => {
    setEditingMessageId(message.id);
    setEditingContent(message.content);
  }, []);

  const handleCancelEdit = useCallback(() => {
    setEditingMessageId(null);
    setEditingContent('');
  }, []);

  const handleSaveEdit = useCallback(
    async (messageId: string) => {
      if (!activeConversation || !editingContent.trim()) return;

      await editMessage(activeConversation, messageId, editingContent.trim());
      setEditingMessageId(null);
      setEditingContent('');

      const afterEdit = getConversationMessages(activeConversation);
      const editedIndex = afterEdit.findIndex((msg) => msg.id === messageId);
      if (editedIndex === -1) return;

      const nextMessage = afterEdit[editedIndex + 1];
      if (nextMessage) {
        await regenerateMessage(activeConversation, nextMessage.id);
      }

      const trimmed = getConversationMessages(activeConversation);
      const lastMessage = trimmed[trimmed.length - 1];
      if (lastMessage?.role === 'user') {
        await streamAssistantResponse(activeConversation, trimmed);
      }
    },
    [
      activeConversation,
      editMessage,
      editingContent,
      getConversationMessages,
      regenerateMessage,
      streamAssistantResponse,
    ]
  );

  const handleRegenerate = useCallback(
    async (messageId: string) => {
      if (!activeConversation) return;

      await regenerateMessage(activeConversation, messageId);
      const trimmed = getConversationMessages(activeConversation);
      const lastMessage = trimmed[trimmed.length - 1];

      if (lastMessage?.role === 'user') {
        await streamAssistantResponse(activeConversation, trimmed);
      }
    },
    [activeConversation, getConversationMessages, regenerateMessage, streamAssistantResponse]
  );

  const applyCustomModel = useCallback(() => {
    const custom = customModelId.trim();
    if (!custom) return;
    setSelectedModel(custom);
  }, [customModelId, setSelectedModel]);

  const togglePinnedModel = useCallback((modelId: string) => {
    setPinnedModels((prev) => {
      const next = prev.includes(modelId) ? prev.filter((id) => id !== modelId) : [modelId, ...prev];
      localStorage.setItem('phaxe-pinned-models', JSON.stringify(next));
      return next;
    });
  }, []);

  const handleModelDropdownEnter = useCallback(() => {
    if (modelCloseTimerRef.current) clearTimeout(modelCloseTimerRef.current);
    setShowModelDropdown(true);
  }, []);

  const handleModelDropdownLeave = useCallback(() => {
    modelCloseTimerRef.current = setTimeout(() => setShowModelDropdown(false), 180);
  }, []);

  const handleProviderDropdownEnter = useCallback(() => {
    if (providerCloseTimerRef.current) clearTimeout(providerCloseTimerRef.current);
    setShowProviderDropdown(true);
  }, []);

  const handleProviderDropdownLeave = useCallback(() => {
    providerCloseTimerRef.current = setTimeout(() => setShowProviderDropdown(false), 180);
  }, []);

  const handlePhaxeSignIn = useCallback(async () => {
    try {
      await signIn();
      setPhaxeSignedIn(isSignedIn());
    } catch {
      setCopyFeedback('Sign in failed');
      clearCopyFeedbackLater();
    }
  }, [clearCopyFeedbackLater]);

  useEffect(() => {
    loadConversations();
  }, [loadConversations]);

  useEffect(() => {
    const available = typeof window !== 'undefined' && Boolean((window as any).puter);
    setPhaxeAvailable(available);
    setPhaxeSignedIn(available ? isSignedIn() : false);
  }, []);

  useEffect(() => {
    if (!providerOptions.length) return;

    if (!selectedProvider || !providerOptions.some((provider) => provider.id === selectedProvider)) {
      const fallback = providerOptions.find((provider) => provider.active) || providerOptions[0];
      if (fallback) setSelectedProvider(fallback.id);
    }
  }, [providerOptions, selectedProvider, setSelectedProvider]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages.length, isStreaming]);

  useEffect(() => {
    if (captureVideoRef.current) {
      captureVideoRef.current.srcObject = stream;
    }
    if (pipPreviewVideoRef.current) {
      pipPreviewVideoRef.current.srcObject = stream;
    }
  }, [stream]);

  useEffect(() => {
    const video = captureVideoRef.current;
    if (!video) return;

    const onEnterPiP = () => setPipActive(true);
    const onLeavePiP = () => setPipActive(false);

    video.addEventListener('enterpictureinpicture', onEnterPiP);
    video.addEventListener('leavepictureinpicture', onLeavePiP);

    return () => {
      video.removeEventListener('enterpictureinpicture', onEnterPiP);
      video.removeEventListener('leavepictureinpicture', onLeavePiP);
    };
  }, [setPipActive]);

  useEffect(() => {
    const SpeechRecognitionCtor = window.SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognitionCtor) return;

    const recognition = new SpeechRecognitionCtor();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onresult = (event: SpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }

      setInput((prev) => {
        const prefix = prev && !prev.endsWith(' ') ? `${prev} ` : prev;
        return `${prefix}${transcript.trim()}`.trim();
      });
    };

    recognition.onerror = () => setIsListening(false);
    recognition.onend = () => {
      if (isListening) {
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

  useEffect(() => {
    const handleDocumentClick = (event: MouseEvent) => {
      const target = event.target as Node;
      if (modelDropdownRef.current && !modelDropdownRef.current.contains(target)) {
        setShowModelDropdown(false);
      }
      if (providerDropdownRef.current && !providerDropdownRef.current.contains(target)) {
        setShowProviderDropdown(false);
      }
    };

    document.addEventListener('mousedown', handleDocumentClick);
    return () => document.removeEventListener('mousedown', handleDocumentClick);
  }, []);

  useEffect(() => {
    if (selectedModelSpec) {
      setCustomModelId('');
    } else {
      setCustomModelId(selectedModel || '');
    }
  }, [selectedModel, selectedModelSpec]);

  useEffect(() => {
    if (liveScreenActive) return;
    if (stream) {
      stopScreenCapture();
    }
  }, [liveScreenActive, stream, stopScreenCapture]);

  useEffect(() => {
    const onSend = () => {
      if (!isStreaming) {
        void handleSend();
      }
    };
    const onTogglePip = () => {
      void togglePiP();
    };
    const onStopLive = () => {
      stopScreenCapture();
    };
    const onToggleLive = () => {
      if (liveScreenActive) {
        stopScreenCapture();
      } else {
        void startScreenCapture();
      }
    };
    const onNewConversation = () => {
      void handleNewConversation();
    };

    window.addEventListener('ai-send-message', onSend as EventListener);
    window.addEventListener('ai-toggle-pip', onTogglePip as EventListener);
    window.addEventListener('ai-stop-live-screen', onStopLive as EventListener);
    window.addEventListener('ai-toggle-live-screen', onToggleLive as EventListener);
    window.addEventListener('ai-new-conversation', onNewConversation as EventListener);

    return () => {
      window.removeEventListener('ai-send-message', onSend as EventListener);
      window.removeEventListener('ai-toggle-pip', onTogglePip as EventListener);
      window.removeEventListener('ai-stop-live-screen', onStopLive as EventListener);
      window.removeEventListener('ai-toggle-live-screen', onToggleLive as EventListener);
      window.removeEventListener('ai-new-conversation', onNewConversation as EventListener);
    };
  }, [
    handleNewConversation,
    handleSend,
    isStreaming,
    liveScreenActive,
    startScreenCapture,
    stopScreenCapture,
    togglePiP,
  ]);

  useEffect(() => {
    return () => {
      if (modelCloseTimerRef.current) clearTimeout(modelCloseTimerRef.current);
      if (providerCloseTimerRef.current) clearTimeout(providerCloseTimerRef.current);
    };
  }, []);

  const toggleMicrophone = () => {
    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    if (!recognitionRef.current) return;

    try {
      recognitionRef.current.start();
      setIsListening(true);
    } catch {
      setIsListening(false);
    }
  };

  const onMarkdownAreaClick = (event: React.MouseEvent) => {
    const target = event.target as HTMLElement;
    const copyBtn = target.closest('.code-copy-btn') as HTMLButtonElement | null;
    if (!copyBtn?.dataset.code) return;

    event.preventDefault();
    event.stopPropagation();

    const decoded = decodeURIComponent(copyBtn.dataset.code);
    void copyText(decoded, 'Code copied');
  };

  return (
    <div className="h-full flex min-h-0">
      <video ref={captureVideoRef} autoPlay playsInline muted className="fixed right-0 bottom-0 w-px h-px opacity-0 pointer-events-none" />

      <video
        ref={pipPreviewVideoRef}
        autoPlay
        playsInline
        muted
        className={`fixed bottom-4 right-4 z-40 w-56 rounded-xl border border-[var(--color-border-primary)] shadow-2xl bg-black transition-opacity ${
          pipActive && stream ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
      />

      <input
        ref={fileInputRef}
        type="file"
        className="hidden"
        accept="image/*,.txt,.md,.json,.js,.ts,.tsx,.py,.css,.html,.xml,.csv,.log"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFileSelect(file);
          event.target.value = '';
        }}
      />

      {showConversationSidebar && (
        <div className="w-72 border-r border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)] flex flex-col min-h-0">
        <div className="flex items-center justify-between px-3 py-2 border-b border-[var(--color-border-primary)]">
          <h3 className="text-xs font-semibold text-[var(--color-text-tertiary)] uppercase tracking-wider">
            Conversations
          </h3>
          <div className="flex items-center gap-1">
            <button
              onClick={handleNewConversation}
              className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
              title="New conversation"
            >
              <Plus size={14} />
            </button>
            <button
              onClick={() => {
                setShowConversationSidebar(false);
              }}
              className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
              title="Hide sidebar"
            >
              <X size={14} />
            </button>
          </div>
        </div>

        <div className="flex-1 overflow-auto p-2 space-y-1">
          {conversations.length === 0 ? (
            <p className="text-xs text-[var(--color-text-tertiary)] text-center py-6">
              Start a new conversation ✨
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
                  onClick={(event) => void handleDeleteConversation(conv.id, event)}
                  className="opacity-0 group-hover:opacity-100 p-0.5 text-[var(--color-text-tertiary)] hover:text-rose-500 transition-all"
                  title="Delete conversation"
                >
                  <Trash2 size={10} />
                </button>
              </div>
            ))
          )}
        </div>
      </div>
      )}

      <div className="flex-1 min-w-0 flex flex-col min-h-0">
        <div className="sticky top-0 z-20 px-4 py-2.5 border-b border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]/95 backdrop-blur supports-[backdrop-filter]:bg-[var(--color-bg-secondary)]/80 space-y-2">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-3 min-w-0">
              {!showConversationSidebar && (
                <button
                  onClick={() => setShowConversationSidebar(true)}
                  className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                  title="Show conversations"
                >
                  <MessageSquare size={14} />
                </button>
              )}
              <h2 className="text-sm font-semibold text-[var(--color-text-primary)] truncate">
                {activeConv?.title || 'AI Assistant'}
              </h2>
              {liveScreenActive && stream && (
                <span className="flex items-center gap-1.5 text-xs text-emerald-500">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live screen active
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
                onClick={() => void (liveScreenActive ? stopScreenCapture() : startScreenCapture())}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                  liveScreenActive
                    ? 'bg-rose-500/10 text-rose-500 hover:bg-rose-500/20'
                    : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
                title={liveScreenActive ? 'Stop live screen' : 'Start live screen'}
              >
                {liveScreenActive ? <Square size={12} /> : <Monitor size={12} />}
                {liveScreenActive ? 'Stop' : 'Live Screen'}
              </button>

              <button
                onClick={() => void togglePiP()}
                disabled={!liveScreenActive || !stream}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
                title="Toggle Picture-in-Picture"
              >
                <PictureInPicture2 size={12} />
                PiP
              </button>

              <button
                onClick={() => setActiveTab('settings')}
                className="p-1.5 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
                title="Open settings"
              >
                <Settings2 size={14} />
              </button>
            </div>
          </div>

          <div className="flex flex-wrap items-end gap-3">
            <div
              ref={providerDropdownRef}
              className="relative"
              onMouseEnter={handleProviderDropdownEnter}
              onMouseLeave={handleProviderDropdownLeave}
            >
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                Provider
              </label>
              <button
                onClick={() => setShowProviderDropdown((prev) => !prev)}
                className="flex items-center justify-between gap-2 min-w-[220px] px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-xs text-[var(--color-text-primary)]"
              >
                <span className="truncate">{activeProvider?.name || 'Select provider'}</span>
                <ChevronDown size={12} className={showProviderDropdown ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>

              {showProviderDropdown && (
                <div className="absolute z-30 mt-1 w-72 max-h-64 overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)] shadow-2xl p-1">
                  {providerOptions.map((provider) => (
                    <button
                      key={provider.id}
                      onClick={() => {
                        if (provider.unavailable) return;
                        setSelectedProvider(provider.id);
                        setShowProviderDropdown(false);
                      }}
                      disabled={provider.unavailable}
                      className={`w-full text-left px-3 py-2 rounded-lg text-xs transition-colors ${
                        provider.id === activeProvider?.id
                          ? 'bg-primary-500/15 text-primary-500'
                          : provider.unavailable
                          ? 'text-[var(--color-text-tertiary)] cursor-not-allowed'
                          : 'text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)] hover:text-[var(--color-text-primary)]'
                      }`}
                    >
                      {provider.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            <div
              ref={modelDropdownRef}
              className="relative"
              onMouseEnter={handleModelDropdownEnter}
              onMouseLeave={handleModelDropdownLeave}
            >
              <label className="block text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                Model
              </label>
              <button
                onClick={() => setShowModelDropdown((prev) => !prev)}
                className="flex items-center justify-between gap-2 w-80 px-3 py-2 rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-xs text-[var(--color-text-primary)]"
              >
                <span className="truncate">
                  {selectedModelSpec?.emoji || '🤖'} {selectedModelSpec?.name || cleanModelName(selectedModel)}
                </span>
                <ChevronDown size={12} className={showModelDropdown ? 'rotate-180 transition-transform' : 'transition-transform'} />
              </button>

              {showModelDropdown && (
                <div className="absolute z-30 mt-1 w-80 max-h-[22rem] overflow-y-auto overflow-x-hidden rounded-xl border border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)] shadow-2xl p-2 space-y-2">
                  <div className="relative">
                    <Search size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-[var(--color-text-tertiary)]" />
                    <input
                      value={modelSearch}
                      onChange={(event) => setModelSearch(event.target.value)}
                      placeholder="Search models..."
                      className="input pl-8 py-1.5 text-xs"
                    />
                  </div>

                  {pinnedVisibleModels.length > 0 && (
                    <div className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] px-1">
                        Pinned
                      </div>
                      {pinnedVisibleModels.map((model) => (
                        <button
                          key={`pin-${model.id}`}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors ${
                            selectedModel === model.id
                              ? 'border-primary-500/40 bg-primary-500/10'
                              : 'border-transparent hover:border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {model.emoji} {model.name}
                              </div>
                              <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">{model.speed}</div>
                            </div>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                togglePinnedModel(model.id);
                              }}
                              className="p-1 rounded hover:bg-[var(--color-bg-primary)]"
                              title="Unpin model"
                            >
                              <PinOff size={12} />
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}

                  {groupedUnpinnedModels.map(([provider, models]) => (
                    <div key={provider} className="space-y-1">
                      <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] px-1">
                        {provider}
                      </div>
                      {models.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModel(model.id);
                            setShowModelDropdown(false);
                          }}
                          className={`w-full text-left px-2.5 py-2 rounded-lg border transition-colors ${
                            selectedModel === model.id
                              ? 'border-primary-500/40 bg-primary-500/10'
                              : 'border-transparent hover:border-[var(--color-border-primary)] hover:bg-[var(--color-bg-tertiary)]'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <div className="text-xs font-medium truncate">
                                {model.emoji} {model.name}
                              </div>
                              <div className="text-[10px] text-[var(--color-text-tertiary)] truncate">{model.speed}</div>
                              <div className="text-[10px] text-[var(--color-text-tertiary)] mt-0.5 flex items-center gap-1 flex-wrap">
                                {model.modalities.map((mode) => (
                                  <span key={`${model.id}-${mode}`}>{modalityIcon[mode] || '•'} {mode}</span>
                                ))}
                              </div>
                            </div>
                            <button
                              onClick={(event) => {
                                event.stopPropagation();
                                togglePinnedModel(model.id);
                              }}
                              className="p-1 rounded hover:bg-[var(--color-bg-primary)]"
                              title={pinnedSet.has(model.id) ? 'Unpin model' : 'Pin model'}
                            >
                              {pinnedSet.has(model.id) ? <PinOff size={12} /> : <Pin size={12} />}
                            </button>
                          </div>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="min-w-[220px]">
              <div className="text-[10px] uppercase tracking-wider text-[var(--color-text-tertiary)] mb-1">
                Custom model ID
              </div>
              <div className="flex items-center gap-1.5">
                <input
                  value={customModelId}
                  onChange={(event) => setCustomModelId(event.target.value)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter') {
                      event.preventDefault();
                      applyCustomModel();
                    }
                  }}
                  placeholder="provider/model-id"
                  className="input text-xs py-1.5 h-8"
                />
                <button
                  onClick={applyCustomModel}
                  className="h-8 px-2 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]"
                  title="Use custom model ID"
                >
                  Use
                </button>
                <button
                  onClick={() => setShowModelHelp((prev) => !prev)}
                  className="h-8 w-8 inline-flex items-center justify-center rounded-lg text-[var(--color-text-secondary)] hover:bg-[var(--color-bg-tertiary)]"
                  title="Model input help"
                >
                  <Info size={14} />
                </button>
              </div>
            </div>
          </div>

          {activeProvider?.id === 'phaxe-free' && phaxeAvailable && !phaxeSignedIn && (
            <div className="flex items-center gap-2 text-xs text-[var(--color-text-secondary)]">
              <span>Sign in to Phaxe to use free AI mode.</span>
              <button
                onClick={() => void handlePhaxeSignIn()}
                className="px-2 py-1 rounded bg-primary-500/15 text-primary-500 hover:bg-primary-500/25"
              >
                Sign in to Phaxe
              </button>
            </div>
          )}

          {showModelHelp && (
            <div className="rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] p-3 text-xs text-[var(--color-text-secondary)] space-y-1">
              <p className="font-medium text-[var(--color-text-primary)]">Model ID tips</p>
              <p>• Use catalog models for the best compatibility.</p>
              <p>• For custom IDs, format like <code>provider/model-name</code>.</p>
              <p>• Example: <code>anthropic/claude-sonnet-4.6</code> or <code>google/gemini-2.5-pro</code>.</p>
            </div>
          )}

          {screenCaptureError && (
            <div className="rounded-lg border border-rose-500/40 bg-rose-500/10 px-3 py-2 text-xs text-rose-400 flex items-start justify-between gap-2">
              <span>{screenCaptureError}</span>
              <button
                onClick={() => setScreenCaptureError(null)}
                className="p-0.5 rounded hover:bg-rose-500/20"
              >
                <X size={12} />
              </button>
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4 space-y-4" onClick={onMarkdownAreaClick}>
          {(!activeConv || activeConv.messages.length === 0) && (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-[var(--color-bg-tertiary)] flex items-center justify-center mb-4">
                <MessageSquare size={24} className="text-[var(--color-text-tertiary)]" />
              </div>
              <h3 className="text-lg font-semibold text-[var(--color-text-primary)] mb-2">
                Ready when you are
              </h3>
              <p className="text-sm text-[var(--color-text-secondary)] max-w-md">
                Ask anything, share your screen, or attach files/images for richer answers.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-5 w-full max-w-xl">
                {[
                  'Summarize what is on my screen',
                  'Help me fill out this form correctly',
                  'Spot issues and suggest fixes',
                  'Explain this screenshot step-by-step',
                ].map((prompt) => (
                  <button
                    key={prompt}
                    onClick={() => void handlePromptClick(prompt)}
                    className="px-3 py-2 rounded-lg text-xs bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-colors text-left"
                  >
                    {prompt}
                  </button>
                ))}
              </div>
            </div>
          )}

          {activeConv?.messages.map((msg) => {
            const imagePreviews = collectImagePreviews(msg);
            const nonImageAttachments = (msg.fileAttachments || []).filter((file) => !file.type.startsWith('image/'));
            const isEditing = editingMessageId === msg.id;

            return (
              <div
                key={msg.id}
                className={`group flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} animate-slide-up`}
              >
                <div
                  className={`relative max-w-[82%] rounded-2xl px-4 py-3 ${
                    msg.role === 'user'
                      ? 'bg-primary-600 text-white rounded-br-md'
                      : 'bg-[var(--color-bg-tertiary)] text-[var(--color-text-primary)] rounded-bl-md'
                  }`}
                >
                  <div className="absolute right-2 -top-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 rounded-full border border-[var(--color-border-primary)] bg-[var(--color-bg-elevated)] p-1 shadow-sm">
                      <button
                        onClick={() => void copyText(msg.content, 'Message copied')}
                        className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                        title="Copy message"
                      >
                        <Copy size={12} />
                      </button>

                      {msg.role === 'user' && (
                        <button
                          onClick={() => handleStartEdit(msg)}
                          className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                          title="Edit and resend"
                        >
                          <Edit3 size={12} />
                        </button>
                      )}

                      {msg.role === 'assistant' && (
                        <button
                          onClick={() => void handleRegenerate(msg.id)}
                          className="p-1 rounded hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)]"
                          title="Regenerate response"
                        >
                          <RefreshCw size={12} />
                        </button>
                      )}

                      <button
                        onClick={() => void handleDeleteMsg(msg.id)}
                        className="p-1 rounded hover:bg-rose-500/20 text-[var(--color-text-secondary)] hover:text-rose-500"
                        title="Delete message"
                      >
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {isEditing ? (
                    <div className="space-y-2">
                      <textarea
                        value={editingContent}
                        onChange={(event) => setEditingContent(event.target.value)}
                        rows={4}
                        className="w-full rounded-lg border border-[var(--color-border-primary)] bg-[var(--color-bg-primary)] text-[var(--color-text-primary)] p-2 text-sm"
                      />
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={handleCancelEdit}
                          className="px-2 py-1 rounded text-xs bg-[var(--color-bg-primary)] text-[var(--color-text-secondary)]"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => void handleSaveEdit(msg.id)}
                          className="px-2 py-1 rounded text-xs bg-primary-600 text-white"
                        >
                          Save & resend
                        </button>
                      </div>
                    </div>
                  ) : msg.role === 'assistant' ? (
                    <div className="text-sm phaxe-markdown" dangerouslySetInnerHTML={renderMarkdown(msg.content)} />
                  ) : (
                    <p className="text-sm whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {imagePreviews.length > 0 && (
                    <div className="mt-2 space-y-2">
                      {imagePreviews.map((preview) => (
                        <div key={`${msg.id}-${preview.src.slice(0, 24)}`}>
                          <img
                            src={preview.src}
                            alt={preview.label}
                            onClick={() => setEnlargedImage(preview.src)}
                            className="rounded-lg max-w-[200px] w-full h-auto object-contain border border-[var(--color-border-primary)] cursor-zoom-in"
                          />
                          <p className="text-[10px] mt-1 opacity-80">{preview.label}</p>
                        </div>
                      ))}
                    </div>
                  )}

                  {nonImageAttachments.length > 0 && (
                    <div className="mt-2 space-y-1">
                      {nonImageAttachments.map((file) => (
                        <div
                          key={`${msg.id}-${file.name}`}
                          className="flex items-center gap-2 rounded-lg border border-[var(--color-border-primary)] px-2 py-1 text-xs"
                        >
                          <FileText size={12} />
                          <span className="truncate">{file.name}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="text-[10px] text-[var(--color-text-tertiary)] mt-1 opacity-70">
                    {formatRelativeTime(msg.timestamp)}
                  </div>
                </div>
              </div>
            );
          })}

          {isStreaming && (
            <div className="flex justify-start animate-slide-up">
              <div className="bg-[var(--color-bg-tertiary)] rounded-2xl rounded-bl-md px-4 py-3">
                <div className="flex items-center gap-2">
                  <div className="flex gap-1">
                    <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse" style={{ animationDelay: '200ms' }} />
                    <span className="w-2 h-2 rounded-full bg-[var(--color-text-tertiary)] animate-pulse" style={{ animationDelay: '400ms' }} />
                  </div>
                  <span className="text-xs text-[var(--color-text-secondary)]">
                    Thinking with {selectedModelSpec?.name || cleanModelName(selectedModel)}...
                  </span>
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        <div className="px-4 py-3 border-t border-[var(--color-border-primary)] bg-[var(--color-bg-secondary)]">
          {attachedFile && (
            <div className="mb-3 inline-flex flex-col items-center gap-1 relative group">
              <div className="relative">
                {attachedFile.type.startsWith('image/') ? (
                  <img
                    src={attachedFile.content}
                    alt={attachedFile.name}
                    onClick={() => setEnlargedImage(attachedFile.content)}
                    className="w-14 h-14 rounded object-cover border border-[var(--color-border-primary)] cursor-zoom-in"
                  />
                ) : (
                  <div className="w-14 h-14 rounded border border-[var(--color-border-primary)] bg-[var(--color-bg-tertiary)] flex items-center justify-center">
                    <FileText size={18} className="text-[var(--color-text-secondary)]" />
                  </div>
                )}

                <button
                  onClick={() => setAttachedFile(null)}
                  className="absolute -top-1 -right-1 opacity-0 group-hover:opacity-100 transition-opacity bg-black/60 text-white rounded-full p-0.5"
                  title="Remove attachment"
                >
                  <X size={11} />
                </button>
              </div>
              <span className="max-w-[160px] truncate text-[10px] text-[var(--color-text-tertiary)]">
                {attachedFile.name}
              </span>
            </div>
          )}

          <div className="flex items-center gap-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              className="p-2 rounded-lg hover:bg-[var(--color-bg-tertiary)] text-[var(--color-text-secondary)] transition-colors"
              title="Attach file or image"
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
              title={isListening ? 'Stop voice input' : 'Start voice input'}
            >
              <Mic size={18} />
            </button>

            <input
              type="text"
              value={input}
              onChange={(event) => setInput(event.target.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter' && !event.shiftKey) {
                  event.preventDefault();
                  void handleSend();
                }
              }}
              placeholder={isListening ? 'Listening…' : 'Ask anything, attach files, or share your screen...'}
              className="flex-1 input"
              disabled={isStreaming}
            />

            <button
              onClick={() => void handleSend()}
              disabled={(!input.trim() && !attachedFile) || isStreaming}
              className="p-2 rounded-lg bg-primary-600 text-white hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              title="Send"
            >
              <Send size={18} />
            </button>
          </div>

          <div className="mt-2 text-[10px] text-[var(--color-text-tertiary)]">
            {activeProvider?.id === 'phaxe-free' ? 'Powered by Phaxe' : `Using ${activeProvider?.name || 'configured provider'}`}
            {copyFeedback ? <span className="ml-2 text-emerald-500">• {copyFeedback}</span> : null}
          </div>
        </div>
      </div>

      {enlargedImage && (
        <div
          className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-6"
          onClick={() => setEnlargedImage(null)}
        >
          <button
            onClick={() => setEnlargedImage(null)}
            className="absolute top-4 right-4 p-2 rounded-full bg-black/60 text-white"
            title="Close"
          >
            <X size={16} />
          </button>
          <img
            src={enlargedImage}
            alt="Expanded preview"
            className="max-w-[90vw] max-h-[85vh] rounded-xl shadow-2xl"
            onClick={(event) => event.stopPropagation()}
          />
          <div className="absolute bottom-4 right-4 text-white/80 text-xs flex items-center gap-1">
            <Maximize2 size={12} />
            Click backdrop to close
          </div>
        </div>
      )}
    </div>
  );
}

export default AITab;
