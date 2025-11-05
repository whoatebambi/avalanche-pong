import { ethers } from "hardhat";
import fs from "fs";
import path from "path";

async function main() {
  const [deployer] = await ethers.getSigners();

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
  console.log("\nTo verify on Snowtrace, run:");
  console.log(`npx hardhat verify --network fuji ${contractAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
