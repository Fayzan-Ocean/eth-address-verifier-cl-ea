const express = require("express");
const bodyParser = require("body-parser");
const { Requester, Validator } = require("@chainlink/external-adapter");
const { ethers, InfuraProvider, JsonRpcProvider, formatUnits } = require("ethers");
const abi = require("./abi.json")
const hwmc_eth_abi = require("./abi_hwmc.json")
const { PrismaClient } = require('@prisma/client');
const e = require("express");
const { v4: uuidv4 } = require('uuid');



const app = express();
const prisma = new PrismaClient()
const port = process.env.EA_PORT || 8080;
const contractAddress = "0xba72b008D53D3E65f6641e1D63376Be2F9C1aD05";
const HWMCClaimcontractAddress = "0xBb51cd620a5328c8c30491686385B74a2d859f99"
const provider = new InfuraProvider("homestead",process.env.INFURA_API_KEY)
const provider2 = new InfuraProvider("homestead",process.env.INFURA_API_KEY)

const myContract = new ethers.Contract(contractAddress, abi, provider);
const HWMC_ETH_Contract = new ethers.Contract(HWMCClaimcontractAddress, hwmc_eth_abi, provider2);

app.use(bodyParser.json());
// Enable CORS middleware
app.use(function(req, res, next) {
  res.setHeader('Access-Control-Allow-Origin', '*'); // Replace '*' with the specific origin you want to allow
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

const customParams = {
  nftIds: true,
  dropId:true,
  ethAddress: true,
  rewardDetails:true,
  endpoint: false,
};

const createRequest = async (input, callback) => {
  // Instanciate with desired auth type (here's Bearer v2 auth)
  
  // The Validator helps you validate the Chainlink request data
  const validator = new Validator(callback, input, customParams);
  const jobRunID = validator.validated.id;
  const nftIds = validator.validated.data.nftIds;
  const dropId = validator.validated.data.dropId;
  const ethAddress = validator.validated.data.ethAddress;
  const rewardDetails = validator.validated.data.rewardDetails;

const claimRequestId = uuidv4();



  let response = { data:{}}
  let nftIdsUnclaimed = [];
  let nftIdsToReward = []




  

  function bigIntArrToIntArr(bigIntArr) {
    var intArr = [];
    for (var i = 0; i < bigIntArr.length; i++) {
      intArr.push(Number(bigIntArr[i]));
    }
    return intArr;
  }
  function strArrToIntArr(strArr) {
    var intArr = [];
    for (var i = 0; i < strArr.length; i++) {
      intArr.push(parseInt(strArr[i]));
    }
    return intArr;
  }
  function getCommonValues(array1, array2) {
    return array1.filter(val => array2.includes(val));
  }
  function removeDuplicates(arr) {
    return arr.filter((value, index) => arr.indexOf(value) === index);
  }
  function getValidNftIds(nftIds, objArray) {
    let validIds = [];
    for (let i = 0; i < nftIds.length; i++) {
      let found = false;
      for (let j = 0; j < objArray.length; j++) {
        if (nftIds[i] == objArray[j].NFTid && objArray[j].airdropId == dropId) {

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
  async function getDbData(_dropId) {
    try {
       const allUsers = await prisma.nftClaimData.findMany({
          where: { airdropId: _dropId },
        })
        return allUsers;
    } catch (error) {
      console.log("Database Fetch Error", error)
      return null
    }
       
      }
  async function filterClaimedNFTsFromEthContract(nftIds) {
        const claimedNFTs = [];
      
        for (let i = 0; i < nftIds.length; i++) {
          const isClaimed = await HWMC_ETH_Contract.isClaimed(nftIds[i], dropId);
          console.log("isClaimed: ",nftIds[i], isClaimed)
      
          if (!isClaimed) {
            claimedNFTs.push(nftIds[i]);
          }
        }
      
        return claimedNFTs;
      }
  async function batchCheckClaimStatus(nftIds, dropId) {
      
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
          else console.log("CLAIMED")
        }
      
        return claimedNFTs;
      }
    

  async function postDbData(_nftIds){
      

      let claimNFTdata = [];

      _nftIds.forEach( (i) => {
        claimNFTdata.push({
          isClaimed: true,
          isBlacklisted: null,
          NFTid: Number(i),
          airdropId: parseInt(dropId),
          claimReqId: claimRequestId,
          claimReqStatus: "pending"
        });
      });
     

     const claimRequestData = {

      address:ethAddress,
      amountUSDT:(formatUnits(BigInt(rewardDetails[1].hex) || 0,6) * nftIds.length),
      amountwBTC:(formatUnits(BigInt(rewardDetails[3].hex) || 0,8) * nftIds.length),
      claimedAt: new Date(),
      claimReqId: claimRequestId,
      claimReqStatus: "pending",
      airdropId:parseInt(dropId),
      nftIds: String(_nftIds.join(','))
     }

     try {
      const ress = await prisma.HWMCClaimRequest.create({
        data: claimRequestData
    })
    console.log(ress);
     } catch (error) {
      console.log(error)
     }



      try {
        const ress = await prisma.nftClaimData.createMany({
        data: claimNFTdata
    });


      console.log(ress);
      } catch (error) {
        console.log(error)
      }
    

      }



  async function checkData() {


    let nftIdsArray = nftIds;
    let allGood=0;



    try {

      console.log("Step 1")


      const allNFTs = bigIntArrToIntArr(await myContract.walletOfOwner(ethAddress));//Get NFT Ids of the wallet address from HWMC
      const nftIdsList = removeDuplicates(nftIdsArray);//Remove Dublicate NFT ids from user input array
      const holdingNfts = getCommonValues(nftIdsList,allNFTs)//Filter Out the NFT ids that are in holder's wallet

      const dbData = await getDbData(dropId); //Get Data from DB
      nftIdsUnclaimed = getValidNftIds(holdingNfts,dbData)//Check if NFT id is claimed in the Database

      
      //If Claim is for Previous Rewards i.e 2 & 3 
      if(dropId<=3){

        //nftIdsToReward = await filterClaimedNFTsFromEthContract(nftIdsUnclaimed)

        nftIdsToReward = await batchCheckClaimStatus(nftIdsUnclaimed,dropId)


        console.log("Holding NFTs: ",holdingNfts)

        console.log("Unclaimed NFTs",nftIdsToReward)
      
      }
      //If Claim is for New Rewards > 3
      else{
      nftIdsToReward=nftIdsUnclaimed
      console.log("Holding NFTs: ",holdingNfts)
      console.log("Unclaimed NFTs",nftIdsToReward)
        }

      nftIdsToReward.length >= 1 ? allGood=1 : allGood=0

    } catch (error) {
      console.log(error)
    } 

    if(allGood==0){
      response.data = {
        allGood: allGood,
        result: false,
      };
      response.status = 200
      return callback(200, Requester.success(jobRunID,response));
    }

  console.log(nftIdsToReward)
    try {
      console.log("POSTED")

    
      await postDbData(nftIdsToReward)
    } catch (error) {
      console.log(error)
      return callback(500, Requester.errored(jobRunID,response));
    }

    
   
  

      response.data = {
        allGood: allGood,
        nftIds: nftIdsToReward,
        reqId:claimRequestId,
        data:[allGood,nftIdsToReward.length],
        result: true,
      };
      response.status = 200
      return callback(200, Requester.success(jobRunID,response));



  }

  await checkData();

 


 

};

// This is a wrapper to allow the function to work with
// GCP Functions
exports.gcpservice = async (req, res) => {
  await createRequest(req.body, (statusCode, data) => {
    res.status(statusCode).send(data);
  });
};

// This is a wrapper to allow the function to work with
// AWS Lambda
// exports.handler = async (event, context, callback) => {
//   await createRequest(event, (statusCode, data) => {
//     callback(null, data);
//   });
// };

exports.handler = async (req, res) => {
  const lrsp = await createRequest(req, (status, data) => {
    const response = {
      statusCode: status,
      body: JSON.stringify(data),
    };
    console.log(
      "LAMBDARESULT",
      "status:",
      status,
      "data:",
      data,
      "resp:",
      response,
    );
    return response;
    // callback(null, data);
    // res.status(status).json(result);
  });
  console.log("ALMOSTFINAL", lrsp);
  return lrsp;
};

// This is a wrapper to allow the function to work with
// newer AWS Lambda implementations
exports.handlerv2 = async (event, context, callback) => {
  await createRequest(JSON.parse(event.body), (status, data) => {
    callback(null, {
      statusCode: status,
      body: JSON.stringify(data),
      isBase64Encoded: false,
    });
  });
};

app.get("/", async (req, res) => {
  console.log("POST Data: ", req.body);
  const resp = await createRequest(req.body, (status, result) => {
    console.log("Result: ", result);
    // return result;
    res.status(status).json(result);
  });
  console.log("resp", resp);
  return resp;
});


app.post("/", async (req, res) => {
  console.log("POST Data: ", req.body);
  const resp = await createRequest(req.body, (status, result) => {
    console.log("Result: ", result);
    // return result;
    res.status(status).json(result);
  });
  console.log("resp", resp);
  return resp;
});

app.listen(port, () => console.log(`Listening on port ${port}!`));
