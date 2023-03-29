import { assert, expect } from 'chai'
import { deployments, ethers, network } from 'hardhat'
import { developmentChains } from '../../helper-hardhat-config'
import { VRFCoordinatorV2Mock } from '../../typechain-types/@chainlink/contracts/src/v0.8/mocks'
import { RandomIpfsNft } from '../../typechain-types/contracts/RandomIpfsNFT.sol'

!developmentChains.includes(network.name)
    ? describe.skip
    : describe('Random IPFS NFT', async () => {
          let randomIpfsNft: RandomIpfsNft
          let VRFCoordinatorV2Mock: VRFCoordinatorV2Mock

          beforeEach(async () => {
              const accounts = await ethers.getSigners()
              const deployer = accounts[0]

              await deployments.fixture(['mocks', 'randomipfs'])
              randomIpfsNft = await ethers.getContract('RandomIpfsNft', deployer)
              VRFCoordinatorV2Mock = await ethers.getContract('VRFCoordinatorV2Mock', deployer)
          })

          describe('constructor', () => {
              it('sets starting values correctly', async function () {
                  const dogTokenUriZero = await randomIpfsNft.getDogTokenUris(0)
                  const isInitialized = await randomIpfsNft.getInitialized()
                  assert(dogTokenUriZero.includes('ipfs://'))
                  assert.equal(isInitialized, true)
              })
          })

          describe('requestNft', () => {
              it("fails if payment isn't sent with the request", async () => {
                  await expect(randomIpfsNft.requestNft()).to.be.revertedWith(
                      'RandomIpfsNFT__NeedMoreETHSent'
                  )
              })
              it('emits and event and kicks off a random word request', async () => {
                  const fee = await randomIpfsNft.getMintFee()
                  await expect(randomIpfsNft.requestNft({ value: fee.toString() })).to.emit(
                      randomIpfsNft,
                      'NftRequested'
                  )
              })
          })

          describe('fulfillRandomWords', () => {
              it('mints NFT after random number returned', async () => {
                  const startingCounter = await randomIpfsNft.getTokenCounter()

                  await new Promise<void>(async (resolve, reject) => {
                      randomIpfsNft.once('NftMinted', async () => {
                          try {
                              const endingCounter = await randomIpfsNft.getTokenCounter()
                              const tokenUri = await randomIpfsNft.tokenURI(startingCounter)

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
