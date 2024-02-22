

export const CreateNft = async (data: any) => {
    try {
      console.log('data', data)
      const { metaplex, name, symbol, uri } = data
  
      try {
        const { nft } = await metaplex.nfts().create({
          uri: uri,
          name: name,
          symbol: symbol,
          sellerFeeBasisPoints: 500, // Represents 5.00%.
        },
        { commitment: "finalized" },
        );

        return nft?.address.toString()
        console.log("nft=====================", nft)
  
      } catch (error: any) {
        console.log('error', error)
        if (error.name === 'AccountNotFoundError') {
          return true
        } else {
          return false
        }
  
      }
  
    } catch (error) {
      console.log('error', error)
  
    }
  }