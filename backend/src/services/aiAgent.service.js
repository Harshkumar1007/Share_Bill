import { getGroupBalances } from '../controllers/group.controller.js';
import * as tools from './aiTools.service.js';
import fs from 'fs';

// Multi-language translation dictionary for local fallback
const dict = {
  English: {
    totalSpent: "Total Group Spending",
    mostSpender: "Highest Spender",
    leastSpender: "Lowest Spender",
    largestExpense: "Largest Expense",
    debtPlan: "Optimal Settlement Plan",
    whoOwesWhom: "Who Owes Whom",
    tripSummaryTitle: "Trip Summary",
    participants: "Participants",
    categoryStats: "Category Spending Breakdown",
    dailySpend: "Daily Spending Breakdown",
    noDues: "All balances are settled! No transactions required.",
    owes: "owes",
    to: "to",
    spentText: "spent a total of",
    biggestExpText: "The largest expense recorded was"
  },
  Hindi: {
    totalSpent: "कुल समूह खर्च",
    mostSpender: "सबसे अधिक खर्च करने वाला",
    leastSpender: "सबसे कम खर्च करने वाला",
    largestExpense: "सबसे बड़ा खर्च",
    debtPlan: "इष्टतम निपटान योजना",
    whoOwesWhom: "कौन किसका ऋणी है",
    tripSummaryTitle: "यात्रा सारांश",
    participants: "प्रतिभागी",
    categoryStats: "श्रेणीवार खर्च का विवरण",
    dailySpend: "दैनिक खर्च का विवरण",
    noDues: "सभी शेष राशि का निपटान कर दिया गया है! कोई लेन-देन आवश्यक नहीं है।",
    owes: "उधार है",
    to: "को",
    spentText: "ने कुल खर्च किया",
    biggestExpText: "दर्ज किया गया सबसे बड़ा खर्च था"
  },
  Bengali: {
    totalSpent: "মোট গ্রুপ খরচ",
    mostSpender: "সর্বোচ্চ ব্যয়কারী",
    leastSpender: "সর্বনিম্ন ব্যয়কারী",
    largestExpense: "সবচেয়ে বড় খরচ",
    debtPlan: "অনুকূল নিষ্পত্তি পরিকল্পনা",
    whoOwesWhom: "কে কার কাছে ঋণী",
    tripSummaryTitle: "ভ্রমণ বিবরণী",
    participants: "অংশগ্রহণকারী",
    categoryStats: "বিভাগ অনুযায়ী ব্যয়ের বিবরণ",
    dailySpend: "দৈনিক ব্যয়ের বিবরণ",
    noDues: "সব ব্যালেন্স মেটানো হয়েছে! কোনো লেনদেনের প্রয়োজন নেই।",
    owes: "ঋণী",
    to: "কে",
    spentText: "মোট খরচ করেছেন",
    biggestExpText: "নথিভুক্ত সবচেয়ে বড় খরচ ছিল"
  },
  Marathi: {
    totalSpent: "एकूण गट खर्च",
    mostSpender: "सर्वात जास्त खर्च करणारा",
    leastSpender: "सर्वात कमी खर्च करणारा",
    largestExpense: "सर्वात मोठा खर्च",
    debtPlan: "तडजोड योजना",
    whoOwesWhom: "कोण कोणाचे देणे लागतो",
    tripSummaryTitle: "प्रवास सारांश",
    participants: "सहभागी",
    categoryStats: "वर्गवारीनुसार खर्चाचा तपशील",
    dailySpend: "दैनिक खर्चाचा तपशील",
    noDues: "सर्व थकबाकी निकाली काढण्यात आली आहे! कोणत्याही व्यवहाराची आवश्यकता नाही.",
    owes: "देणे लागतो",
    to: "ला",
    spentText: "ने एकूण खर्च केला",
    biggestExpText: "नोंदवला गेलेला सर्वात मोठा खर्च होता"
  },
  Gujarati: {
    totalSpent: "કુલ જૂથ ખર્ચ",
    mostSpender: "સૌથી વધુ ખર્ચ કરનાર",
    leastSpender: "સૌથી ઓછો ખર્ચ કરનાર",
    largestExpense: "સૌથી મોટો ખર્ચ",
    debtPlan: "તાવણું પતાવટ પ્લાન",
    whoOwesWhom: "કોણ કોનું દેણું ચૂકવશે",
    tripSummaryTitle: "પ્રવાસ સારાંશ",
    participants: "ભાગીદારો",
    categoryStats: "કેટેગરી મુજબ ખર્ચ વિગત",
    dailySpend: "દૈનિક ખર્ચ વિગત",
    noDues: "બધી બાકી રકમ ચૂકવાઈ ગઈ છે! કોઈ વ્યવહારની જરૂર નથી.",
    owes: "ચૂકવશે",
    to: "ને",
    spentText: "એ કુલ ખર્ચ કર્યો",
    biggestExpText: "નોંધાયેલો સૌથી મોટો ખર્ચ હતો"
  },
  Tamil: {
    totalSpent: "மொத்த குழு செலவு",
    mostSpender: "அதிகம் செலவு செய்தவர்",
    leastSpender: "குறைவாக செலவு செய்தவர்",
    largestExpense: "மிகப்பெரிய செலவு",
    debtPlan: "உகந்த தீர்வு திட்டம்",
    whoOwesWhom: "யார் யாருக்கு கடன்பட்டிருக்கிறார்கள்",
    tripSummaryTitle: "பயணச் சுருக்கம்",
    participants: "பங்கேற்பாளர்கள்",
    categoryStats: "வகைப்பாடு செலவு விவரம்",
    dailySpend: "தினசரி செலவு விவரம்",
    noDues: "அனைத்து நிலுவைகளும் தீர்க்கப்பட்டுவிட்டன! எந்த பரிவர்த்தனையும் தேவையில்லை.",
    owes: "தர வேண்டும்",
    to: "க்கு",
    spentText: "மொத்தமாக செலவு செய்துள்ளார்",
    biggestExpText: "பதிவுசெய்யப்பட்ட மிகப்பெரிய செலவு"
  },
  Telugu: {
    totalSpent: "మొత్తం గ్రూప్ ఖర్చు",
    mostSpender: "ఎక్కువ ఖర్చు చేసిన వ్యక్తి",
    leastSpender: "తక్కువ ఖర్చు చేసిన వ్యక్తి",
    largestExpense: "అతి పెద్ద ఖర్చు",
    debtPlan: "సరైన పరిష్కార ప్రణాళిక",
    whoOwesWhom: "ఎవరు ఎవరికి ఇవ్వాలి",
    tripSummaryTitle: "ప్రయాణ సారాంశం",
    participants: "పాల్గొనేవారు",
    categoryStats: "విభాగాల వారీగా ఖర్చుల వివరాలు",
    dailySpend: "రోజువారీ ఖర్చుల వివరాలు",
    noDues: "అన్ని బ్యਾਲెన్సులు పరిష్కరించబడ్డాయి! ఎటువంటి లావాదేవీలు అవసరం లేదు.",
    owes: "ఇవ్వాలి",
    to: "కి",
    spentText: "మొత్తంగా ఖర్చు చేశారు",
    biggestExpText: "నమోదైన అతిపెద్ద ఖర్చు"
  },
  Malayalam: {
    totalSpent: "ആകെ ഗ്രൂപ്പ് ചെലവ്",
    mostSpender: "ഏറ്റവും കൂടുതൽ ചിലവഴിച്ചയാൾ",
    leastSpender: "ഏറ്റവും കുറവ് ചിലവഴിച്ചയാൾ",
    largestExpense: "ഏറ്റവും വലിയ ചെലവ്",
    debtPlan: "ഒറ്റത്തവണ തീർപ്പാക്കൽ പ്ലാൻ",
    whoOwesWhom: "ആര് ആർക്കാണ് നൽകാനുള്ളത്",
    tripSummaryTitle: "യാത്രയുടെ സംഗ്രഹം",
    participants: "പങ്കെടുക്കുന്നവർ",
    categoryStats: "വിഭാഗം തിരിച്ച് ചെലവുകൾ",
    dailySpend: "ദൈനംദിന ചെലവുകൾ",
    noDues: "എല്ലാ കുടിശ്ശികകളും തീർത്തു! ഇടപാടുകൾ ഒന്നും ആവശ്യമില്ല.",
    owes: "നൽകാനുണ്ട്",
    to: "ക്ക്",
    spentText: "ആകെ ചെലവഴിച്ചു",
    biggestExpText: "രേഖപ്പെടുത്തിയതിൽ ഏറ്റവും വലിയ ചെലവ്"
  },
  Punjabi: {
    totalSpent: "ਕੁੱਲ ਗਰੁੱਪ ਖਰਚਾ",
    mostSpender: "ਸਭ ਤੋਂ ਵੱਧ ਖਰਚ ਕਰਨ ਵਾਲਾ",
    leastSpender: "ਸਭ ਤੋਂ ਘੱਟ ਖਰਚ ਕਰਨ ਵਾਲਾ",
    largestExpense: "ਸਭ ਤੋਂ ਵੱਡਾ ਖਰਚਾ",
    debtPlan: "ਸਹੀ ਨਿਪਟਾਰਾ ਯੋਜਨਾ",
    whoOwesWhom: "ਕੌਣ ਕਿਸਦਾ ਦੇਣਦਾਰ ਹੈ",
    tripSummaryTitle: "ਯਾਤਰਾ ਦਾ ਸਾਰ",
    participants: "ਹਿੱਸੇਦਾਰ",
    categoryStats: "ਸ਼੍ਰੇਣੀ ਅਨੁਸਾਰ ਖਰਚਾ",
    dailySpend: "ਰੋਜ਼ਾਨਾ ਖਰਚਾ",
    noDues: "ਸਾਰੀਆਂ ਬਾਕੀ ਰਕਮਾਂ ਦਾ ਨਿਪਟਾਰਾ ਹੋ ਚੁੱਕਾ ਹੈ! ਕਿਸੇ ਲੈਣ-ਦੇਣ ਦੀ ਲੋੜ ਨਹੀਂ ਹੈ।",
    owes: "ਦੇਣੇ ਹਨ",
    to: "ਨੂੰ",
    spentText: "ਨੇ ਕੁੱਲ ਖਰਚ ਕੀਤੇ",
    biggestExpText: "ਦਰਜ ਕੀਤਾ ਗਿਆ ਸਭ ਤੋਂ ਵੱਡਾ ਖਰਚਾ ਸੀ"
  }
};

/**
 * Fetch and bundle the entire group database profile into a single JSON context
 * @param {string} groupId 
 * @returns {Promise<Object>}
 */
export const getGroupContext = async (groupId) => {
  const [
    group,
    members,
    expenses,
    balances,
    settlements,
    tripSummary,
    categoryStats,
    activityLogs,
    csvImports,
    anomalies
  ] = await Promise.all([
    tools.getGroup(groupId),
    tools.getMembers(groupId),
    tools.getExpenses(groupId),
    tools.getBalances(groupId),
    tools.getSettlements(groupId),
    tools.getTripSummary(groupId),
    tools.getCategoryStats(groupId),
    tools.getActivityLogs(groupId),
    tools.getCSVImports(groupId),
    tools.getAnomalies(groupId)
  ]);

  return {
    group,
    members,
    expensesCount: expenses.length,
    expenses: expenses.map(e => ({
      description: e.description,
      amount: e.amount,
      currency: e.currency,
      date: e.date ? new Date(e.date).toISOString().split('T')[0] : 'Unknown',
      paidBy: e.paidBy?.name,
      splits: e.splits.map(s => ({
        user: s.user?.name,
        amount: s.amount
      }))
    })),
    balances,
    settlements: settlements.map(s => ({
      from: s.fromUser?.name,
      to: s.toUser?.name,
      amount: s.amount,
      date: s.date ? new Date(s.date).toISOString().split('T')[0] : 'Unknown'
    })),
    tripSummary,
    categoryStats,
    activityLogs: activityLogs.map(l => ({
      type: l.type,
      user: l.userName,
      message: l.message,
      timestamp: l.timestamp
    })),
    csvImports,
    anomalies
  };
};

/**
 * Strips markdown codeblock markers (like ```json ... ```) from a text response.
 * @param {string} text 
 * @returns {string} Clean JSON string
 */
export const cleanJsonResponse = (text) => {
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```(json)?\r?\n/, '');
    cleaned = cleaned.replace(/\r?\n```$/, '');
  }
  return cleaned.trim();
};

/**
 * Rule-based analytical reasoning fallback if Gemini API key is missing or fails.
 * Parses keywords and resolves actual statistics based on tool outputs.
 */
export const runLocalFallbackAgent = (context, question, language) => {
  const lang = dict[language] ? language : 'English';
  const t = dict[lang];

  const q = question.toLowerCase();
  
  let answer = "";
  const insights = [];
  const tables = [];
  const settlements = [];

  const { group, members, expenses, balances, tripSummary, categoryStats } = context;
  const currency = balances.defaultCurrency || 'USD';
  const groupName = group?.name || 'Group';

  if (q.includes('spender') || q.includes('spent the most') || q.includes('spent most') || q.includes('most spent') || q.includes('সবচেয়ে বেশি') || q.includes('સૌથી વધુ') || q.includes('सबसे ज्यादा') || q.includes('செலவு')) {
    if (tripSummary.topSpenders.length > 0) {
      const top = tripSummary.topSpenders[0];
      const bottom = tripSummary.topSpenders[tripSummary.topSpenders.length - 1];
      answer = `${top.name} ${t.spentText} ${currency} ${top.total.toFixed(2)}, making them the highest spender. ${bottom.name} spent the least with ${currency} ${bottom.total.toFixed(2)}.`;
      
      insights.push(`${t.mostSpender}: ${top.name} (${currency} ${top.total.toFixed(2)})`);
      insights.push(`${t.leastSpender}: ${bottom.name} (${currency} ${bottom.total.toFixed(2)})`);
      
      tables.push({
        headers: ["Member Name", "Total Amount Spent"],
        rows: tripSummary.topSpenders.map(s => [s.name, `${currency} ${s.total.toFixed(2)}`])
      });
    } else {
      answer = `No expenses have been recorded in this group yet.`;
    }
  } 
  else if (q.includes('biggest') || q.includes('largest') || q.includes('highest expense') || q.includes('सबसे बड़ा') || q.includes('સૌથી મોટો') || q.includes('সবচেয়ে বড়') || q.includes('பெரிய')) {
    const maxExp = tripSummary.largestExpense;
    if (maxExp) {
      answer = `${t.biggestExpText} "${maxExp.description}" of ${maxExp.currency} ${maxExp.amount.toFixed(2)} paid by ${maxExp.paidBy} on ${maxExp.date}.`;
      insights.push(`Largest Expense: ${maxExp.description} (${maxExp.currency} ${maxExp.amount.toFixed(2)})`);
      
      tables.push({
        headers: ["Field", "Details"],
        rows: [
          ["Description", maxExp.description],
          ["Amount", `${maxExp.currency} ${maxExp.amount.toFixed(2)}`],
          ["Paid By", maxExp.paidBy],
          ["Date", maxExp.date]
        ]
      });
    } else {
      answer = `No expenses recorded yet.`;
    }
  }
  else if (q.includes('settle') || q.includes('debt') || q.includes('owe') || q.includes('लेन-देन') || q.includes('ਦੇਣਦਾਰ') || q.includes('കടം') || q.includes('கடன்')) {
    const curBalances = balances.balancesByCurrency[currency] || { debts: [] };
    const debts = curBalances.debts || [];
    
    if (debts.length > 0) {
      const debtLines = debts.map(d => `${d.from} → ${d.to} ${currency} ${d.amount.toFixed(2)}`);
      answer = `Here is the optimized settlement plan to resolve all dues in ${currency} using ${debts.length} transaction(s):\n\n${debtLines.join('\n')}\n\nThis will balance all group balances to zero.`;
      
      insights.push(`Total Transactions Needed: ${debts.length}`);
      insights.push(`Total Settled Amount: ${currency} ${debts.reduce((sum, d) => sum + d.amount, 0).toFixed(2)}`);
      
      tables.push({
        headers: ["From (Debtor)", "To (Creditor)", "Amount"],
        rows: debts.map(d => [d.from, d.to, `${currency} ${d.amount.toFixed(2)}`])
      });

      debts.forEach(d => {
        settlements.push({
          from: d.from,
          to: d.to,
          amount: d.amount
        });
      });
    } else {
      answer = t.noDues;
    }
  }
  else if (q.includes('category') || q.includes('food') || q.includes('hotel') || q.includes('travel') || q.includes('stay') || q.includes('taxi') || q.includes('श्रेणी') || q.includes('வகை')) {
    const stats = categoryStats;
    const statsEntries = Object.entries(stats);
    if (statsEntries.length > 0) {
      answer = `Here is the category spending breakdown for the group:\n\n` + 
               statsEntries.map(e => `- ${e[0]}: ${currency} ${e[1].total.toFixed(2)} (${e[1].count} expense(s))`).join('\n');
      
      tables.push({
        headers: ["Category", "Total Spent", "Transactions Count"],
        rows: statsEntries.map(e => [e[0], `${currency} ${e[1].total.toFixed(2)}`, e[1].count.toString()])
      });
      
      const topCat = statsEntries.sort((a,b) => b[1].total - a[1].total)[0];
      insights.push(`Top Category Cost: ${topCat[0]} (${currency} ${topCat[1].total.toFixed(2)})`);
    } else {
      answer = `No expenses recorded.`;
    }
  }
  else {
    const totalSpentStr = Object.entries(tripSummary.totalExpensesByCurrency)
      .map(e => `${e[0]} ${e[1].toFixed(2)}`).join(', ');
      
    answer = `Welcome to the ${t.tripSummaryTitle} for group "${groupName}".\n\n` +
             `- **Total Group Spending:** ${totalSpentStr || 'None'}\n` +
             `- **Total Members:** ${tripSummary.participantsCount}\n` +
             `- **Members List:** ${tripSummary.participants.join(', ')}\n\n` +
             `Feel free to ask specific details about spenders, categories, or the settlement plans!`;
             
    insights.push(`Total Members: ${tripSummary.participantsCount}`);
    if (tripSummary.topSpenders.length > 0) {
      insights.push(`Top Spender: ${tripSummary.topSpenders[0].name}`);
    }
    
    tables.push({
      headers: ["Metric", "Value"],
      rows: [
        ["Group Name", groupName],
        ["Total Spending", totalSpentStr || "0.00"],
        ["Members Count", tripSummary.participantsCount.toString()]
      ]
    });
  }

  return {
    answer,
    insights,
    tables,
    settlements,
    metadata: {
      engine: "Local Fallback Engine",
      languageMatched: lang,
      timestamp: new Date().toISOString()
    }
  };
};

/**
 * Query the Gemini API or run local fallback analysis to resolve financial queries.
 * @param {string} groupId 
 * @param {string} question 
 * @param {string} language 
 * @param {Array} history Chat session history
 * @returns {Promise<Object>} Structured query response
 */
export const queryAgent = async (groupId, question, language = 'English', history = []) => {
  const context = await getGroupContext(groupId);

  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    console.warn('GEMINI_API_KEY environment variable is not configured. Running Local Fallback Engine.');
    return runLocalFallbackAgent(context, question, language);
  }

  const systemInstructionText = `
You are a Financial Intelligence Agent for a Shared Expense Management App.
You act as an expert financial analyst, accountant, and debt settlement advisor.

You are given:
1. Active Group Context: A JSON object containing the complete live database information for a group (members, expenses, splits, settlements, net balances, activity logs).
2. User Question: The question the user is asking.
3. Language: The language the user wants the explanation in (e.g. Hindi, English, Bengali, Marathi, Gujarati, Tamil, Telugu, Malayalam, Punjabi).
4. Chat History: Previous messages in this active chat session for context memory.

Your job is to answer the User Question using the provided Active Group Context and explain any calculations step-by-step.
Follow these rules:
1. ONLY use the live data provided in the Active Group Context.
2. Be mathematically precise. Verify all sums, divisions, and percentages.
3. For calculations of settlements, show the optimized settlement plan where net balances are reduced to zero with the minimum number of transactions.
4. Support multi-language requests. The values, formulas, and math stay unchanged, but the language of the explanation text and labels must match the requested language.
5. Support follow-up questions by referencing the provided Chat History.
6. Provide rich visual aids by generating structured tables, summary insights, and settlement lists.
7. Keep safety and privacy: Refuse to disclose passwords, JWT session tokens, system database credentials, or private credentials. If the user asks for data outside the group context, reject it.
8. Output the response in valid, parsable JSON matching this exact structure:
{
  "answer": "The text answer in the requested language, explaining the logic/calculations.",
  "insights": ["Bullet point key insight 1", "Bullet point key insight 2"],
  "tables": [
    {
      "headers": ["Header 1", "Header 2"],
      "rows": [
        ["Row 1 Cell 1", "Row 1 Cell 2"]
      ]
    }
  ],
  "settlements": [
    {
      "from": "Debtor Name",
      "to": "Creditor Name",
      "amount": 100.00
    }
  ],
  "metadata": {
    "calculationSteps": "Step-by-step math explanation"
  }
}
Do not include markdown wrappers (like \`\`\`json ... \`\`\`) in your response; return ONLY the raw JSON string.
`;

  const contextMessage = {
    role: 'user',
    parts: [
      {
        text: `Here is the live database information for the current group. Use this data to answer the next user question and any subsequent queries:\n${JSON.stringify(context, null, 2)}`
      }
    ]
  };

  const mappedHistory = (history || []).map(h => ({
    role: h.role === 'user' ? 'user' : 'model',
    parts: [{ text: h.content }]
  }));

  const currentMessage = {
    role: 'user',
    parts: [{ text: `Language: ${language}\n\nQuestion: ${question}` }]
  };

  const contents = [
    contextMessage,
    ...mappedHistory,
    currentMessage
  ];

  try {
    const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        contents,
        systemInstruction: {
          parts: [{ text: systemInstructionText }]
        },
        generationConfig: {
          responseMimeType: 'application/json'
        }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Gemini API Request failed with status ${response.status}: ${errorText}`);
      // Fallback to local reasoning on failure
      return runLocalFallbackAgent(context, question, language);
    }

    const resJson = await response.json();
    const candidateText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!candidateText) {
      throw new Error('No content returned from Gemini candidate.');
    }

    const cleanedText = cleanJsonResponse(candidateText);
    const parsedResult = JSON.parse(cleanedText);

    return {
      answer: parsedResult.answer || '',
      insights: parsedResult.insights || [],
      tables: parsedResult.tables || [],
      settlements: parsedResult.settlements || [],
      metadata: {
        engine: "Google Gemini 1.5 Flash API",
        languageMatched: language,
        ...parsedResult.metadata,
        timestamp: new Date().toISOString()
      }
    };
  } catch (err) {
    console.error('Gemini query execution failed, falling back to local reasoning:', err.message);
    return runLocalFallbackAgent(context, question, language);
  }
};

export default {
  getGroupContext,
  cleanJsonResponse,
  runLocalFallbackAgent,
  queryAgent
};
