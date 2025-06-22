import React, { useEffect, useState } from "react";
import { useReadContract, useWriteContract, useAccount } from "wagmi";
import { ERC721ABI as abi } from "@/abi";
import { BigNumber } from "ethers";
import base64 from "base-64";

interface Props {
  addressContract: string;
  tokenId: BigNumber;
}

interface ItemInfo {
  name: string;
  description: string;
  svg: string;
}

export function CardERC721(props: Props) {
  const addressContract = props.addressContract;
  const [itemInfo, setItemInfo] = useState<ItemInfo>();

  const {
    data: nftURI,
    isError: uriError,
    error: uriErrorObj,
    isLoading: uriLoading,
  } = useReadContract({
    abi: abi,
    address: addressContract as `0x${string}`,
    functionName: "tokenURI",
    args: [props.tokenId],
  });

  useEffect(() => {
    if (!nftURI) return;

    const data = base64.decode((nftURI as string).slice(29));
    const itemInfo = JSON.parse(data);
    const svg = base64.decode(itemInfo.image.slice(26));
    setItemInfo({
      name: itemInfo.name,
      description: itemInfo.description,
      svg: svg,
    });
  }, [nftURI]);

  return (
    <div className="my-2 bg-gray-100 rounded-md w-[220px] h-[260px] px-3 py-4">
      {itemInfo ? (
        <div>
          <img
            src={`data:image/svg+xml;utf8,${itemInfo.svg}`}
            alt={itemInfo.name}
            className="w-[200px]"
          />
          <p className="text-xl px-2 py-2">{itemInfo.name}</p>
        </div>
      ) : (
        <div />
      )}
    </div>
  );
}
