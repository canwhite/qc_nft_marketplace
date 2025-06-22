import type { NextPage } from "next";
import Head from "next/head";
// import Link from "next/link";
// import { useState, useEffect } from "react";
// import { ethers } from "ethers";
// import { Button } from "@/components/ui/button";
// import useEvent from "@/hooks/useEvent";
import { useCounter } from "@/store/index";
import { WalletOptions } from "@/components/walletOptions";
import { Account } from "@/components/account";
import { CardERC721 } from "@/components/cardERC721";
// import { BigNumber } from "ethers";

const nftAddress = "0x5fbdb2315678afecb367f032d93f642f64180aa3";
const tokenId = 1;

const Home: NextPage = () => {
  const { count, increment, decrement, reset } = useCounter();
  return (
    <div className="flex flex-col items-center  w-full h-full">
      <WalletOptions />
      <Account className="mt-2" />
      <CardERC721 addressContract={nftAddress} tokenId={tokenId} />
    </div>
  );
};

export default Home;
