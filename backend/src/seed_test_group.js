import prisma from './services/prisma.service.js';

async function main() {
  try {
    // 1. Get or create users
    const userEmails = [
      { email: 'ayushraj1y2@gmail.com', name: 'harshkumar' },
      { email: 'satyamkumar2351056@gmail.com', name: 'Satyam' },
      { email: 'aisha.test@sharebill.com', name: 'Aisha' },
      { email: 'priya.test@sharebill.com', name: 'Priya' },
      { email: 'aditya.test@sharebill.com', name: 'Aditya' }
    ];

    const users = [];
    for (const u of userEmails) {
      let dbUser = await prisma.user.findUnique({ where: { email: u.email } });
      if (!dbUser) {
        dbUser = await prisma.user.create({
          data: {
            email: u.email,
            name: u.name,
            password: 'hashed_dummy_password_123'
          }
        });
      }
      users.push(dbUser);
    }

    const harsh = users.find(u => u.name === 'harshkumar');
    const satyam = users.find(u => u.name === 'Satyam');
    const aisha = users.find(u => u.name === 'Aisha');
    const priya = users.find(u => u.name === 'Priya');
    const aditya = users.find(u => u.name === 'Aditya');

    // 2. Create the test group
    const groupName = "Goa Road Trip 2026";
    // Check if group already exists
    let group = await prisma.group.findFirst({ where: { name: groupName } });
    if (group) {
      // Clean up previous test run of this group
      await prisma.settlement.deleteMany({ where: { groupId: group.id } });
      await prisma.expenseSplit.deleteMany({
        where: { expense: { groupId: group.id } }
      });
      await prisma.expense.deleteMany({ where: { groupId: group.id } });
      await prisma.groupMember.deleteMany({ where: { groupId: group.id } });
      await prisma.group.delete({ where: { id: group.id } });
    }

    group = await prisma.group.create({
      data: {
        name: groupName,
        description: "Graduation holiday road trip to Goa with high spend analytics",
        creatorId: harsh.id
      }
    });

    console.log(`Created group: ${group.name} (${group.id})`);

    // 3. Add members
    const memberData = users.map(u => ({
      groupId: group.id,
      userId: u.id
    }));
    await prisma.groupMember.createMany({ data: memberData });

    // 4. Create Expenses
    const createExpense = async (desc, amt, paidBy, currency = 'INR', splitType = 'EQUAL', isRefund = false, customSplits = null) => {
      const exp = await prisma.expense.create({
        data: {
          description: desc,
          amount: amt,
          currency,
          groupId: group.id,
          paidById: paidBy.id,
          splitType,
          isRefund
        }
      });

      // Calculate splits
      let splits = [];
      if (splitType === 'EQUAL') {
        const share = amt / users.length;
        splits = users.map(u => ({
          expenseId: exp.id,
          userId: u.id,
          amount: share
        }));
      } else if (splitType === 'EXACT' && customSplits) {
        splits = Object.entries(customSplits).map(([name, amount]) => {
          const user = users.find(u => u.name === name);
          return {
            expenseId: exp.id,
            userId: user.id,
            amount: amount
          };
        });
      }

      await prisma.expenseSplit.createMany({ data: splits });
      return exp;
    };

    // Expense 1: Food - Beachfront Dinner (INR 5000, paid by harsh, equal)
    await createExpense("Beachfront Seafood Dinner", 5000, harsh);

    // Expense 2: Food - Breakfast Cafe (INR 1200, paid by Satyam, equal)
    await createExpense("Breakfast Cafe Cafe", 1200, satyam);

    // Expense 3: Accommodation - Villa Rental (INR 15000, paid by Priya, exact custom split)
    // Custom split: Satyam owes 4000, Priya owes 3000, Aisha owes 3000, harshkumar owes 3000, Aditya owes 2000
    const villaSplits = {
      'Satyam': 4000,
      'Priya': 3000,
      'Aisha': 3000,
      'harshkumar': 3000,
      'Aditya': 2000
    };
    await createExpense("Luxury Villa Rental", 15000, priya, 'INR', 'EXACT', false, villaSplits);

    // Expense 4: Transportation - Fuel for Car (INR 3000, paid by Aditya, equal)
    await createExpense("Fuel for Roadtrip Car", 3000, aditya);

    // Expense 5: Refund - AC Malfunction Refund (INR -2500, meaning a refund entry, paid by Priya, split equal)
    // In database, let's keep amount as -2500, splits are -500 each
    await createExpense("AC Malfunction Refund", -2500, priya, 'INR', 'EQUAL', true);

    // Expense 6: Food - Ice Cream (INR 500, paid by Aisha, equal)
    await createExpense("Beachside Ice Cream", 500, aisha);

    // 5. Add initial Settlement: Satyam pays Priya 2000 INR
    await prisma.settlement.create({
      data: {
        groupId: group.id,
        fromUserId: satyam.id,
        toUserId: priya.id,
        amount: 2000
      }
    });

    console.log("Database seeded successfully with test data!");
  } catch (err) {
    console.error("Seeding failed:", err);
  } finally {
    await prisma.$disconnect();
  }
}

main();
