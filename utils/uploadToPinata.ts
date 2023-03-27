import path from 'path'
import fs from 'fs'
import pinataSDK from '@pinata/sdk'

const pinataApiKey = process.env.PINATA_API_KEY || ''
const pinataApiSecret = process.env.PINATA_API_SECRET || ''
const pinata = new pinataSDK(pinataApiKey, pinataApiSecret)

export const storeImages = async (imagesFilePath: string) => {
    const fullImagePath = path.resolve(imagesFilePath)
    const files = fs.readdirSync(fullImagePath)
    let responses = []

    console.log('Uploading to IPFS...')

    for (let fileIndex in files) {
        console.log(`Working on ${files[fileIndex]}...`)

        const readableStreamForFile = fs.createReadStream(`${fullImagePath}\\${files[fileIndex]}`)

        try {
            const options = {
                pinataMetadata: {
                    name: files[fileIndex],
                },
            }
            const response = await pinata.pinFileToIPFS(readableStreamForFile, options)
            responses.push(response)
        } catch (error) {
            console.log(error)
        }
    }
    return { responses, files }
}

export const storeTokenUriMetadata = async (metadata: Object) => {
    try {
        const response = await pinata.pinJSONToIPFS(metadata)
        return response
    } catch (error) {
        console.log(error)
    }
    return null
}
