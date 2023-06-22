const { PrismaClient } = require('@prisma/client');
const { ethers, InfuraProvider, JsonRpcProvider, formatUnits,parseUnits } = require("ethers");
const abi = require("../../abi.json")
const hwmc_eth_abi = require("../../abi_hwmc.json")
const hwmc_matic_abi = require("../../abi_claim_matic.json")




const prisma = new PrismaClient()


const contractAddress = "0xba72b008D53D3E65f6641e1D63376Be2F9C1aD05";
const HWMCClaimcontractAddress = "0xBb51cd620a5328c8c30491686385B74a2d859f99"
const HWMCPolygonClaimcontractAddress = "0xd002f7d00124a65329Dce927ea1213C1b3E7cD8e"


const provider = new InfuraProvider("homestead","15a386a7294f4416bd5cf2294f99d71b")
const provider2 = new InfuraProvider("homestead","15a386a7294f4416bd5cf2294f99d71b")
const provider3 = new InfuraProvider("matic","15a386a7294f4416bd5cf2294f99d71b")


const myContract = new ethers.Contract(contractAddress, abi, provider);
const HWMC_ETH_Contract = new ethers.Contract(HWMCClaimcontractAddress, hwmc_eth_abi, provider2);
const HWMC_Matic_Contract = new ethers.Contract(HWMCPolygonClaimcontractAddress, hwmc_matic_abi, provider3);



//ADDRESSES TO CHECK
const addresses = ["0x4b5d0e3cf191331f2901651105474cae5c2965c9"]



//DAATABASE Functions
async function getDbData(_dropId) {
    try {
         const allUsers = await prisma.nftClaimData.findMany({
      where: { airdropId: _dropId },
    })
    return allUsers;
    } catch (error) {
        console.log(error)
    }
   
}



//Web3 Functions
async function getHoldingNfts(ethAddress){
    const allNFTs = bigIntArrToIntArr(await myContract.walletOfOwner(ethAddress));
    console.log(allNFTs.length)
    return allNFTs
}

async function batchCheckClaimStatusEth(nftIds, dropId) {

    try {
      const promises = [];
    for (let i = 0; i < nftIds.length; i++) {
      const promise = HWMC_ETH_Contract.isClaimed(nftIds[i], dropId);
      promises.push(promise);
    }
  
    const results = await Promise.all(promises);
    
  
    const claimedNFTs = [];
  
    for (let i = 0; i < results.length; i++) {
      if (!results[i]) {
        claimedNFTs.push(nftIds[i]);
      }
      
    }
  
    return claimedNFTs;   
    } catch (error) {
       console.log("Batch Check: ",error) 
    }
      
   
}

async function getRewardDetails(_dropId){
  try {
    const Rewards = await HWMC_Matic_Contract.Rewards(_dropId);
    return Rewards
  } catch (error) {
    return null
  }
    
}

function getCommonValues(array1, array2) {
    return array1.filter(val => array2.includes(val));
  }
function getValidNftIds(nftIds, objArray,_dropId) {
    let validIds = [];
    for (let i = 0; i < nftIds.length; i++) {
      let found = false;
      for (let j = 0; j < objArray.length; j++) {
        if (nftIds[i] == objArray[j].NFTid && objArray[j].airdropId == _dropId) {

          found = true;
        /*   if (objArray[j].isClaimed != true && objArray[j].claimReqStatus != 'pending' || objArray[j].claimReqStatus != 'success') {
            validIds.push(nftIds[i]);
          } */
          break;
        }
      }
      if (!found) {
        validIds.push(nftIds[i]);
      }
    }
    return validIds;
  }

const getClaimed = async (_dropId , _holdingNFTs)=>{

    let unclaimedNfts
      
    if(_dropId<=3){
        unclaimedNfts =  await batchCheckClaimStatusEth(_holdingNFTs,_dropId)     
    }
    else{

        let dbData

        try {
            dbData = await getDbData(_dropId);
          } catch (error) {
            console.log("Database Fetch Error", error)
          }
      
          unclaimedNfts = getValidNftIds(_holdingNFTs,dbData,_dropId)//Check if NFT id is claimed in the Databaset
    }

    
    
    const rewardDetails = await getRewardDetails(_dropId) 
  
    return {
        usdc: Number(formatUnits(String(rewardDetails[1]),6)) * unclaimedNfts.length,
        wbtc: Number(formatUnits(String(rewardDetails[3]),8)) * unclaimedNfts.length
    }
}



/* const getSingleUserRewards = async ()=>{

    const holdingNFTs = await getHoldingNfts("0xF2A3f10ea6B015171C751caE46C6bF291D3fd28C")

    let totalRewards ={
        usdc:0,
        wbtc:0
    }

    for(let i=2;i<=3;i++){

    
        setTimeout(async ()=>{
            const reward =  await getClaimed(i,holdingNFTs)
            totalRewards.usdc += reward.usdc
            totalRewards.wbtc += reward.wbtc
     
        },6000)
    }
        
    return totalRewards
    

} */

const getSingleUserRewards = async (_ethAddress) => {
    return new Promise(async (resolve) => {
      const holdingNFTs = await getHoldingNfts(_ethAddress);
  
      let totalRewards = {
        usdc: 0,
        wbtc: 0,
        ownedNfts: holdingNFTs.length,
        address:_ethAddress
      };
      let monthRewards = []
  
      const promises = [];
  
      for (let i = 2; i <= 6; i++) {
        console.log("arra",i)
        promises.push(
          new Promise(async (innerResolve) => {
            const reward = await getClaimed(i, holdingNFTs);
            totalRewards.usdc += reward.usdc;
            totalRewards.wbtc += reward.wbtc;
            monthRewards.push({
              usdc: reward.usdc,
              wbtc:reward.wbtc,
              month: i
            })
            console.log(monthRewards)
            innerResolve();
          })
        );
      }
  
      await Promise.all(promises);
      resolve(totalRewards);
  
    });
  };







//MAin Fucntionality
const getAllUsersRewards = async (_ethAddress) => {
    const delay = 30000; // 2 seconds delay
    const allHoldersData = [];
  
    for (let i = 0; i < addresses.length; i++) {
      await new Promise((resolve) => {
        setTimeout(async () => {
          const singleUser = await getSingleUserRewards(addresses[i]);
          allHoldersData.push(singleUser);
          resolve();
        }, i * delay);
      });
    }
  
    return allHoldersData;
  };

getAllUsersRewards().then((data)=>{
//console.log(data)
})
 



//UTIL functions
function bigIntArrToIntArr(bigIntArr) {
    var intArr = [];
    for (var i = 0; i < bigIntArr.length; i++) {
      intArr.push(Number(bigIntArr[i]));
    }
    return intArr;
  }


