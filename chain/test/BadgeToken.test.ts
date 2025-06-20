// test the badge token
import { expect } from "chai";
import { Signer } from "ethers";
import { ethers } from "hardhat";
import { BadgeToken } from "../typechain";
import * as base64 from "base-64";

const _name = "BadgeToken";
const _symbol = "BADGE";

describe("BadgeToken", function () {
  let badge: BadgeToken;
  let account0: Signer, account1: Signer;

  beforeEach(async function () {
    [account0, account1] = await ethers.getSigners();
    const BadgeToken = await ethers.getContractFactory("BadgeToken");
    badge = await BadgeToken.deploy(_name, _symbol);
  });

  it("Should have the correct name and symbol ", async function () {
    //获取名字
    expect(await badge.name()).to.equal(_name);
    //获取symbol
    expect(await badge.symbol()).to.equal(_symbol);
  });

  it("Should tokenId start from 1 and auto increment", async function () {
    const address1 = await account1.getAddress();
    await badge.mintTo(address1);
    expect(await badge.ownerOf(1)).to.equal(address1);

    await badge.mintTo(address1);
    expect(await badge.ownerOf(2)).to.equal(address1);
    expect(await badge.balanceOf(address1)).to.equal(2);
  });

  it("Should mint a token with event", async function () {
    const address1 = await account1.getAddress();
    const zeroAddress = ethers.ZeroAddress; // 使用 ethers.js v6 的正确方式获取零地址
    /*  
        Transfer 事件是由 ERC-721 标准定义的，在 NFT 的铸造、转移或销毁时触发。
        触发场景：
        铸造（Minting）：当新 NFT 被创建时，from 是零地址（0x0），表示 NFT 从“无”生成。
        转移（Transfer）：当 NFT 从一个地址转移到另一个地址时，from 和 to 都是有效地址。
        销毁（Burning）：当 NFT 被销毁时，to 是零地址。从零开始，最后到0
    */

    await expect(badge.mintTo(address1))
      .to.emit(badge, "Transfer")
      .withArgs(zeroAddress, address1, 1);
  });

  it("Should mint a token with desired tokenURI (log result for inspection)", async function () {
    const address1 = await account1.getAddress();
    await badge.mintTo(address1);
    const tokenUri = await badge.tokenURI(1);
    // console.log("tokenURI:")
    // console.log(tokenUri)

    const tokenId = 1;
    // tokenUri.slice(29) 用于去除 tokenURI 开头的 "data:application/json;base64," 前缀
    // 这个前缀表示后面的数据是 base64 编码的 JSON 数据
    // 通过 slice(29) 我们只获取 base64 编码的实际数据部分
    // 类似地，itemInfo.image.slice(26) 用于去除 SVG 图像数据前的 "data:image/svg+xml;base64," 前缀
    // 这样我们就可以直接获取到 base64 编码的 SVG 图像数据
    const data = base64.decode(tokenUri.slice(29));
    const itemInfo = JSON.parse(data);
    expect(itemInfo.name).to.be.equal("Badge #" + String(tokenId));
    expect(itemInfo.description).to.be.equal(
      "Badge NFT with on-chain SVG image."
    );

    // slice() 方法用于提取字符串的一部分，并返回新的字符串
    // 语法：string.slice(startIndex, endIndex)
    // - startIndex: 开始提取的位置（包含）
    // - endIndex: 结束提取的位置（不包含），可选参数
    // 如果只提供 startIndex，则提取从该位置到字符串末尾的所有字符
    // 如果 startIndex 为负数，则从字符串末尾开始计算位置
    // 如果 endIndex 为负数，则从字符串末尾开始计算位置
    const svg = base64.decode(itemInfo.image.slice(26));
    const idInSVG = svg.slice(256, -13);
    expect(idInSVG).to.be.equal(String(tokenId));
  });
  it("Should mint 10 token with desired tokenURI", async function () {
    const address1 = await account1.getAddress();

    for (let i = 1; i <= 10; i++) {
      await badge.mintTo(address1);
      const tokenUri = await badge.tokenURI(i);

      const data = base64.decode(tokenUri.slice(29));
      const itemInfo = JSON.parse(data);
      expect(itemInfo.name).to.be.equal("Badge #" + String(i));
      expect(itemInfo.description).to.be.equal(
        "Badge NFT with on-chain SVG image."
      );

      const svg = base64.decode(itemInfo.image.slice(26));
      const idInSVG = svg.slice(256, -13);
      expect(idInSVG).to.be.equal(String(i));
    }

    expect(await badge.balanceOf(address1)).to.equal(10);
  });
});
