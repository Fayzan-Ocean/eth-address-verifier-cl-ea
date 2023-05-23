const { Prisma } = require('@prisma/client');

const users = [
    {
        address: '0x01eee98ac7e5ce9a33f86d4ea9c3f49d82e856a1',

    },
    {
        address: '0x59a699932194aa0e9ef300e74a4fdd52fbfcdd77',

    },
    {
        address: '0x664250876c9d9acC92AF91427cC0114a9a22B067',

    },
];

const claimHistory = [
    {
        isClaimed: false,
        isBlacklisted: false,
        NFTid: 13,
        airdropId: 1,
    },
    {
        isClaimed: false,
        isBlacklisted: false,
        NFTid: 14,
        airdropId: 1,
    },

];

module.exports = {
    users,
    claimHistory,
};