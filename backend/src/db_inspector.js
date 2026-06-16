import prisma from './services/prisma.service.js';

async function main() {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    });
    console.log('--- USERS ---');
    console.log(JSON.stringify(users, null, 2));

    const groups = await prisma.group.findMany({
      include: {
        members: {
          include: {
            user: { select: { name: true } }
          }
        }
      }
    });
    console.log('\n--- GROUPS ---');
    console.log(JSON.stringify(groups.map(g => ({
      id: g.id,
      name: g.name,
      description: g.description,
      members: g.members.map(m => m.user?.name)
    })), null, 2));

    for (const g of groups) {
      const expenses = await prisma.expense.findMany({
        where: { groupId: g.id },
        include: {
          paidBy: { select: { name: true } },
          splits: { include: { user: { select: { name: true } } } }
        }
      });
      console.log(`\n--- EXPENSES FOR GROUP: ${g.name} (${g.id}) ---`);
      console.log(JSON.stringify(expenses.map(e => ({
        id: e.id,
        description: e.description,
        amount: e.amount,
        currency: e.currency,
        paidBy: e.paidBy?.name,
        date: e.date,
        splits: e.splits.map(s => ({ name: s.user?.name, amount: s.amount }))
      })), null, 2));
    }
  } catch (err) {
    console.error(err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
