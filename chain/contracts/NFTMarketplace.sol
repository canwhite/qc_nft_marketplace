// SPDX-License-Identifier: MIT 
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

    address payable public marketowner;
    uint256 public listingFee = 0.025 ether;

    enum State {Created, Release, Inactive}

    struct MarketItem {
        uint id;
        address nftContract;
        uint256 tokenId;
        // payable 是 Solidity 中的一个重要修饰符，用于标记地址可以接收以太币
        // 1. 作用：允许地址接收以太币转账
        address payable seller;
        address payable buyer;
        uint256 price;
        State state;
    }

    //array of objects
    mapping(uint256 => MarketItem) private marketItems;

    // ==indexed 是 Solidity 中用于标记事件参数的修饰符，主要作用如下：==
    // 1. 允许在链下通过事件过滤器（filter）快速查找特定事件
    // 2. 最多可以对三个参数使用 indexed
    // 3. indexed 参数会被存储在日志的 topics 中，而非 data 部分
    // 4. 对于 address、uint、bool 等简单类型，使用 indexed 可以高效过滤
    // 5. 对于复杂类型（如数组、结构体），使用 indexed 会存储其 keccak256 哈希值
    // 6. 使用 indexed 会增加 gas 成本，但可以提升链下查询效率
    // 7. 在 MarketItemCreated 事件中，id 被标记为 indexed，方便后续通过 id 快速查找特定 NFT 的创建事件

    // 使用 indexed 参数查询事件时，可以通过 web3.js 或 ethers.js 的过滤器功能进行高效查询
    // 例如：
    // 1. 通过 indexed 参数 id 查询特定 NFT 的创建事件：
    //    const filter = contract.filters.MarketItemCreated(id);
    //    const events = await contract.queryFilter(filter);
    // 2. 查询所有 MarketItemCreated 事件：
    //    const events = await contract.queryFilter("MarketItemCreated");
    // 3. 查询某个地址相关的所有事件：
    //    const filter = contract.filters.MarketItemCreated(null, null, null, address);
    //    const events = await contract.queryFilter(filter);
    // 注意：
    // - indexed 参数会被存储在日志的 topics 中，查询效率更高
    // - 非 indexed 参数存储在 data 中，查询时需要解码
    // - 最多只能有 3 个 indexed 参数
    //Event

    event MarketItemCreated(
        uint indexed id,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price,
        State state
    );

    event MarketItemSold(
        uint indexed id,
        address indexed nftContract,
        uint256 indexed tokenId,
        address seller,
        address buyer,
        uint256 price,
        State state
    );


    //constructor
    constructor(){
        // payable 在 Solidity 中有两种用法：
        // 1. 作为修饰符：用于标记函数可以接收以太币
        // 2. 作为类型转换：将普通地址转换为可接收以太币的地址
        // 这里使用的是第二种用法，将 msg.sender 转换为可接收以太币的地址
        // 因为 marketowner 需要能够接收以太币（如收取上架费用）
        marketowner = payable(msg.sender);
    }


    //== core methods ==

    // create item
    function createMarketItem(
        address nftContract,
        uint256 tokenId,
        uint256 price
     ) public payable nonReentrant{
        require(price > 0 , "Price must be at least 1 wei");
        require(msg.value == listingFee,"Fee must be equal to listing fee");
        // 检查NFT是否已授权给当前市场合约
        // IERC721(nftContract).getApproved(tokenId) 获取NFT的授权地址
        // address(this) 中的 this 指代当前合约实例
        // address() 是一个类型转换函数，将合约实例转换为地址类型
        // 这里的作用是获取当前市场合约的地址，用于检查NFT是否已授权给本合约
        require(IERC721(nftContract).getApproved(tokenId) == address(this), "NFT must be approved to market");

        _itemCounter.increment();
        uint256 id = _itemCounter.current();

        marketItems[id] =  MarketItem(
            id,
            nftContract,
            tokenId,
            payable(msg.sender),
            payable(address(0)),
            price,
            State.Created
        );

        emit MarketItemCreated(
            id,
            nftContract,
            tokenId,
            msg.sender,
            address(0),
            price,
            State.Created
        );
    }

    // delete item 
    function deleteMarketItem(uint256 itemId) public nonReentrant {
        require(itemId <= _itemCounter.current(), "id must <= item count");
        require(marketItems[itemId].state == State.Created, "item must be on market");
        MarketItem storage item = marketItems[itemId];

        require(IERC721(item.nftContract).ownerOf(item.tokenId) == msg.sender, "must be the owner");
        require(IERC721(item.nftContract).getApproved(item.tokenId) == address(this), "NFT must be approved to market");

        item.state = State.Inactive;
        emit MarketItemSold(
            itemId,
            item.nftContract,
            item.tokenId,
            item.seller,
            address(0),
            0,
            State.Inactive
        );
    }

    
    function createMarketSale(
        address nftContract,
        uint256 id
    ) public payable nonReentrant(){
        MarketItem storage item = marketItems[id]; //should use storge!!!!
        uint price = item.price;
        uint tokenId = item.tokenId;

        require(msg.value == price ,"Please submit the asking price");
        require(IERC721(nftContract).getApproved(tokenId) == address(this), "NFT must be approved to market");

        //从卖家转移到买家，item.seller（卖家地址）转移到msg.sender（买家地址）
        IERC721(nftContract).transferFrom(item.seller, msg.sender, tokenId);
        //区别于常规的transfer，这里没有to，但是出发者就是接收方
        //向市场所有者支付上架费用
        payable(marketowner).transfer(listingFee);
        //向卖家支付购买金额
        item.seller.transfer(msg.value);

        //update state
        item.buyer = payable(msg.sender);
        item.state = State.Release;
        _itemSoldCounter.increment();   

        //把msg.sender理解为实际买家地址就ok
        //实际上就是当前操作者
        emit MarketItemSold(
            id,
            nftContract,
            tokenId,
            item.seller,
            msg.sender,
            price,
            State.Release
        );     

    }


    

    //== other methods == 
    //get fee
    function getListingFee() public view returns(uint256){
        return listingFee;
    }

    //fetch active items
    function fetchActiveItems() public view returns (MarketItem[] memory) {
        return fetchHepler(FetchOperator.ActiveItems);
    }

    /**
    * @dev Returns only market items a user has purchased
    * todo pagination
    */
    function fetchMyPurchasedItems() public view returns (MarketItem[] memory) {
        return fetchHepler(FetchOperator.MyPurchasedItems);
    }

    /**
    * @dev Returns only market items a user has created
    * todo pagination
    */
    function fetchMyCreatedItems() public view returns (MarketItem[] memory) {
        return fetchHepler(FetchOperator.MyCreatedItems);
    }



    //fetch operator 
    enum FetchOperator { ActiveItems, MyPurchasedItems, MyCreatedItems}

    //fetch helper，一个filter function
    function fetchHepler(FetchOperator _op) private view returns (MarketItem[] memory) {     
        uint total = _itemCounter.current();

        uint itemCount = 0;
        for (uint i = 1; i <= total; i++) {
            if (isCondition(marketItems[i], _op)) {
                itemCount ++;
            }
        }

        uint index = 0;
        //返回的实际上是一个创建了固定长度的数组
        MarketItem[] memory items = new MarketItem[](itemCount);
        for (uint i = 1; i <= total; i++) {
            if (isCondition(marketItems[i], _op)) {
                items[index] = marketItems[i];
                index ++;
            }
        }
        return items;
    } 

    //is condition
    function isCondition(MarketItem memory item, FetchOperator _op) private view returns (bool){
        //查找我创建的items
        if(_op == FetchOperator.MyCreatedItems){ 
            return 
                (item.seller == msg.sender
                && item.state != State.Inactive
                )? true
                : false;
        }
        //查找我买的
        else if(_op == FetchOperator.MyPurchasedItems){
            return
                (item.buyer ==  msg.sender) ? true: false;
        }
        //查找active的
        // 判断是否为活跃的NFT项目需要满足以下条件：
        // 1. 买家地址为0，表示尚未售出
        // 2. 状态为Created，表示已创建但未释放或失效
        // 3. NFT合约已授权给当前市场合约，表示可以交易
        // 这些条件确保了NFT项目是有效的、可交易的，并且尚未被购买
        else if(_op == FetchOperator.ActiveItems){
            return 
                (item.buyer == address(0) 
                && item.state == State.Created
                && (IERC721(item.nftContract).getApproved(item.tokenId) == address(this))
                )? true
                : false;
        }else{
            return false;
        }
    }
 
}