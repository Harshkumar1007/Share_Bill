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
    settled: "Settled",
    refundExplanation: "Refunds decrease the total expense footprint of the group, thereby reducing the share owed by each member. In this group, the total refund amount of {totalRefund} credited back reduces each participant's owed share by {savings}.",
    refundMath: "Mathematical Explanation:\nTotal Refund Amount: {totalRefund}\nTotal Members: {membersCount}\nIndividual Savings = Total Refund / Members Count = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "Individual Savings: {savings}",
    noRefunds: "No refunds have been recorded in this group.",
    expenseHistoryIntro: "A total of {count} transaction(s) have been recorded in this group.",
    expenseHistoryMath: "Mathematical Summary:\n- Positive Expenses: {positive}\n- Refund Deductions: {refunds}\n- Net Total Spending (Positive - Refunds): {net}\n- Average Cost Per Participant (Net Spent / {membersCount} Members): {avg}",
    expenseHistoryInsight: "Total Group Spending: {net}",
    debtCreatorExplanation: "The member who created the highest debt in this group is {name}, with a net standing balance of {standing}.",
    debtCreatorMathIntro: "A member becomes a debtor (debt creator) when their fair share of group expenses exceeds the payments they made. In this group, {name} paid a total of {paid} but accrued a total share of {owed}. Settlements sent were {sent} and received were {recv}.",
    debtCreatorMathDetail: "Using the Net Standing formula:\nNet Standing = (Expenses Paid) - (Fair Share Owed) + (Settlements Sent) - (Settlements Received)\n{paid} (Paid) - {owed} (Owed) + {sent} (Sent) - {recv} (Received) = {standing} (Net Standing)\n\nThis results in a net negative standing of {standing}, making them the highest debt creator.",
    settlementExplanationIntro: "Formula: Net Standing = (Expenses Paid) - (Fair Share Owed) + (Settlements Sent) - (Settlements Received)\n\nIndividual breakdown for each member:",
    settlementOptimizationText: "Settlement Optimization:\nWe balance creditors (positive standing) and debtors (negative standing) iteratively to clear all balances in the minimum number of transactions. The optimized settlement plan is:",
    memberExplanationTitle: "Balance Explanation for {name}:",
    memberPaidDetails: "1. **Expenses Paid:** {name} paid a total of {paid} across the following expenses:",
    memberOwedDetails: "2. **Share Owed:** {name} owed a total share of {owed} across the following splits:",
    memberSettlementsDetails: "3. **Settlements:** {name} sent {sent} and received {recv} in settlements.",
    memberFinalMath: "4. **Final Math:** Using the Net Standing formula:\nFormula: Net Standing = (Expenses Paid) - (Fair Share Owed) + (Settlements Sent) - (Settlements Received)\n{paid} (Paid) - {owed} (Owed) + {sent} (Sent) - {recv} (Received) = {standing} (Net Standing)\n\nThis results in a net balance of {standing}.",
    tripSummaryIntro: "Comprehensive report for group \"{name}\":",
    tripSummaryPoints: "- **Total Group Spending:** {totalSpent}\n- **Trip Date Range:** {dateRange}\n- **Total Members:** {membersCount} ({membersList})\n- **Average Cost Per Person:** {avg}\n- **Highest Spender:** {topSpender} (spent {topSpenderSpent})\n- **Largest Single Expense:** {largestExpense}\n- **Total Transactions:** {transactionsCount} (including {refundsCount} refund(s))",
    groupNameLabel: "Group Name",
    totalSpendingLabel: "Total Spending",
    totalTransactionsLabel: "Total Transactions",
    averageShareLabel: "Average Share",
    topSpenderLabel: "Top Spender",
    tripDateRangeLabel: "Trip Date Range"
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
    settled: "सुलझा हुआ",
    refundExplanation: "रिफंड होने से समूह का कुल खर्च घट जाता है, जिससे प्रत्येक सदस्य का देय हिस्सा कम हो जाता है। इस समूह में, कुल रिफंड राशि {totalRefund} है। इसके कारण प्रत्येक सदस्य के हिस्से से {savings} की बचत हुई है।",
    refundMath: "गणितीय व्याख्या:\nकुल रिफंड राशि: {totalRefund}\nकुल सदस्य संख्या: {membersCount}\nप्रति सदस्य बचत = कुल रिफंड / कुल सदस्य = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "व्यक्तिगत बचत: {savings}",
    noRefunds: "इस समूह में कोई रिफंड दर्ज नहीं किया गया है।",
    expenseHistoryIntro: "इस समूह में कुल {count} लेनदेन दर्ज किए गए हैं।",
    expenseHistoryMath: "गणितीय सारांश:\n- कुल सकारात्मक खर्च: {positive}\n- कुल रिफंड कटौती: {refunds}\n- शुद्ध खर्च (सकारात्मक - रिफंड): {net}\n- प्रति सदस्य औसत हिस्सा (शुद्ध खर्च / {membersCount} सदस्य): {avg}",
    expenseHistoryInsight: "कुल समूह खर्च: {net}",
    debtCreatorExplanation: "इस समूह में सबसे बड़ा कर्जदार {name} है, जिसकी शुद्ध स्थिति {standing} है।",
    debtCreatorMathIntro: "कोई सदस्य तब कर्जदार बनता है जब उसका कुल देय हिस्सा उसके द्वारा किए गए खर्चों के भुगतान से अधिक होता है। यहाँ {name} ने कुल {paid} का भुगतान किया, जबकि उनका कुल देय हिस्सा {owed} था। भेजे गए निपटान: {sent}, प्राप्त निपटान: {recv}।",
    debtCreatorMathDetail: "शुद्ध स्थिति सूत्र का उपयोग करते हुए:\nअंतिम स्थिति = (भुगतान किया गया खर्च) - (हिस्सा देय) + (भेजा गया निपटान) - (प्राप्त निपटान)\n{paid} (भुगतान) - {owed} (देय) + {sent} (भेजा) - {recv} (प्राप्त) = {standing} (अंतिम स्थिति)\n\nइस प्रकार {name} का शुद्ध नकारात्मक शेष {standing} है, जो उन्हें समूह का सबसे बड़ा कर्जदार बनाता है।",
    settlementExplanationIntro: "सूत्र: अंतिम स्थिति = (भुगतान किया गया खर्च) - (हिस्सा देय) + (भेजा गया निपटान) - (प्राप्त निपटान)\n\nप्रत्येक सदस्य की गणना निम्नलिखित है:",
    settlementOptimizationText: "निपटान अनुकूलन:\nहम ऋणदाताओं (सकारात्मक शेष) और देनदारों (नकारात्मक शेष) का मिलान करके लेनदेन की कुल संख्या को न्यूनतम करते हैं। अनुकूलित निपटान योजना इस प्रकार है:",
    memberExplanationTitle: "{name} के लिए बकाया राशि का विवरण:",
    memberPaidDetails: "1. **भुगतान किया गया खर्च:** {name} ने इन खर्चों में कुल {paid} का भुगतान किया:",
    memberOwedDetails: "2. **देय हिस्सा:** {name} का कुल हिस्सा {owed} बनता है:",
    memberSettlementsDetails: "3. **निपटान:** {name} ने {sent} भेजे और {recv} प्राप्त किए।",
    memberFinalMath: "4. **अंतिम गणित:** अंतिम स्थिति सूत्र का उपयोग करते हुए:\nसूत्र: अंतिम स्थिति = (भुगतान किया गया खर्च) - (हिस्सा देय) + (भेजा गया निपटान) - (प्राप्त निपटान)\n{paid} (भुगतान) - {owed} (देय) + {sent} (भेजा) - {recv} (प्राप्त) = {standing} (अंतिम स्थिति)\n\nइस प्रकार {name} का शुद्ध बकाया {standing} है।",
    tripSummaryIntro: "समूह \"{name}\" के लिए विस्तृत रिपोर्ट:",
    tripSummaryPoints: "- **कुल समूह खर्च:** {totalSpent}\n- **यात्रा अवधि:** {dateRange}\n- **कुल प्रतिभागी संख्या:** {membersCount} व्यक्ति ({membersList})\n- **औसत खर्च प्रति व्यक्ति:** {avg}\n- **सबसे ज्यादा खर्च करने वाला:** {topSpender} (खर्च किया {topSpenderSpent})\n- **सबसे बड़ा एकल खर्च:** {largestExpense}\n- **कुल लेनदेन संख्या:** {transactionsCount} (जिसमें {refundsCount} रिफंड शामिल हैं)",
    groupNameLabel: "समूह का नाम",
    totalSpendingLabel: "कुल खर्च",
    totalTransactionsLabel: "कुल लेनदेन",
    averageShareLabel: "औसत हिस्सा",
    topSpenderLabel: "शीर्ष खर्चकर्ता",
    tripDateRangeLabel: "यात्रा अवधि"
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
    settled: "নিষ্পত্তি",
    refundExplanation: "রিফান্ড মোট ব্যয় কমিয়ে দেয়, যার ফলে প্রতিটি সদস্যের প্রদেয় অংশ হ্রাস পায়। এই গ্রুপে, মোট রিফান্ড {totalRefund} ফেরত দেওয়ার ফলে প্রতি সদস্যের প্রদেয় অংশ {savings} হ্রাস পেয়েছে।",
    refundMath: "গাণিতিক ব্যাখ্যা:\nমোট রিফান্ড: {totalRefund}\nমোট সদস্য সংখ্যা: {membersCount}\nব্যক্তিগত সাশ্রয় = মোট রিফান্ড / সদস্য সংখ্যা = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "ব্যক্তিগত সাশ্রয়: {savings}",
    noRefunds: "এই গ্রুপে কোনো রিফান্ড নথিভুক্ত করা হয়নি।",
    expenseHistoryIntro: "এই গ্রুপে মোট {count}টি লেনদেন নথিভুক্ত করা হয়েছে।",
    expenseHistoryMath: "গাণিতিক সারাংশ:\n- ইতিবাচক ব্যয়: {positive}\n- রিফান্ড বাদ: {refunds}\n- নিট মোট ব্যয় (ইতিবাচক - রিফান্ড): {net}\n- প্রতি সদস্য গড় ব্যয়: {avg}",
    expenseHistoryInsight: "মোট গ্রুপ খরচ: {net}",
    debtCreatorExplanation: "এই গ্রুপে সর্বোচ্চ ঋণগ্রহীতা হলেন {name}, যার চূড়ান্ত অবস্থা {standing}।",
    debtCreatorMathIntro: "কোন সদস্য তখনই ঋণগ্রহীতা হন যখন গ্রুপের খরচে তার প্রদেয় অংশ তার পরিশোধ করা ব্যয়ের চেয়ে বেশি হয়। এই গ্রুপে, {name} মোট {paid} পরিশোধ করেছেন কিন্তু তার প্রদেয় অংশ ছিল {owed}। প্রেরিত নিষ্পত্তি: {sent}, গৃহীত নিষ্পত্তি: {recv}।",
    debtCreatorMathDetail: "চূড়ান্ত অবস্থার সূত্র ব্যবহার করে:\nচূড়ান্ত অবস্থা = (ব্যয় পরিশোধ) - (প্রদেয় অংশ) + (প্রেরিত নিষ্পত্তি) - (গৃহীত নিষ্পত্তি)\n{paid} (পরিশোধ) - {owed} (প্রদেয়) + {sent} (প্রেরিত) - {recv} (গৃহীত) = {standing} (চূড়ান্ত অবস্থা)\n\nএর ফলে নিট ঋণাত্মক অবস্থা দাঁড়ায় {standing}, যা তাকে সর্বোচ্চ ঋণগ্রহীতা করে তোলে।",
    settlementExplanationIntro: "सूत्र: চূড়ান্ত অবস্থা = (ব্যয় পরিশোধ) - (প্রদেয় অংশ) + (প্রেরিত নিষ্পত্তি) - (গৃহীত নিষ্পত্তি)\n\nপ্রতিটি সদস্যের হিসাব নিচে দেওয়া হলো:",
    settlementOptimizationText: "নিষ্পত্তি অপ্টিমাইজেশন:\nআমরা লেনদেনের সংখ্যা সর্বনিম্ন করতে ঋণদাতা এবং ঋণগ্রহীতাদের মিলন করি। অপ্টিমাইজড নিষ্পত্তি পরিকল্পনা নিচে দেওয়া হলো:",
    memberExplanationTitle: "{name}-এর বকেয়া হিসাবের বিবরণ:",
    memberPaidDetails: "1. **ব্যয় পরিশোধ:** {name} মোট {paid} পরিশোধ করেছেন এই খরচে:",
    memberOwedDetails: "2. **প্রদেয় অংশ:** {name}-এর মোট প্রদেয় অংশ {owed} নিচে দেওয়া হলো:",
    memberSettlementsDetails: "3. **নিষ্পত্তি:** {name} মোট {sent} পাঠিয়েছেন এবং {recv} গ্রহণ করেছেন।",
    memberFinalMath: "4. **চূড়ান্ত হিসাব:** চূড়ান্ত অবস্থার সূত্র ব্যবহার করে:\nসূত্র: চূড়ান্ত অবস্থা = (ব্যয় পরিশোধ) - (প্রদেয় অংশ) + (প্রেরিত নিষ্পত্তি) - (গৃহীত নিষ্পত্তি)\n{paid} (পরিশোধ) - {owed} (প্রদেয়) + {sent} (প্রেরিত) - {recv} (গৃহীত) = {standing} (চূড়ান্ত অবস্থা)\n\nএর ফলে নিট বকেয়া দাঁড়ায় {standing}।",
    tripSummaryIntro: "গ্রুপ \"{name}\"-এর জন্য বিস্তারিত বিবরণ:",
    tripSummaryPoints: "- **মোট গ্রুপ খরচ:** {totalSpent}\n- **ভ্রমণ সময়কাল:** {dateRange}\n- **মোট সদস্য সংখ্যা:** {membersCount} জন ({membersList})\n- **প্রতি ব্যক্তি গড় ব্যয়:** {avg}\n- **সর্বোচ্চ ব্যয়কারী:** {topSpender} (ব্যয় {topSpenderSpent})\n- **সর্বোচ্চ একক ব্যয়:** {largestExpense}\n- **মোট লেনদেন সংখ্যা:** {transactionsCount} ({refundsCount} রিফান্ড সহ)",
    groupNameLabel: "গ্রুপের নাম",
    totalSpendingLabel: "মোট ব্যয়",
    totalTransactionsLabel: "মোট লেনদেন",
    averageShareLabel: "গড় অংশ",
    topSpenderLabel: "শীর্ষ ব্যয়কারী",
    tripDateRangeLabel: "ভ্রমণ সময়কাল"
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
    settled: "निकाली",
    refundExplanation: "रिफंडमुळे एकूण गट खर्च कमी होतो, ज्यामुळे प्रत्येक सदस्याचा देय हिस्सा कमी होतो. या गटात, एकूण रिफंड {totalRefund} मुळे प्रत्येक सदस्याचा देय हिस्सा {savings} ने कमी झाला आहे.",
    refundMath: "गणितीय स्पष्टीकरण:\nएकूण रिफंड: {totalRefund}\nएकूण सदस्य संख्या: {membersCount}\nवैयक्तिक बचत = एकूण रिफंड / सदस्य संख्या = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "वैयक्तिक बचत: {savings}",
    noRefunds: "या गटामध्ये कोणतीही रिफंड नोंदवली गेलेली नाही.",
    expenseHistoryIntro: "या गटामध्ये एकूण {count} व्यवहारांची नोंद झाली आहे.",
    expenseHistoryMath: "गणितीय सारांश:\n- सकारात्मक खर्च: {positive}\n- रिफंड वजावट: {refunds}\n- निव्वळ एकूण खर्च (सकारात्मक - रिफंड): {net}\n- प्रति सदस्य सरासरी खर्च: {avg}",
    expenseHistoryInsight: "एकूण गट खर्च: {net}",
    debtCreatorExplanation: "या गटात सर्वात मोठा कर्जदार {name} आहे, ज्याची अंतिम शिल्लक {standing} आहे.",
    debtCreatorMathIntro: "जेव्हा एखाद्या सदस्याचा देय हिस्सा त्याने भरलेल्या खर्चापेक्षा जास्त असतो, तेव्हा तो कर्जदार बनतो. या गटात, {name} ने एकूण {paid} भरले, पण त्याचा देय हिस्सा {owed} होता. पाठवलेले तोडगे: {sent}, मिळालेले तोडगे: {recv}.",
    debtCreatorMathDetail: "अंतिम शिल्लक सूत्र वापरून:\nअंतिम शिल्लक = (खर्च भरला) - (देय हिस्सा) + (पाठवलेले) - (मिळालेले)\n{paid} (भरलेला खर्च) - {owed} (देय हिस्सा) + {sent} (पाठवलेले) - {recv} (मिळालेले) = {standing} (अंतिम शिल्लक)\n\nयामुळे निव्वळ उणे शिल्लक {standing} राहते, ज्यामुळे तो सर्वात मोठा कर्जदार ठरतो.",
    settlementExplanationIntro: "सूत्र: अंतिम शिल्लक = (खर्च भरला) - (देय हिस्सा) + (पाठवलेले तोडगे) - (मिळालेले तोडगे)\n\nप्रत्येक सदस्याचा हिशोब खालीलप्रमाणे आहे:",
    settlementOptimizationText: "तोडगा अनुकूलन:\nव्यवहारांची संख्या कमी करण्यासाठी आम्ही धनको आणि कर्जदार यांच्यात ताळमेळ घालतो. अनुकूलित तोडगा योजना खालीलप्रमाणे आहे:",
    memberExplanationTitle: "{name} साठी शिल्लक रकमेचे स्पष्टीकरण:",
    memberPaidDetails: "1. **खर्च भरला:** {name} ने एकूण {paid} भरले:",
    memberOwedDetails: "2. **देय हिस्सा:** {name} चा एकूण देय हिस्सा {owed} खालीलप्रमाणे आहे:",
    memberSettlementsDetails: "3. **तोडगे:** {name} ने {sent} पाठवले आणि {recv} मिळवले.",
    memberFinalMath: "4. **अंतिम हिशोब:** अंतिम शिल्लक सूत्र वापरून:\nअंतिम शिल्लक = (खर्च भरला) - (देय हिस्सा) + (पाठवलेले) - (मिळालेले)\n{paid} (भरलेला खर्च) - {owed} (देय हिस्सा) + {sent} (पाठवलेले) - {recv} (मिळालेले) = {standing} (अंतिम शिल्लक)\n\nयामुळे निव्वळ शिल्लक {standing} उरते.",
    tripSummaryIntro: "गट \"{name}\" साठी सविस्तर अहवाल:",
    tripSummaryPoints: "- **एकूण गट खर्च:** {totalSpent}\n- **प्रवास कालावधी:** {dateRange}\n- **एकूण सदस्य संख्या:** {membersCount} व्यक्ती ({membersList})\n- **प्रति व्यक्ती सरासरी खर्च:** {avg}\n- **सर्वात जास्त खर्च करणारा:** {topSpender} (खर्च केले {topSpenderSpent})\n- **सर्वात मोठा एकल खर्च:** {largestExpense}\n- **एकूण व्यवहार संख्या:** {transactionsCount} (यात {refundsCount} रिफंड समाविष्ट आहेत)",
    groupNameLabel: "गटाचे नाव",
    totalSpendingLabel: "एकूण खर्च",
    totalTransactionsLabel: "एकूण व्यवहार",
    averageShareLabel: "सरासरी हिस्सा",
    topSpenderLabel: "शीर्ष खर्च करणारा",
    tripDateRangeLabel: "प्रवास कालावधी"
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
    settled: "ચૂકતે",
    refundExplanation: "રિફંડથી જૂથનો કુલ ખર્ચ ઘટે છે, જેથી દરેક સભ્યનો દેવું હિસ્સો ઓછો થાય છે. આ જૂથમાં, કુલ રિફંડ {totalRefund} પાછા મળવાને કારણે દરેક સભ્યનો દેવું હિસ્સો {savings} ઓછો થયો છે.",
    refundMath: "ગાણિતિક સમજૂતી:\nકુલ રિફંડ: {totalRefund}\nકુલ સભ્યોની સંખ્યા: {membersCount}\nવ્યક્તિગત બચત = કુલ રિફંડ / સભ્યોની સંખ્યા = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "વ્યક્તિગત બચત: {savings}",
    noRefunds: "આ જૂથમાં કોઈ રિફંડ નોંધાયેલ નથી.",
    expenseHistoryIntro: "આ જૂથમાં કુલ {count} વ્યવહારો નોંધાયા છે.",
    expenseHistoryMath: "ગાણિતિક સારાંશ:\n- સકારાત્મક ખર્ચ: {positive}\n- રિફંડ બાદબાકી: {refunds}\n- ચોખ્ખો કુલ ખર્ચ (સકારાત્મક - રિફંડ): {net}\n- સભ્ય દીઠ સરેરાશ ખર્ચ: {avg}",
    expenseHistoryInsight: "કુલ જૂથ ખર્ચ: {net}",
    debtCreatorExplanation: "આ જૂથમાં સૌથી મોટો દેણદાર {name} છે, જેની અંતિમ બાકી {standing} છે.",
    debtCreatorMathIntro: "જ્યારે કોઈ સભ્યનો દેવું હિસ્સો તેણે ચૂકવેલા ખર્ચ કરતાં વધુ હોય ત્યારે તે દેણદાર બને છે. આ જૂથમાં, {name} એ કુલ {paid} ચૂકવ્યા, જ્યારે તેમનો દેવું હિસ્સો {owed} હતો. મોકલેલ પતાવટ: {sent}, મળેલ પતાવટ: {recv}.",
    debtCreatorMathDetail: "અંતિમ બાકીના સૂત્રનો ઉપયોગ કરીને:\nઅંતિમ બાકી = (ચૂકવેલ) - (દેવું) + (મોકલેલ) - (મળેલ)\n{paid} (ચૂકવેલ) - {owed} (દેવું) + {sent} (મોકલેલ) - {recv} (મળેલ) = {standing} (અંતિમ બાકી)\n\nઆના કારણે ચોખ્ખી ઋણ બાકી રકમ {standing} રહે છે, જે તેમને સૌથી મોટો દેણદાર બનાવે છે.",
    settlementExplanationIntro: "સૂત્ર: અંતિમ બાકી = (ખર્ચ ચૂકવ્યો) - (દેવું હિસ્સો) + (મોકલેલ પતાવટ) - (મળેલ પતાવટ)\n\nદરેક સભ્યની ગણતરી નીચે મુજબ છે:",
    settlementOptimizationText: "પતાવટ અનુકૂલન:\nવ્યવહારોની સંખ્યા ન્યૂનતમ કરવા માટે અમે લેણદારો અને દેણદારોનું સંતુલન કરીએ છીએ. અનુકૂળ પતાવટ યોજના નીચે મુજબ છે:",
    memberExplanationTitle: "{name} માટે બાકી રકમની સમજૂતી:",
    memberPaidDetails: "1. **ખર્ચ ચૂકવ્યો:** {name} એ કુલ {paid} ચૂકવ્યા નીચેના ખર્ચમાં:",
    memberOwedDetails: "2. **દેવું હિસ્સો:** {name} નો કુલ દેવું હિસ્સો {owed} નીચે મુજબ છે:",
    memberSettlementsDetails: "3. **પતાવટ:** {name} એ {sent} મોકલ્યા અને {recv} મેળવ્યા.",
    memberFinalMath: "4. **અંતિમ ગણતરી:** અંતિમ બાકીના સૂત્રનો ઉપયોગ કરીને:\nઅંતિમ બાકી = (ખર્ચ ચૂકવ્યો) - (દેવું હિસ્સો) + (મોકલેલ પતાવટ) - (મળેલ પતાવટ)\n{paid} (ચૂકવેલ) - {owed} (દેવું) + {sent} (મોકલેલ) - {recv} (મળેલ) = {standing} (અંતિમ બાકી)\n\nઆના કારણે ચોખ્ખી બાકી રકમ {standing} રહે છે.",
    tripSummaryIntro: "જૂથ \"{name}\" માટે વિગતવાર અહેવાલ:",
    tripSummaryPoints: "- **કુલ જૂથ ખર્ચ:** {totalSpent}\n- **પ્રવાસ સમયગાળો:** {dateRange}\n- **કુલ સભ્યોની સંખ્યા:** {membersCount} વ્યક્તિઓ ({membersList})\n- **વ્યક્તિ દીઠ સરેરાશ ખર્ચ:** {avg}\n- **સૌથી વધુ ખર્ચ કરનાર:** {topSpender} (ખર્ચ કર્યો {topSpenderSpent})\n- **સૌથી મોટો એકલ ખર્ચ:** {largestExpense}\n- **કુલ વ્યવહારોની સંખ્યા:** {transactionsCount} ({refundsCount} રિફંડ સાથે)",
    groupNameLabel: "જૂથનું નામ",
    totalSpendingLabel: "કુલ ખર્ચ",
    totalTransactionsLabel: "કુલ વ્યવહારો",
    averageShareLabel: "સરેરાશ હિસ્સો",
    topSpenderLabel: "સૌથી વધુ ખર્ચ કરનાર",
    tripDateRangeLabel: "પ્રવાસ સમયગાળો"
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
    settled: "தீர்க்கப்பட்டது",
    refundExplanation: "பணத்தைத் திரும்பப்பெறுதல் குழுவின் மொத்த செலவைக் குறைக்கிறது, இதனால் ஒவ்வொரு உறுப்பினரின் பங்கும் குறைகிறது. இந்த குழுவில், திரும்பப்பெறப்பட்ட மொத்த தொகை {totalRefund} ஒவ்வொரு உறுப்பினரின் பங்கையும் {savings} குறைக்கிறது.",
    refundMath: "விளக்கம்:\nமொத்த திரும்பப்பெறுதல்: {totalRefund}\nமொத்த உறுப்பினர்கள்: {membersCount}\nதனிநபர் சேமிப்பு = மொத்த திரும்பப்பெறுதல் / உறுப்பினர்கள் = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "தனிநபர் சேமிப்பு: {savings}",
    noRefunds: "இந்த குழுவில் திரும்பப்பெறுதல் எதுவும் பதிவு செய்யப்படவில்லை.",
    expenseHistoryIntro: "இந்த குழுவில் மொத்தம் {count} பரிவர்த்தனைகள் பதிவு செய்யப்பட்டுள்ளன.",
    expenseHistoryMath: "செலவு வரலாறு கணித விளக்கம்:\n- நேர்மறையான செலவுகள்: {positive}\n- திரும்பப்பெற்ற கழிவுகள்: {refunds}\n- நிகர மொத்த செலவு (நேர்மறை - திரும்பப்பெற்றது): {net}\n- நபர் ஒன்றுக்கான சராசரி செலவு: {avg}",
    expenseHistoryInsight: "மொத்த குழு செலவு: {net}",
    debtCreatorExplanation: "இந்த குழுவில் அதிக கடன் உருவாக்கியவர் {name}, இவருடைய இறுதி நிலை {standing} ஆகும்.",
    debtCreatorMathIntro: "ஒரு உறுப்பினரின் பகிர்ந்துகொண்ட தொகை அவர் செலுத்திய செலவுகளை விட அதிகமாக இருக்கும்போது அவர் கடன்பட்டவராகிறார். இந்த குழுவில், {name} மொத்தம் {paid} செலுத்தியுள்ளார், ஆனால் அவருடைய பகிர்வு {owed} ஆகும். அனுப்பிய தீர்வு: {sent}, பெற்ற தீர்வு: {recv}.",
    debtCreatorMathDetail: "இறுதி நிலை சூத்திரத்தைப் பயன்படுத்தி:\nஇறுதி நிலை = (செலுத்திய செலவுகள்) - (பகிர்ந்துகொண்ட தொகை) + (அனுப்பிய தீர்வு) - (பெற்ற தீர்வு)\n{paid} (செலுத்தியது) - {owed} (பகிர்வு) + {sent} (அனுப்பியது) - {recv} (பெற்றது) = {standing} (இறுதி நிலை)\n\nஇதனால் இவருக்கு நிகர எதிர்மறை இருப்பு {standing} ஆகிறது, இதுவே இவரை அதிக கடன் உருவாக்கியவராக்குக்கிறது.",
    settlementExplanationIntro: "சூத்திரம்: இறுதி நிலை = (செலுத்திய செலவுகள்) - (பகிர்ந்துகொண்ட தொகை) + (அனுப்பிய தீர்வு) - (பெற்ற தீர்வு)\n\nஒவ்வொரு உறுப்பினரின் கணக்கீடு பின்வருமாறு:",
    settlementOptimizationText: "தீர்வு மேம்படுத்தல்:\nபரிவர்த்தனைகளின் எண்ணிக்கையைக் குறைக்க கடனளிப்பவர்களையும் கடனாளிகளையும் ஒப்பிட்டுச் சமநிலைப்படுத்துகிறோம். மேம்படுத்தப்பட்ட தீர்வுத் திட்டம்:",
    memberExplanationTitle: "{name} க்கான இருப்பு விளக்கம்:",
    memberPaidDetails: "1. **செலுத்திய செலவுகள்:** {name} மொத்தம் {paid} செலுத்தியுள்ளார்:",
    memberOwedDetails: "2. **பகிர்ந்துகொண்ட தொகை:** {name} பகிர்ந்துகொண்ட தொகை {owed} பின்வருமாறு:",
    memberSettlementsDetails: "3. **தீர்வு:** {name} {sent} அனுப்பியுள்ளார் மற்றும் {recv} பெற்றுள்ளார்.",
    memberFinalMath: "4. **இறுதி கணக்கீடு:** இறுதி நிலை சூத்திரத்தைப் பயன்படுத்தி:\nஇறுதி நிலை = (செலுத்திய செலவுகள்) - (பகிர்ந்துகொண்ட தொகை) + (அனுப்பிய தீர்வு) - (பெற்ற தீர்வு)\n{paid} (செலுத்தியது) - {owed} (பகிர்வு) + {sent} (அனுப்பியது) - {recv} (பெற்றது) = {standing} (இறுதி நிலை)\n\nஇதனால் நிகர இருப்பு {standing} ஆகும்.",
    tripSummaryIntro: "\"{name}\" குழுவிற்கான விரிவான அறிக்கை:",
    tripSummaryPoints: "- **மொத்த குழு செலவு:** {totalSpent}\n- **பயண காலம்:** {dateRange}\n- **மொத்த உறுப்பினர்கள்:** {membersCount} நபர்கள் ({membersList})\n- **நபர் ஒன்றுக்கான சராசரி செலவு:** {avg}\n- **அதிகம் செலவு செய்தவர்:** {topSpender} (செலவிட்டது {topSpenderSpent})\n- **மிகப்பெரிய தனிநபர் செலவு:** {largestExpense}\n- **மொத்த பரிவர்த்தனைகள்:** {transactionsCount} ({refundsCount} திரும்பப்பெறுகளுடன்)",
    groupNameLabel: "குழுவின் பெயர்",
    totalSpendingLabel: "மொத்த செலவு",
    totalTransactionsLabel: "மொத்த பரிவர்த்தனைகள்",
    averageShareLabel: "சராசரி பங்கு",
    topSpenderLabel: "அதிகம் செலவு செய்தவர்",
    tripDateRangeLabel: "பயண காலம்"
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
    category: "वर्गीकरण",
    count: "సంఖ్య",
    highestDebtor: "అత్యధిక రుణగ్రహీత",
    debtor: "రుణగ్రహీత",
    creditor: "రుణదాత",
    settled: "పరిష్కరించబడింది",
    refundExplanation: "రీఫండ్‌ల వల్ల గ్రూప్ మొత్తం ఖర్చు తగ్గి, ప్రతి సభ్యుని బాకీ వాటా తగ్గుతుంది. ఈ గ్రూప్‌లో, మొత్తం రీఫండ్ {totalRefund} వెనక్కి రావడం వల్ల ప్రతి సభ్యుని వాటా {savings} తగ్గింది.",
    refundMath: "గణిత వివరణ:\nమొత్తం రీఫండ్: {totalRefund}\nమొత్తం సభ్యులు: {membersCount}\nవ్యక్తిగత ఆదా = మొత్తం రీఫండ్ / సభ్యులు = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "వ్యక్తిగత ఆదా: {savings}",
    noRefunds: "ఈ గ్రూప్‌లో ఎటువంటి రీఫండ్‌లు నమోదు కాలేదు.",
    expenseHistoryIntro: "ఈ గ్రూప్‌లో మొత్తం {count} లావాదేవీలు నమోదయ్యాయి.",
    expenseHistoryMath: "గణిత సారాంశం:\n- సకారాత్మక ఖర్చులు: {positive}\n- రీఫండ్ మినహాయింపులు: {refunds}\n- నికర మొత్తం ఖర్చు (ఖర్చులు - రీఫండ్‌లు): {net}\n- సభ్యునికి సరేరాశీ ఖర్చు: {avg}",
    expenseHistoryInsight: "మొత్తం గ్రూప్ ఖర్చు: {net}",
    debtCreatorExplanation: "ఈ గ్రూప్‌లో అత్యధికంగా అప్పు ఉన్న వ్యక్తి {name}, అతని తుది బ్యాలెన్స్ {standing}.",
    debtCreatorMathIntro: "ఒక సభ్యుని వాటా బాకీ వారు చెల్లించిన ఖర్చుల కంటే ఎక్కువగా ఉన్నప్పుడు వారు రుణగ్రస్తులవుతారు. ఈ గ్రూప్‌లో, {name} మొత్తం {paid} చెల్లించారు, కానీ అతని వాటా బాకీ {owed}. పంపిన పరిష్కారాలు: {sent}, పొందిన పరిష్కారాలు: {recv}.",
    debtCreatorMathDetail: "తుది బ్యాలెన్స్ సూత్రాన్ని ఉపయోగించి:\nతుది బ్యాలెన్స్ = (చెల్లించిన ఖర్చులు) - (వాటా బాకీ) + (పంపిన పరిష్కారం) - (పొందిన పరిష్కారం)\n{paid} (చెల్లించినది) - {owed} (వాటా) + {sent} (పంపినది) - {recv} (పొందినది) = {standing} (తుది బ్యాలెన్స్)\n\nదీని వల్ల ఇతనికి అత్యధిక నికర రుణ బ్యాలెన్స్ {standing} ఉంది, అందువల్ల ఇతను అత్యధిక అప్పు ఉన్న వ్యక్తి అయ్యాడు.",
    settlementExplanationIntro: "సూత్రం: తుది బ్యాలెన్స్ = (చెల్లించిన ఖర్చులు) - (వాటా బాకీ) + (పంపిన పరిష్కారం) - (పొందిన పరిష్కారం)\n\nప్రতি సభ్యుని లెక్కలు క్రింది విధంగా ఉన్నాయి:",
    settlementOptimizationText: "పరిష్కార ఆప్టిమైజేషన్:\nలావాదేవీల సంఖ్యను తగ్గించడానికి రుణదాతలను మరియు రుణగ్రస్తులను సమతుల్యం చేస్తాము. సరైన పరిష్కార ప్రణాళిక:",
    memberExplanationTitle: "{name} తుది బ్యాలెన్స్ వివరణ:",
    memberPaidDetails: "1. **చెల్లించిన ఖర్చులు:** {name} మొత్తం {paid} చెల్లించారు:",
    memberOwedDetails: "2. **వాటా బాకీ:** {name} వాటా బాకీ {owed} క్రింది విధంగా ఉంది:",
    memberSettlementsDetails: "3. **పరిష్కారాలు:** {name} {sent} పంపారు మరియు {recv} పొందారు.",
    memberFinalMath: "4. **తుది లెక్కలు:** తుది బ్యాలెన్స్ సూత్రాన్ని ఉపయోగించి:\nతుది బ్యాలెన్స్ = (చెల్లించిన ఖర్చులు) - (వాటా బాకీ) + (పంపిన పరిష్కారం) - (పొందిన పరిష్కారం)\n{paid} (చెల్లించినది) - {owed} (వాటా) + {sent} (పంపినది) - {recv} (పొందినది) = {standing} (తుది బ్యాలెన్స్)\n\nదీని వల్ల తుది బ్యాలెన్స్ {standing} అవుతుంది.",
    tripSummaryIntro: "గ్రూప్ \"{name}\" సవివరమైన నివేదిక:",
    tripSummaryPoints: "- **మొత్తం గ్రూప్ ఖర్చు:** {totalSpent}\n- **ప్రయాణ కాలం:** {dateRange}\n- **మొత్తం సభ్యులు:** {membersCount} మంది ({membersList})\n- **సభ్యునికి సగటు ఖర్చు:** {avg}\n- **ఎక్కువ ఖర్చు చేసిన వ్యక్తి:** {topSpender} (చెల్లించినది {topSpenderSpent})\n- **అతిపెద్ద సింగిల్ ఖర్చు:** {largestExpense}\n- **మొత్తం లావాదేవీలు:** {transactionsCount} ({refundsCount} రీఫండ్‌లతో కలిపి)",
    groupNameLabel: "గ్రూప్ పేరు",
    totalSpendingLabel: "మొత్తం ఖర్చు",
    totalTransactionsLabel: "మొత్తం లావాదేవీలు",
    averageShareLabel: "సగటు వాటా",
    topSpenderLabel: "ఎక్కువ ఖర్చు చేసిన వ్యక్తి",
    tripDateRangeLabel: "ప్రయాణ కాలం"
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
    settled: "തീർപ്പാക്കി",
    refundExplanation: "റീഫണ്ടുകൾ ഗ്രൂപ്പിന്റെ ആകെ ചെലവ് കുറയ്ക്കുകയും ഓരോ അംഗത്തിന്റെയും ബാധ്യത കുറയ്ക്കുകയും ചെയ്യുന്നു. ഈ ഗ്രൂപ്പിൽ, ആകെ റീഫണ്ട് തുകയായ {totalRefund} തിരികെ ലഭിച്ചത് ഓരോ അംഗത്തിന്റെയും ബാധ്യത {savings} കുറച്ചിട്ടുണ്ട്.",
    refundMath: "ഗണിത വിശദീകരണം:\nആകെ റീഫണ്ട്: {totalRefund}\nആകെ അംഗങ്ങൾ: {membersCount}\nവ്യക്തിഗത ലാഭം = ആകെ റീഫണ്ട് / അംഗങ്ങൾ = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "വ്യക്തിഗത ലാഭം: {savings}",
    noRefunds: "ഈ ഗ്രൂപ്പിൽ റീഫണ്ടുകളൊന്നും രേഖപ്പെടുത്തിയിട്ടില്ല.",
    expenseHistoryIntro: "ഈ ഗ്രൂപ്പിൽ ആകെ {count} ഇടപാടുകൾ രേഖപ്പെടുത്തിയിട്ടുണ്ട്.",
    expenseHistoryMath: "ഗണിത സംഗ്രഹം:\n- പോസിറ്റീവ് ചെലവുകൾ: {positive}\n- റീഫണ്ട് കിഴിവുകൾ: {refunds}\n- നെറ്റ് ആകെ ചെലവ് (പോസിറ്റീവ് - റീഫണ്ട്): {net}\n- അംഗം ഒന്നിന് ശരാശരി ചെലവ്: {avg}",
    expenseHistoryInsight: "ആകെ ഗ്രൂപ്പ് ചെലവ്: {net}",
    debtCreatorExplanation: "ഈ ഗ്രൂപ്പിൽ ഏറ്റവും കൂടുതൽ കട ബാധ്യതയുള്ള വ്യക്തി {name} ആണ്, ഇയാളുടെ അവസാന നില {standing} ആണ്.",
    debtCreatorMathIntro: "ഒരു അംഗത്തിന്റെ ബാധ്യതയുള്ള പങ്ക് അവർ നൽകിയ ചെലവുകളെക്കാൾ കൂടുതലാകുമ്പോൾ അവർ കടക്കാരനാകുന്നു. ഈ ഗ്രൂപ്പിൽ, {name} ആകെ {paid} നൽകി, എന്നാൽ ഇയാളുടെ പങ്ക് {owed} ആയിരുന്നു. അയച്ച തുക: {sent}, ലഭിച്ച തുക: {recv}.",
    debtCreatorMathDetail: "അവസാന നില സൂത്രവാക്യം ഉപയോഗിച്ച്:\nഅവസാന നില = (നൽകിയ ചെലവുകൾ) - (ബാധ്യതയുള്ള പങ്ക്) + (അയച്ച തുക) - (ലഭിച്ച തുക)\n{paid} (നൽകിയത്) - {owed} (പങ്ക്) + {sent} (അയച്ചത്) - {recv} (ലഭിച്ചത്) = {standing} (അവസാന നില)\n\nഇത് വഴി ഇയാൾക്ക് നെഗറ്റീവ് ബാക്കി തുക {standing} വരുന്നു, അങ്ങനെ ഇയാൾ ഏറ്റവും കൂടുതൽ കട ബാധ്യതയുള്ള വ്യക്തിയാകുന്നു.",
    settlementExplanationIntro: "സൂത്രവാക്യം: അവസാന നില = (നൽകിയ ചെലവുകൾ) - (ബാധ്യതയുള്ള പങ്ക്) + (അയച്ച തുക) - (ലഭിച്ച തുക)\n\nഓരോ അംഗത്തിന്റെയും കണക്കുകൂട്ടലുകൾ താഴെ നൽകുന്നു:",
    settlementOptimizationText: "തീർപ്പാക്കൽ ഒപ്റ്റിമൈസേഷൻ:\nഇടപാടുകളുടെ എണ്ണം കുറയ്ക്കുന്നതിനായി ഞങ്ങൾ കടം നൽകിയവരെയും വാങ്ങിയവരെയും പരസ്പരം ക്രമീകരിക്കുന്നു. ഒപ്റ്റിമൈസ് ചെയ്ത തീർപ്പാക്കൽ പ്ലാൻ:",
    memberExplanationTitle: "{name} -ന്റെ ബാക്കി തുക വിവരണം:",
    memberPaidDetails: "1. **നൽകിയ ചെലവുകൾ:** {name} ആകെ {paid} നൽകി:",
    memberOwedDetails: "2. **ബാധ്യതയുള്ള പങ്ക്:** {name} -ന്റെ ആകെ പങ്ക് {owed} താഴെ നൽകുന്നു:",
    memberSettlementsDetails: "3. **തീർപ്പാക്കൽ:** {name} {sent} അയക്കുകയും {recv} സ്വീകരിക്കുകയും ചെയ്തു.",
    memberFinalMath: "4. **അവസാന ഗണിതം:** അവസാന നില സൂത്രവാക്യം ഉപയോഗിച്ച്:\nഅവസാന നില = (നൽകിയ ചെലവുകൾ) - (ബാധ്യതയുള്ള പങ്ക്) + (അയച്ച തുക) - (ലഭിച്ച തുക)\n{paid} (നൽകിയത്) - {owed} (പങ്ക്) + {sent} (അയച്ചത്) - {recv} (ലഭിച്ചത്) = {standing} (അവസാന നില)\n\nഇതിന്റെ ഫലമായി ബാക്കി തുക {standing} ആകുന്നു.",
    tripSummaryIntro: "\"{name}\" ഗ്രൂപ്പിനായുള്ള വിശദമായ റിപ്പോർട്ട്:",
    tripSummaryPoints: "- **ആകെ ഗ്രൂപ്പ് ചെലവ്:** {totalSpent}\n- **യാത്രാ കാലയളവ്:** {dateRange}\n- **ആകെ അംഗങ്ങൾ:** {membersCount} പേർ ({membersList})\n- **അംഗം ഒന്നിന് ശരാശരി ചെലവ്:** {avg}\n- **ഏറ്റവും കൂടുതൽ ചിലവഴിച്ചയാൾ:** {topSpender} (ചിലവഴിച്ചത് {topSpenderSpent})\n- **ഏറ്റവും വലിയ ഒറ്റ ചെലവ്:** {largestExpense}\n- **ആകെ ഇടപാടുകൾ:** {transactionsCount} ({refundsCount} റീഫണ്ടുകൾ ഉൾപ്പെടെ)",
    groupNameLabel: "ഗ്രൂപ്പിന്റെ പേര്",
    totalSpendingLabel: "ആകെ ചെലവ്",
    totalTransactionsLabel: "ആകെ ഇടപാടുകൾ",
    averageShareLabel: "ശരാശരി പങ്ക്",
    topSpenderLabel: "കൂടുതൽ ചിലവഴിച്ചയാൾ",
    tripDateRangeLabel: "യാത്രാ കാലയളവ്"
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
    settled: "ਨਿਪਟਾਇਆ",
    refundExplanation: "ਰਿਫੰਡ ਨਾਲ ਗਰੁੱਪ ਦਾ ਕੁੱਲ ਖਰਚਾ ਘਟਦਾ ਹੈ, ਜਿਸ ਨਾਲ ਹਰੇਕ ਮੈਂਬਰ ਦੀ ਦੇਣਦਾਰੀ ਘਟਦੀ ਹੈ। ਇਸ ਗਰੁੱਪ ਵਿੱਚ, ਕੁੱਲ ਰਿਫੰਡ ਰਾਸ਼ੀ {totalRefund} ਮਿਲਣ ਨਾਲ ਹਰੇਕ ਮੈਂਬਰ ਦੀ ਦੇਣਦਾਰੀ {savings} ਘੱਟ ਗਈ ਹੈ।",
    refundMath: "ਗਣਿਤਿਕ ਵਿਆਖਿਆ:\nਕੁੱਲ ਰਿਫੰਡ: {totalRefund}\nਕੁੱਲ ਮੈਂਬਰ ਸੰਖਿਆ: {membersCount}\nਨਿੱਜੀ ਬਚਤ = ਕੁੱਲ ਰਿਫੰਡ / ਮੈਂਬਰ ਸੰਖਿਆ = {totalRefund} / {membersCount} = {savings}",
    refundSavingsInsight: "ਨਿੱਜੀ ਬਚਤ: {savings}",
    noRefunds: "ਇਸ ਗਰੁੱਪ ਵਿੱਚ ਕੋਈ ਰਿਫੰਡ ਦਰਜ ਨਹੀਂ ਕੀਤਾ ਗਿਆ ਹੈ।",
    expenseHistoryIntro: "ਇਸ ਗਰੁੱਪ ਵਿੱਚ ਕੁੱਲ {count} ਲੈਣ-ਦੇਣ ਦਰਜ ਕੀਤੇ ਗਏ ਹਨ।",
    expenseHistoryMath: "ਗਣਿਤਿਕ ਸਾਰ:\n- ਸਕਾਰਾਤਮਕ ਖਰਚੇ: {positive}\n- ਰਿਫੰਡ ਕਟੌਤੀ: {refunds}\n- ਸ਼ੁੱਧ ਕੁੱਲ ਖਰਚਾ (ਸਕਾਰਾਤਮਕ - ਰਿਫੰਡ): {net}\n- ਪ੍ਰਤੀ ਮੈਂਬਰ ਔਸਤ ਖਰਚਾ: {avg}",
    expenseHistoryInsight: "ਕੁੱਲ ਗਰੁੱਪ ਖਰਚਾ: {net}",
    debtCreatorExplanation: "ਇਸ ਗਰੁੱਪ ਵਿੱਚ ਸਭ ਤੋਂ ਵੱਡਾ ਦੇਣਦਾਰ {name} ਹੈ, ਜਿਸਦੀ ਅੰਤਿਮ ਸਥਿਤੀ {standing} ਹੈ।",
    debtCreatorMathIntro: "ਕੋਈ ਮੈਂਬਰ ਉਦੋਂ ਦੇਣਦਾਰ ਬਣਦਾ ਹੈ ਜਦੋਂ ਉਸਦੀ ਦੇਣਦਾਰੀ ਉਸਦੇ ਭੁਗਤਾਨ ਕੀਤੇ ਖਰਚਿਆਂ ਤੋਂ ਵੱਧ ਹੁੰਦੀ ਹੈ। ਇਸ ਗਰੁੱਪ ਵਿੱਚ, {name} ਨੇ ਕੁੱਲ {paid} ਦਾ ਭੁਗਤਾਨ ਕੀਤਾ, ਜਦੋਂ ਕਿ ਉਸਦਾ ਦੇਣਦਾਰੀ ਹਿੱਸਾ {owed} ਸੀ। ਭੇਜੇ ਗਏ ਨਿਪਟਾਰੇ: {sent}, ਪ੍ਰਾਪਤ ਨਿਪਟਾਰੇ: {recv}।",
    debtCreatorMathDetail: "ਅੰਤਿਮ ਸਥਿਤੀ ਸੂਤਰ ਦੀ ਵਰਤੋਂ ਕਰਦੇ ਹੋਏ:\nਅੰਤਿਮ ਸਥਿਤੀ = (ਭੁਗਤਾਨ ਕੀਤੇ ਖਰਚੇ) - (ਦੇਣਦਾਰੀ ਹਿੱਸਾ) + (ਭੇਜਿਆ ਗਿਆ ਨਿਪਟਾਰਾ) - (ਪ੍ਰਾਪਤ ਨਿਪਟਾਰਾ)\n{paid} (ਭੁਗਤਾਨ) - {owed} (ਦੇਣਦਾਰੀ) + {sent} (ਭੇਜਿਆ) - {recv} (ਪ੍ਰਾਪਤ) = {standing} (ਅੰਤਿਮ ਸਥਿਤੀ)\n\nਇਸ ਤਰ੍ਹਾਂ {name} ਦਾ ਸ਼ੁੱਧ ਨਕਾਰਾਤਮਕ ਬਕਾਇਆ {standing} ਹੈ, ਜੋ ਉਸਨੂੰ ਗਰੁੱਪ ਦਾ ਸਭ ਤੋਂ ਵੱਡਾ ਦੇਣਦਾਰ ਬਣਾਉਂਦਾ ਹੈ।",
    settlementExplanationIntro: "ਸੂਤਰ: ਅੰਤਿਮ ਸਥਿਤੀ = (ਭੁਗਤਾਨ ਕੀਤੇ ਖਰਚੇ) - (ਦੇਣਦਾਰੀ ਹਿੱਸਾ) + (ਭੇਜਿਆ ਗਿਆ ਨਿਪਟਾਰਾ) - (ਪ੍ਰਾਪਤ ਨਿਪਟਾਰਾ)\n\nਹਰੇਕ ਮੈਂਬਰ ਦੀ ਗਣਨਾ ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਹੈ:",
    settlementOptimizationText: "ਨਿਪਟਾਰਾ ਅਨੁਕੂਲਨ:\nਲੈਣ-ਦੇਣ ਦੀ ਗਿਣਤੀ ਘੱਟ ਕਰਨ ਲਈ ਅਸੀਂ ਲੈਣਦਾਰਾਂ ਅਤੇ ਦੇਣਦਾਰਾਂ ਦਾ ਸੰਤੁਲਨ ਕਰਦੇ ਹਾਂ। ਅਨੁਕੂਲ ਨਿਪਟਾਰਾ ਯੋਜਨਾ ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਹੈ:",
    memberExplanationTitle: "{name} ਦੇ ਬਕਾਏ ਦੀ ਵਿਆਖਿਆ:",
    memberPaidDetails: "1. **ਭੁਗਤਾਨ ਕੀਤੇ ਖਰਚੇ:** {name} ਨੇ ਕੁੱਲ {paid} ਦਾ ਭੁਗਤਾਨ ਕੀਤਾ:",
    memberOwedDetails: "2. **ਦੇਣਦਾਰੀ ਹਿੱਸਾ:** {name} ਦੀ ਦੇਣਦਾਰੀ {owed} ਹੇਠ ਲਿਖੇ ਅਨੁਸਾਰ ਹੈ:",
    memberSettlementsDetails: "3. **ਨਿਪਟਾਰੇ:** {name} ਨੇ {sent} ਭੇਜੇ ਅਤੇ {recv} ਪ੍ਰਾਪਤ ਕੀਤੇ।",
    memberFinalMath: "4. **ਅੰਤਿਮ ਹਿਸਾਬ:** ਅੰਤਿਮ ਸਥਿਤੀ ਸੂਤਰ ਦੀ ਵਰਤੋਂ ਕਰਦੇ ਹੋਏ:\nਅੰਤਿਮ ਸਥਿਤੀ = (ਭੁਗਤਾਨ ਕੀਤੇ ਖਰਚੇ) - (ਦੇਣਦਾਰੀ ਹਿੱਸਾ) + (ਭੇਜਿਆ ਗਿਆ ਨਿਪਟਾਰਾ) - (ਪ੍ਰਾਪਤ ਨਿਪਟਾਰਾ)\n{paid} (ਭੁਗਤਾਨ) - {owed} (ਦੇਣਦਾਰੀ) + {sent} (ਭੇਜਿਆ) - {recv} (ਪ੍ਰਾਪਤ) = {standing} (ਅੰਤਿਮ ਸਥਿਤੀ)\n\nਇਸਦੇ ਨਤੀਜੇ ਵਜੋਂ ਸ਼ੁੱਧ ਬਕਾਇਆ {standing} ਹੈ।",
    tripSummaryIntro: "ਗਰੁੱਪ \"{name}\" ਲਈ ਵੇਰਵੇ ਸਹਿਤ ਰਿਪੋਰਟ:",
    tripSummaryPoints: "- **ਕੁੱਲ ਗਰੁੱਪ ਖਰਚਾ:** {totalSpent}\n- **ਯਾਤਰਾ ਦਾ ਸਮਾਂ:** {dateRange}\n- **ਕੁੱਲ ਮੈਂਬਰ ਸੰਖਿਆ:** {membersCount} ਮੈਂਬਰ ({membersList})\n- **ਪ੍ਰਤੀ ਮੈਂਬਰ ਔਸਤ ਖਰਚਾ:** {avg}\n- **ਸਭ ਤੋਂ ਵੱਧ ਖਰਚ ਕਰਨ ਵਾਲਾ:** {topSpender} (ਖਰਚ ਕੀਤੇ {topSpenderSpent})\n- **ਸਭ ਤੋਂ ਵੱਡਾ ਸਿੰਗਲ ਖਰਚਾ:** {largestExpense}\n- **ਕੁੱਲ ਲੈਣ-ਦੇਣ:** {transactionsCount} (ਜਿਸ ਵਿੱਚ {refundsCount} ਰਿਫੰਡ ਸ਼ਾਮਲ ਹਨ)",
    groupNameLabel: "ਗਰੁੱਪ ਦਾ ਨਾਮ",
    totalSpendingLabel: "ਕੁੱਲ ਖਰਚਾ",
    totalTransactionsLabel: "ਕੁੱਲ ਲੈਣ-ਦੇਣ",
    averageShareLabel: "ਔਸਤ ਹਿੱਸਾ",
    topSpenderLabel: "ਸਭ ਤੋਂ ਵੱਧ ਖਰਚ ਕਰਨ ਵਾਲਾ",
    tripDateRangeLabel: "ਯਾਤਰਾ ਦਾ ਸਮਾਂ"
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
 * Match the user question to one of the target intents
 * @param {string} question 
 * @returns {string|null} Intent name or null
 */
export const matchIntent = (question) => {
  const q = question.toLowerCase();
  
  if (q.includes('refund') || q.includes('reimbursement') || q.includes('वापसी') || q.includes('रिफंड') || q.includes('return')) {
    return 'REFUND_ANALYSIS';
  }
  if (q.includes('creator') || q.includes('debtor') || q.includes('most debt') || q.includes('highest debt') || q.includes('कर्जदार') || q.includes('कर्ज')) {
    return 'DEBT_CREATOR_ANALYSIS';
  }
  if (q.includes('step-by-step') || q.includes('calculation') || q.includes('how was') || q.includes('explain calculations') || q.includes('explain balances') || q.includes('गणना') || q.includes('बकाया') || q.includes('standing') || q.includes('why')) {
    return 'SETTLEMENT_EXPLANATION';
  }
  if (q.includes('history') || q.includes('list of expenses') || q.includes('all expenses') || q.includes('इतिहास') || q.includes('खर्चों का') || q.includes('transactions')) {
    return 'EXPENSE_HISTORY';
  }
  if (q.includes('summary') || q.includes('trip') || q.includes('complete') || q.includes('सारांश') || q.includes('विवरण')) {
    return 'DETAILED_TRIP_SUMMARY';
  }
  
  return null;
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

  // Interpolation helper
  const interpolate = (template, values) => {
    if (!template) return "";
    let res = template;
    for (const [k, v] of Object.entries(values)) {
      res = res.replace(new RegExp(`\\{${k}\\}`, 'g'), v);
    }
    return res;
  };

  // Helper function to translate categories
  const translateCategory = (catName) => {
    const catDict = {
      Hindi: { "Food & Dining": "भोजन और खान-पान", "General": "सामान्य", "Transportation": "परिवहन" },
      Bengali: { "Food & Dining": "খাদ্য ও ভোজন", "General": "সাধারণ", "Transportation": "পরিবহন" },
      Marathi: { "Food & Dining": "अन्न आणि जेवण", "General": "सामान्य", "Transportation": "वाहतूक" },
      Gujarati: { "Food & Dining": "ખોરાક અને ભોજન", "General": "સામાન્ય", "Transportation": "પરિવહન" },
      Tamil: { "Food & Dining": "உணவு மற்றும் டைனிங்", "General": "பொதுவானது", "Transportation": "போக்குவரத்து" },
      Telugu: { "Food & Dining": "ఆహారం & భోజనం", "General": "సాధారణ", "Transportation": "రవాణా" },
      Malayalam: { "Food & Dining": "ഭക്ഷണവും ഡൈനിംഗും", "General": "പൊതുവായത്", "Transportation": "ഗതാഗതം" },
      Punjabi: { "Food & Dining": "ਭੋਜਨ ਅਤੇ ਖਾਣਾ", "General": "ਆਮ", "Transportation": "ਆਵਾਜਾਈ" }
    };
    return catDict[lang]?.[catName] || catName;
  };

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

  // MATCH THE INTENT
  const matchedIntent = matchIntent(question);

  if (matchedIntent === 'REFUND_ANALYSIS') {
    const refundExpenses = expenses.filter(e => e.amount < 0 || e.description.toLowerCase().includes('refund'));
    const totalRefund = refundExpenses.reduce((sum, r) => sum + r.amount, 0);

    if (refundExpenses.length > 0) {
      const absTotalRefund = Math.abs(totalRefund);
      const absSavings = absTotalRefund / members.length;

      answer = interpolate(t.refundExplanation, {
        totalRefund: fmt(absTotalRefund),
        savings: fmt(absSavings)
      }) + "\n\n" + interpolate(t.refundMath, {
        totalRefund: absTotalRefund.toFixed(2),
        membersCount: members.length,
        savings: fmt(absSavings)
      }) + "\n\n" + (lang === 'Hindi' ? "ये रिफंड अंतिम बकाया को प्रभावित करते हैं:" : "List of refunds affecting balances:");

      insights.push(interpolate(t.refundSavingsInsight, { savings: fmt(absSavings) }));
      insights.push(`${t.refundAnalysisTitle}: ${fmt(absTotalRefund)}`);

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
      answer = t.noRefunds || "No refunds have been recorded in this group.";
    }
  }
  else if (matchedIntent === 'DEBT_CREATOR_ANALYSIS') {
    if (highestDebtor && highestDebtor.standing < -0.01) {
      answer = interpolate(t.debtCreatorExplanation, {
        name: highestDebtor.name,
        standing: fmt(highestDebtor.standing)
      }) + "\n\n" + interpolate(t.debtCreatorMathIntro, {
        name: highestDebtor.name,
        paid: fmt(highestDebtor.paid),
        owed: fmt(highestDebtor.owed),
        sent: fmt(highestDebtor.sent),
        recv: fmt(highestDebtor.recv)
      }) + "\n\n" + interpolate(t.debtCreatorMathDetail, {
        paid: highestDebtor.paid.toFixed(2),
        owed: highestDebtor.owed.toFixed(2),
        sent: highestDebtor.sent.toFixed(2),
        recv: highestDebtor.recv.toFixed(2),
        standing: highestDebtor.standing.toFixed(2)
      });

      insights.push(`${t.highestDebtor || "Highest Debtor"}: ${highestDebtor.name} (${fmt(highestDebtor.standing)})`);

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
  else if (matchedIntent === 'SETTLEMENT_EXPLANATION') {
    const matchedMember = members.find(m => q.includes(m.name.toLowerCase()));

    if (matchedMember) {
      const ms = memberStandings.find(m => m.name === matchedMember.name);
      
      const memberPaidExps = expenses.filter(e => e.paidBy === matchedMember.name);
      const paidListStr = memberPaidExps.length > 0
        ? memberPaidExps.map(e => `- "${e.description}": ${fmt(e.amount)}`).join('\n')
        : (lang === 'Hindi' ? "- कोई खर्च भुगतान नहीं किया गया।" : "- No expenses paid.");

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

      answer = interpolate(t.memberExplanationTitle, { name: matchedMember.name }) + "\n\n" +
               interpolate(t.memberPaidDetails, { name: matchedMember.name, paid: fmt(ms.paid) }) + "\n" + paidListStr + "\n\n" +
               interpolate(t.memberOwedDetails, { name: matchedMember.name, owed: fmt(ms.owed) }) + "\n" + owedListStr + "\n\n" +
               interpolate(t.memberSettlementsDetails, { name: matchedMember.name, sent: fmt(ms.sent), recv: fmt(ms.recv) }) + "\n\n" +
               interpolate(t.memberFinalMath, {
                 paid: ms.paid.toFixed(2),
                 owed: ms.owed.toFixed(2),
                 sent: ms.sent.toFixed(2),
                 recv: ms.recv.toFixed(2),
                 standing: ms.standing.toFixed(2)
               });

      insights.push(`${matchedMember.name} Standing: ${fmt(ms.standing)}`);
    } else {
      const calcLines = memberStandings.map(m => {
        return formatMemberStandingText(m.name, m.paid, m.owed, m.sent, m.recv, m.standing);
      });

      answer = t.settlementExplanationIntro + "\n\n" + calcLines.join('\n') + "\n\n" + t.settlementOptimizationText;

      insights.push(lang === 'Hindi' ? `परिकलित सदस्य: ${members.length}` : `Calculated members: ${members.length}`);
      insights.push(lang === 'Hindi' ? "बकाया अनुकूलन पूर्ण" : "Dues optimization completed");
    }

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
  else if (matchedIntent === 'EXPENSE_HISTORY') {
    const totalPosSpent = expenses.filter(e => e.amount > 0).reduce((sum, e) => sum + e.amount, 0);
    const totalRefund = expenses.filter(e => e.amount < 0).reduce((sum, e) => sum + e.amount, 0);
    const netSpent = totalPosSpent + totalRefund;
    const avgSpent = netSpent / members.length;

    answer = t.expenseHistoryTitle + ":\n\n" + interpolate(t.expenseHistoryIntro, { count: expenses.length }) + "\n\n" +
             interpolate(t.expenseHistoryMath, {
               positive: fmt(totalPosSpent),
               refunds: fmt(Math.abs(totalRefund)),
               net: fmt(netSpent),
               membersCount: members.length,
               avg: fmt(avgSpent)
             }) + "\n\n" + (lang === 'Hindi' ? "दर्ज किए गए लेनदेन का विवरण:" : "Detailed list of recorded transactions:");

    insights.push(interpolate(t.expenseHistoryInsight, { net: fmt(netSpent) }));
    insights.push(`${t.expenseHistoryTitle}: ${expenses.length}`);

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
  else if (matchedIntent === 'DETAILED_TRIP_SUMMARY') {
    const totalSpentStr = Object.entries(tripSummary.totalExpensesByCurrency)
      .map(e => `${e[0]} ${e[1].toFixed(2)}`).join(', ');
    const netSpent = tripSummary.totalExpensesByCurrency[currency] || 0;
    const avgSpent = netSpent / members.length;
    const maxExp = tripSummary.largestExpense;

    const validDates = expenses.map(e => e.date).filter(d => d !== 'Unknown').sort();
    const dateRangeStr = validDates.length > 0
      ? `${validDates[0]} - ${validDates[validDates.length - 1]}`
      : "N/A";

    const maxExpDetailsHindi = maxExp ? `"${maxExp.description}" (${currency} ${maxExp.amount.toFixed(2)} भुगतान ${maxExp.paidBy} द्वारा दिनांक ${maxExp.date})` : 'N/A';
    const maxExpDetailsEng = maxExp ? `"${maxExp.description}" (${currency} ${maxExp.amount.toFixed(2)} paid by ${maxExp.paidBy} on ${maxExp.date})` : 'N/A';
    const maxExpDetails = lang === 'Hindi' ? maxExpDetailsHindi : maxExpDetailsEng;

    answer = t.tripSummaryTitle + ":\n\n" + interpolate(t.tripSummaryIntro, { name: groupName }) + "\n" +
             interpolate(t.tripSummaryPoints, {
               totalSpent: totalSpentStr || "0.00",
               dateRange: dateRangeStr,
               membersCount: members.length,
               membersList: members.map(m => m.name).join(', '),
               avg: fmt(avgSpent),
               topSpender: tripSummary.topSpenders[0]?.name || 'N/A',
               topSpenderSpent: currency + " " + (tripSummary.topSpenders[0]?.total || 0).toFixed(2),
               largestExpense: maxExpDetails,
               transactionsCount: expenses.length,
               refundsCount: expenses.filter(e => e.amount < 0).length
             });

    insights.push(`${t.totalSpent || "Total Spending"}: ${totalSpentStr || "0.00"}`);
    insights.push(`${t.participants || "Total Members"}: ${members.length}`);
    insights.push(lang === 'Hindi' ? `प्रति व्यक्ति औसत लागत: ${fmt(avgSpent)}` : `Average cost per person: ${fmt(avgSpent)}`);

    tables.push({
      headers: [t.metric || "Metric", t.value || "Value"],
      rows: [
        [t.groupNameLabel || "Group Name", groupName],
        [t.totalSpendingLabel || "Total Spending", totalSpentStr || "0.00"],
        [t.totalTransactionsLabel || "Total Transactions", expenses.length.toString()],
        [t.averageShareLabel || "Average Share", fmt(avgSpent)],
        [t.topSpenderLabel || "Top Spender", tripSummary.topSpenders[0]?.name || 'N/A'],
        [t.tripDateRangeLabel || "Trip Date Range", dateRangeStr]
      ]
    });

    const statsEntries = Object.entries(categoryStats);
    if (statsEntries.length > 0) {
      tables.push({
        headers: [t.category || "Category", t.totalSpent || "Total Spent", t.count || "Count"],
        rows: statsEntries.map(e => [
          translateCategory(e[0]),
          fmt(e[1].total),
          e[1].count.toString()
        ])
      });
    }

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
  else {
    // Legacy / Specific matchers as fallback
    if (q.includes('spender') || q.includes('spent the most') || q.includes('spent most') || q.includes('most spent')) {
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
                   statsEntries.map(e => `- ${translateCategory(e[0])}: ${fmt(e[1].total)} (${e[1].count} खर्च)`).join('\n');
        } else {
          answer = "Here is the category spending breakdown for the group:\n\n" + 
                   statsEntries.map(e => `- ${e[0]}: ${fmt(e[1].total)} (${e[1].count} expense(s))`).join('\n');
        }
        
        tables.push({
          headers: [t.category || "Category", t.totalSpent || "Total Spent", t.count || "Count"],
          rows: statsEntries.map(e => [translateCategory(e[0]), fmt(e[1].total), e[1].count.toString()])
        });
        
        const topCat = statsEntries.sort((a,b) => b[1].total - a[1].total)[0];
        insights.push(`Top Category Cost: ${topCat[0]} (${fmt(topCat[1].total)})`);
      } else {
        answer = lang === 'Hindi' ? "कोई खर्च दर्ज नहीं किया गया।" : "No expenses recorded.";
      }
    }
    else {
      // General default fallback
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
          [t.groupNameLabel || "Group Name", groupName],
          [t.totalSpendingLabel || "Total Spending", totalSpentStr || "0.00"],
          [t.totalTransactionsLabel || "Total Transactions", tripSummary.participantsCount.toString()]
        ]
      });
    }
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
  matchIntent,
  runLocalFallbackAgent,
  queryAgent
};
