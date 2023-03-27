import '@typechain/hardhat'
import '@nomiclabs/hardhat-waffle'
import '@nomiclabs/hardhat-etherscan'
import '@nomiclabs/hardhat-ethers'
import 'hardhat-gas-reporter'
import 'dotenv/config'
import 'solidity-coverage'
import 'hardhat-deploy'
import 'solidity-coverage'
import { HardhatUserConfig } from 'hardhat/config'

const COINMARKETCAP_API_KEY = process.env.COINMARKETCAP_API_KEY || ''
const GOERLI_RPC_URL =
    process.env.GOERLI_RPC_URL || 'https://eth-sepolia.g.alchemy.com/v2/YOUR-API-KEY'
const PRIVATE_KEY = process.env.PRIVATE_KEY || ''
const ETHERSCAN_API_KEY = process.env.ETHERSCAN_API_KEY || ''

const config: HardhatUserConfig = {
    defaultNetwork: 'hardhat',
    networks: {
        hardhat: {
            chainId: 31337,
            // gasPrice: 130000000000,
        },
        goerli: {
            url: GOERLI_RPC_URL,
            accounts: PRIVATE_KEY !== undefined ? [PRIVATE_KEY] : [],
            //   accounts: {
            //     mnemonic: MNEMONIC,
            //   },
            saveDeployments: true,
            chainId: 5,
        },
    },
    solidity: {
        compilers: [
            {
                version: '0.8.7',
            },
            {
                version: '0.6.6',
            },
        ],
    },
    etherscan: {
        apiKey: ETHERSCAN_API_KEY,
        customChains: [
            {
                network: 'goerli',
                chainId: 5,
                urls: {
                    apiURL: 'https://api-goerli.etherscan.io/api',
                    browserURL: 'https://goerli.etherscan.io',
                },
            },
        ],
    },
    gasReporter: {
        enabled: true,
        currency: 'USD',
        outputFile: 'gas-report.txt',
        noColors: true,
        // coinmarketcap: COINMARKETCAP_API_KEY,
    },
    namedAccounts: {
        deployer: {
            default: 0, // here this will by default take the first account as deployer
            1: 0, // similarly on mainnet it will take the first account as deployer. Note though that depending on how hardhat network are configured, the account 0 on one network can be different than on another
        },
    },
    mocha: {
        timeout: 200000, // 200 seconds max for running tests
    },
}

export default config
