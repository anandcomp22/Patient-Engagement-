import React, { useState, useRef, useEffect } from 'react';
import {
  Box, Typography, TextField, IconButton, Paper, Avatar,
  Fab, Fade, CircularProgress, Divider, Tooltip
} from '@mui/material';
import {
  Close, Send, SmartToy, Person, DeleteOutline, ExpandMore
} from '@mui/icons-material';
// ─── Inline SVG icon (no background artifacts, crisp at any size) ──────────
const MedBotIcon = ({ size = 32 }) => (
  <svg width={size} height={size} viewBox="0 0 64 64" fill="none" xmlns="http://www.w3.org/2000/svg">
    {/* Antenna */}
    <line x1="32" y1="6" x2="32" y2="14" stroke="#1E5DA9" strokeWidth="3" strokeLinecap="round"/>
    <circle cx="32" cy="5" r="3" fill="#00B4D8"/>
    {/* Head */}
    <rect x="10" y="14" width="44" height="34" rx="10" fill="#1E5DA9"/>
    {/* Eyes */}
    <circle cx="22" cy="28" r="5" fill="#00B4D8"/>
    <circle cx="42" cy="28" r="5" fill="#00B4D8"/>
    <circle cx="22" cy="28" r="2.5" fill="white"/>
    <circle cx="42" cy="28" r="2.5" fill="white"/>
    {/* Smile */}
    <path d="M24 37 Q32 43 40 37" stroke="white" strokeWidth="2.5" strokeLinecap="round" fill="none"/>
    {/* Medical cross on forehead */}
    <rect x="29" y="16" width="6" height="2" rx="1" fill="white"/>
    <rect x="31" y="14" width="2" height="6" rx="1" fill="white"/>
    {/* Body */}
    <rect x="18" y="50" width="28" height="10" rx="6" fill="#1E5DA9"/>
    {/* Arms */}
    <rect x="4" y="20" width="8" height="20" rx="4" fill="#1976D2"/>
    <rect x="52" y="20" width="8" height="20" rx="4" fill="#1976D2"/>
  </svg>
);


// ─── Ollama config ─────────────────────────────────────────────────────────
const OLLAMA_URL   = 'http://localhost:11434/api/chat';
const OLLAMA_MODEL = 'llama3.2';

const SYSTEM_PROMPT = `You are MedBot, a smart medical assistant built into the Patient Engagement application.
You ONLY answer questions about:
1. How to use this application (appointments, video calls, prescriptions, health tracking, emergency map, exercise goals)
2. General medical and health guidelines
3. Medicine details — dosage, side effects, drug interactions, uses, storage

If the user asks anything outside these three areas, politely decline and redirect them.
Keep answers concise, clear, and accurate. Always add a note recommending the user consult a licensed doctor for personal medical decisions.
Do not make up drug information. If unsure, say so.`;

// ─── Helpers ───────────────────────────────────────────────────────────────
const buildMessages = (history) => [
  { role: 'system', content: SYSTEM_PROMPT },
  ...history.map(m => ({ role: m.role, content: m.content })),
];

const TypingDots = () => (
  <Box sx={{ display: 'flex', gap: 0.5, alignItems: 'center', py: 0.5 }}>
    {[0, 1, 2].map(i => (
      <Box key={i} sx={{
        width: 7, height: 7, borderRadius: '50%', backgroundColor: '#1E5DA9',
        animation: 'bounce 1.2s infinite ease-in-out',
        animationDelay: `${i * 0.2}s`,
        '@keyframes bounce': { '0%,80%,100%': { transform: 'scale(0.6)', opacity: 0.4 }, '40%': { transform: 'scale(1)', opacity: 1 } }
      }} />
    ))}
  </Box>
);

// ─── Message bubble ────────────────────────────────────────────────────────
const MessageBubble = ({ msg }) => {
  const isUser = msg.role === 'user';
  return (
    <Box sx={{ display: 'flex', justifyContent: isUser ? 'flex-end' : 'flex-start', mb: 1.5, gap: 1, alignItems: 'flex-end' }}>
      {!isUser && (
        <Avatar sx={{ width: 32, height: 32, bgcolor: '#e0f2fe', flexShrink: 0 }}>
          <MedBotIcon size={20} />
        </Avatar>
      )}
      <Box sx={{
        maxWidth: '78%', px: 2, py: 1.2, borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        backgroundColor: isUser ? '#1E5DA9' : '#f1f5f9',
        color: isUser ? '#fff' : '#1e293b',
        boxShadow: '0 1px 4px rgba(0,0,0,0.08)',
        fontSize: '0.875rem', lineHeight: 1.6, whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </Box>
      {isUser && (
        <Avatar sx={{ width: 28, height: 28, bgcolor: '#e2e8f0' }}>
          <Person sx={{ fontSize: 16, color: '#64748b' }} />
        </Avatar>
      )}
    </Box>
  );
};

// ─── Main Component ────────────────────────────────────────────────────────
export default function MedicalChatBot() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: 'assistant', content: 'Hi! I\'m **MedBot** 👋\nI can help you with:\n• Using this app\n• Medical guidelines\n• Medicine details\n\nHow can I help you today?' }
  ]);
  const [input, setInput] = useState('');
  const [streaming, setStreaming] = useState(false);
  const [ollamaOnline, setOllamaOnline] = useState(null); // null=unknown, true/false
  const bottomRef = useRef(null);
  const inputRef = useRef(null);
  const abortRef = useRef(null);

  // Check Ollama status on open
  useEffect(() => {
    if (!open) return;
    fetch('http://localhost:11434/api/tags', { signal: AbortSignal.timeout(2000) })
      .then(() => setOllamaOnline(true))
      .catch(() => setOllamaOnline(false));
  }, [open]);

  // Auto-scroll to bottom
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, streaming]);

  // Focus input when opened
  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 200);
  }, [open]);

  const sendMessage = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput('');

    const userMsg = { role: 'user', content: text };
    const updatedHistory = [...messages, userMsg];
    setMessages(updatedHistory);
    setStreaming(true);

    // Placeholder for streaming assistant message
    setMessages(prev => [...prev, { role: 'assistant', content: '' }]);

    try {
      const ctrl = new AbortController();
      abortRef.current = ctrl;

      const res = await fetch(OLLAMA_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        signal: ctrl.signal,
        body: JSON.stringify({
          model: OLLAMA_MODEL,
          messages: buildMessages(updatedHistory),
          stream: true,
        }),
      });

      if (!res.ok) throw new Error(`Ollama error: ${res.status}`);

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value, { stream: true });
        const lines = chunk.split('\n').filter(Boolean);
        for (const line of lines) {
          try {
            const json = JSON.parse(line);
            const token = json?.message?.content || '';
            fullText += token;
            setMessages(prev => {
              const next = [...prev];
              next[next.length - 1] = { role: 'assistant', content: fullText };
              return next;
            });
          } catch {}
        }
      }
    } catch (err) {
      if (err.name === 'AbortError') return;
      setMessages(prev => {
        const next = [...prev];
        next[next.length - 1] = {
          role: 'assistant',
          content: ollamaOnline === false
            ? '⚠️ Ollama is not running. Please start it with:\n`ollama serve`\nthen refresh.'
            : `⚠️ Error: ${err.message}`,
        };
        return next;
      });
    } finally {
      setStreaming(false);
      abortRef.current = null;
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); sendMessage(); }
  };

  const clearChat = () => {
    abortRef.current?.abort();
    setMessages([{ role: 'assistant', content: "Chat cleared! How can I help you?" }]);
    setInput('');
    setStreaming(false);
  };

  return (
    <>
      {/* Floating Action Button */}
      <Box sx={{ position: 'fixed', bottom: 28, right: 28, zIndex: 1300 }}>
        {/* Pulse ring when closed */}
        {!open && (
          <Box sx={{
            position: 'absolute', inset: -6, borderRadius: '50%',
            border: '2px solid rgba(30,93,169,0.4)',
            animation: 'pulse 2s infinite',
            '@keyframes pulse': { '0%': { transform: 'scale(1)', opacity: 0.8 }, '100%': { transform: 'scale(1.5)', opacity: 0 } }
          }} />
        )}
        <Tooltip title={open ? 'Close MedBot' : 'Ask MedBot'} placement="left" arrow>
          <Fab
            onClick={() => setOpen(o => !o)}
            sx={{ width: 64, height: 64, p: 0, overflow: 'visible',
              background: 'linear-gradient(135deg, #1E5DA9 0%, #00B4D8 100%)',
              boxShadow: '0 6px 24px rgba(30,93,169,0.45)',
              transition: 'transform 0.3s',
              '&:hover': { transform: 'scale(1.08)' },
            }}
          >
            {open
              ? <Close sx={{ color: '#fff', fontSize: 28 }} />
              : <MedBotIcon size={38} />
            }
          </Fab>
        </Tooltip>
      </Box>

      {/* Chat Window */}
      <Fade in={open}>
        <Paper elevation={12} sx={{
          position: 'fixed', bottom: 108, right: 28, zIndex: 1299,
          width: { xs: 'calc(100vw - 32px)', sm: 380 },
          height: 520, display: 'flex', flexDirection: 'column',
          borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 12px 48px rgba(0,0,0,0.18)',
        }}>
          {/* Header */}
          <Box sx={{ background: 'linear-gradient(135deg, #1E5DA9 0%, #00B4D8 100%)', px: 2, py: 1.5, display: 'flex', alignItems: 'center', gap: 1.5 }}>
            <Avatar sx={{ width: 38, height: 38, bgcolor: 'rgba(255,255,255,0.15)' }}>
              <MedBotIcon size={26} />
            </Avatar>
            <Box sx={{ flex: 1 }}>
              <Typography variant="subtitle2" fontWeight="bold" sx={{ color: '#fff', lineHeight: 1.2 }}>MedBot</Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <Box sx={{ width: 7, height: 7, borderRadius: '50%', bgcolor: ollamaOnline === false ? '#fca5a5' : '#4ade80' }} />
                <Typography variant="caption" sx={{ color: 'rgba(255,255,255,0.85)' }}>
                  {ollamaOnline === false ? 'Ollama offline' : ollamaOnline ? 'llama3.2 · local' : 'Connecting...'}
                </Typography>
              </Box>
            </Box>
            <Tooltip title="Clear chat" arrow>
              <IconButton size="small" onClick={clearChat} sx={{ color: 'rgba(255,255,255,0.8)', '&:hover': { color: '#fff' } }}>
                <DeleteOutline fontSize="small" />
              </IconButton>
            </Tooltip>
          </Box>

          <Divider />

          {/* Messages */}
          <Box sx={{ flex: 1, overflowY: 'auto', px: 2, py: 1.5, backgroundColor: '#fafbfc',
            '&::-webkit-scrollbar': { width: 4 },
            '&::-webkit-scrollbar-thumb': { background: '#cbd5e1', borderRadius: 4 }
          }}>
            {messages.map((msg, i) => (
              <MessageBubble key={i} msg={msg} />
            ))}
            {streaming && messages[messages.length - 1]?.content === '' && (
              <Box sx={{ display: 'flex', gap: 1, alignItems: 'flex-end', mb: 1.5 }}>
                <Avatar sx={{ width: 32, height: 32, bgcolor: '#e0f2fe', flexShrink: 0 }}>
                  <MedBotIcon size={20} />
                </Avatar>
                <Box sx={{ px: 2, py: 1, borderRadius: '18px 18px 18px 4px', backgroundColor: '#f1f5f9' }}>
                  <TypingDots />
                </Box>
              </Box>
            )}
            <div ref={bottomRef} />
          </Box>

          <Divider />

          {/* Ollama offline banner */}
          {ollamaOnline === false && (
            <Box sx={{ px: 2, py: 1, backgroundColor: '#fef2f2', borderTop: '1px solid #fecaca' }}>
              <Typography variant="caption" sx={{ color: '#dc2626' }}>
                ⚠️ Ollama not detected. Run <strong>ollama serve</strong> locally.
              </Typography>
            </Box>
          )}

          {/* Input */}
          <Box sx={{ px: 2, py: 1.5, backgroundColor: '#fff', display: 'flex', gap: 1, alignItems: 'flex-end' }}>
            <TextField
              inputRef={inputRef}
              fullWidth multiline maxRows={3}
              placeholder="Ask about medical help..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={streaming || ollamaOnline === false}
              variant="outlined"
              size="small"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: '14px', fontSize: '0.875rem',
                  '&.Mui-focused fieldset': { borderColor: '#1E5DA9' },
                }
              }}
            />
            <IconButton
              onClick={sendMessage}
              disabled={!input.trim() || streaming || ollamaOnline === false}
              sx={{
                width: 40, height: 40, flexShrink: 0,
                background: input.trim() && !streaming ? 'linear-gradient(135deg, #1E5DA9, #00B4D8)' : '#e2e8f0',
                color: input.trim() && !streaming ? '#fff' : '#94a3b8',
                borderRadius: '12px', transition: 'all 0.2s',
                '&:hover': { transform: 'scale(1.05)' },
              }}
            >
              {streaming ? <CircularProgress size={18} sx={{ color: '#94a3b8' }} /> : <Send sx={{ fontSize: 18 }} />}
            </IconButton>
          </Box>
        </Paper>
      </Fade>
    </>
  );
}
