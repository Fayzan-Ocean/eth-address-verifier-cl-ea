const { PrismaClient } = require('@prisma/client');
const csv=require('csvtojson')
const fs = require("fs");


const prisma = new PrismaClient()
const csvFilePath='./utils/updated.csv'

const readStream=fs.createReadStream(csvFilePath);

const updateClaimReqStatus = async ( claimReqId)=>{

    try {
        const updatedRows = await prisma.hWMCClaimRequest.updateMany({
          where: {
            // Specify the conditions to select the rows you want to update
            // For example, to update rows where the "status" is "pending"
            claimReqId: claimReqId,
            claimReqStatus: 'pending'
          },
          data: {
            // Specify the fields and their updated values
            // For example, to set the "status" to "completed"
            claimReqStatus: 'success',
          },
        });
    
  
      } catch (error) {
        console.error('Error updating rows:', error);
      } finally {
        await prisma.$disconnect();
      }
    

}

const readExcelDataAndSetSuccess = async () => {
    const jsonObj = await readStream.pipe(csv());
    console.log(jsonObj.length);
    
    const dividedArray = divideArrayIntoParts(jsonObj, 10);
    
    console.log(dividedArray[1].length);

    iterateDividedArrayWithTimeout(dividedArray, 0);


  };


const divideArrayIntoParts = (array, numberOfParts) => {
    const chunkSize = Math.ceil(array.length / numberOfParts);
    const dividedArray = [];
  
    for (let i = 0; i < array.length; i += chunkSize) {
      const chunk = array.slice(i, i + chunkSize);
      dividedArray.push(chunk);
    }
  
    return dividedArray;
  };

const iterateDividedArrayWithTimeout = (dividedArray, index) => {
    if (index >= dividedArray.length) {
      // Base case: Reached the end of the divided array
      return;
    }
  
    const currentPart = dividedArray[index];
    // Perform your desired operation on the current part of the array
    console.log('Processing part', index + 1, );

    currentPart.forEach(async (req, index) => {

        setTimeout(async () => {
          await updateClaimReqStatus(req.claimReqId);
          
        },  6000); // Delay each iteration by (index + 1) * 6000 milliseconds
      });
  
    setTimeout(() => {
      iterateDividedArrayWithTimeout(dividedArray, index + 1); // Recursively call the function for the next part
    }, 10000); // 10 seconds timeout
  };
  


async function main() {
    try {
      await prisma.$connect(); // Establish Prisma DB connection

    


    await readExcelDataAndSetSuccess()

    } catch (error) {
      console.error('Error:', error);
    } finally {
      await prisma.$disconnect(); // Release Prisma DB connection
    }
  }
  
  main();




//updateClaimReqStatus("2499d370-d9f1-4725-b607-876babd181aa")

// Requiring the module


  
