import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🗑️  Resetting database...');

  try {
    // Delete all dares (this will cascade delete bets, proofs, comments, chat rooms)
    const deletedDares = await prisma.dare.deleteMany({});
    console.log(`✅ Deleted ${deletedDares.count} dares.`);

    // Optionally, we can also delete bets explicitly if there are any orphaned ones (though schema prevents this)
    const deletedBets = await prisma.bet.deleteMany({});
    console.log(`✅ Deleted ${deletedBets.count} bets.`);

    console.log('✅ Database reset complete!');
  } catch (error) {
    console.error('❌ Reset failed:', error);
    process.exit(1);
  }
}

main()
  .catch((e) => {
    console.error('❌ Script failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
