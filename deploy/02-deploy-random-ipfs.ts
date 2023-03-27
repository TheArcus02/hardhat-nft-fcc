import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from '../helper-hardhat-config'
import { VRFCoordinatorV2Mock } from '../typechain-types/@chainlink/contracts/src/v0.8/mocks'
import { storeImages, storeTokenUriMetadata } from '../utils/uploadToPinata'
import verify from '../utils/verify'

const FUND_AMOUNT = '1000000000000000000000'
const metadataTemplate = {
    name: '',
    description: '',
    image: '',
    attributes: [
        {
            trait_type: 'Cuteness',
            value: 100,
        },
    ],
}

let tokenUris: string[] = [
    'ipfs://QmNddFsneWThscVTyaTPWoiYAe5X462TSq27Bg2NX6HeWh',
    'ipfs://QmNqYUNjjRDXU4KN1cLA5pUgJ3V4cEVR7VWwDtCh8Awwue',
    'ipfs://Qme7UtrSEuizrnR2wjf2wCmh7YradDvsFicn5ozMrxzc6M',
]

const imagesLocation = './images/randomNft'

const deployRandomIpfsNft: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    const chainId: number = network.config.chainId!

    // IPFS hashes of our images
    if (process.env.UPLOAD_TO_PINATA == 'true') {
        tokenUris = await handleTokenUris()
    }

    let vrfCoordinatorV2MockAddress: string | undefined
    let vrfCoordinatorV2Mock: VRFCoordinatorV2Mock | undefined
    let subscriptionId

    if (chainId == 31337) {
        // create VRFV2 Subscription
        vrfCoordinatorV2Mock = await ethers.getContract<VRFCoordinatorV2Mock>(
            'VRFCoordinatorV2Mock'
        )
        vrfCoordinatorV2MockAddress = vrfCoordinatorV2Mock.address
        const transactionResponse = await vrfCoordinatorV2Mock.createSubscription()
        const transactionReceipt = await transactionResponse.wait()
        subscriptionId = transactionReceipt!.events![0].args!.subId
        await vrfCoordinatorV2Mock.fundSubscription(subscriptionId, FUND_AMOUNT)
    } else {
        vrfCoordinatorV2MockAddress = networkConfig[chainId].vrfCoordinatorV2!
        subscriptionId = networkConfig[chainId].subscriptionId
    }
    log('----------------------------------------------------')

    const args: any[] = [
        vrfCoordinatorV2MockAddress,
        subscriptionId,
        networkConfig[chainId].gasLane,
        networkConfig[chainId].mintFee,
        networkConfig[chainId].callbackGasLimit,
        tokenUris,
    ]

    const randomipfsNft = await deploy('RandomIpfsNft', {
        from: deployer,
        args,
        log: true,
        waitConfirmations: waitBlockConfirmations,
    })
    log('----------------------------------------------------')
    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log('Verifying...')
        await verify(randomipfsNft.address, args)
    } else if (developmentChains.includes(network.name) && vrfCoordinatorV2Mock && subscriptionId) {
        log('Adding consumer...')
        await vrfCoordinatorV2Mock.addConsumer(subscriptionId, randomipfsNft.address)
    }
}

const handleTokenUris = async (): Promise<string[]> => {
    let tokenUris: string[] = []
    // store image in IPFS

    // store metadata in IPFS
    const { responses: imageUploadResponses, files } = await storeImages(imagesLocation)
    for (let imageUploadResponseIndex in imageUploadResponses) {
        // create metadata
        // upload metadata
        let tokenUriMetadata = { ...metadataTemplate }
        tokenUriMetadata.name = files[imageUploadResponseIndex].replace('.png', '')
        tokenUriMetadata.description = `An adorable ${tokenUriMetadata.name}`
        tokenUriMetadata.image = `ipfs://${imageUploadResponses[imageUploadResponseIndex].IpfsHash}`
        console.log(`Uploading ${tokenUriMetadata.name}...`)
        // store JSON to pinata
        const metadataUploadResponse = await storeTokenUriMetadata(tokenUriMetadata)
        tokenUris.push(`ipfs://${metadataUploadResponse?.IpfsHash}`)
    }
    console.log('Token URIs uploaded! They are:')
    console.log(tokenUris)
    return tokenUris
}

export default deployRandomIpfsNft
deployRandomIpfsNft.tags = ['all', 'randomipfs', 'main']
