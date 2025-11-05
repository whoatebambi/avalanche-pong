const { ethers } = require("hardhat");
const fs = require("fs");
const path = require("path");
require("dotenv").config();

async function main() {
  const signers = await ethers.getSigners();
  
  if (signers.length === 0) {
    throw new Error("No deployer account found. Make sure PRIVATE_KEY is set in your .env file.");
  }

  const deployer = signers[0];
  console.log("Deploying contracts with the account:", deployer.address);
  console.log("Account balance:", (await ethers.provider.getBalance(deployer.address)).toString());

  const GameScore = await ethers.getContractFactory("GameScore");
  const gameScore = await GameScore.deploy();

  await gameScore.waitForDeployment();

  const contractAddress = await gameScore.getAddress();
  console.log("GameScore deployed to:", contractAddress);

  // Save contract address to file
  const contractData = {
    address: contractAddress,
    network: "fuji",
    deployer: deployer.address,
    timestamp: new Date().toISOString(),
  };

  const contractPath = path.join(__dirname, "..", "contract-address.json");
  fs.writeFileSync(contractPath, JSON.stringify(contractData, null, 2));

  console.log("\nContract address saved to:", contractPath);
  console.log("\n✅ Contract deployed successfully!");
  console.log("\nView your contract on Avalanche Explorer:");
  console.log(`https://explorer.avax-test.network/address/${contractAddress}`);
  console.log("\nTo verify the contract manually:");
  console.log("1. Visit the contract address above");
  console.log("2. Click 'Verify & Publish' tab");
  console.log("3. Follow the verification instructions");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

