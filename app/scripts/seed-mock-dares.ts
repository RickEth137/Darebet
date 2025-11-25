import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

const MOCK_DARES = [
  {
    id: '11111111111111111111111111111111',
    onChainId: '11111111111111111111111111111111',
    title: 'EAT 10 GHOST PEPPERS IN 5 MINUTES',
    description: 'I DARE YOU TO CONSUME 10 CAROLINA REAPER GHOST PEPPERS WITHIN 5 MINUTES WITHOUT DRINKING ANYTHING. RECORD THE ENTIRE PROCESS.',
    creator: '11111111111111111111111111111111',
    logoUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq',
    bannerUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu',
    deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
    minBet: 0.05,
  },
  {
    id: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    onChainId: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    title: 'SLEEP IN A CEMETERY FOR 24 HOURS',
    description: 'SPEND AN ENTIRE NIGHT AND DAY IN A GRAVEYARD. NO LEAVING THE PREMISES. DOCUMENT WITH TIMESTAMPS EVERY 2 HOURS.',
    creator: 'TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA',
    logoUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq',
    bannerUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu',
    deadline: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
    minBet: 0.05,
  },
  {
    id: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    onChainId: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    title: 'SHAVE HEAD AND EYEBROWS COMPLETELY',
    description: 'COMPLETELY SHAVE OFF ALL HAIR INCLUDING EYEBROWS. MUST KEEP IT OFF FOR AT LEAST 30 DAYS. NO WIGS OR FAKE HAIR ALLOWED.',
    creator: 'ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL',
    logoUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq',
    bannerUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu',
    deadline: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
    minBet: 0.05,
  },
  {
    id: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
    onChainId: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
    title: 'WALK BACKWARDS FOR ENTIRE DAY',
    description: 'WALK ONLY BACKWARDS FOR 24 HOURS STRAIGHT. NO FORWARD STEPS ALLOWED. DOCUMENT THE JOURNEY WITH CONTINUOUS VIDEO.',
    creator: 'metaqbxxUerdq28cj1RbAWkYQm3ybzjb6a8bt518x1s',
    logoUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq',
    bannerUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu',
    deadline: new Date(Date.now() + 10 * 24 * 60 * 60 * 1000),
    minBet: 0.05,
  },
  {
    id: 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX',
    onChainId: 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX',
    title: 'EAT NOTHING BUT MAYO FOR 3 DAYS',
    description: 'CONSUME ONLY MAYONNAISE FOR 72 HOURS. NO OTHER FOOD OR DRINKS EXCEPT WATER. MUST BE DOCUMENTED WITH MEAL TIMESTAMPS.',
    creator: 'namesLPneVptA9Z5rqUDD9tMTWEJwofgaYwp8cawRkX',
    logoUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq',
    bannerUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu',
    deadline: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
    minBet: 0.05,
  },
  {
    id: 'So11111111111111111111111111111111111111112',
    onChainId: 'So11111111111111111111111111111111111111112',
    title: 'TALK LIKE PIRATE FOR ONE MONTH',
    description: 'SPEAK ONLY IN PIRATE LANGUAGE FOR 30 CONSECUTIVE DAYS. MUST BE MAINTAINED IN ALL CONVERSATIONS, WORK, AND PUBLIC INTERACTIONS.',
    creator: 'So11111111111111111111111111111111111111112',
    logoUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreiacb5xsbqh63jxw665fjy5kxvqrp5um6mmupmjqafnegyk3yfr2gq',
    bannerUrl: 'https://brown-traditional-sheep-998.mypinata.cloud/ipfs/bafkreie7yscceem2zpilr5rl67h755yxtcyd45gbabtk4plibp7d6j4fsu',
    deadline: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
    minBet: 0.05,
  },
];

async function main() {
  console.log('🌱 Seeding mock dares...');

  for (const dare of MOCK_DARES) {
    try {
      const result = await prisma.dare.upsert({
        where: { id: dare.id },
        update: {
          ...dare,
          updatedAt: new Date(),
        },
        create: dare,
      });
      console.log(`✅ Created/Updated dare: ${result.title}`);
    } catch (error) {
      console.error(`❌ Failed to create dare ${dare.title}:`, error);
    }
  }

  console.log('✅ Seeding complete!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
