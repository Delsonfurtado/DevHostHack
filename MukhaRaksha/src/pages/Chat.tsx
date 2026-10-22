import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Search,
  Volume2,
  VolumeX,
  Trash2,
  AlertCircle,
  HelpCircle,
  Key,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { ChatMessage } from '../types/models';

interface FAQ {
  qEn: string;
  qKn: string;
  aEn: string;
  aKn: string;
}

const FAQS: FAQ[] = [
  {
    qEn: 'What are the earliest signs of oral cancer?',
    qKn: 'ಬಾಯಿ ಕ್ಯಾನ್ಸರ್‌ನ ಆರಂಭಿಕ ಲಕ್ಷಣಗಳು ಯಾವುವು?',
    aEn: 'The earliest signs include a painless mouth ulcer lasting more than 2 weeks, non-scrapable white patches (leukoplakia), red patches (erythroplakia), and unexplained mouth or jaw stiffness.',
    aKn: '೨ ವಾರಗಳಿಗಿಂತ ಹೆಚ್ಚು ಕಾಲ ಉಳಿಯುವ ನೋವಿಲ್ಲದ ಹುಣ್ಣು, ಬಿಳಿ ಚುಕ್ಕೆ (ಲ್ಯುಕೋಪ್ಲಾಕಿಯಾ), ಕೆಂಪು ಚುಕ್ಕೆ (ಎರಿಥ್ರೋಪ್ಲಾಕಿಯಾ) ಮತ್ತು ಬಾಯಿ ಅಗಲವಾಗಿ ತೆರೆಯಲು ಕಷ್ಟವಾಗುವುದು ಆರಂಭಿಕ ಲಕ್ಷಣಗಳು.',
  },
  {
    qEn: 'Is areca nut alone capable of causing oral cancer without tobacco?',
    qKn: 'ತಂಬಾಕು ಇಲ್ಲದ ಕೇವಲ ಅಡಿಕೆ ಜಗಿಯುವುದರಿಂದಲೂ ಕ್ಯಾನ್ಸರ್ ಬರುವುದೇ?',
    aEn: 'Yes. Areca nut is recognized by WHO as an independent Group 1 human carcinogen. It causes oral submucous fibrosis (OSMF) which has a high malignant transformation rate.',
    aKn: 'ಹೌದು. ಅಡಿಕೆಯು ಸ್ವತಃ ಗ್ರೂಪ್ ೧ ಕ್ಯಾನ್ಸರ್‌ಕಾರಕವಾಗಿದೆ. ಇದು ಬಾಯಿಯ ಒಳಗಿನ ಚರ್ಮ ಗಟ್ಟಿಯಾಗಲು (ಓಎಸ್‌ಎಂಎಫ್) ಕಾರಣವಾಗಿ ಕ್ಯಾನ್ಸರ್‌ಗೆ ದಾರಿಯಾಗುತ್ತದೆ.',
  },
  {
    qEn: 'How can I get free counseling to quit tobacco in Karnataka?',
    qKn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ತಂಬಾಕು ತ್ಯಜಿಸಲು ಉಚಿತ ಆಪ್ತಸಮಾಲೋಚನೆ ಎಲ್ಲಿ ಸಿಗುತ್ತದೆ?',
    aEn: 'Call the National Tobacco Quitline at 1800-11-2356 (Toll-Free). You can also visit your nearest Taluk Hospital or Community Health Centre (CHC) Dental OPD.',
    aKn: 'ರಾಷ್ಟ್ರೀಯ ತಂಬಾಕು ಮುಕ್ತ ಸಹಾಯವಾಣಿ ೧೮೦೦-೧೧-೨೩೫೬ ಗೆ ಉಚಿತವಾಗಿ ಕರೆ ಮಾಡಿ. ಅಥವಾ ಹತ್ತಿರದ ತಾಲೂಕು ಆಸ್ಪತ್ರೆಯ ದಂತ ಚಿಕಿತ್ಸಾ ವಿಭಾಗಕ್ಕೆ ಭೇಟಿ ನೀಡಿ.',
  },
  {
    qEn: 'What is the difference between an ordinary aphthous ulcer and oral cancer?',
    qKn: 'ಸಾಮಾನ್ಯ ಬಾಯಿ ಹುಣ್ಣು ಮತ್ತು ಕ್ಯಾನ್ಸರ್ ಹುಣ್ಣಿನ ನಡುವಿನ ವ್ಯತ್ಯಾಸವೇನು?',
    aEn: 'Normal mouth sores usually heal on their own in 7–10 days and are often painful. Precancerous or cancerous ulcers often persist beyond 14 days and may have raised, firm borders.',
    aKn: 'ಸಾಮಾನ್ಯ ಬಾಯಿ ಹುಣ್ಣುಗಳು ೭-೧೦ ದಿನಗಳಲ್ಲಿ ತಾವಾಗಿಯೇ ವಾಸಿಯಾಗುತ್ತವೆ. ಕ್ಯಾನ್ಸರ್ ಹುಣ್ಣುಗಳು ೨ ವಾರ ಕಳೆದರೂ ವಾಸಿಯಾಗದೆ ಗಟ್ಟಿಯಾಗಿ ಬೆಳೆಯುತ್ತವೆ.',
  },
  {
    qEn: 'Where can I get advanced oral cancer treatment in Karnataka?',
    qKn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ಅತ್ಯುತ್ತಮ ಬಾಯಿ ಕ್ಯಾನ್ಸರ್ ಚಿಕಿತ್ಸೆ ಎಲ್ಲಿ ಲಭ್ಯವಿದೆ?',
    aEn: 'Kidwai Memorial Institute of Oncology (Bengaluru), Government Dental College (Bengaluru), and district medical colleges across Mysuru, Dharwad, and Belagavi provide subsidized and Ayushman Bharat covered care.',
    aKn: 'ಬೆಂಗಳೂರಿನ ಕಿಡ್ವಾಯ್ ಆಂಕೊಲಜಿ ಸಂಸ್ಥೆ, ಸರ್ಕಾರಿ ದಂತ ಕಾಲೇಜು, ಮೈಸೂರು ಹಾಗೂ ಧಾರವಾಡ ಜಿಲ್ಲಾ ಆಸ್ಪತ್ರೆಗಳಲ್ಲಿ ಉಚಿತ/ರಿಯಾಯಿತಿ ದರದ ಚಿಕಿತ್ಸೆ ಲಭ್ಯವಿದೆ.',
  },
];

export default function Chat() {
  const { t, lang, settings, speak, stopSpeaking, isSpeaking } = useApp();

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [faqSearch, setFaqSearch] = useState('');
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Live messages from Dexie
  const messages = useLiveQuery(() => db.chatMessages.orderBy('timestamp').toArray(), []) || [];

  // Scroll to bottom on new message
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Handle Send Message
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputText.trim() || isLoading) return;

    const userMsg = inputText.trim();
    setInputText('');

    // Save user message
    const userMsgObj: ChatMessage = {
      id: 'msg_' + Date.now(),
      role: 'user',
      content: userMsg,
      timestamp: new Date(),
    };
    await db.chatMessages.add(userMsgObj);

    setIsLoading(true);

    try {
      if (settings.claudeApiKey) {
        // Call Anthropic API directly from browser
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': settings.claudeApiKey,
            'anthropic-version': '2023-06-01',
            'dangerously-allow-browser': 'true',
          },
          body: JSON.stringify({
            model: 'claude-3-haiku-20240307',
            max_tokens: 450,
            system:
              'You are MukhaRaksha, a warm, calm, expert oral health awareness assistant for Karnataka, India. Provide clear educational guidance on oral cancer symptoms, risk factors (tobacco, areca nut/pan, alcohol), and oral hygiene. Respond in the user\'s language (Kannada if query is Kannada, English if English). CRITICAL: NEVER provide a clinical diagnosis or prescribe medications. Always emphasize consulting a doctor or dentist for examination.',
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: userMsg },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error(`API error: ${response.statusText}`);
        }

        const data = await response.json();
        const assistantText = data.content?.[0]?.text || 'No response from assistant.';

        await db.chatMessages.add({
          id: 'msg_bot_' + Date.now(),
          role: 'assistant',
          content: assistantText,
          timestamp: new Date(),
        });
      } else {
        // Fallback: Rule-based FAQ search
        await new Promise((res) => setTimeout(res, 600));

        const matchedFaq = FAQS.find(
          (f) =>
            userMsg.toLowerCase().includes('sign') ||
            userMsg.toLowerCase().includes('symptom') ||
            userMsg.toLowerCase().includes('ಅಡಿಕೆ') ||
            userMsg.toLowerCase().includes('areca') ||
            userMsg.toLowerCase().includes('quit') ||
            userMsg.toLowerCase().includes('ಬಿಡು') ||
            userMsg.toLowerCase().includes('doctor') ||
            userMsg.toLowerCase().includes('kidwai')
        );

        let answer = '';
        if (matchedFaq) {
          answer = lang === 'kn' ? matchedFaq.aKn : matchedFaq.aEn;
        } else {
          answer =
            lang === 'kn'
              ? 'ಮುಖರಕ್ಷಾ ಜಾಗೃತಿಗೆ ಸ್ವಾಗತ. ಬಾಯಿ ಹುಣ್ಣು ೨ ವಾರಗಳಲ್ಲಿ ಗುಣವಾಗದಿದ್ದರೆ ಅಥವಾ ಬಾಯಿಯಲ್ಲಿ ಬಿಳಿ/ಕೆಂಪು ಚುಕ್ಕೆಗಳು ಕಂಡರೆ ದಂತ ವೈದ್ಯರನ್ನು ಸಂಪರ್ಕಿಸಿ. (ತಜ್ಞ AI ಉತ್ತರಗಳಿಗಾಗಿ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿ Claude API Key ನಮೂದಿಸಬಹುದು).'
              : 'Welcome to MukhaRaksha! If you or a patient have a mouth sore lasting over 2 weeks or white/red patches, please visit a dental professional promptly. (For custom AI answers, you can add your Claude API key in Settings).';
        }

        await db.chatMessages.add({
          id: 'msg_bot_' + Date.now(),
          role: 'assistant',
          content: answer,
          timestamp: new Date(),
        });
      }
    } catch (err: any) {
      console.error(err);
      showToast('Could not fetch AI response. Check your Claude API key.', 'error');
      await db.chatMessages.add({
        id: 'msg_bot_' + Date.now(),
        role: 'assistant',
        content:
          lang === 'kn'
            ? 'ಕ್ಷಮಿಸಿ, AI ಸಂಪರ್ಕದಲ್ಲಿ ದೋಷವಾಗಿದೆ. ದಯವಿಟ್ಟು ನಿಮ್ಮ ಇಂಟರ್ನೆಟ್ ಅಥವಾ ಸೆಟ್ಟಿಂಗ್ಸ್‌ನಲ್ಲಿರುವ API ಕೀಯನ್ನು ಪರಿಶೀಲಿಸಿ.'
            : 'Sorry, unable to connect to AI. Please check your API key in Settings or review our FAQs below.',
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Clear Chat History
  const handleClearChat = async () => {
    await db.chatMessages.clear();
    showToast('Chat history cleared', 'info');
  };

  // Filtered FAQs
  const filteredFaqs = FAQS.filter(
    (f) =>
      f.qEn.toLowerCase().includes(faqSearch.toLowerCase()) ||
      f.qKn.toLowerCase().includes(faqSearch.toLowerCase())
  );

  return (
    <Layout title={t('chatTitle')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-4 flex flex-col h-[calc(100vh-140px)]">
        {/* Header Bar */}
        <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-800 shrink-0">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-teal-600 text-white flex items-center justify-center">
              <Bot size={18} />
            </div>
            <div>
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">
                {t('chatTitle')}
              </h2>
              <span className="text-[10px] text-gray-400">
                {settings.claudeApiKey ? '✨ Claude AI Powered' : 'Built-in Knowledge Base'}
              </span>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {messages.length > 0 && (
              <button
                onClick={handleClearChat}
                className="text-gray-400 hover:text-red-500 p-1.5"
                title="Clear Chat"
              >
                <Trash2 size={16} />
              </button>
            )}
          </div>
        </div>

        {/* AI Disclaimer Alert */}
        <div className="p-2 my-2 rounded-xl bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 flex items-center gap-2 shrink-0">
          <AlertCircle size={14} className="text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-300">
            {t('chatDisclaimer')}
          </p>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {messages.length === 0 ? (
            /* Empty State with FAQ Suggestions */
            <div className="space-y-4 py-6">
              <div className="text-center space-y-1">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-900/40 text-teal-600 flex items-center justify-center mx-auto">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-sm font-bold text-gray-800 dark:text-gray-200">
                  {lang === 'kn' ? 'ಮುಖರಕ್ಷಾ ಸಹಾಯಕಿಗೆ ಸ್ವಾಗತ' : 'Ask MukhaRaksha Anything'}
                </h3>
                <p className="text-xs text-gray-400 max-w-xs mx-auto">
                  {lang === 'kn'
                    ? 'ಬಾಯಿ ಕ್ಯಾನ್ಸರ್, ಅಡಿಕೆ ದುಷ್ಪರಿಣಾಮಗಳು ಅಥವಾ ತಪಾಸಣೆಯ ಬಗ್ಗೆ ಪ್ರಶ್ನೆಗಳನ್ನು ಕೇಳಿ.'
                    : 'Get quick guidance on oral lesions, risk prevention, and tobacco quitting.'}
                </p>
              </div>

              {/* Quick FAQ Pills */}
              <div className="space-y-1.5">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider block">
                  {t('faqTitle')}
                </span>
                {FAQS.slice(0, 3).map((faq, i) => (
                  <button
                    key={i}
                    onClick={() => {
                      setInputText(lang === 'kn' ? faq.qKn : faq.qEn);
                    }}
                    className="w-full text-left p-2.5 rounded-xl border border-gray-200 dark:border-gray-700 hover:border-teal-500 bg-white dark:bg-gray-800 text-xs text-gray-700 dark:text-gray-200 transition-colors flex items-center justify-between"
                  >
                    <span>{lang === 'kn' ? faq.qKn : faq.qEn}</span>
                    <HelpCircle size={14} className="text-teal-600 shrink-0 ml-2" />
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((m) => {
              const isUser = m.role === 'user';
              return (
                <div
                  key={m.id}
                  className={`flex items-start gap-2 ${isUser ? 'justify-end' : 'justify-start'}`}
                >
                  {!isUser && (
                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold">
                      ಮ
                    </div>
                  )}

                  <div
                    className={`max-w-[80%] p-3 rounded-2xl text-xs leading-relaxed space-y-1 ${
                      isUser
                        ? 'bg-teal-600 text-white rounded-tr-none'
                        : 'bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 text-gray-800 dark:text-gray-100 rounded-tl-none shadow-xs'
                    }`}
                  >
                    <p>{m.content}</p>
                    <div className="flex items-center justify-between pt-1 text-[9px] opacity-70">
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!isUser && (
                        <button
                          onClick={() => speak(m.content)}
                          className="hover:opacity-100 p-0.5 ml-2"
                          title="Read message"
                        >
                          <Volume2 size={12} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-gray-400 italic py-2">
              <Bot size={16} className="animate-spin text-teal-600" />
              <span>MukhaRaksha is thinking...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="pt-2 border-t border-gray-200 dark:border-gray-800 flex gap-2 shrink-0">
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t('chatPlaceholder')}
            className="input-field text-xs py-2.5 flex-1"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="btn-primary py-2.5 px-4 text-xs font-bold flex items-center gap-1 shrink-0"
          >
            <Send size={14} />
          </button>
        </form>
      </div>
    </Layout>
  );
}
