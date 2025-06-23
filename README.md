# qc_nft_marketplace

nft

### how to create nft by mock in this case

first of all , you need to run :

```
yarn console
```

then:

```
nftaddress = 'xxx'
nft = await ethers.getContractAt("BadgeToken", nftaddress)
await nft.name()
await nft.mintTo('0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266')
await nft.tokenURI(1)
```

### PS：

> in the new version of openzeppelin contracts , the Counters method has been deleted, so I fulfill a lib by myself
> but you can not use this method cause it cost gas, perhaps you can use data which type is uint256 to decrement and increment
