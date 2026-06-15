import React, { useState, useEffect, useRef } from 'react';
import { Send, Sparkles, Languages, Users, Bot, User, Brain, AlertTriangle, AlertCircle, HelpCircle } from 'lucide-react';
import { aiService } from '../services/ai.service';
import { groupService } from '../services/group.service';

export const AIAssistant = () => {
  const [groups, setGroups] = useState([]);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [selectedLanguage, setSelectedLanguage] = useState('English');
  const [inputMessage, setInputMessage] = useState('');
  const [chatHistory, setChatHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const messagesEndRef = useRef(null);

  const languages = [
    "English",
    "Hindi",
    "Bengali",
    "Marathi",
    "Gujarati",
    "Tamil",
    "Telugu",
    "Malayalam",
    "Punjabi"
  ];

  const suggestedQuestions = [
    { text: "Who spent the most?", label: "Top Spender" },
    { text: "How can everyone settle their dues?", label: "Settlement Plan" },
    { text: "Summarize the entire trip.", label: "Trip Summary" },
    { text: "Show category spending breakdown.", label: "Categories Stats" }
  ];

  // Fetch groups on mount
  useEffect(() => {
    const fetchGroups = async () => {
      try {
        const response = await groupService.getGroups();
        if (response.success) {
          setGroups(response.data || response.groups || []);
        }
      } catch (err) {
        console.error('Failed to load groups for AI selector:', err);
      }
    };
    fetchGroups();
  }, []);

  // Scroll to bottom on history change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatHistory, loading]);

  const handleSendMessage = async (textToSend) => {
    const messageText = textToSend || inputMessage;
    if (!messageText.trim()) return;
    if (!selectedGroupId) {
      setError('Please select a group first to begin chat.');
      return;
    }

    setError('');
    const userMessage = {
      role: 'user',
      content: messageText
    };

    // Append user message immediately
    setChatHistory(prev => [...prev, userMessage]);
    if (!textToSend) setInputMessage('');
    
    setLoading(true);

    try {
      // Map frontend chatHistory message structures to backend [{role, content}] format
      const historyPayload = chatHistory.map(msg => ({
        role: msg.role,
        content: msg.content
      }));

      const response = await aiService.queryAgent(
        selectedGroupId,
        messageText,
        selectedLanguage,
        historyPayload
      );

      if (response.success) {
        setChatHistory(prev => [
          ...prev,
          {
            role: 'model',
            content: response.answer,
            insights: response.insights || [],
            tables: response.tables || [],
            settlements: response.settlements || [],
            metadata: response.metadata || {}
          }
        ]);
      } else {
        setError(response.error || 'Failed to query the AI Agent.');
      }
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'An error occurred during communication.');
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const renderInlineMarkdown = (text) => {
    const parts = [];
    let index = 0;
    const regex = /(\*\*.*?\*\*|`.*?`)/g;
    let match;
    
    while ((match = regex.exec(text)) !== null) {
      const matchIndex = match.index;
      const matchText = match[0];
      
      if (matchIndex > index) {
        parts.push(text.substring(index, matchIndex));
      }
      
      if (matchText.startsWith('**') && matchText.endsWith('**')) {
        parts.push(
          <strong key={matchIndex} className="font-bold text-slate-900 dark:text-dark-50">
            {matchText.slice(2, -2)}
          </strong>
        );
      } else if (matchText.startsWith('`') && matchText.endsWith('`')) {
        parts.push(
          <code key={matchIndex} className="rounded bg-slate-100 px-1 py-0.5 font-mono text-xs text-rose-600 dark:bg-dark-800 dark:text-rose-400 border border-slate-200 dark:border-dark-750">
            {matchText.slice(1, -1)}
          </code>
        );
      }
      
      index = regex.lastIndex;
    }
    
    if (index < text.length) {
      parts.push(text.substring(index));
    }
    
    return parts.length > 0 ? parts : text;
  };

  const renderMarkdown = (text) => {
    if (!text) return null;
    const blocks = text.split(/\n\n+/);
    
    return blocks.map((block, bIdx) => {
      const trimmed = block.trim();
      
      if (trimmed.startsWith('- ') || trimmed.startsWith('* ')) {
        const items = trimmed.split(/\n[-*]\s+/).map(line => line.replace(/^[-*]\s+/, '').trim());
        return (
          <ul key={bIdx} className="list-disc pl-5 my-3 space-y-1.5 text-slate-700 dark:text-dark-200">
            {items.map((item, iIdx) => (
              <li key={iIdx}>{renderInlineMarkdown(item)}</li>
            ))}
          </ul>
        );
      }
      
      if (trimmed.startsWith('#')) {
        const match = trimmed.match(/^(#{1,6})\s+(.*)$/);
        if (match) {
          const level = match[1].length;
          const headingText = match[2];
          const classes = level === 1 ? 'text-2xl font-bold my-4 text-slate-900 dark:text-dark-50'
                        : level === 2 ? 'text-xl font-bold my-3 text-slate-800 dark:text-dark-100'
                        : 'text-lg font-bold my-2 text-slate-800 dark:text-dark-100';
          const Tag = `h${level}`;
          return <Tag key={bIdx} className={classes}>{renderInlineMarkdown(headingText)}</Tag>;
        }
      }
      
      if (trimmed.startsWith('>')) {
        const quoteText = trimmed.replace(/^>\s*/mg, '').trim();
        return (
          <blockquote key={bIdx} className="border-l-4 border-brand-500 pl-4 my-3 italic text-slate-600 dark:text-dark-300">
            {renderInlineMarkdown(quoteText)}
          </blockquote>
        );
      }

      return (
        <p key={bIdx} className="my-2.5 leading-relaxed text-slate-750 dark:text-dark-200">
          {renderInlineMarkdown(trimmed)}
        </p>
      );
    });
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-7rem)] animate-fade-in font-sans">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between pb-4 border-b border-slate-200 dark:border-dark-800 gap-4 shrink-0">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-slate-900 dark:text-dark-50 flex items-center gap-2">
            <Brain className="h-8 w-8 text-brand-500" />
            Financial Intelligence Agent
          </h1>
          <p className="text-sm text-slate-500 dark:text-dark-450 mt-1">Real-time analytical reasoning, trip reports, category statistics, and optimized debt settlement plans.</p>
        </div>

        {/* Config Selectors */}
        <div className="flex items-center gap-3">
          {/* Group Dropdown */}
          <div className="flex items-center gap-1.5">
            <Users className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedGroupId}
              onChange={(e) => {
                setSelectedGroupId(e.target.value);
                setChatHistory([]); // Clear chat history when switching groups
              }}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-dark-750 dark:bg-dark-900 dark:text-dark-100 transition-colors"
            >
              <option value="">-- Choose Group --</option>
              {groups.map(g => (
                <option key={g.id} value={g.id}>{g.name}</option>
              ))}
            </select>
          </div>

          {/* Language Dropdown */}
          <div className="flex items-center gap-1.5">
            <Languages className="h-4 w-4 text-slate-400 shrink-0" />
            <select
              value={selectedLanguage}
              onChange={(e) => setSelectedLanguage(e.target.value)}
              className="rounded-xl border border-slate-300 bg-white px-3 py-1.5 text-xs font-semibold text-slate-700 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-dark-750 dark:bg-dark-900 dark:text-dark-100 transition-colors"
            >
              {languages.map(lang => (
                <option key={lang} value={lang}>{lang}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-sm font-semibold text-red-650 flex items-center gap-2 dark:bg-red-950/20 dark:text-red-400 border border-red-200/40 mt-4 shrink-0">
          <AlertCircle className="h-5 w-5 shrink-0" />
          {error}
        </div>
      )}

      {/* Main Chat Feed Workspace */}
      <div className="flex-1 overflow-y-auto py-6 space-y-6 min-h-0 px-2">
        {chatHistory.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center max-w-xl mx-auto space-y-6">
            <div className="rounded-3xl p-5 bg-brand-500/10 border border-brand-500/20 text-brand-500 animate-pulse">
              <Bot className="h-12 w-12" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-slate-800 dark:text-dark-100">Ask the Financial Intelligence Agent</h2>
              <p className="text-sm text-slate-500 dark:text-dark-450 mt-2 leading-relaxed">
                Choose an active group and a language, then ask any question. You can query statistics, top spenders, verify calculations, summarize entire trips, or output optimized debt settlement suggestions.
              </p>
            </div>
            
            {/* Suggested questions list */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full pt-4">
              {suggestedQuestions.map((q, idx) => (
                <button
                  key={idx}
                  onClick={() => handleSendMessage(q.text)}
                  disabled={!selectedGroupId}
                  className="flex items-center gap-2.5 p-4 rounded-2xl border border-slate-200 text-left hover:bg-slate-50 dark:border-dark-850 dark:hover:bg-dark-800/40 text-xs font-semibold text-slate-700 dark:text-dark-250 transition-all duration-200 active:scale-[0.98] disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  <HelpCircle className="h-4 w-4 text-brand-500 shrink-0" />
                  <span>{q.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            {chatHistory.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-4 max-w-4xl ${msg.role === 'user' ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div className={`rounded-2xl p-2.5 h-10 w-10 shrink-0 flex items-center justify-center shadow-md ${
                  msg.role === 'user'
                    ? 'bg-gradient-to-tr from-brand-600 to-brand-500 text-white'
                    : 'bg-slate-100 dark:bg-dark-800 text-slate-650 dark:text-dark-100 border border-slate-200 dark:border-dark-750'
                }`}>
                  {msg.role === 'user' ? <User className="h-5 w-5" /> : <Bot className="h-5 w-5" />}
                </div>

                {/* Message Bubble Body */}
                <div className={`flex-1 rounded-3xl p-5 shadow-sm border ${
                  msg.role === 'user'
                    ? 'bg-slate-100 text-slate-800 border-slate-200 dark:bg-dark-800 dark:text-dark-100 dark:border-dark-750'
                    : 'bg-white text-slate-800 border-slate-200 dark:bg-dark-900 dark:text-dark-100 dark:border-dark-800/80'
                }`}>
                  {/* Text Answer */}
                  <div className="text-sm font-medium leading-relaxed">
                    {msg.role === 'user' ? msg.content : renderMarkdown(msg.content)}
                  </div>

                  {/* Render Visual Elements for Assistant Responses */}
                  {msg.role !== 'user' && (
                    <>
                      {/* Key Insights List */}
                      {msg.insights && msg.insights.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-800 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-dark-450 flex items-center gap-1.5">
                            <Sparkles className="h-3.5 w-3.5 text-brand-500" />
                            Key Insights
                          </h4>
                          <div className="flex flex-wrap gap-2">
                            {msg.insights.map((ins, iIdx) => (
                              <span key={iIdx} className="inline-flex items-center gap-1 rounded-xl bg-slate-50 border border-slate-200 text-slate-700 px-3 py-1 text-xs font-semibold dark:bg-dark-800 dark:text-dark-200 dark:border-dark-750 shadow-sm">
                                {ins}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Visual Tables */}
                      {msg.tables && msg.tables.map((table, tIdx) => (
                        <div key={tIdx} className="mt-4 overflow-hidden rounded-2xl border border-slate-200 dark:border-dark-750 shadow-md">
                          <table className="w-full text-left border-collapse text-xs">
                            <thead>
                              <tr className="bg-slate-50 dark:bg-dark-950/40 text-slate-500 dark:text-dark-400 font-bold uppercase text-[10px] tracking-wider border-b border-slate-200 dark:border-dark-750">
                                {table.headers.map((h, hIdx) => (
                                  <th key={hIdx} className="px-4 py-3">{h}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-150 dark:divide-dark-800 text-slate-700 dark:text-dark-200">
                              {table.rows.map((row, rIdx) => (
                                <tr key={rIdx} className="hover:bg-slate-50/50 dark:hover:bg-dark-800/20">
                                  {row.map((cell, cIdx) => (
                                    <td key={cIdx} className="px-4 py-2.5 font-medium">{cell}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        </div>
                      ))}

                      {/* Visual Settlement Flow Charts */}
                      {msg.settlements && msg.settlements.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-dark-800 space-y-2">
                          <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 dark:text-dark-450">
                            Suggested Settlements Flow
                          </h4>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                            {msg.settlements.map((s, sIdx) => (
                              <div key={sIdx} className="flex items-center justify-between p-3.5 rounded-2xl border border-brand-500/20 bg-brand-50/5 dark:bg-brand-950/5 shadow-sm">
                                <div className="flex items-center gap-2 text-xs">
                                  <span className="font-bold text-slate-800 dark:text-dark-100">{s.from}</span>
                                  <span className="text-slate-400 dark:text-dark-450">→</span>
                                  <span className="font-bold text-slate-800 dark:text-dark-100">{s.to}</span>
                                </div>
                                <span className="font-black text-brand-600 dark:text-brand-400 text-xs">
                                  ${parseFloat(s.amount).toFixed(2)}
                                </span>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Engine Metadata tag */}
                      {msg.metadata && msg.metadata.engine && (
                        <div className="mt-4 flex items-center justify-end text-[10px] text-slate-400 dark:text-dark-500 font-semibold tracking-wider uppercase gap-1">
                          <Sparkles className="h-3 w-3 text-brand-400" />
                          <span>Powered by {msg.metadata.engine}</span>
                        </div>
                      )}
                    </>
                  )}
                </div>
              </div>
            ))}

            {/* Typing Thinking Indicator Bubble */}
            {loading && (
              <div className="flex gap-4 max-w-lg mr-auto">
                <div className="rounded-2xl p-2.5 h-10 w-10 shrink-0 flex items-center justify-center bg-slate-100 dark:bg-dark-800 text-slate-650 dark:text-dark-100 border border-slate-200 dark:border-dark-750 shadow-md">
                  <Bot className="h-5 w-5 animate-pulse" />
                </div>
                <div className="flex-1 rounded-3xl p-5 bg-white border border-slate-200 dark:bg-dark-900 dark:border-dark-800/80 flex items-center gap-2">
                  <span className="text-xs font-semibold text-slate-500 dark:text-dark-400 animate-pulse">Agent is reasoning live data...</span>
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></span>
                    <span className="w-1.5 h-1.5 bg-brand-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>
        )}
      </div>

      {/* Fixed Chat Input Area */}
      <div className="pt-4 border-t border-slate-200 dark:border-dark-800 shrink-0 bg-slate-50/10 dark:bg-dark-900/10">
        <div className="flex items-center gap-3">
          <textarea
            rows={1}
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            disabled={!selectedGroupId || loading}
            placeholder={
              !selectedGroupId
                ? "Select a group from the top dropdown list to start chatting..."
                : "Ask the Financial Agent anything about expenses, balances, categories, trips, or settlement plans..."
            }
            className="flex-1 resize-none rounded-2xl border border-slate-300 bg-white px-4 py-3 text-sm font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-brand-500 dark:border-dark-750 dark:bg-dark-900 dark:text-dark-100 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          />
          <button
            onClick={() => handleSendMessage()}
            disabled={!selectedGroupId || !inputMessage.trim() || loading}
            className="rounded-2xl bg-gradient-to-tr from-brand-600 to-brand-500 p-3.5 text-white shadow-lg shadow-brand-500/20 hover:from-brand-500 hover:to-brand-400 focus:outline-none focus:ring-2 focus:ring-brand-500 active:scale-[0.96] transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed shrink-0"
          >
            <Send className="h-5 w-5" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default AIAssistant;
