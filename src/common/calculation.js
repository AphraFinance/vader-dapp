import EthDater from 'ethereum-block-by-date'
import { getXVaderPriceByBlock } from './graphql'
import { getStartOfTheDayTimeStamp } from './utils'
import defaults from './defaults'
import { getLPVirtualPrice, lpTokenStaking } from './ethereum'
import { ethers } from 'ethers'
import { getVaderPrice } from './pricing'

const getXVaderPrice = () => getXVaderPriceByBlock()

const getBlockNumberPriorDaysAgo = async (numberOfDays) => {
	const dater = new EthDater(defaults.network.provider)
	const SECOND_IN_A_DAY = 86400
	const startOfDayTs = getStartOfTheDayTimeStamp()
	const sevenDaysAgoTs = startOfDayTs - SECOND_IN_A_DAY * numberOfDays
	const timestampInMs = sevenDaysAgoTs * 1000
	const cachedHits = localStorage.getItem('BLOCK_NUMBER_BY_TIMESTAMP')
	if (cachedHits) {
		const data = JSON.parse(cachedHits)
		if (data.timestamp === timestampInMs) {
			return data.block
		}
	}
	try {
		const response = await dater.getDate(timestampInMs, true)
		localStorage.setItem('BLOCK_NUMBER_BY_TIMESTAMP', JSON.stringify(response))
		return response && response.block
	}
	catch (err) {
		console.log('getBlockNumberPriorDaysAgo', err)
		return null
	}
}

const getXVaderAprByNumberOfDays = async (numberOfDays = 7) => {
	const daysAgoBlockNumber = await getBlockNumberPriorDaysAgo(numberOfDays)
	if (!daysAgoBlockNumber) {
		return null
	}
	const [currentPrice, daysAgoPrice] = await Promise.all([
		getXVaderPrice(),
		getXVaderPrice(daysAgoBlockNumber),
	])
	const currentPriceBN = ethers.utils.parseUnits(currentPrice)
	const daysAgoPriceBN = ethers.utils.parseUnits(daysAgoPrice)
	const apr = currentPriceBN
		.sub(daysAgoPriceBN)
		.mul(ethers.utils.parseUnits('1'))
		.div(daysAgoPriceBN)
		.mul(365)
		.div(numberOfDays)
		.toString()
	return ethers.utils.formatUnits(apr)
}

const calculateLPTokenAPR = async ({
	type, stakingContractAddress,
}) => {
	const getCurvePoolTokenPrice = async () => {
		try {
			const price = await getLPVirtualPrice()
			return ethers.BigNumber.from(price)
		}
		catch (err) {
			console.error('GET_CURVE_POOL_TOKEN_PRICE', err)
			return null
		}
	}
	const vaderPrice = await getVaderPrice()
	if (!vaderPrice) {
		return null
	}
	let lpTokenPrice = null
	switch (type) {
	case 'CURVE_POOL':
		lpTokenPrice = await getCurvePoolTokenPrice()
		break
	default:
		break
	}
	if (!lpTokenPrice) {
		return null
	}
	const vaderPriceBN = ethers.utils.parseUnits(vaderPrice)
	const lpTokenPriceBN = ethers.utils.parseUnits(lpTokenPrice)
	const lpTokenStakingContract = lpTokenStaking(stakingContractAddress)
	const [rewardPerLPToken, rewardsDuration] = await Promise.all([
		lpTokenStakingContract.rewardPerToken(),
		lpTokenStakingContract.rewardsDuration(),
	])
	const rewardPrice = ethers.BigNumber.from(rewardPerLPToken).mul(vaderPriceBN)

	const apr = rewardPrice
		.div(lpTokenPriceBN)
		.mul(365 * 86400)
		.div(rewardsDuration)
		.toString()

	return ethers.utils.formatUnits(apr)
}

const getXVaderApr = async (maxNumberOfDays = 7) => {
	if (maxNumberOfDays === 0) {
		return null
	}
	console.log('GETTING_APR', maxNumberOfDays)
	const apr = await getXVaderAprByNumberOfDays(maxNumberOfDays)
	if (+apr > 0) {
		console.log('FOUND', apr, maxNumberOfDays)
		return apr
	}
	return getXVaderApr(maxNumberOfDays - 1)
}

export {
	getXVaderPrice,
	getXVaderApr,
	calculateLPTokenAPR,
}
