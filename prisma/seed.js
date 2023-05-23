const { PrismaClient } = require('@prisma/client');
const { users, claimHistory } = require('./data.js');
const prisma = new PrismaClient();

const load = async () => {
    try {





        await prisma.nftClaimData.createMany({
            data: claimHistory,
        });

        console.log('Added HWMCClaimHistory data');
    } catch (e) {
        console.error(e);
        process.exit(1);
    } finally {
        await prisma.$disconnect();
    }
};

load();