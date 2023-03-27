import { assert } from 'chai'
import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { VRFCoordinatorV2Mock } from '../../typechain-types/@chainlink/contracts/src/v0.8/mocks'
import { RandomIpfsNft } from '../../typechain-types/contracts/RandomIpfsNFT.sol'

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('BasicNFT', async () => {
          let randomIpfsNft: RandomIpfsNft
          let VRFCoordinatorV2Mock: VRFCoordinatorV2Mock

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              const deployer = accounts[0]

              await deployments.fixture(['mocks', 'randomipfs'])
              randomIpfsNft = await ethers.getContract('RandomIpfsNft', deployer)
              VRFCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock', deployer)
          })

          describe('fulfillRandomWords', () => {
              it('mints NFT after random number returned', async () => {
                  const startingCounter = await randomIpfsNft.getTokenCounter()

                  await new Promise<void>(async (resolve, reject) => {
                      randomIpfsNft.once('NftMinted', async () => {
                          try {
                              const endingCounter = await randomIpfsNft.getTokenCounter()
                              const tokenUri = await randomIpfsNft.getDogTokenUris(startingCounter)

                              assert.equal(tokenUri.toString().includes('ipfs://'), true)
                              assert.equal(
                                  endingCounter.toString(),
                                  startingCounter.add(1).toString()
                              )
                              resolve()
                          } catch (error) {
                              console.log(error)
                              reject(error)
                          }
                      })
                      try {
                          const fee = await randomIpfsNft.getMintFee()
                          const tx = await randomIpfsNft.requestNft({ value: fee.toString() })
                          const txReceipt = await tx.wait(1)
                          const requestId = await txReceipt.events![1].args!.requestId
                          await VRFCoordinatorV2Mock.fulfillRandomWords(
                              requestId,
                              randomIpfsNft.address
                          )
                      } catch (error) {
                          console.log(error)
                          reject(error)
                      }
                  })
              })
          })
      })
