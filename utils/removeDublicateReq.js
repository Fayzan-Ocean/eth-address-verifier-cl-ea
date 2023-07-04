const { PrismaClient } = require('@prisma/client');
const csv=require('csvtojson')
const fs = require("fs");
const csvV = require('fast-csv');


const prisma = new PrismaClient()
const csvFilePath='./utils/reqs.csv'

const readStream=fs.createReadStream(csvFilePath);

const blWallets = ["0x94dB1FE366d59624be05eF8d8D692FEc10831f5D","0x70147829cf79978BBb3Ed44F6141c1A520e14f7C","0x6Fd01E41EC0EB002fDA76E01ce4220F509166826"]

const readExcelDataAndSetSuccess = async () => {
    const jsonObj = await readStream.pipe(csv());
   
     console.log(jsonObj.length);
  /*   const dividedArray = divideArrayIntoParts(jsonObj, 5);
    
    iterateDividedArrayWithTimeout(dividedArray, 3); */

    const updatedData = removeDuplicates(jsonObj,'Address','USDT Amount',"wBTC Amount" );
    console.log(updatedData.uniqueRecords.length)
    console.log(updatedData.duplicates.length)

    const finalData = removeRecordsByField(updatedData.uniqueRecords,'Address',blWallets)
    console.log(finalData.length)

   
   // const deleted =   await removeDuplicatesFromDb(updatedData.duplicates);

    //console.log(deleted)
 
    //removeDuplicatesFromDb()

    exportToCsv(finalData)


  };


  function exportToCsv(obj){
    const csvStream = csvV.format({ headers: true });

    const writableStream = fs.createWriteStream("./utils/updated.csv");
    csvStream.pipe(writableStream);
  
    obj.forEach((item) => {
      csvStream.write(item);
    });
  
    csvStream.end();
  
    console.log('CSV file exported successfully.');

  }

 /*  function removeDuplicates(array, property1, property2, property3) {
    const uniqueRecords = array.reduce((accumulator, current) => {
      const isDuplicate = accumulator.some((item) =>
        item[property1] === current[property1] &&
        parseFloat(item[property2]) === parseFloat(current[property2]) &&
        parseFloat(item[property3]) === parseFloat(current[property3])
        
      );

      
  
      if (!isDuplicate) {
        accumulator.push(current);
      }
  
      return accumulator;
    }, []);
  
    return uniqueRecords;
  } */
  
  function removeDuplicates(array, property1, property2, property3) {
    const uniqueRecords = [];
    const duplicates = [];
  
    array.forEach((current) => {
      const isDuplicate = uniqueRecords.some((item) =>
        item[property1] === current[property1] &&
        parseFloat(item[property2]) === parseFloat(current[property2]) &&
        parseFloat(item[property3]) === parseFloat(current[property3]) &&
       ( (item['airdropId'] !== null && item['airdropId'] === current['airdropId']) ||
        (item['airdropId'] !== 'null' && item['airdropId'] === current['airdropId']))
      );
  
      if (isDuplicate) {
        duplicates.push(current);
      } else {
        uniqueRecords.push(current);
      }
    });
  
    return {
      uniqueRecords,
      duplicates
    };
  }

  const removeDuplicatesFromDb = async (claims) =>{
   

    try {
      const updatedRows = await prisma.hWMCClaimRequest.deleteMany({
        where: {
          claimReqId:{
            in: claims.claimReqId,
          },
          // Specify the conditions to select the rows you want to update
          // For example, to update rows where the "status" is "pending"
          //OR: claims.map((claim) => ({ claimReqId: claim.claimReqId })),
          claimReqStatus: 'pending'
        }
      });

      console.log(updatedRows)
      return updatedRows
  

    } catch (error) {
      console.error('Error updating rows:', error);
    } finally {
      await prisma.$disconnect();
    }
  


  }

  function removeRecordsByField(arr, fieldName, values) {
    return arr.filter((obj) => !values.includes(obj[fieldName]));
  }




async function main() {
    try {
     // await prisma.$connect(); // Establish Prisma DB connection



    await readExcelDataAndSetSuccess()

    } catch (error) {
      console.error('Error:', error);
    } finally {
      //await prisma.$disconnect(); // Release Prisma DB connection
    }
  }
  
  main();




//updateClaimReqStatus("2499d370-d9f1-4725-b607-876babd181aa")

// Requiring the module


  
