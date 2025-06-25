import { marketAddress } from "./projectSetting";
import { NFTMarketplace } from "./../typechain-types/contracts/NFTMarketplace";
import { tokenAddress } from "./../../webapp/config";
import { BadgeToken } from "./../typechain-types/contracts/BadgeToken";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { BadgeToken, NFTMarketplace } from "../typechain";
// import { tokenAddress, marketAddress } from "./projectsetting";
// 导入文件系统模块
import * as fs from "fs";
import * as path from "path";

const _name = "BadgeToken";
const _symbol = "BADGE";

/** deploy and init */
async function main() {
  console.log("========   deploy to a **new** localhost ======");
  /* deploy the NFT contract */
  const NFT = await ethers.getContractFactory("BadgeToken");
  const nftContract: BadgeToken = await NFT.deploy(_name, _symbol);
  //   await nftContract.deployed();

  /**deploy the market contract */
  const Market = await ethers.getContractFactory("NFTMarketplace");
  const marketContract: NFTMarketplace = await Market.deploy();

  const tokenAddress = await nftContract.getAddress();
  const marketAddress = await marketContract.getAddress();

  // 定义目标文件路径
  const configPath = path.join(__dirname, "../../webapp/config.ts");

  // 准备要写入的内容
  const configContent = `export const tokenAddress = "${tokenAddress}";
export const marketAddress = "${marketAddress}";
`;

  // 将内容写入配置文件
  fs.writeFileSync(configPath, configContent);

  console.log("配置文件已更新：", configPath);

  //先搞定账户
  let owner: Signer, account1: Signer, account2: Signer;
  [owner, account1, account2] = await ethers.getSigners();
  const address0 = await owner.getAddress();
  const address1 = await account1.getAddress();
  const address2 = await account2.getAddress();

  //再通过名称和地址获取合约实例
  const nft: BadgeToken = await ethers.getContractAt(
    "BadgeToken",
    tokenAddress
  );
  const market: NFTMarketplace = await ethers.getContractAt(
    "NFTMarketplace",
    marketAddress
  );

  // 测试合约方法
  const listingFee = await market.getListingFee();
  console.log("Listing fee:", listingFee.toString());

  const auctionPrice = ethers.parseUnits("1", "ether");

  console.log("1. == mint 1-6 to account#0");
  for (let i = 1; i <= 6; i++) {
    await nft.mintTo(address0);
  }

  console.log("2. == list 1-6 to market");
  for (let i = 1; i <= 6; i++) {
    await nft.approve(marketAddress, i);
    await market.createMarketItem(tokenAddress, i, auctionPrice, {
      value: listingFee,
    });
  }

  console.log("3. == mint 7-9 to account#1");
  for (let i = 7; i <= 9; i++) {
    await nft.connect(account1).mintTo(address1);
  }

  console.log("4. == list 7-9 to market");
  for (let i = 7; i <= 9; i++) {
    await nft.connect(account1).approve(marketAddress, i);
    await market
      .connect(account1)
      .createMarketItem(tokenAddress, i, auctionPrice, { value: listingFee });
  }

  console.log("5. == account#0 buy 7 & 8");
  await market.createMarketSale(tokenAddress, 7, { value: auctionPrice });
  await market.createMarketSale(tokenAddress, 8, { value: auctionPrice });

  console.log("6. == account#1 buy 1");
  await market
    .connect(account1)
    .createMarketSale(tokenAddress, 1, { value: auctionPrice });

  console.log("7. == account#2 buy 2");
  await market
    .connect(account2)
    .createMarketSale(tokenAddress, 2, { value: auctionPrice });
  console.log("8. == account#0 delete 6");
  await market.deleteMarketItem(6);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
