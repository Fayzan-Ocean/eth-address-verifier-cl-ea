const { ethers, InfuraProvider, JsonRpcProvider, formatUnits,parseUnits } = require("ethers");
const abi = require("../../abi.json")



const contractAddress = "0xDe20F7d79de049341610780758c65fFDc178C309";


const provider = new InfuraProvider("homestead",process.env.INFURA_API_KEY)


const myContract = new ethers.Contract(contractAddress, abi, provider);


