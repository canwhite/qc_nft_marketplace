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
});
