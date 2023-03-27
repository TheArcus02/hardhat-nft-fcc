import { assert } from 'chai'
import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { BasicNft } from '../../typechain-types/contracts/BasicNFT.sol'

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('BasicNFT', async () => {
          let basicNFT: BasicNft

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              const deployer = accounts[0]

              await deployments.fixture(['mocks', 'basicnft'])
              basicNFT = await ethers.getContract('BasicNft', deployer)
          })

          it('Allows users to mint an NFT, and updates appropriately', async () => {
              const txResponse = await basicNFT.mintNft()
              await txResponse.wait(1)
              const tokenURI = await basicNFT.tokenURI(0)
              const tokenCounter = await basicNFT.getTokenCounter()

              assert.equal(tokenCounter.toString(), '1')
              assert.equal(tokenURI, await basicNFT.TOKEN_URI())
          })
      })
