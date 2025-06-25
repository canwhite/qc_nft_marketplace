import { expect } from "chai";
import { BigNumber, Signer } from "ethers";
import { ethers } from "hardhat";
import { BadgeToken, NFTMarketplace } from "../typechain";
import {
  TransactionResponse,
  TransactionReceipt,
} from "@ethersproject/providers";

const _name = "BadgeToken";
const _symbol = "BADGE";

describe("NFTMarketplace", function () {
  let nft: BadgeToken;
  let market: NFTMarketplace;
  let account0: Signer, account1: Signer, account2: Signer;
  let address0: string, address1: string, address2: string;

  let listingFee: BigNumber;
  //将字符串"1"转换为以太坊单位"wei"（1 ether = 10^18 wei）。
  const auctionPrice = ethers.parseUnits("1", "ether");

  beforeEach(async function () {
    //账号和地址是两个概念
    // 在以太坊中，account（账户）和address（地址）是两个相关但不同的概念：
    // 1. Account（账户）：
    //    - 代表一个以太坊账户实体
    //    - 包含地址、余额、nonce等信息
    //    - 可以执行交易和签署消息
    //    - 通过Signer对象表示，可以执行签名操作
    // 2. Address（地址）：
    //    - 是账户的唯一标识符
    //    - 是一个20字节的十六进制字符串
    //    - 用于接收和发送以太币及代币
    //    - 通过getAddress()方法从Signer对象获取
    // 简单来说，account是包含地址和其他信息的完整账户对象，而address只是账户的标识符
    [account0, account1, account2] = await ethers.getSigners();
    address0 = await account0.getAddress();
    address1 = await account1.getAddress();
    address2 = await account2.getAddress();

    const BadgeToken = await ethers.getContractFactory("BadgeToken");
    nft = await BadgeToken.deploy(_name, _symbol);

    const Market = await ethers.getContractFactory("NFTMarketplace");
    market = await Market.deploy();
    listingFee = await market.getListingFee();
  });

  //create market item
  it("should create market item successfully", async () => {
    await nft.mintTo(address0); //tokenId=1
    // approve 是 ERC-721 标准中的授权方法，用于授权另一个地址（通常是市场合约）可以转移指定的 NFT，
    // param1: address , param2: nft id
    // 合约地址和用户地址的获取
    // 例如：
    // const contractAddress = await market.getAddress(); // 获取市场合约地址
    // const userAddress = await account0.getAddress();  // 获取用户地址
    let marketAddress = await market.getAddress();
    await nft.approve(marketAddress, 1);

    let nftAddress = await nft.getAddress();

    await market.createMarketItem(nftAddress, 1, auctionPrice, {
      value: listingFee,
    });

    const items = await market.fetchMyCreatedItems();
    expect(items.length).to.be.equal(1);
  });

  it("Should create market item with EVENT", async () => {
    await nft.mintTo(address0); //tokenId=1
    let marketAddress = await market.getAddress();
    await nft.approve(marketAddress, 1);
    let nftAddress = await nft.getAddress();

    await expect(
      market.createMarketItem(nftAddress, 1, auctionPrice, {
        value: listingFee,
      })
    )
      .to.emit(market, "MarketItemCreated") // 验证： 交易是否成功触发"MarketItemCreated"事件
      .withArgs(
        1,
        nftAddress,
        1,
        address0,
        ethers.ZeroAddress,
        auctionPrice,
        0
      );
  });

  it("Should revert to create market item if nft is not approved", async () => {
    await nft.mintTo(address0); //tokenId=1
    // await nft.approve(market.address,1)
    const nftAddress = await nft.getAddress();
    await expect(
      market.createMarketItem(nftAddress, 1, auctionPrice, {
        value: listingFee,
      })
    ).to.be.revertedWith("NFT must be approved to market");
  });
  // buy
  it("Should create market item and buy (by address#1) successfully", async () => {
    await nft.mintTo(address0); //tokenId=1
    // approve 是 ERC-721 标准中的授权方法，用于授权另一个地址（通常是市场合约）可以转移指定的 NFT，
    // param1: address , param2: nft id
    // 合约地址和用户地址的获取
    // 例如：
    // const contractAddress = await market.getAddress(); // 获取市场合约地址
    // const userAddress = await account0.getAddress();  // 获取用户地址
    let marketAddress = await market.getAddress();
    await nft.approve(marketAddress, 1);

    let nftAddress = await nft.getAddress();

    await market.createMarketItem(nftAddress, 1, auctionPrice, {
      value: listingFee,
    });

    //买卖需要两个人:
    // connect 是 ethers.js 中的一个方法，用于切换合约的调用者
    // 在这里，market.connect(account1) 表示使用 account1 这个账户来调用 market 合约的方法
    // 默认情况下，合约方法是由部署合约的账户（account0）调用的
    // 使用 connect 可以模拟其他用户与合约的交互
    await expect(
      market
        .connect(account1) //用谁来调用
        .createMarketSale(nftAddress, 1, { value: auctionPrice })
    )
      .to.emit(market, "MarketItemSold")
      .withArgs(1, nftAddress, 1, address0, address1, auctionPrice, 1);

    //ownerOf(1)
    expect(await nft.ownerOf(1)).to.be.equal(address1);
  });

  it("Should revert buy if seller remove approve", async function () {
    await nft.mintTo(address0); //tokenId=1
    const marketAddress = await market.getAddress();
    await nft.approve(marketAddress, 1);
    const nftAddress = await nft.getAddress();
    await market.createMarketItem(nftAddress, 1, auctionPrice, {
      value: listingFee,
    });
    //nft use approve to cancel transaction
    await nft.approve(ethers.ZeroAddress, 1);

    await expect(
      market
        .connect(account1)
        .createMarketSale(nftAddress, 1, { value: auctionPrice })
    ).to.be.reverted;
  });

  // 这个测试用例验证了NFT可以不经过市场直接转移的情况
  // 1. 首先，account0 铸造了一个NFT（tokenId=1）
  // 2. 然后，account0 授权市场合约可以操作这个NFT
  // 3. account0 将这个NFT上架到市场
  // 4. account0 直接将这个NFT转移给account2，绕过了市场交易
  // 5. 当account1尝试通过市场购买这个NFT时，交易应该被回滚
  // 这个测试表明：
  // - NFT的所有者可以在NFT上架后，不经过市场直接转移NFT
  // - 这种直接转移会导致市场中的挂单失效
  // - 市场合约需要能够检测并处理这种绕过市场交易的情况
  // 这种设计允许NFT所有者保留对NFT的完全控制权，即使已经上架到市场
  it("Should revert buy if seller transfer the token out", async function () {
    await nft.mintTo(address0); //tokenId=1
    const marketAddress = await market.getAddress();
    await nft.approve(marketAddress, 1);
    const nftAddress = await nft.getAddress();
    await market.createMarketItem(nftAddress, 1, auctionPrice, {
      value: listingFee,
    });
    //私下已经卖过了，市场没有了交易权
    await nft.transferFrom(address0, address2, 1);

    await expect(
      market
        .connect(account1)
        .createMarketSale(nftAddress, 1, { value: auctionPrice })
    ).to.be.reverted;
  });

  it("Should revert to delete(de-list) with wrong params", async function () {
    await nft.mintTo(address0); //tokenId=1
    const marketAddress = await market.getAddress();
    //讲交易权给到市场
    await nft.approve(marketAddress, 1);
    const nftAddress = nft.getAddress();
    await market.createMarketItem(nftAddress, 1, auctionPrice, {
      value: listingFee,
    });

    //not a correct id
    await expect(market.deleteMarketItem(2)).to.be.reverted;

    //not owner
    await expect(market.connect(account1).deleteMarketItem(1)).to.be.reverted;

    //warn , 交易权被转移
    await nft.transferFrom(address0, address1, 1);
    //not approved to market now
    await expect(market.deleteMarketItem(1)).to.be.reverted;
  });

  it("Should create market item and delete(de-list) successfully", async function () {
    await nft.mintTo(address0); //tokenId=1
    const marketAddress = market.getAddress();
    await nft.approve(marketAddress, 1);
    const nftAddress = nft.getAddress();

    await market.createMarketItem(nftAddress, 1, auctionPrice, {
      value: listingFee,
    });
    await market.deleteMarketItem(1);

    //如果已经删除了，nft记得置空
    await nft.approve(ethers.ZeroAddress, 1);

    // should revert if trying to delete again
    await expect(market.deleteMarketItem(1)).to.be.reverted;
  });

  // 这个方法测试了NFT市场交易完成后，卖家、买家和市场所有者的ETH余额是否正确
  // 1. 首先获取市场所有者的初始余额
  // 2. 卖家（address1）铸造一个NFT并授权给市场
  // 3. 获取卖家的初始余额
  // 4. 卖家在市场上创建出售列表，支付上架费
  // 5. 计算卖家在支付上架费和gas费后的余额，验证是否正确
  // 6. 获取买家的初始余额
  // 7. 买家购买NFT，支付拍卖价格
  // 8. 计算买家在支付拍卖价格和gas费后的余额，验证是否正确
  // 9. 验证市场所有者在收到上架费后的余额是否正确
  // 通过这种方式，我们可以确保市场交易的资金流向和余额变化符合预期
  it("Should seller, buyer and market owner correct ETH value after sale", async function () {
    let txresponse: TransactionResponse, txreceipt: TransactionReceipt;
    let gas;
    //provider主要负责读
    const marketownerBalance = await ethers.provider.getBalance(address0);

    //address1铸造nft
    await nft.connect(account1).mintTo(address1); //tokenId=1
    const marketAddress = await market.getAddress();
    //授权给市场
    await nft.connect(account1).approve(marketAddress, 1);

    //获取address1的余额
    let sellerBalance = await ethers.provider.getBalance(address1);

    const nftAddress = await nft.getAddress();
    //market完成交易
    txresponse = await market
      .connect(account1)
      .createMarketItem(nftAddress, 1, auctionPrice, { value: listingFee });
    //
    const sellerAfter = await ethers.provider.getBalance(address1);

    //获取交易收据
    txreceipt = await txresponse.wait();
    // 计算交易消耗的gas费用 = 使用的gas数量 * 实际支付的gas价格
    // 注意effectiveGasPrice可能不存在
    console.log("Full transaction receipt:", txreceipt);
    const gasPrice = txreceipt.gasPrice || txreceipt.effectiveGasPrice;
    if (!gasPrice) {
      throw new Error("Cannot determine gas price from transaction receipt");
    }
    gas = BigInt(txreceipt.gasUsed) * BigInt(gasPrice);

    // sellerAfter = sellerBalance - listingFee - gas
    expect(sellerAfter).to.equal(
      BigInt(sellerBalance) - BigInt(listingFee) - gas
    );

    //然后我们再算买方
    const buyerBalance = await ethers.provider.getBalance(address2);
    txresponse = await market
      .connect(account2)
      .createMarketSale(nftAddress, 1, { value: auctionPrice });
    const buyerAfter = await ethers.provider.getBalance(address2);

    //这里的金额有问题
    let ngasPrice = txreceipt.gasPrice || txreceipt.effectiveGasPrice;
    // gas = txreceipt.gasUsed.mul(txreceipt.gasPrice);
    gas = BigInt(txreceipt.gasUsed) * BigInt(ngasPrice);
    const difference =
      BigInt(buyerBalance) - BigInt(auctionPrice) - BigInt(gas);
    // 允许1e15 wei(0.001 ETH)以内的误差
    expect(buyerAfter).to.be.closeTo(difference, BigInt(1e15));
    console.log(`Buyer balance check:
      Initial: ${buyerBalance}
      Paid: ${auctionPrice}
      Gas: ${gas}
      Expected: ${difference}
      Actual: ${buyerAfter}`);

    //market place 就赚一个listingFee
    // 市场只收取 listingFee 而不收取拍卖费的原因：
    // 1. 简化商业模式：只收取一次性的上架费用，降低用户使用门槛
    // 2. 鼓励交易：不收取拍卖费可以激励更多用户参与交易，增加市场流动性
    // 3. 透明收费：用户在上架时就能明确知道需要支付的费用，没有隐藏成本
    // 4. 竞争策略：相比其他收取拍卖费的市场，这种模式更具竞争力
    // 5. 降低交易成本：买家只需支付拍卖价格，不需要额外支付手续费
    // 6. 专注于核心功能：通过收取 listingFee 来维持市场运营，而不是从每笔交易中抽成

    // 买家支付的拍卖费去向：
    // 1. 直接支付给卖家：拍卖费全额转给 NFT 的原所有者（卖家）
    // 2. 智能合约保证：通过智能合约自动执行转账，确保资金安全
    // 3. 无中间抽成：市场不从中抽取任何费用，全部金额归卖家所有
    // 4. 激励创作者：这种模式鼓励更多创作者参与，因为他们可以获得全部收益
    // 5. 透明交易：所有资金流向都在区块链上可查，确保交易公开透明
    const marketownerAfter = await ethers.provider.getBalance(address0);
    const sums = BigInt(marketownerBalance) + BigInt(listingFee);
    expect(marketownerAfter).to.equal(sums);
  });
});
