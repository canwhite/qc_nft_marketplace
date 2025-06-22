import type { NextPage } from "next";
import Head from "next/head";
// import Link from "next/link";
// import { useState, useEffect } from "react";
// import { ethers } from "ethers";
// import { Button } from "@/components/ui/button";
// import useEvent from "@/hooks/useEvent";
import { useCounter } from "@/store/index";
import { WalletOptions } from "@/components/walletOptions.tsx";
import { Account } from "@/components/account.tsx";

// declare let window: any;

const Home: NextPage = () => {
  const { count, increment, decrement, reset } = useCounter();
  return (
    <div className="flex flex-col items-center  w-full h-full">
      <WalletOptions />
      <Account className="mt-2" />
    </div>
  );
};

export default Home;
