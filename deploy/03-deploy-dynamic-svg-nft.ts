import {
    developmentChains,
    networkConfig,
    VERIFICATION_BLOCK_CONFIRMATIONS,
} from '../helper-hardhat-config'
import verify from '../utils/verify'
import { DeployFunction } from 'hardhat-deploy/types'
import { HardhatRuntimeEnvironment } from 'hardhat/types'
import { MockV3Aggregator } from '../typechain-types/@chainlink/contracts/src/v0.6/tests/MockV3Aggregator'
import fs from 'fs'

const deployDynamicSvgNft: DeployFunction = async function (hre: HardhatRuntimeEnvironment) {
    const { deployments, getNamedAccounts, network, ethers } = hre
    const { deploy, log } = deployments
    const { deployer } = await getNamedAccounts()
    const waitBlockConfirmations = developmentChains.includes(network.name)
        ? 1
        : VERIFICATION_BLOCK_CONFIRMATIONS
    const chainId = network.config.chainId!

    let ethUsdPriceFeedAddress: string

    if (chainId == 31337) {
        const EthUsdAggregator: MockV3Aggregator = await ethers.getContract('MockV3Aggregator')
        ethUsdPriceFeedAddress = EthUsdAggregator.address
    } else {
        ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed!
    }

    const lowSVG = await fs.readFileSync('./images/dynamicNft/frown.svg', { encoding: 'utf8' })
    const highSVG = await fs.readFileSync('./images/dynamicNft/happy.svg', { encoding: 'utf8' })

    log('----------------------------------------------------')
    const args: any[] = [ethUsdPriceFeedAddress, lowSVG, highSVG]
    const dynamicSvgNft = await deploy('DynamicSvgNft', {
        from: deployer,
        args: args,
        log: true,
        waitConfirmations: waitBlockConfirmations || 1,
    })

    // Verify the deployment
    if (!developmentChains.includes(network.name) && process.env.ETHERSCAN_API_KEY) {
        log('Verifying...')
        await verify(dynamicSvgNft.address, args)
    }
}

export default deployDynamicSvgNft
deployDynamicSvgNft.tags = ['all', 'dynamicsvg', 'main']
