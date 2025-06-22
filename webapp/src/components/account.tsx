import { useAccount, useDisconnect, useEnsAvatar, useEnsName } from "wagmi";
import { cn } from "@/lib/utils";

export function Account({ className }) {
  const { address } = useAccount();
  const { disconnect } = useDisconnect();
  // ENS (Ethereum Name Service) 是一个基于以太坊的域名系统，它允许用户将复杂的以太坊地址（如 0x1234...abcd）映射为易读的域名（如 zack.eth）。
  // ensName 就是通过 ENS 系统解析出的域名。例如：
  // - 以太坊地址 0x1234...abcd 可能对应 ensName "zack.eth"
  // - 类比dns
  const { data: ensName } = useEnsName({ address });
  //获取用户头像
  const { data: ensAvatar } = useEnsAvatar({ name: ensName! });

  return (
    <div className={cn("flex space-x-2 items-center", className)}>
      <span>{ensAvatar && <img alt="ENS Avatar" src={ensAvatar} />}</span>
      <span>
        <span> account </span>:
        {address && (
          <span>{ensName ? `${ensName} (${address})` : address}</span>
        )}
      </span>
      <button className="border-1 px-1 py-[2px]" onClick={() => disconnect()}>
        Disconnect
      </button>
    </div>
  );
}
