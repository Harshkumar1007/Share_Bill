import prisma from './services/prisma.service.js';
import { queryAgent } from './services/aiAgent.service.js';
import { getBalances, getTripSummary, getCategoryStats } from './services/aiTools.service.js';

async function getGroupContext(groupId) {
  const group = await prisma.group.findUnique({
    where: { id: groupId }
  });
  const members = await prisma.groupMember.findMany({
    where: { groupId, leftAt: null },
    include: { user: { select: { id: true, name: true, email: true } } }
  }).then(mems => mems.map(m => m.user));

  const expenses = await prisma.expense.findMany({
    where: { groupId },
    include: {
      paidBy: { select: { id: true, name: true, email: true } },
      splits: { include: { user: { select: { id: true, name: true, email: true } } } }
    },
    orderBy: { date: 'asc' }
  });

  const settlements = await prisma.settlement.findMany({
    where: { groupId },
    include: {
      fromUser: { select: { id: true, name: true, email: true } },
      toUser: { select: { id: true, name: true, email: true } }
    }
  });

  const computedBalances = await getBalances(groupId);
  const summary = await getTripSummary(groupId);
  const catStats = await getCategoryStats(groupId);

  return {
    group,
    members,
    expenses,
    balances: computedBalances,
    tripSummary: summary,
    categoryStats: catStats
  };
}

async function main() {
  const groupName = "Goa Road Trip 2026";
  const group = await prisma.group.findFirst({ where: { name: groupName } });
  if (!group) {
    console.error("Test group not found!");
    process.exit(1);
  }

  const groupId = group.id;
  const context = await getGroupContext(groupId);

  const tests = [
    {
      id: 1,
      question: "Who spent the most?",
      language: "English"
    },
    {
      id: 2,
      question: "Why does Satyam owe their current balance?",
      language: "English"
    },
    {
      id: 3,
      question: "Show final settlement plan.",
      language: "English"
    },
    {
      id: 4,
      question: "Explain balances.",
      language: "Hindi"
    },
    {
      id: 5,
      question: "Give complete trip summary.",
      language: "English"
    },
    {
      id: 6,
      question: "Show expense history.",
      language: "English"
    },
    {
      id: 7,
      question: "Who created the highest debt?",
      language: "English"
    },
    {
      id: 8,
      question: "What refunds affected balances?",
      language: "English"
    },
    {
      id: 9,
      question: "Show all food-related expenses.",
      language: "English"
    },
    {
      id: 10,
      question: "Explain settlement calculations step-by-step.",
      language: "English"
    }
  ];

  console.log(`Running acceptance test on group "${groupName}" (${groupId})...\n`);

  for (const t of tests) {
    console.log(`========================================`);
    console.log(`TEST ${t.id}: ${t.question} (${t.language})`);
    console.log(`========================================`);
    
    const response = await queryAgent(groupId, t.question, t.language, []);
    
    console.log(`Answer:\n${response.answer}`);
    if (response.insights && response.insights.length > 0) {
      console.log(`Insights: ${JSON.stringify(response.insights)}`);
    }
    if (response.tables && response.tables.length > 0) {
      console.log(`Tables: ${JSON.stringify(response.tables)}`);
    }
    if (response.settlements && response.settlements.length > 0) {
      console.log(`Settlements: ${JSON.stringify(response.settlements)}`);
    }
    const engine = response.metadata?.engine || "Unknown";
    console.log(`Engine used: ${engine}`);
    console.log(`\n`);
  }

  await prisma.$disconnect();
}

main();
