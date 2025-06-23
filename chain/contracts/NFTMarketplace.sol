pragma solidity ^0.8.28;
import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "./Counters.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol"; //新版本的放在utils里了，但是官网竟然没查出来
import "@openzeppelin/contracts/utils/Address.sol";
import "hardhat/console.sol";


contract NFTMarketplace is ReentrancyGuard{
    // 不，这里的 `using Counters for Counters.Counter` 不是继承
    // 这是 Solidity 中的 using 声明，用于将库函数附加到特定类型
    using Counters for Counters.Counter;
    Counters.Counter private _itemCounter;//start from 1
    Counters.Counter private _itemSoldCounter;




}