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
    tripSummaryTitle: "Detailed Trip Summary",
    participants: "Participants",
    categoryStats: "Category Spending Breakdown",
    dailySpend: "Daily Spending Breakdown",
    noDues: "All balances are settled! No transactions required.",
    owes: "owes",
    to: "to",
    spentText: "spent a total of",
    biggestExpText: "The largest expense recorded was",
    refundAnalysisTitle: "Refund Analysis",
    expenseHistoryTitle: "Expense History",
    debtCreatorTitle: "Highest Debt Creator Analysis",
    settlementExplanationTitle: "Settlement Calculations Step-by-Step",
    member: "Member",
    paid: "Expenses Paid",
    owed: "Share Owed",
    sent: "Settlements Sent",
    recv: "Settlements Received",
    standing: "Final Standing",
    status: "Status",
    date: "Date",
    description: "Description",
    paidBy: "Paid By",
    amount: "Amount",
    splitType: "Split Type",
    savings: "Individual Savings",
    metric: "Metric",
    value: "Value",
    category: "Category",
    count: "Count",
    highestDebtor: "Highest Debtor",
    debtor: "Debtor",
    creditor: "Creditor",
    settled: "Settled"
  },
  Hindi: {
    totalSpent: "कुल समूह खर्च",
    mostSpender: "सबसे अधिक खर्च करने वाला",
    leastSpender: "सबसे कम खर्च करने वाला",
    largestExpense: "सबसे बड़ा खर्च",
    debtPlan: "अनुकूलित निपटान योजना",
    whoOwesWhom: "कौन किसको भुगतान करेगा",
    tripSummaryTitle: "विस्तृत यात्रा सारांश",
    participants: "प्रतिभागी",
    categoryStats: "श्रेणी अनुसार खर्च का विवरण",
    dailySpend: "दैनिक खर्च का विवरण",
    noDues: "सभी बकाया सुलझ गए हैं! किसी लेन-देन की आवश्यकता नहीं है।",
    owes: "का बकाया है",
    to: "को",
    spentText: "ने कुल खर्च किया",
    biggestExpText: "दर्ज किया गया सबसे बड़ा खर्च था",
    refundAnalysisTitle: "रिफंड विश्लेषण",
    expenseHistoryTitle: "खर्चों का इतिहास",
    debtCreatorTitle: "सबसे बड़ा कर्जदार विश्लेषण",
    settlementExplanationTitle: "निपटान गणना का चरण-दर-चरण विवरण",
    member: "सदस्य",
    paid: "भुगतान किया गया खर्च",
    owed: "हिस्सा (देय)",
    sent: "भेजा गया निपटान",
    recv: "प्राप्त निपटान",
    standing: "अंतिम स्थिति",
    status: "स्थिति",
    date: "दिनांक",
    description: "विवरण",
    paidBy: "भुगतान कर्ता",
    amount: "राशि",
    splitType: "विभाजन प्रकार",
    savings: "व्यक्तिगत बचत",
    metric: "मीट्रिक",
    value: "मान",
    category: "श्रेणी",
    count: "संख्या",
    highestDebtor: "सबसे बड़ा देनदार",
    debtor: "देनदार",
    creditor: "लेनदार",
    settled: "सुलझा हुआ"
  },
  Bengali: {
    totalSpent: "মোট গ্রুপ খরচ",
    mostSpender: "সর্বোচ্চ ব্যয়কারী",
    leastSpender: "সর্বনিম্ন ব্যয়কারী",
    largestExpense: "সর্বোত্তম ব্যয়",
    debtPlan: "অনূকূল নিষ্পত্তি পরিকল্পনা",
    whoOwesWhom: "কে কার কাছে ঋণী",
    tripSummaryTitle: "ভ্রমণ বিবরণী",
    participants: "অংশগ্রহণকারী",
    categoryStats: "বিভাগ ভিত্তিক ব্যয় বিশ্লেষণ",
    dailySpend: "দৈনিক ব্যয় বিশ্লেষণ",
    noDues: "সমস্ত লেনদেন নিষ্পত্তি হয়েছে! কোনো লেনদেনের প্রয়োজন নেই।",
    owes: "ঋণী",
    to: "কে",
    spentText: "মোট ব্যয় করেছেন",
    biggestExpText: "সর্বোচ্চ ব্যয় ছিল",
    refundAnalysisTitle: "রিফান্ড বিশ্লেষণ",
    expenseHistoryTitle: "ব্যয়ের ইতিহাস",
    debtCreatorTitle: "সর্বোচ্চ ঋণগ্রহীতা বিশ্লেষণ",
    settlementExplanationTitle: "নিষ্পত্তি হিসাবের ধাপ বিবরণ",
    member: "সদস্য",
    paid: "ব্যয় পরিশোধ",
    owed: "প্রদেয় অংশ",
    sent: "প্রেরিত নিষ্পত্তি",
    recv: "গৃহীত নিষ্পত্তি",
    standing: "চূড়ান্ত অবস্থা",
    status: "অবস্থা",
    date: "তারিখ",
    description: "বিবরণ",
    paidBy: "পরিশোধকারী",
    amount: "পরিমাণ",
    splitType: "বিভাজন প্রকার",
    savings: "ব্যক্তিগত সঞ্চয়",
    metric: "মেট্রিক",
    value: "মান",
    category: "বিভাগ",
    count: "সংখ্যা",
    highestDebtor: "সর্বোচ্চ ঋণগ্রহীতা",
    debtor: "ঋণগ্রহীতা",
    creditor: "ঋণদাতা",
    settled: "নিষ্পত্তি"
  },
  Marathi: {
    totalSpent: "एकूण गट खर्च",
    mostSpender: "सर्वात जास्त खर्च करणारा",
    leastSpender: "सर्वात कमी खर्च करणारा",
    largestExpense: "सर्वात मोठा खर्च",
    debtPlan: "योग्य तोडगा योजना",
    whoOwesWhom: "कोण कोणाचे देणे लागतो",
    tripSummaryTitle: "सविस्तर प्रवास सारांश",
    participants: "सहभागी",
    categoryStats: "वर्गवारीनुसार खर्च विवरण",
    dailySpend: "दैनिक खर्च विवरण",
    noDues: "सर्व व्यवहार पूर्ण झाले आहेत! कोणत्याही व्यवहाराची आवश्यकता नाही.",
    owes: "देणे लागतो",
    to: "ला",
    spentText: "ने एकूण खर्च केला",
    biggestExpText: "नोंदवला गेलेला सर्वात मोठा खर्च होता",
    refundAnalysisTitle: "रिफंड विश्लेषण",
    expenseHistoryTitle: "खर्चाचा इतिहास",
    debtCreatorTitle: "सर्वात मोठा कर्जदार विश्लेषण",
    settlementExplanationTitle: "तोडगा हिशोबाचे पायरी-पायरीने स्पष्टीकरण",
    member: "सदस्य",
    paid: "खर्च भरला",
    owed: "देय हिस्सा",
    sent: "पाठवलेले तोडगे",
    recv: "मिळालेले तोडगे",
    standing: "अंतिम शिल्लक",
    status: "स्थिती",
    date: "दिनांक",
    description: "तपशील",
    paidBy: "खर्च भरणारा",
    amount: "रक्कम",
    splitType: "विभागणी प्रकार",
    savings: "वैयक्तिक बचत",
    metric: "मापदंड",
    value: "मूल्य",
    category: "वर्ग",
    count: "संख्या",
    highestDebtor: "सर्वात मोठा कर्जदार",
    debtor: "कर्जदार",
    creditor: "धनको",
    settled: "निकाली"
  },
  Gujarati: {
    totalSpent: "કુલ જૂથ ખર્ચ",
    mostSpender: "સૌથી વધુ ખર્ચ કરનાર",
    leastSpender: "સૌથી ઓછો ખર્ચ કરનાર",
    largestExpense: "સૌથી મોટો ખર્ચ",
    debtPlan: "અનુકૂળ પતાવટ યોજના",
    whoOwesWhom: "કોણ કોનું દેણદાર છે",
    tripSummaryTitle: "વિગતવાર પ્રવાસ સારાંશ",
    participants: "ભાગીદારો",
    categoryStats: "શ્રેણી મુજબ ખર્ચ વિભાજન",
    dailySpend: "દૈનિક ખર્ચ વિભાજન",
    noDues: "બધી બાકી રકમ પતી ગઈ છે! કોઈ વ્યવહારની જરૂર નથી.",
    owes: "ચૂકવશે",
    to: "ને",
    spentText: "એ કુલ ખર્ચ કર્યો",
    biggestExpText: "નોંધાયેલો સૌથી મોટો ખર્ચ હતો",
    refundAnalysisTitle: "રિફંડ વિશ્લેષણ",
    expenseHistoryTitle: "ખર્ચનો ઇતિહાસ",
    debtCreatorTitle: "સૌથી વધુ દેણદાર વિશ્લેષણ",
    settlementExplanationTitle: "પતાવટ ગણતરીની તબક્કાવાર સમજૂતી",
    member: "સભ્ય",
    paid: "ખર્ચ ચૂકવ્યો",
    owed: "દેવું હિસ્સો",
    sent: "મોકલેલ પતાવટ",
    recv: "મળેલ પતાવટ",
    standing: "અંતિમ બાકી",
    status: "સ્થિતિ",
    date: "તારીખ",
    description: "વર્ણન",
    paidBy: "ચૂકવનાર",
    amount: "રકમ",
    splitType: "વિભાજન પ્રકાર",
    savings: "વ્યક્તિગત બચત",
    metric: "માપદંડ",
    value: "કિંમત",
    category: "શ્રેણી",
    count: "સંખ્યા",
    highestDebtor: "સૌથી મોટો દેણદાર",
    debtor: "દેણદાર",
    creditor: "લેણદાર",
    settled: "ચૂકતે"
  },
  Tamil: {
    totalSpent: "மொத்த குழு செலவு",
    mostSpender: "அதிகம் செலவு செய்தவர்",
    leastSpender: "குறைவாக செலவு செய்தவர்",
    largestExpense: "மிகப்பெரிய செலவு",
    debtPlan: "சிறந்த தீர்வு திட்டம்",
    whoOwesWhom: "யார் யாருக்கு கடன்பட்டிருக்கிறார்கள்",
    tripSummaryTitle: "விவரமான பயண சுருக்கம்",
    participants: "பங்கேற்பாளர்கள்",
    categoryStats: "வகைப்பாடு செலவு விவரம்",
    dailySpend: "தினசரி செலவு விவரம்",
    noDues: "அனைத்து நிலுவைகளும் தீர்க்கப்பட்டுவிட்டன! எந்த பரிவர்த்தனையும் தேவையல்ல.",
    owes: "தர வேண்டும்",
    to: "க்கு",
    spentText: "மொத்தமாக செலவு செய்துள்ளார்",
    biggestExpText: "பதிவுசெய்யப்பட்ட மிகப்பெரிய செலவு",
    refundAnalysisTitle: "பணத்தைத் திரும்பப்பெறுதல் பகுப்பாய்வு",
    expenseHistoryTitle: "செலவு வரலாறு",
    debtCreatorTitle: "அதிக கடன் உருவாக்கியவர் பகுப்பாய்வு",
    settlementExplanationTitle: "தீர்வு கணக்கீடுகள் படிப்படியான விளக்கம்",
    member: "உறுப்பினர்",
    paid: "செலுத்திய செலவுகள்",
    owed: "பகிர்ந்துகொண்ட தொகை",
    sent: "அனுப்பிய தீர்வு",
    recv: "பெற்ற தீர்வு",
    standing: "இறுதி நிலை",
    status: "நிலை",
    date: "தேதி",
    description: "விளக்கம்",
    paidBy: "செலுத்தியவர்",
    amount: "தொகை",
    splitType: "பகிர்வு வகை",
    savings: "தனிநபர் சேமிப்பு",
    metric: "அளவீடு",
    value: "மதிப்பு",
    category: "வகை",
    count: "எண்ணிக்கை",
    highestDebtor: "அதிக கடன் பெற்றவர்",
    debtor: "கடன் பெற்றவர்",
    creditor: "கடன் கொடுத்தவர்",
    settled: "தீர்க்கப்பட்டது"
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
    noDues: "అన్ని బ్యాలెన్సులు పరిష్కరించబడ్డాయి! ఎటువంటి లావాదేవీలు అవసరం లేదు.",
    owes: "ఇవ్వాలి",
    to: "కి",
    spentText: "మొత్తంగా ఖర్చు చేశారు",
    biggestExpText: "నమోదైన అతిపెద్ద ఖర్చు",
    refundAnalysisTitle: "రీఫండ్ విశ్లేషణ",
    expenseHistoryTitle: "ఖర్చుల చరిత్ర",
    debtCreatorTitle: "ఎక్కువ అప్పు ఉన్న వ్యక్తి విశ్లేషణ",
    settlementExplanationTitle: "పరిష్కార లెక్కల దశల వారీ వివరణ",
    member: "సభ్యుడు",
    paid: "చెల్లించిన ఖర్చులు",
    owed: "వాటా (బాకీ)",
    sent: "పంపిన పరిష్కారం",
    recv: "పొందిన పరిష్కారం",
    standing: "తుది బ్యాలెన్స్",
    status: "స్థితి",
    date: "తేదీ",
    description: "వివరణ",
    paidBy: "చెల్లించిన వ్యక్తి",
    amount: "మొత్తం",
    splitType: "విభజన రకం",
    savings: "వ్యక్తిగత పొదుపు",
    metric: "మెట్రిక్",
    value: "విలువ",
    category: "వర్గం",
    count: "సంఖ్య",
    highestDebtor: "అత్యధిక రుణగ్రహీత",
    debtor: "రుణగ్రహీత",
    creditor: "రుణదాత",
    settled: "పరిష్కరించబడింది"
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
    biggestExpText: "രേഖപ്പെടുത്തിയതിൽ ഏറ്റവും വലിയ ചെലവ്",
    refundAnalysisTitle: "റീഫണ്ട് വിശകലനം",
    expenseHistoryTitle: "ചെലവുകളുടെ ചരിത്രം",
    debtCreatorTitle: "ഏറ്റവും വലിയ കടക്കാരൻറെ വിശകലനം",
    settlementExplanationTitle: "തീർപ്പാക്കൽ കണക്കുകൂട്ടലുകളുടെ ഘട്ടം ഘട്ടമായുള്ള വിവരണം",
    member: "അംഗം",
    paid: "നൽകിയ ചെലവുകൾ",
    owed: "ബാധ്യതയുള്ള പങ്ക്",
    sent: "അയച്ച തുക",
    recv: "ലഭിച്ച തുക",
    standing: "അവസാന നില",
    status: "നില",
    date: "തീയതി",
    description: "വിവരണം",
    paidBy: "നൽകിയയാൾ",
    amount: "തുക",
    splitType: "വിഭജന രീതി",
    savings: "വ്യക്തിഗത ലാഭം",
    metric: "മെട്രിക്",
    value: "മൂല്യം",
    category: "വിഭാഗം",
    count: "എണ്ണം",
    highestDebtor: "ഏറ്റവും വലിയ കടക്കാരൻ",
    debtor: "കടക്കാരൻ",
    creditor: "കടം നൽകിയയാൾ",
    settled: "തീർപ്പാക്കി"
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
    biggestExpText: "ਦਰਜ ਕੀਤਾ ਗਿਆ ਸਭ ਤੋਂ ਵੱਡਾ ਖਰਚਾ ਸੀ",
    refundAnalysisTitle: "ਰਿਫੰਡ ਵਿਸ਼ਲੇਸ਼ਣ",
    expenseHistoryTitle: "ਖਰਚਿਆਂ ਦਾ ਇਤਿਹਾਸ",
    debtCreatorTitle: "ਸਭ ਤੋਂ ਵੱਡਾ ਦੇਣਦਾਰ ਵਿਸ਼ਲੇਸ਼ਣ",
    settlementExplanationTitle: "ਨਿਪਟਾਰੇ ਦੇ ਹਿਸਾਬ ਦਾ ਕਦਮ-ਦਰ-ਕਦਮ ਵੇਰਵਾ",
    member: "ਮੈਂਬਰ",
    paid: "ਭੁਗਤਾਨ ਕੀਤੇ ਖਰਚੇ",
    owed: "ਦੇਣਦਾਰੀ ਹਿੱਸਾ",
    sent: "ਭੇਜਿਆ ਗਿਆ ਨਿਪਟਾਰਾ",
    recv: "ਪ੍ਰਾਪਤ ਨਿਪਟਾਰਾ",
    standing: "ਅੰਤਿਮ ਸਥਿਤੀ",
    status: "ਸਥਿਤੀ",
    date: "ਮਿਤੀ",
    description: "ਵੇਰਵਾ",
    paidBy: "ਭੁਗਤਾਨ ਕਰਤਾ",
    amount: "ਰਕਮ",
    splitType: "ਵੰਡ ਦੀ ਕਿਸਮ",
    savings: "ਨਿੱਜੀ ਬਚਤ",
    metric: "ਮੈਟ੍ਰਿਕ",
    value: "ਮੁੱਲ",
    category: "ਸ਼੍ਰੇਣੀ",
    count: "ਗਿਣਤੀ",
    highestDebtor: "ਸਭ ਤੋਂ ਵੱਡਾ ਦੇਣਦਾਰ",
    debtor: "ਦੇਣਦਾਰ",
    creditor: "ਲੈਣਦਾਰ",
    settled: "ਨਿਪਟਾਇਆ"
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

  const { group, members, expenses, balances, tripSummary, categoryStats, settlements: initialSettlements } = context;
  const currency = balances.defaultCurrency || 'INR';
  const groupName = group?.name || 'Group';

  // Helper function to format currency
  const fmt = (val) => `${currency} ${val.toFixed(2)}`;

  // Helper function to translate EQUAL/EXACT split types
  const getSplitTypeLabel = (splitsCount) => {
    const isCustom = splitsCount !== members.length;
    if (isCustom) {
      if (lang === 'Hindi') return "सटीक";
      if (lang === 'Bengali') return "সঠিক";
      if (lang === 'Marathi') return "अचूक";
      if (lang === 'Gujarati') return "ચોક્કસ";
      if (lang === 'Tamil') return "துல்லியமானது";
      if (lang === 'Telugu') return "ఖచ్చితమైన";
      if (lang === 'Malayalam') return "കൃത്യം";
      if (lang === 'Punjabi') return "ਸਟੀਕ";
      return "EXACT";
    } else {
      if (lang === 'Hindi') return "बराबर";
      if (lang === 'Bengali') return "সমান";
      if (lang === 'Marathi') return "समान";
      if (lang === 'Gujarati') return "સરખું";
      if (lang === 'Tamil') return "சமம்";
      if (lang === 'Telugu') return "సమానం";
      if (lang === 'Malayalam') return "തുല്യം";
      if (lang === 'Punjabi') return "ਬਰਾਬਰ";
      return "EQUAL";
    }
  };

  // Helper for Net Standing formula label
  const getFormulaText = () => {
    if (lang === 'Hindi') {
      return "सूत्र: अंतिम स्थिति = (भुगतान किया गया खर्च) - (हिस्सा देय) + (भेजा गया निपटान) - (प्राप्त निपटान)";
    }
    if (lang === 'Bengali') {
      return "सूत्र: চূড়ান্ত অবস্থা = (ব্যয় পরিশোধ) - (প্রদেয় অংশ) + (প্রেরিত নিষ্পত্তি) - (গৃহীত নিষ্পত্তি)";
    }
    if (lang === 'Marathi') {
      return "सूत्र: अंतिम शिल्लक = (खर्च भरला) - (देय हिस्सा) + (पाठवलेले तोडगे) - (मिळालेले तोडगे)";
    }
    if (lang === 'Gujarati') {
      return "સૂત્ર: અંતિમ બાકી = (ખર્ચ ચૂકવ્યો) - (દેવું હિસ્સો) + (મોકલેલ પતાવટ) - (મળેલ પતાવટ)";
    }
    if (lang === 'Tamil') {
      return "சூத்திரம்: இறுதி நிலை = (செலுத்திய செலவுகள்) - (பகிர்ந்துகொண்ட தொகை) + (அனுப்பிய தீர்வு) - (பெற்ற தீர்வு)";
    }
    if (lang === 'Telugu') {
      return "సూత్రం: తుది బ్యాలెన్స్ = (చెల్లించిన ఖర్చులు) - (వాటా బాకీ) + (పంపిన పరిష్కారం) - (పొందిన పరిష్కారం)";
    }
    if (lang === 'Malayalam') {
      return "സൂത്രവാക്യം: അവസാന നില = (നൽകിയ ചെലവുകൾ) - (ബാധ്യതയുള്ള പങ്ക്) + (അയച്ച തുക) - (ലഭിച്ച തുക)";
    }
    if (lang === 'Punjabi') {
      return "ਸੂਤਰ: ਅੰਤਿਮ ਸਥਿਤੀ = (ਭੁਗਤਾਨ ਕੀਤੇ ਖਰਚੇ) - (ਦੇਣਦਾਰੀ ਹਿੱਸਾ) + (ਭੇਜਿਆ ਗਿਆ ਨਿਪਟਾਰਾ) - (ਪ੍ਰਾਪਤ ਨਿਪਟਾਰਾ)";
    }
    return "Formula: Net Standing = (Expenses Paid) - (Fair Share Owed) + (Settlements Sent) - (Settlements Received)";
  };

  // Helper for member standing status
  const getStatusLabel = (netVal, isHighestDebtor) => {
    if (isHighestDebtor && netVal < -0.01) return t.highestDebtor || "Highest Debtor";
    if (netVal < -0.01) return t.debtor || "Debtor";
    if (netVal > 0.01) return t.creditor || "Creditor";
    return t.settled || "Settled";
  };

  const formatMemberStandingText = (name, paidAmt, owedAmt, sentAmt, recvAmt, netStanding) => {
    const p = paidAmt.toFixed(2);
    const o = owedAmt.toFixed(2);
    const s = sentAmt.toFixed(2);
    const r = recvAmt.toFixed(2);
    const n = netStanding.toFixed(2);

    if (lang === 'Hindi') {
      return `- **${name}**: भुगतान: ${p} | देय हिस्सा: ${o} | भेजा: ${s} | प्राप्त: ${r} => अंतिम स्थिति: **${n}**`;
    }
    if (lang === 'Bengali') {
      return `- **${name}**: পরিশোধ: ${p} | প্রদেয় অংশ: ${o} | প্রেরিত: ${s} | গৃহীত: ${r} => চূড়ান্ত অবস্থা: **${n}**`;
    }
    if (lang === 'Marathi') {
      return `- **${name}**: भरला खर्च: ${p} | देय हिस्सा: ${o} | पाठवले: ${s} | मिळाले: ${r} => अंतिम शिल्लक: **${n}**`;
    }
    if (lang === 'Gujarati') {
      return `- **${name}**: ચૂકવેલ: ${p} | દેવું હિસ્સો: ${o} | મોકલેલ: ${s} | મળેલ: ${r} => અંતિમ બાકી: **${n}**`;
    }
    if (lang === 'Tamil') {
      return `- **${name}**: செலுத்தியது: ${p} | பகிர்வு: ${o} | அனுப்பியது: ${s} | பெற்றது: ${r} => இறுதி நிலை: **${n}**`;
    }
    if (lang === 'Telugu') {
      return `- **${name}**: చెల్లించినది: ${p} | వాటా: ${o} | పంపినది: ${s} | పొందినది: ${r} => తుది బ్యాలెన్స్: **${n}**`;
    }
    if (lang === 'Malayalam') {
      return `- **${name}**: നൽകിയത്: ${p} | പങ്ക്: ${o} | അയച്ചത്: ${s} | ലഭിച്ചത്: ${r} => അവസാന നില: **${n}**`;
    }
    if (lang === 'Punjabi') {
      return `- **${name}**: ਭੁਗਤਾਨ: ${p} | ਦੇਣਦਾਰੀ ਹਿੱਸਾ: ${o} | ਭੇਜਿਆ: ${s} | ਪ੍ਰਾਪਤ: ${r} => ਅੰਤਿਮ ਸਥਿਤੀ: **${n}**`;
    }
    return `- **${name}**: Paid: ${p} | Owed: ${o} | Sent: ${s} | Recv: ${r} => Net Standing: **${n}**`;
  };

  // Pre-calculate standings for all members
  const memberStandings = members.map(m => {
    const paidAmt = expenses.filter(e => e.paidBy === m.name).reduce((sum, e) => sum + e.amount, 0);
    const owedAmt = expenses.reduce((sum, e) => {
      const split = e.splits.find(s => s.user === m.name);
      return sum + (split ? split.amount : 0);
    }, 0);
    const sentAmt = (initialSettlements || []).filter(s => s.from === m.name).reduce((sum, s) => sum + s.amount, 0);
    const recvAmt = (initialSettlements || []).filter(s => s.to === m.name).reduce((sum, s) => sum + s.amount, 0);
    const netStanding = paidAmt - owedAmt + sentAmt - recvAmt;

    return {
      name: m.name,
      paid: paidAmt,
      owed: owedAmt,
      sent: sentAmt,
      recv: recvAmt,
      standing: netStanding
    };
  });

  const sortedStandings = [...memberStandings].sort((a, b) => a.standing - b.standing);
  const highestDebtor = sortedStandings[0];

  // 1. REFUND_ANALYSIS Intent
  if (q.includes('refund') || q.includes('reimbursement') || q.includes('वापसी') || q.includes('रिफंड') || q.includes('return')) {
    const refundExpenses = expenses.filter(e => e.amount < 0 || e.description.toLowerCase().includes('refund'));
    const totalRefund = refundExpenses.reduce((sum, r) => sum + r.amount, 0);

    if (refundExpenses.length > 0) {
      const absTotalRefund = Math.abs(totalRefund);
      const absSavings = absTotalRefund / members.length;

      if (lang === 'Hindi') {
        answer = `रिफंड विश्लेषण:\n\nरिफंड होने से समूह का कुल खर्च घट जाता है, जिससे प्रत्येक सदस्य का देय हिस्सा कम हो जाता है। इस समूह में, कुल रिफंड राशि ${fmt(absTotalRefund)} है। इसके कारण प्रत्येक सदस्य के हिस्से से ${fmt(absSavings)} की बचत हुई है।\n\nगणितीय व्याख्या:\nकुल रिफंड राशि: ${fmt(absTotalRefund)}\nकुल सदस्य संख्या: ${members.length}\nप्रति सदस्य बचत = कुल रिफंड / कुल सदस्य = ${absTotalRefund.toFixed(2)} / ${members.length} = ${fmt(absSavings)}\n\nये रिफंड अंतिम बकाया को प्रभावित करते हैं:`;
      } else {
        answer = `${t.refundAnalysisTitle || "Refund Analysis"}:\n\nRefunds decrease the total expense footprint of the group, thereby reducing the share owed by each member. In this group, the total refund amount of ${fmt(absTotalRefund)} credited back reduces each participant's owed share by ${fmt(absSavings)}.\n\nMathematical Explanation:\nTotal Refund Amount: ${fmt(absTotalRefund)}\nTotal Members: ${members.length}\nIndividual Savings = Total Refund / Members Count = ${absTotalRefund.toFixed(2)} / ${members.length} = ${fmt(absSavings)}\n\nList of refunds affecting balances:`;
      }

      insights.push(`${t.refundAnalysisTitle || "Refund Analysis"}: ${fmt(absTotalRefund)}`);
      insights.push(`${t.savings || "Individual Savings"}: ${fmt(absSavings)}`);

      tables.push({
        headers: [t.date || "Date", t.description || "Description", t.paidBy || "Paid By", t.amount || "Amount", t.savings || "Savings"],
        rows: refundExpenses.map(r => [
          r.date,
          r.description,
          r.paidBy,
          fmt(r.amount),
          fmt(Math.abs(r.amount / members.length))
        ])
      });
    } else {
      answer = lang === 'Hindi'
        ? "इस समूह में कोई रिफंड दर्ज नहीं किया गया है।"
        : "No refunds have been recorded in this group.";
    }
  }
  // 2. DEBT_CREATOR_ANALYSIS Intent
  else if (q.includes('creator') || q.includes('debtor') || q.includes('most debt') || q.includes('highest debt') || q.includes('कर्जदार') || q.includes('कर्ज')) {
    if (highestDebtor && highestDebtor.standing < -0.01) {
      if (lang === 'Hindi') {
        answer = `सबसे बड़ा कर्जदार विश्लेषण:\n\nइस समूह में सबसे बड़ा कर्जदार ${highestDebtor.name} है, जिसकी शुद्ध स्थिति ${fmt(highestDebtor.standing)} है।\n\nगणितीय व्याख्या:\nकोई सदस्य तब कर्जदार बनता है जब उसका कुल देय हिस्सा उसके द्वारा किए गए खर्चों के भुगतान से अधिक होता है। यहाँ ${highestDebtor.name} ने कुल ${fmt(highestDebtor.paid)} का भुगतान किया, जबकि उनका कुल देय हिस्सा ${fmt(highestDebtor.owed)} था। भेजे गए निपटान ${fmt(highestDebtor.sent)} और प्राप्त निपटान ${fmt(highestDebtor.recv)} थे।\n\nशुद्ध स्थिति सूत्र का उपयोग करते हुए:\n${getFormulaText()}\n${highestDebtor.paid.toFixed(2)} (भुगतान) - ${highestDebtor.owed.toFixed(2)} (देय) + ${highestDebtor.sent.toFixed(2)} (भेजा) - ${highestDebtor.recv.toFixed(2)} (प्राप्त) = ${highestDebtor.standing.toFixed(2)} (अंतिम स्थिति)\n\nइस प्रकार ${highestDebtor.name} का शुद्ध नकारात्मक शेष ${fmt(highestDebtor.standing)} है, जो उन्हें समूह का सबसे बड़ा कर्जदार बनाता है।`;
      } else {
        answer = `${t.debtCreatorTitle || "Highest Debt Creator Analysis"}:\n\nThe member who created the highest debt in this group is ${highestDebtor.name}, with a net standing balance of ${fmt(highestDebtor.standing)}.\n\nMathematical Explanation:\nA member becomes a debtor (debt creator) when their fair share of group expenses exceeds the payments they made. In this group, ${highestDebtor.name} paid a total of ${fmt(highestDebtor.paid)} but accrued a total share of ${fmt(highestDebtor.owed)}. Settlements sent were ${fmt(highestDebtor.sent)} and received were ${fmt(highestDebtor.recv)}.\n\nUsing the Net Standing formula:\n${getFormulaText()}\n${highestDebtor.paid.toFixed(2)} (Paid) - ${highestDebtor.owed.toFixed(2)} (Owed) + ${highestDebtor.sent.toFixed(2)} (Sent) - ${highestDebtor.recv.toFixed(2)} (Received) = ${highestDebtor.standing.toFixed(2)} (Net Standing)\n\nThis results in a net negative standing of ${fmt(highestDebtor.standing)}, making them the highest debt creator.`;
      }

      insights.push(`${t.debtCreatorTitle || "Highest Debtor"}: ${highestDebtor.name} (${fmt(highestDebtor.standing)})`);

      tables.push({
        headers: [t.member || "Member", t.paid || "Paid", t.owed || "Owed", t.standing || "Standing", t.status || "Status"],
        rows: memberStandings.map(m => [
          m.name,
          fmt(m.paid),
          fmt(m.owed),
          fmt(m.standing),
          getStatusLabel(m.standing, m.name === highestDebtor.name)
        ])
      });
    } else {
      answer = lang === 'Hindi'
        ? "इस समूह में कोई कर्जदार नहीं है; सभी शेष राशियां संतुलित हैं।"
        : "There are no debtors in this group; all balances are balanced.";
    }
  }
  // 3. SETTLEMENT_EXPLANATION Intent (includes why a specific member owes or general calculations)
  else if (q.includes('step-by-step') || q.includes('calculation') || q.includes('how was') || q.includes('explain calculations') || q.includes('explain balances') || q.includes('balance') || q.includes('owe') || q.includes('गणना') || q.includes('बकाया') || q.includes('standing') || q.includes('why')) {
    // Check if the query references a specific member by name
    const matchedMember = members.find(m => q.includes(m.name.toLowerCase()));

    if (matchedMember) {
      const ms = memberStandings.find(m => m.name === matchedMember.name);
      
      // Get paid details
      const memberPaidExps = expenses.filter(e => e.paidBy === matchedMember.name);
      const paidListStr = memberPaidExps.length > 0
        ? memberPaidExps.map(e => `- "${e.description}": ${fmt(e.amount)}`).join('\n')
        : (lang === 'Hindi' ? "- कोई खर्च भुगतान नहीं किया गया।" : "- No expenses paid.");

      // Get splits details
      const owedSplits = [];
      expenses.forEach(e => {
        const split = e.splits.find(s => s.user === matchedMember.name);
        if (split) {
          const splitLabel = getSplitTypeLabel(e.splits.length);
          owedSplits.push(`- "${e.description}": ${fmt(split.amount)} (${splitLabel} of ${fmt(e.amount)})`);
        }
      });
      const owedListStr = owedSplits.length > 0
        ? owedSplits.join('\n')
        : (lang === 'Hindi' ? "- कोई देय हिस्सा नहीं।" : "- No share owed.");

      if (lang === 'Hindi') {
        answer = `${matchedMember.name} के लिए बकाया राशि का विवरण:\n\n${matchedMember.name} की अंतिम स्थिति ${fmt(ms.standing)} है।\n\nगणितीय व्याख्या:\n1. **भुगतान किया गया खर्च:** ${matchedMember.name} ने इन खर्चों में कुल ${fmt(ms.paid)} का भुगतान किया:\n${paidListStr}\n\n2. **देय हिस्सा:** ${matchedMember.name} का कुल हिस्सा ${fmt(ms.owed)} बनता है:\n${owedListStr}\n\n3. **निपटान:** ${matchedMember.name} ने ${fmt(ms.sent)} भेजे और ${fmt(ms.recv)} प्राप्त किए।\n\n4. **अंतिम गणित:** अंतिम स्थिति सूत्र का उपयोग करते हुए:\n${getFormulaText()}\n${ms.paid.toFixed(2)} (भुगतान) - ${ms.owed.toFixed(2)} (देय) + ${ms.sent.toFixed(2)} (भेजा) - ${ms.recv.toFixed(2)} (प्राप्त) = ${ms.standing.toFixed(2)} (अंतिम स्थिति)\n\nइस प्रकार ${matchedMember.name} का शुद्ध बकाया ${fmt(ms.standing)} है।`;
      } else {
        answer = `Balance Explanation for ${matchedMember.name}:\n\n${matchedMember.name} has a net standing balance of ${fmt(ms.standing)}.\n\nHere is how this balance was calculated:\n1. **Expenses Paid:** ${matchedMember.name} paid a total of ${fmt(ms.paid)} across the following expenses:\n${paidListStr}\n\n2. **Share Owed:** ${matchedMember.name} owed a total share of ${fmt(ms.owed)} across the following splits:\n${owedListStr}\n\n3. **Settlements:** ${matchedMember.name} sent ${fmt(ms.sent)} and received ${fmt(ms.recv)} in settlements.\n\n4. **Final Math:** Using the Net Standing formula:\n${getFormulaText()}\n${ms.paid.toFixed(2)} (Paid) - ${ms.owed.toFixed(2)} (Owed) + ${ms.sent.toFixed(2)} (Sent) - ${ms.recv.toFixed(2)} (Received) = ${ms.standing.toFixed(2)} (Net Standing)\n\nThis results in a net balance of ${fmt(ms.standing)}.`;
      }

      insights.push(`${matchedMember.name} Standing: ${fmt(ms.standing)}`);
    } else {
      // General group step-by-step calculations
      const calcLines = memberStandings.map(m => {
        return formatMemberStandingText(m.name, m.paid, m.owed, m.sent, m.recv, m.standing);
      });

      if (lang === 'Hindi') {
        answer = `निपटान गणना का चरण-दर-चरण विवरण:\n\n${getFormulaText()}\n\nप्रत्येक सदस्य की गणना निम्नलिखित है:\n${calcLines.join('\n')}\n\nनिपटान अनुकूलन:\nहम ऋणदाताओं (सकारात्मक शेष) और देनदारों (नकारात्मक शेष) का मिलान करके लेनदेन की कुल संख्या को न्यूनतम करते हैं। अनुकूलित निपटान योजना इस प्रकार है:`;
      } else {
        answer = `${t.settlementExplanationTitle || "Settlement Calculations Step-by-Step"}:\n\n${getFormulaText()}\n\nIndividual breakdown for each member:\n${calcLines.join('\n')}\n\nSettlement Optimization:\nWe balance creditors (positive standing) and debtors (negative standing) iteratively to clear all balances in the minimum number of transactions. The optimized settlement plan is:`;
      }

      insights.push(`Calculated members: ${members.length}`);
      insights.push("Dues optimization completed");
    }

    // Append optimized settlements
    const curBalances = balances.balancesByCurrency[currency] || { debts: [] };
    const debts = curBalances.debts || [];

    if (debts.length > 0) {
      debts.forEach(d => {
        if (lang === 'Hindi') {
          answer += `\n- ${d.from} → ${d.to} : ${fmt(d.amount)} (${d.from} को ${d.to} को भुगतान करना होगा)`;
        } else {
          answer += `\n- ${d.from} → ${d.to} : ${fmt(d.amount)}`;
        }
        settlements.push({
          from: d.from,
          to: d.to,
          amount: d.amount
        });
      });
    } else {
      answer += `\n- ${t.noDues}`;
    }

    tables.push({
      headers: [t.member || "Member", t.paid || "Paid", t.owed || "Owed", t.sent || "Sent", t.recv || "Recv", t.standing || "Standing"],
      rows: memberStandings.map(m => [
        m.name,
        fmt(m.paid),
        fmt(m.owed),
        fmt(m.sent),
        fmt(m.recv),
        fmt(m.standing)
      ])
    });
  }
  // 4. EXPENSE_HISTORY Intent
  else if (q.includes('history') || q.includes('list of expenses') || q.includes('all expenses') || q.includes('इतिहास') || q.includes('खर्चों का') || q.includes('transactions')) {
    const totalPosSpent = expenses.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const totalRefund = expenses.filter(e => e.amount < 0).reduce((sum, e) => sum + e.amount, 0);
    const netSpent = totalPosSpent + totalRefund;
    const avgSpent = netSpent / members.length;

    if (lang === 'Hindi') {
      answer = `खर्चों का इतिहास:\n\nइस समूह में कुल ${expenses.length} लेनदेन दर्ज किए गए हैं।\n\nगणितीय सारांश:\n- कुल सकारात्मक खर्च: ${fmt(totalPosSpent)}\n- कुल रिफंड कटौती: ${fmt(Math.abs(totalRefund))}\n- शुद्ध खर्च (सकारात्मक - रिफंड): ${fmt(netSpent)}\n- प्रति सदस्य औसत हिस्सा (शुद्ध खर्च / ${members.length} सदस्य): ${fmt(avgSpent)}\n\nदर्ज किए गए लेनदेन का विवरण:`;
    } else {
      answer = `${t.expenseHistoryTitle || "Expense History"}:\n\nA total of ${expenses.length} transaction(s) have been recorded in this group.\n\nMathematical Summary:\n- Positive Expenses: ${fmt(totalPosSpent)}\n- Refund Deductions: ${fmt(Math.abs(totalRefund))}\n- Net Total Spending (Positive - Refunds): ${fmt(netSpent)}\n- Average Cost Per Participant (Net Spent / ${members.length} Members): ${fmt(avgSpent)}\n\nDetailed list of recorded transactions:`;
    }

    insights.push(`${t.totalSpent || "Total Spending"}: ${fmt(netSpent)}`);
    insights.push(`${t.expenseHistoryTitle || "Transactions"}: ${expenses.length}`);

    tables.push({
      headers: [t.date || "Date", t.description || "Description", t.paidBy || "Paid By", t.amount || "Amount", t.splitType || "Split Type"],
      rows: expenses.map(e => [
        e.date,
        e.description,
        e.paidBy,
        fmt(e.amount),
        getSplitTypeLabel(e.splits.length)
      ])
    });
  }
  // 5. DETAILED_TRIP_SUMMARY / Default Intent
  else if (q.includes('summary') || q.includes('trip') || q.includes('complete') || q.includes('सारांश') || q.includes('विवरण')) {
    const totalSpentStr = Object.entries(tripSummary.totalExpensesByCurrency)
      .map(e => `${e[0]} ${e[1].toFixed(2)}`).join(', ');
    const netSpent = tripSummary.totalExpensesByCurrency[currency] || 0;
    const avgSpent = netSpent / members.length;
    const maxExp = tripSummary.largestExpense;

    // Date range computation
    const validDates = expenses.map(e => e.date).filter(d => d !== 'Unknown').sort();
    const dateRangeStr = validDates.length > 0
      ? `${validDates[0]} - ${validDates[validDates.length - 1]}`
      : "N/A";

    const maxExpDetailsHindi = maxExp ? `"${maxExp.description}" (${currency} ${maxExp.amount.toFixed(2)} भुगतान ${maxExp.paidBy} द्वारा दिनांक ${maxExp.date})` : 'N/A';
    const maxExpDetailsEng = maxExp ? `"${maxExp.description}" (${currency} ${maxExp.amount.toFixed(2)} paid by ${maxExp.paidBy} on ${maxExp.date})` : 'N/A';

    if (lang === 'Hindi') {
      answer = `विस्तृत यात्रा सारांश:\n\nसमूह "${groupName}" के लिए विस्तृत रिपोर्ट:\n- **कुल समूह खर्च:** ${totalSpentStr || 'कोई खर्च नहीं'}\n- **यात्रा अवधि:** ${dateRangeStr}\n- **कुल प्रतिभागी संख्या:** ${members.length} व्यक्ति (${members.map(m => m.name).join(', ')})\n- **औसत खर्च प्रति व्यक्ति:** ${fmt(avgSpent)}\n- **सबसे ज्यादा खर्च करने वाला:** ${tripSummary.topSpenders[0]?.name || 'N/A'} (${currency} ${(tripSummary.topSpenders[0]?.total || 0).toFixed(2)})\n- **सबसे बड़ा एकल खर्च:** ${maxExpDetailsHindi}\n- **कुल लेनदेन संख्या:** ${expenses.length} (जिसमें ${expenses.filter(e => e.amount < 0).length} रिफंड शामिल हैं)`;
    } else {
      answer = `${t.tripSummaryTitle || "Detailed Trip Summary"}:\n\nComprehensive report for group "${groupName}":\n- **Total Group Spending:** ${totalSpentStr || 'None'}\n- **Trip Date Range:** ${dateRangeStr}\n- **Total Members:** ${members.length} (${members.map(m => m.name).join(', ')})\n- **Average Cost Per Person:** ${fmt(avgSpent)}\n- **Highest Spender:** ${tripSummary.topSpenders[0]?.name || 'N/A'} (spent ${currency} ${(tripSummary.topSpenders[0]?.total || 0).toFixed(2)})\n- **Largest Single Expense:** ${maxExpDetailsEng}\n- **Total Transactions:** ${expenses.length} (including ${expenses.filter(e => e.amount < 0).length} refund(s))`;
    }

    insights.push(`${t.totalSpent || "Total Spending"}: ${totalSpentStr || "0.00"}`);
    insights.push(`${t.participants || "Total Members"}: ${members.length}`);
    insights.push(`Average cost per person: ${fmt(avgSpent)}`);

    // Table 1: Key Trip Metrics
    tables.push({
      headers: [t.metric || "Metric", t.value || "Value"],
      rows: [
        [lang === 'Hindi' ? "समूह का नाम" : "Group Name", groupName],
        [lang === 'Hindi' ? "कुल व्यय" : "Total Spending", totalSpentStr || "0.00"],
        [lang === 'Hindi' ? "कुल लेनदेन" : "Total Transactions", expenses.length.toString()],
        [lang === 'Hindi' ? "प्रति व्यक्ति औसत हिस्सा" : "Average Share", fmt(avgSpent)],
        [lang === 'Hindi' ? "शीर्ष खर्चकर्ता" : "Top Spender", tripSummary.topSpenders[0]?.name || 'N/A'],
        [lang === 'Hindi' ? "यात्रा अवधि" : "Trip Date Range", dateRangeStr]
      ]
    });

    // Table 2: Category Stats Breakdown
    const statsEntries = Object.entries(categoryStats);
    if (statsEntries.length > 0) {
      tables.push({
        headers: [t.category || "Category", t.totalSpent || "Total Spent", t.count || "Count"],
        rows: statsEntries.map(e => [
          e[0],
          fmt(e[1].total),
          e[1].count.toString()
        ])
      });
    }

    // Table 3: Participant Standings
    tables.push({
      headers: [t.member || "Member", t.paid || "Paid", t.owed || "Owed", t.standing || "Standing"],
      rows: memberStandings.map(m => [
        m.name,
        fmt(m.paid),
        fmt(m.owed),
        fmt(m.standing)
      ])
    });
  }
  // Other matchers (legacy matchers)
  else if (q.includes('spender') || q.includes('spent the most') || q.includes('spent most') || q.includes('most spent')) {
    if (tripSummary.topSpenders.length > 0) {
      const top = tripSummary.topSpenders[0];
      const bottom = tripSummary.topSpenders[tripSummary.topSpenders.length - 1];
      answer = lang === 'Hindi'
        ? `${top.name} ने कुल ${fmt(top.total)} खर्च किए, जिससे वे सबसे अधिक खर्च करने वाले बन गए। ${bottom.name} ने सबसे कम ${fmt(bottom.total)} खर्च किए।`
        : `${top.name} spent a total of ${fmt(top.total)}, making them the highest spender. ${bottom.name} spent the least with ${fmt(bottom.total)}.`;
      
      insights.push(`${t.mostSpender}: ${top.name} (${fmt(top.total)})`);
      insights.push(`${t.leastSpender}: ${bottom.name} (${fmt(bottom.total)})`);
      
      tables.push({
        headers: [t.member || "Member", t.totalSpent || "Total Spent"],
        rows: tripSummary.topSpenders.map(s => [s.name, fmt(s.total)])
      });
    } else {
      answer = lang === 'Hindi' ? "इस समूह में अभी तक कोई खर्च दर्ज नहीं किया गया है।" : "No expenses have been recorded in this group yet.";
    }
  } 
  else if (q.includes('biggest') || q.includes('largest') || q.includes('highest expense')) {
    const maxExp = tripSummary.largestExpense;
    if (maxExp) {
      answer = lang === 'Hindi'
        ? `दर्ज किया गया सबसे बड़ा खर्च "${maxExp.description}" था, जिसकी राशि ${maxExp.currency} ${maxExp.amount.toFixed(2)} थी और इसका भुगतान ${maxExp.paidBy} द्वारा दिनांक ${maxExp.date} को किया गया था।`
        : `The largest expense recorded was "${maxExp.description}" of ${maxExp.currency} ${maxExp.amount.toFixed(2)} paid by ${maxExp.paidBy} on ${maxExp.date}.`;
      insights.push(`Largest Expense: ${maxExp.description} (${maxExp.currency} ${maxExp.amount.toFixed(2)})`);
      
      tables.push({
        headers: [t.metric || "Metric", t.value || "Value"],
        rows: [
          [t.description || "Description", maxExp.description],
          [t.amount || "Amount", `${maxExp.currency} ${maxExp.amount.toFixed(2)}`],
          [t.paidBy || "Paid By", maxExp.paidBy],
          [t.date || "Date", maxExp.date]
        ]
      });
    } else {
      answer = lang === 'Hindi' ? "कोई खर्च दर्ज नहीं किया गया।" : "No expenses recorded yet.";
    }
  }
  else if (q.includes('settle') || q.includes('debt') || q.includes('owe')) {
    const curBalances = balances.balancesByCurrency[currency] || { debts: [] };
    const debts = curBalances.debts || [];
    
    if (debts.length > 0) {
      const debtLines = debts.map(d => `${d.from} → ${d.to} ${fmt(d.amount)}`);
      answer = lang === 'Hindi'
        ? `सभी बकायों को निपटाने के लिए अनुकूलित निपटान योजना (कुल ${debts.length} लेनदेन):\n\n${debtLines.join('\n')}\n\nयह सभी समूह शेष को शून्य कर देगा।`
        : `Here is the optimized settlement plan to resolve all dues in ${currency} using ${debts.length} transaction(s):\n\n${debtLines.join('\n')}\n\nThis will balance all group balances to zero.`;
      
      insights.push(`Total Transactions Needed: ${debts.length}`);
      insights.push(`Total Settled Amount: ${fmt(debts.reduce((sum, d) => sum + d.amount, 0))}`);
      
      tables.push({
        headers: [lang === 'Hindi' ? "देनदार" : "From (Debtor)", lang === 'Hindi' ? "लेनदार" : "To (Creditor)", t.amount || "Amount"],
        rows: debts.map(d => [d.from, d.to, fmt(d.amount)])
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
  else if (q.includes('category') || q.includes('food') || q.includes('hotel') || q.includes('travel') || q.includes('stay') || q.includes('taxi')) {
    const stats = categoryStats;
    const statsEntries = Object.entries(stats);
    if (statsEntries.length > 0) {
      if (lang === 'Hindi') {
        answer = "समूह के लिए श्रेणीवार खर्च का विवरण इस प्रकार है:\n\n" + 
                 statsEntries.map(e => `- ${e[0]}: ${fmt(e[1].total)} (${e[1].count} खर्च)`).join('\n');
      } else {
        answer = "Here is the category spending breakdown for the group:\n\n" + 
                 statsEntries.map(e => `- ${e[0]}: ${fmt(e[1].total)} (${e[1].count} expense(s))`).join('\n');
      }
      
      tables.push({
        headers: [t.category || "Category", t.totalSpent || "Total Spent", t.count || "Count"],
        rows: statsEntries.map(e => [e[0], fmt(e[1].total), e[1].count.toString()])
      });
      
      const topCat = statsEntries.sort((a,b) => b[1].total - a[1].total)[0];
      insights.push(`Top Category Cost: ${topCat[0]} (${fmt(topCat[1].total)})`);
    } else {
      answer = lang === 'Hindi' ? "कोई खर्च दर्ज नहीं किया गया।" : "No expenses recorded.";
    }
  }
  else {
    const totalSpentStr = Object.entries(tripSummary.totalExpensesByCurrency)
      .map(e => `${e[0]} ${e[1].toFixed(2)}`).join(', ');
      
    answer = lang === 'Hindi'
      ? `समूह "${groupName}" के लिए विस्तृत यात्रा सारांश में आपका स्वागत है।\n\n` +
        `- **कुल समूह खर्च:** ${totalSpentStr || 'कोई खर्च नहीं'}\n` +
        `- **कुल प्रतिभागी:** ${tripSummary.participantsCount}\n` +
        `- **प्रतिभागियों की सूची:** ${tripSummary.participants.join(', ')}\n\n` +
        `खर्च करने वालों, श्रेणियों, या निपटान योजनाओं के बारे में विशिष्ट विवरण पूछने के लिए स्वतंत्र महसूस करें!`
      : `Welcome to the ${t.tripSummaryTitle} for group "${groupName}".\n\n` +
        `- **Total Group Spending:** ${totalSpentStr || 'None'}\n` +
        `- **Total Members:** ${tripSummary.participantsCount}\n` +
        `- **Members List:** ${tripSummary.participants.join(', ')}\n\n` +
        `Feel free to ask specific details about spenders, categories, or the settlement plans!`;
             
    insights.push(`Total Members: ${tripSummary.participantsCount}`);
    if (tripSummary.topSpenders.length > 0) {
      insights.push(`Top Spender: ${tripSummary.topSpenders[0].name}`);
    }
    
    tables.push({
      headers: [t.metric || "Metric", t.value || "Value"],
      rows: [
        [lang === 'Hindi' ? "समूह का नाम" : "Group Name", groupName],
        [lang === 'Hindi' ? "कुल व्यय" : "Total Spending", totalSpentStr || "0.00"],
        [lang === 'Hindi' ? "सदस्य संख्या" : "Members Count", tripSummary.participantsCount.toString()]
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
