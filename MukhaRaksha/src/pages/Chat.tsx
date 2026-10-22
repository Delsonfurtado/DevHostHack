import React, { useState, useEffect, useRef } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import {
  MessageSquare,
  Send,
  Bot,
  User,
  Sparkles,
  Volume2,
  Trash2,
  AlertCircle,
  HelpCircle,
  ShieldAlert,
  ArrowRight,
  ExternalLink,
} from 'lucide-react';
import Layout from '../components/Layout';
import { Card, ReadAloudBtn, showToast } from '../components/ui';
import { useApp } from '../context/AppContext';
import { db } from '../db/database';
import type { ChatMessage } from '../types/models';

interface KnowledgeItem {
  keywords: string[];
  en: string;
  kn: string;
}

const CLINICAL_KNOWLEDGE_BASE: KnowledgeItem[] = [
  {
    keywords: ['ulcer', 'sore', 'wound', 'heal', 'ಹುಣ್ಣು', 'ಗಾಯ', 'ವಾಸಿಯಾಗದ'],
    en: 'Any mouth ulcer or sore that does not heal within 2 weeks must be physically examined by a dental surgeon or doctor. While normal aphthous ulcers resolve in 7–10 days, precancerous and cancerous sores persist, have raised or firm edges, and might not cause severe pain initially.',
    kn: '೨ ವಾರಗಳಿಗಿಂತ ಹೆಚ್ಚು ಕಾಲ ಗುಣವಾಗದ ಬಾಯಿ ಹುಣ್ಣನ್ನು ತಕ್ಷಣವೇ ದಂತ ವೈದ್ಯರು ಅಥವಾ ಆಂಕೊಲಾಜಿಸ್ಟ್ ಬಳಿ ಪರೀಕ್ಷಿಸಿಕೊಳ್ಳಬೇಕು. ಸಾಮಾನ್ಯ ಬಾಯಿ ಹುಣ್ಣು ೭-೧೦ ದಿನಗಳಲ್ಲಿ ತಾನಾಗಿಯೇ ಗುಣವಾಗುತ್ತದೆ, ಆದರೆ ಕ್ಯಾನ್ಸರ್ ಹುಣ್ಣುಗಳು ಗಟ್ಟಿಯಾಗಿ ಬೆಳೆಯುತ್ತವೆ.',
  },
  {
    keywords: ['areca', 'betel', 'pan', 'supari', 'ಅಡಿಕೆ', 'ವೀಳ್ಯ', 'ಪಾನ್', 'ಸುಪಾರಿ'],
    en: 'Areca nut (betel nut / supari) is classified by the WHO International Agency for Research on Cancer as a Group 1 human carcinogen on its own, even without tobacco. It contains alkaloids like arecoline that cause oral submucous fibrosis (OSMF)—stiffening of the cheek and loss of mouth opening.',
    kn: 'ಅಡಿಕೆಯು (ಸುಪಾರಿ) ತಂಬಾಕು ಬೆರೆಸದಿದ್ದರೂ ಸ್ವತಃ ಪ್ರಮುಖ ಕ್ಯಾನ್ಸರ್‌ಕಾರಕವಾಗಿದೆ. ಇದರಲ್ಲಿರುವ ಅರೆಕೋಲಿನ್ ಎಂಬ ಅಂಶವು ಬಾಯಿಯ ಒಳಗಿನ ಚರ್ಮವನ್ನು ಕಲ್ಲಿನಂತೆ ಬಿಗಿಗೊಳಿಸಿ (ಓಎಸ್‌ಎಂಎಫ್) ಬಾಯಿ ತೆರೆಯಲಾಗದ ಸ್ಥಿತಿಗೆ ಕಾರಣವಾಗುತ್ತದೆ.',
  },
  {
    keywords: ['white', 'red', 'patch', 'leukoplakia', 'erythroplakia', 'ಬಿಳಿ', 'ಕೆಂಪು', 'ಚುಕ್ಕೆ'],
    en: 'White patches that cannot be wiped away are called leukoplakia, and velvety red patches are called erythroplakia. Erythroplakia has an especially high risk (up to 90%) of harboring severe dysplasia or early cancer. Both require immediate clinical biopsy evaluation.',
    kn: 'ಒರೆಸಿದರೂ ಹೋಗದ ಬಿಳಿ ಚುಕ್ಕೆಗಳನ್ನು "ಲ್ಯುಕೋಪ್ಲಾಕಿಯಾ" ಮತ್ತು ಕೆಂಪು ಚುಕ್ಕೆಗಳನ್ನು "ಎರಿಥ್ರೋಪ್ಲಾಕಿಯಾ" ಎನ್ನುತ್ತಾರೆ. ಕೆಂಪು ಚುಕ್ಕೆಗಳು ಕ್ಯಾನ್ಸರ್ ಆಗುವ ಸಂಭವ ಅತಿ ಹೆಚ್ಚು (೯೦% ವರೆಗೆ). ಇವು ಕಂಡುಬಂದಲ್ಲಿ ವಿಳಂಬವಿಲ್ಲದೆ ತಪಾಸಣೆ ಮಾಡಿಸಿ.',
  },
  {
    keywords: ['quit', 'helpline', 'craving', 'stop', 'ತ್ಯಜಿಸು', 'ಬಿಡು', 'ಸಹಾಯವಾಣಿ', 'ಆಸೆ'],
    en: 'You can get free, confidential counseling by calling the National Tobacco Quitline at 1800-11-2356 (Toll-free, India). Intense cravings typically last only 3–5 minutes. Try drinking cold water, chewing cardamom/cloves, or doing deep belly breathing.',
    kn: 'ತಂಬಾಕು ತ್ಯಜಿಸಲು ರಾಷ್ಟ್ರೀಯ ಉಚಿತ ಸಹಾಯವಾಣಿ ೧೮೦೦-೧೧-೨೩೫೬ ಗೆ ಕರೆ ಮಾಡಿ ತಜ್ಞರ ಸಲಹೆ ಪಡೆಯಬಹುದು. ತಂಬಾಕಿನ ತೀವ್ರ ಆಸೆ ಕೇವಲ ೩-೫ ನಿಮಿಷ ಮಾತ್ರ ಇರುತ್ತದೆ. ಆ ಸಮಯದಲ್ಲಿ ತಣ್ಣೀರು ಕುಡಿಯಿರಿ ಅಥವಾ ಏಲಕ್ಕಿ/ಲವಂಗ ಜಗಿಯಿರಿ.',
  },
  {
    keywords: ['trismus', 'open', 'mouth', 'stiff', 'jaw', 'ಬಾಯಿ', 'ತೆರೆಯಲು', 'ಬಿಗಿ'],
    en: 'Difficulty opening the mouth wide (less than 3 fingers width) is called trismus, commonly resulting from Oral Submucous Fibrosis (OSMF) due to areca nut or gutka use. Early diagnosis can halt progression before surgical intervention is required.',
    kn: 'ಬಾಯಿಯನ್ನು ಅಗಲವಾಗಿ ತೆರೆಯಲು ಕಷ್ಟವಾಗುವುದು (೩ ಬೆರಳುಗಳಷ್ಟು ಜಾಗವಿಲ್ಲದಿರುವುದು) ಅಡಿಕೆ ಅಥವಾ ಗುಟ್ಕಾ ಬಳಕೆಯಿಂದ ಬರುವ ಫೈಬ್ರೋಸಿಸ್ ಲಕ್ಷಣ. ಆರಂಭಿಕ ಹಂತದಲ್ಲೇ ತಪಾಸಣೆ ಮಾಡಿಸಿದರೆ ಔಷಧಿಗಳ ಮೂಲಕ ಗುಣಪಡಿಸಬಹುದು.',
  },
  {
    keywords: ['kidwai', 'hospital', 'clinic', 'dentist', 'bangalore', 'bengaluru', 'ಕಿಡ್ವಾಯ್', 'ಆಸ್ಪತ್ರೆ', 'ವೈದ್ಯರು'],
    en: 'In Karnataka, advanced tertiary oral cancer care is provided at Kidwai Memorial Institute of Oncology (Bengaluru), Government Dental College (Bengaluru), and District Medical Colleges in Dharwad, Mysuru, and Belagavi with Ayushman Bharat-Arogya Karnataka coverage.',
    kn: 'ಕರ್ನಾಟಕದಲ್ಲಿ ಬೆಂಗಳೂರಿನ ಕಿಡ್ವಾಯ್ ಸ್ಮಾರಕ ಆಂಕೊಲಜಿ ಸಂಸ್ಥೆ, ಸರ್ಕಾರಿ ದಂತ ಕಾಲೇಜು ಮತ್ತು ಮೈಸೂರು, ಧಾರವಾಡ, ಬೆಳಗಾವಿ ಜಿಲ್ಲಾ ವೈದ್ಯಕೀಯ ಕಾಲೇಜುಗಳಲ್ಲಿ ಆಯುಷ್ಮಾನ್ ಭಾರತ್ ಯೋಜನೆಯಡಿ ಉಚಿತ ಅಥವಾ ರಿಯಾಯಿತಿ ದರದ ಚಿಕಿತ್ಸೆ ಲಭ್ಯವಿದೆ.',
  },
  {
    keywords: ['biopsy', 'pain', 'test', 'ಬಯಾಪ್ಸಿ', 'ನೋವು', 'ಪರೀಕ್ಷೆ'],
    en: 'A biopsy is a minor, safe procedure where a tiny piece of tissue is taken under local anesthesia to definitively verify if cells are benign, precancerous, or cancerous. It is the gold standard and should never be delayed out of fear.',
    kn: 'ಬಯಾಪ್ಸಿ ಎನ್ನುವುದು ಸ್ಥಳೀಯ ಅರಿವಳಿಕೆ (ಲೋಕಲ್ ಅನಸ್ತೇಶಿಯಾ) ನೀಡಿ ಸಣ್ಣ ಮಾದರಿ ಅಂಗಾಂಶವನ್ನು ತೆಗೆದು ಪರೀಕ್ಷಿಸುವ ಸುರಕ್ಷಿತ ವಿಧಾನ. ಇದು ಕ್ಯಾನ್ಸರ್ ಇದೆಯೇ ಇಲ್ಲವೇ ಎಂಬುದನ್ನು ಖಚಿತಪಡಿಸಿಕೊಳ್ಳಲು ಅತಿ ಮುಖ್ಯ.',
  },
  {
    keywords: ['child', 'baby', 'teething', 'bottle', 'ಮಗು', 'ಹಲ್ಲು', 'ಹಾಲು'],
    en: 'For children under 6 years, avoid bedtime milk bottles and sweet drinks to prevent early childhood caries. Always consult our "Little Smiles" section in this app for age-banded nutrition and oral hygiene guides.',
    kn: '೬ ವರ್ಷದೊಳಗಿನ ಮಕ್ಕಳಿಗೆ ರಾತ್ರಿ ಮಲಗುವಾಗ ಹಾಲಿನ ಬಾಟಲ್ ಕೊಡಬೇಡಿ. ಹೆಚ್ಚಿನ ಮಾಹಿತಿಗಾಗಿ ಮುಖರಕ್ಷಾ ಅಪ್ಲಿಕೇಶನ್‌ನಲ್ಲಿರುವ "ಪುಟ್ಟ ನಗು" ವಿಭಾಗವನ್ನು ವೀಕ್ಷಿಸಿ.',
  },
];

const SUGGESTED_PROMPTS = [
  {
    en: 'How to differentiate an ordinary ulcer from oral cancer?',
    kn: 'ಸಾಮಾನ್ಯ ಬಾಯಿ ಹುಣ್ಣು ಮತ್ತು ಕ್ಯಾನ್ಸರ್ ಹುಣ್ಣಿನ ವ್ಯತ್ಯಾಸವೇನು?',
  },
  {
    en: 'Why is areca nut harmful even without tobacco?',
    kn: 'ತಂಬಾಕು ಇಲ್ಲದ ಕೇವಲ ಅಡಿಕೆ ಜಗಿಯುವುದರಿಂದ ಏನು ಹಾನಿ?',
  },
  {
    en: 'What are the free helpline numbers to quit tobacco?',
    kn: 'ತಂಬಾಕು ತ್ಯಜಿಸಲು ಉಚಿತ ಸಹಾಯವಾಣಿ ಸಂಖ್ಯೆ ಯಾವುದು?',
  },
  {
    en: 'What does a non-scrapable white patch in cheek mean?',
    kn: 'ಕೆನ್ನೆಯಲ್ಲಿರುವ ಬಿಳಿ ಚುಕ್ಕೆ (ಲ್ಯುಕೋಪ್ಲಾಕಿಯಾ) ಎಂದರೆ ಏನು?',
  },
];

export default function Chat() {
  const { t, lang, settings, speak } = useApp();

  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Live messages
  const messages = useLiveQuery(() => db.chatMessages.orderBy('timestamp').toArray(), []) || [];

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isLoading]);

  // Answer query locally via smart knowledge base
  const getKnowledgeResponse = (query: string): string => {
    const qLower = query.toLowerCase();
    for (const item of CLINICAL_KNOWLEDGE_BASE) {
      if (item.keywords.some((k) => qLower.includes(k))) {
        const text = lang === 'kn' ? item.kn : item.en;
        const disclaimer =
          lang === 'kn'
            ? '\n\n⚠️ ಗಮನಿಸಿ: ಇದು ಶೈಕ್ಷಣಿಕ ಮಾಹಿತಿ ಮಾತ್ರ. ದಯವಿಟ್ಟು ವೈದ್ಯರ ಅಥವಾ ದಂತ ವೈದ್ಯರ ನೇರ ಪರೀಕ್ಷೆ ಪಡೆಯಿರಿ.'
            : '\n\n⚠️ Disclaimer: This is educational guidance only. Please consult a qualified dental surgeon or oncologist for physical examination.';
        return text + disclaimer;
      }
    }

    return lang === 'kn'
      ? 'ಮುಖರಕ್ಷಾ ಕ್ಲಿನಿಕಲ್ ಜ್ಞಾನ ಭಂಡಾರ: ೨ ವಾರಗಳಿಗಿಂತ ಹೆಚ್ಚು ಕಾಲ ಉಳಿಯುವ ಯಾವುದೇ ಬಾಯಿ ಹುಣ್ಣು, ಕೆಂಪು ಅಥವಾ ಬಿಳಿ ಚುಕ್ಕೆಗಳು, ಅಥವಾ ಬಾಯಿ ತೆರೆಯಲು ಕಷ್ಟವಾಗಿದ್ದರೆ ವಿಳಂಬವಿಲ್ಲದೆ ತಪಾಸಣೆ ಮಾಡಿಸಿ. ತಂಬಾಕು ತ್ಯಜಿಸಲು ೧೮೦೦-೧೧-೨೩೫೬ ಗೆ ಉಚಿತ ಕರೆ ಮಾಡಿ. (ಆನ್‌ಲೈನ್ Claude AI ಸಕ್ರಿಯಗೊಳಿಸಲು Settings ನಲ್ಲಿ ನಿಮ್ಮ API Key ನಮೂದಿಸಬಹುದು).'
      : 'MukhaRaksha Clinical Knowledge: Persistent oral ulcers lasting >2 weeks, unscrapable white or velvety red mucosal patches, or difficulty opening the mouth are red flags requiring clinical examination. Call the National Tobacco Quitline at 1800-11-2356 for cessation guidance. (To enable cloud-powered conversational AI, add your Claude API key in Settings).';
  };

  const handleSendMessage = async (userText: string) => {
    if (!userText.trim() || isLoading) return;

    const query = userText.trim();
    setInputText('');

    await db.chatMessages.add({
      id: 'msg_' + Date.now(),
      role: 'user',
      content: query,
      timestamp: new Date(),
    });

    setIsLoading(true);

    try {
      if (settings.claudeApiKey) {
        // Direct Client-Side Anthropic API Call
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
            max_tokens: 500,
            system:
              'You are MukhaRaksha, a clinical oral cancer awareness and tobacco cessation assistant for Karnataka, India. Provide warm, medically sound information in the user\'s language (natural Kannada if queried in Kannada, English if in English). ALWAYS state clearly that this app supports screening and awareness and NEVER diagnose or prescribe medications. Always advise physical clinical examination and biopsy when red flags are present.',
            messages: [
              ...messages.map((m) => ({ role: m.role, content: m.content })),
              { role: 'user', content: query },
            ],
          }),
        });

        if (!response.ok) {
          throw new Error('Anthropic API request failed');
        }

        const data = await response.json();
        const reply = data.content?.[0]?.text || 'No response';

        await db.chatMessages.add({
          id: 'msg_bot_' + Date.now(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        });
      } else {
        // High quality offline clinical knowledge
        await new Promise((res) => setTimeout(res, 500));
        const reply = getKnowledgeResponse(query);

        await db.chatMessages.add({
          id: 'msg_bot_' + Date.now(),
          role: 'assistant',
          content: reply,
          timestamp: new Date(),
        });
      }
    } catch (err) {
      console.error(err);
      const fallbackReply = getKnowledgeResponse(query);
      await db.chatMessages.add({
        id: 'msg_bot_' + Date.now(),
        role: 'assistant',
        content: fallbackReply,
        timestamp: new Date(),
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClearChat = async () => {
    await db.chatMessages.clear();
    showToast(lang === 'kn' ? 'ಸಂಭಾಷಣೆ ತೆರವುಗೊಳಿಸಲಾಗಿದೆ' : 'Chat history cleared', 'info');
  };

  return (
    <Layout title={t('chatTitle')} showDisclaimer>
      <div className="max-w-xl mx-auto px-4 py-3 flex flex-col h-[calc(100vh-140px)]">
        {/* Header Ribbon */}
        <div className="flex items-center justify-between pb-2.5 border-b border-slate-200 dark:border-slate-800 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-teal-600 to-teal-500 text-white flex items-center justify-center shadow-xs">
              <Bot size={18} />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h2 className="text-sm font-bold text-slate-900 dark:text-white">
                  {t('chatTitle')}
                </h2>
                <span className="text-[10px] font-bold px-2 py-0.2 rounded-full bg-teal-100 dark:bg-teal-950/60 text-teal-800 dark:text-teal-300 border border-teal-200/60 dark:border-teal-800/60">
                  {settings.claudeApiKey ? 'Claude AI' : 'Clinical Offline AI'}
                </span>
              </div>
              <p className="text-[10px] text-slate-400">
                {lang === 'kn' ? 'ಬಾಯಿ ಆರೋಗ್ಯ ಮತ್ತು ತಂಬಾಕು ಮುಕ್ತಿ ಸಹಾಯಕ' : 'Oral Health & Screening Knowledge'}
              </p>
            </div>
          </div>

          {messages.length > 0 && (
            <button
              onClick={handleClearChat}
              className="text-slate-400 hover:text-rose-500 p-1.5 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
              title="Clear Chat"
            >
              <Trash2 size={16} />
            </button>
          )}
        </div>

        {/* Non-Diagnostic Disclaimer Pill */}
        <div className="my-2 p-2.5 rounded-xl bg-gradient-to-r from-amber-500/10 via-amber-400/5 to-teal-500/10 border border-amber-200/80 dark:border-amber-800/60 flex items-center gap-2 shrink-0">
          <ShieldAlert size={15} className="text-amber-600 shrink-0" />
          <p className="text-[11px] text-amber-800 dark:text-amber-300 font-medium leading-tight">
            {lang === 'kn'
              ? 'ಮುಖರಕ್ಷಾ AI ರೋಗನಿರ್ಣಯ ಮಾಡುವುದಿಲ್ಲ. ಇದು ಕೇವಲ ಜಾಗೃತಿ ಮತ್ತು ಸ್ಕ್ರೀನಿಂಗ್ ಮಾರ್ಗದರ್ಶನ ನೀಡುತ್ತದೆ.'
              : 'MukhaRaksha AI supports screening and education. It never diagnoses. Always consult a dental surgeon or doctor.'}
          </p>
        </div>

        {/* Message Thread */}
        <div className="flex-1 overflow-y-auto space-y-3 py-2 pr-1">
          {messages.length === 0 ? (
            <div className="space-y-4 py-4">
              <div className="text-center space-y-1.5">
                <div className="w-12 h-12 rounded-2xl bg-teal-50 dark:bg-teal-950/60 text-teal-600 flex items-center justify-center mx-auto shadow-2xs">
                  <Sparkles size={24} />
                </div>
                <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
                  {lang === 'kn' ? 'ಮುಖರಕ್ಷಾ AI ಸಹಾಯಕಿಗೆ ಸ್ವಾಗತ' : 'Ask MukhaRaksha Clinical AI'}
                </h3>
                <p className="text-xs text-slate-400 max-w-xs mx-auto">
                  {lang === 'kn'
                    ? 'ಬಾಯಿ ಹುಣ್ಣು, ಅಡಿಕೆ ದುಷ್ಪರಿಣಾಮ, ಲ್ಯುಕೋಪ್ಲಾಕಿಯಾ ಅಥವಾ ತಂಬಾಕು ಬಿಡುವ ಕುರಿತು ಪ್ರಶ್ನಿಸಿ.'
                    : 'Ask about oral lesions, areca nut risks, precancerous signs, or cessation help.'}
                </p>
              </div>

              {/* Quick Prompt Pills */}
              <div className="space-y-2 pt-2">
                <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block px-1">
                  {lang === 'kn' ? 'ಸಾಮಾನ್ಯ ಪ್ರಶ್ನೆಗಳು (ಟ್ಯಾಪ್ ಮಾಡಿ)' : 'Common Clinical Inquiries (Tap to Ask)'}
                </span>
                <div className="grid grid-cols-1 gap-2">
                  {SUGGESTED_PROMPTS.map((prompt, i) => (
                    <button
                      key={i}
                      onClick={() => handleSendMessage(lang === 'kn' ? prompt.kn : prompt.en)}
                      className="text-left p-3 rounded-xl border border-slate-200/80 dark:border-slate-800 hover:border-teal-500 bg-white/80 dark:bg-slate-900/80 hover:bg-teal-50/40 text-xs text-slate-700 dark:text-slate-200 transition-all flex items-center justify-between group shadow-2xs"
                    >
                      <span className="font-medium">{lang === 'kn' ? prompt.kn : prompt.en}</span>
                      <ArrowRight size={14} className="text-teal-600 shrink-0 ml-2 group-hover:translate-x-0.5 transition-transform" />
                    </button>
                  ))}
                </div>
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
                    <div className="w-7 h-7 rounded-lg bg-teal-600 text-white flex items-center justify-center shrink-0 mt-0.5 text-xs font-bold shadow-2xs">
                      ಮ
                    </div>
                  )}

                  <div
                    className={`max-w-[85%] p-3.5 rounded-2xl text-xs leading-relaxed space-y-1.5 shadow-2xs ${
                      isUser
                        ? 'bg-gradient-to-tr from-teal-600 to-teal-700 text-white rounded-tr-none'
                        : 'bg-white dark:bg-slate-800 border border-slate-200/80 dark:border-slate-700 text-slate-800 dark:text-slate-100 rounded-tl-none'
                    }`}
                  >
                    <p className="whitespace-pre-line">{m.content}</p>
                    <div className="flex items-center justify-between pt-1 text-[10px] opacity-70 border-t border-slate-100/20">
                      <span>{new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                      {!isUser && (
                        <button
                          onClick={() => speak(m.content)}
                          className="hover:opacity-100 p-0.5 ml-2 transition-opacity"
                          title="Read aloud"
                        >
                          <Volume2 size={13} />
                        </button>
                      )}
                    </div>
                  </div>

                  {isUser && (
                    <div className="w-7 h-7 rounded-lg bg-slate-200 dark:bg-slate-700 text-slate-700 dark:text-slate-200 flex items-center justify-center shrink-0 mt-0.5">
                      <User size={14} />
                    </div>
                  )}
                </div>
              );
            })
          )}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-teal-600 dark:text-teal-400 font-medium italic py-2">
              <Bot size={16} className="animate-spin text-teal-600" />
              <span>{lang === 'kn' ? 'ಮುಖರಕ್ಷಾ AI ಆಲೋಚಿಸುತ್ತಿದೆ...' : 'MukhaRaksha is generating guidance...'}</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input Bar */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage(inputText);
          }}
          className="pt-2 border-t border-slate-200 dark:border-slate-800 flex gap-2 shrink-0"
        >
          <input
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={
              lang === 'kn'
                ? 'ಬಾಯಿ ಆರೋಗ್ಯ, ಲಕ್ಷಣಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನಿಸಿ...'
                : 'Ask oral health, lesion, or habit question...'
            }
            className="input-field text-xs py-3 flex-1"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isLoading}
            className="btn-primary py-3 px-4.5 text-xs font-bold shrink-0"
          >
            <Send size={15} />
          </button>
        </form>
      </div>
    </Layout>
  );
}
