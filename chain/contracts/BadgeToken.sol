// SPDX-License-Identifier: MIT 
pragma solidity ^0.8.28;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/utils/Strings.sol";
import "@openzeppelin/contracts/utils/Base64.sol";

contract BadgeToken is ERC721 {
     uint256 private _currentTokenId = 0; //tokenId will start from 1


    constructor(
        string memory _name,
        string memory _symbol
    ) ERC721(_name, _symbol) {

    }
    function mintTo(address _to) public {
        //这里获取的是当前值+1.但是此时并未修改
        uint256 newTokenId = _getNextTokenId();
        _mint(_to, newTokenId);
        //之后再修改的
        _incrementTokenId();        
    }   

    // 在 Solidity 中，以下划线 _ 开头命名的方法或变量通常表示它们是私有的（private）或内部的（internal）
    // Solidity: _currentTokenId - 私有变量
    // Rust: _unused_var - 忽略未使用的变量
    function _getNextTokenId() private view returns(uint256){
        return _currentTokenId+1;
    }

    function _incrementTokenId() private{
        _currentTokenId++;
    }

    //view读取合约状态，单丝pure不读取合约状态，他只是修改局部变量的值，just do these things
    //tokenURI() returns a URI. You can get the resulting URI for each token by concatenating the baseURI and the tokenId.
    // tokenURI 方法用于返回指定 tokenId 的元数据 URI
    // 该方法需要满足 ERC721 标准，返回一个符合 metadata 标准的 JSON 字符串
    // 该方法被标记为 pure 因为：
    // 1. 不读取合约状态（仅使用传入的 tokenId 参数）
    // 2. 不修改合约状态
    // 3. 所有操作都在内存中完成
    // 方法返回的字符串格式为：data:application/json;base64,{base64_encoded_json}
    // 其中 JSON 包含以下字段：
    // - name: NFT 名称
    // - description: NFT 描述
    // - image: NFT 图片的 base64 编码 SVG 数据
    // 图片是通过拼接 SVG 字符串生成的，包含：
    // 1. 棕色背景
    // 2. 白色大号数字（tokenId）
    // 注意：当前实现存在以下问题：
    // 1. 缺少对 tokenId 有效性的检查
    // 2. SVG 图片的尺寸和样式较为简单
    // 3. 没有处理 tokenId 不存在的情况
    // 建议改进：
    // 1. 添加 require 检查 tokenId 是否有效
    // 2. 优化 SVG 图片设计
    // 3. 添加对 tokenId 存在性的验证
    function  tokenURI(uint256 tokenId) override public pure returns(string memory) {
        /*
        <svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'>
            <style>.base { fill: white; font-family: serif; font-size: 300px; }</style>
            <rect width='100%' height='100%' fill='brown' />
                <text x='100' y='260' class='base'>
                1
                </text>
        </svg>
        */
        string[3] memory parts;
        parts[0] = "<svg xmlns='http://www.w3.org/2000/svg' preserveAspectRatio='xMinYMin meet' viewBox='0 0 350 350'><style>.base { fill: white; font-family: serif; font-size: 300px; }</style><rect width='100%' height='100%' fill='brown' /><text x='100' y='260' class='base'>";
        parts[1] = Strings.toString(tokenId);
        parts[2] = "</text></svg>";

      
        string memory svgOutput = Base64.encode(bytes(abi.encodePacked(parts[0], parts[1], parts[2])));
        string memory tokenIdString = Strings.toString(tokenId);
        //get a json string
        
        string memory json = string(abi.encodePacked(
                '{"name":"Badge #', 
                tokenIdString, 
                '","description":"Badge NFT with on-chain SVG image.",',
                '"image":"data:image/svg+xml;base64,', 
                svgOutput, // 使用 Base64 编码后的 SVG
                '"}'
            ));
        // abi.encodePacked 是 Solidity 中的一个内置函数，用于将多个参数紧密打包成字节数组
        // VS： abi.encode 与encode不同，它不会添加填充字节，因此可以节省 gas 费用
        // "data:application/json;base64," 是 Data URI 的前缀
        // 1. "data:" 表示这是一个 Data URI
        // 2. "application/json" 指定内容类型为 JSON
        // 3. "base64" 表示后面的数据是 base64 编码的
        // 这样可以直接在浏览器中解析和显示这个 JSON 数据
        return string(abi.encodePacked("data:application/json;base64,", Base64.encode(bytes(json))));
    }

}






