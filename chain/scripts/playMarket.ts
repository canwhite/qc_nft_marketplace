import { BadgeToken } from "./../typechain-types/contracts/BadgeToken";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { BadgeToken, NFTMarketplace } from "../typechain";
import * as base64 from "base-64";

const _name = "BadgeToken";
const _symbol = "BADGE";

async function main() {
  let account0: Signer, account1: Signer;
  [account0, account1] = await ethers.getSigners();
  const address0 = await account0.getAddress();
  const address1 = await account1.getAddress();
  //deploy the market contract

  const Market = await ethers.getContractFactory("NFTMarketplace");
  const market: NFTMarketplace = await Market.deploy();
  //   await market.deployed();
  const marketAddress = await market.getAddress();

  //deploy the nft contract
  const NFT = await ethers.getContractFactory("BadgeToken");
  const nft: BadgeToken = await NFT.deploy(_name, _symbol);
  const tokenAddress = await nft.getAddress();

  console.log("marketAddress", marketAddress);
  console.log("nftContractAddress", tokenAddress);

  //create three tokens
  await nft.mintTo(address0); //'1'
  await nft.mintTo(address0); //'2'
  await nft.mintTo(address0); //'3'

  const listingFee = await market.getListingFee();
  const auctionPrice = ethers.parseUnits("1", "ether");
  await nft.approve(marketAddress, 1);
  await nft.approve(marketAddress, 2);
  await nft.approve(marketAddress, 3);
  console.log("Approve marketAddress", marketAddress);

  /* put both tokens for sale */
  await market.createMarketItem(tokenAddress, 1, auctionPrice, {
    value: listingFee,
  });
  await market.createMarketItem(tokenAddress, 2, auctionPrice, {
    value: listingFee,
  });
  await market.createMarketItem(tokenAddress, 3, auctionPrice, {
    value: listingFee,
  });

  // test transfer ，nft2先转过去
  await nft.transferFrom(address0, address1, 2);

  // nft1再买过来
  /* execute sale of token to another user */
  // 这里的1指的是NFT的tokenId，即第一个被铸造的NFT
  // 在之前的代码中，我们通过nft.mintTo(address0)创建了三个NFT，它们的tokenId分别是1、2、3
  // 现在我们要让account1用户购买tokenId为1的NFT
  await market
    .connect(account1)
    .createMarketSale(tokenAddress, 1, { value: auctionPrice });

  /* query for and return the unsold items
  1，2都倒腾出去了，就剩下3了
  */
  console.log("==after purchase & Transfer==");
  let items = await market.fetchActiveItems();
  let printitems;
  printitems = await parseItems(items, nft);
  printitems.map((item) => {
    printHelper(item, true, false); //id & name: 3 Badge #3
  });

  console.log("==after delete==");
  await market.deleteMarketItem(3);
  items = await market.fetchActiveItems();
  printitems = await parseItems(items, nft);
  printitems.map((item) => {
    printHelper(item, true, false);
  });

  // 解释为什么 myCreatedItems 返回的是这两个 NFT：
  // 1. tokenId 为 1 的 NFT 最初由 account0 创建并上架，后来被 account1 购买
  // 2. tokenId 为 2 的 NFT 由 account0 创建并上架，然后通过 transferFrom 转移给了 account1
  // 虽然这两个 NFT 的所有权已经转移，但它们最初都是由 account0 创建的
  // 因此，在查询 account0 创建的物品时，会返回这两个 NFT 的记录
  // 即使它们已经被转移或出售，创建记录仍然保留
  console.log("==my list items==");
  items = await market.fetchMyCreatedItems();
  printitems = await parseItems(items, nft);
  printitems.map((item) => {
    printHelper(item, true, false);
  });
  // id & name: 1 Badge #1
  // id & name: 2 Badge #2

  console.log("");
  console.log("==address1 purchased item (only one, tokenId =1)==");
  items = await market.connect(account1).fetchMyPurchasedItems();
  printitems = await parseItems(items, nft);
  printitems.map((item) => {
    printHelper(item, true, true);
  });
}

//所谓的parse就是解构，deconstruction
function parseItems(items: any, nft: BadgeToken) {
  let parsed = Promise.all(
    items.map(async (item: any) => {
      const tokenUri = await nft.tokenURI(item.tokenId);
      return {
        price: item.price.toString(),
        tokenId: item.tokenId.toString(),
        seller: item.seller,
        buyer: item.buyer,
        tokenUri,
      };
    })
  );
  return parsed;
}

function printHelper(item: any, flagUri = false, flagSVG = false) {
  if (flagUri) {
    const { name, description, svg } = parseNFT(item);
    console.log("id & name:", item.tokenId, name);
    if (flagSVG) console.log(svg);
  } else {
    console.log("id       :", item.tokenId);
  }
}
function parseNFT(item: any) {
  // 从第29个字符开始截取是因为tokenURI返回的字符串格式为：
  // "data:application/json;base64,<base64编码的JSON数据>"
  // 前29个字符是固定的前缀，表示后面的数据是base64编码的JSON数据
  // 我们需要去掉这个前缀，只获取base64编码的实际数据部分
  // 类似地，itemInfo.image.slice(26)用于去除SVG图像数据前的"data:image/svg+xml;base64,"前缀
  // 这样我们就可以直接获取到base64编码的SVG图像数据
  const data = base64.decode(item.tokenUri.slice(29));
  const itemInfo = JSON.parse(data);
  // 从第26个字符开始截取是因为itemInfo.image返回的字符串格式为：
  // "data:image/svg+xml;base64,<base64编码的SVG数据>"
  // 前26个字符是固定的前缀，表示后面的数据是base64编码的SVG图像数据
  // 我们需要去掉这个前缀，只获取base64编码的实际SVG数据部分
  // 这样我们就可以直接解码并显示SVG图像
  const svg = base64.decode(itemInfo.image.slice(26));
  return { name: itemInfo.name, description: itemInfo.description, svg: svg };
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
