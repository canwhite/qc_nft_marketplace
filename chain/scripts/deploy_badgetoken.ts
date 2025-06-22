import { ethers } from "hardhat";

async function main() {
  // BadgeToken constructor parameters
  const name = "BadgeToken";
  const symbol = "BADGE";

  // Get the contract factory
  const BadgeToken = await ethers.getContractFactory("BadgeToken");

  // Deploy the contract
  const token = await BadgeToken.deploy(name, symbol);

  // Wait for deployment
  console.log("BadgeToken deployed to:", token.target);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
