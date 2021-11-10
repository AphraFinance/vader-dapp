import { ethers } from 'ethers'
import humanStandardTokenAbi from '../artifacts/abi/humanStandardToken'
import converterAbi from '../artifacts/abi/converter'
import routerAbi from '../artifacts/abi/vaderRouter'
import defaults from './defaults'

const addLiquidity = async (tokenA, tokenB, amountAdesired, amountBDesired, to, deadline, provider) => {
	const contract = new ethers.Contract(
		defaults.address.router,
		routerAbi,
		provider.getSigner(0),
	)
	// eslint-disable-next-line quotes
	return await contract["addLiquidity(address,address,uint256,uint256,address,uint256)"](tokenA, tokenB, amountAdesired, amountBDesired, to, deadline)
}

const approveERC20ToSpend = async (tokenAddress, spenderAddress, amount, provider) => {
	const contract = new ethers.Contract(
		tokenAddress,
		humanStandardTokenAbi,
		provider.getSigner(0),
	)
	return await contract.approve(spenderAddress, amount)
}

const getERC20Allowance = async (tokenAddress, ownerAddress, spenderAddress, provider) => {
	const contract = new ethers.Contract(
		tokenAddress,
		humanStandardTokenAbi,
		provider,
	)
	return await contract.allowance(ownerAddress, spenderAddress)
}

const getERC20BalanceOf = async (tokenAddress, address, provider) => {
	const contract = new ethers.Contract(
		tokenAddress,
		humanStandardTokenAbi,
		provider,
	)
	return await contract.balanceOf(address)
}

const resolveUnknownERC20 = async (tokenAddress, provider) => {
	let token
	const contract = new ethers.Contract(
		tokenAddress,
		humanStandardTokenAbi,
		provider,
	)
	const address = await contract.resolvedAddress
	const name = await contract.name().then(r => { return r }).catch(err => console.log(err))
	const symbol = await contract.symbol().then(r => { return r }).catch(err => console.log(err))
	const decimals = await contract.decimals().then(r => { return r.toNumber() }).catch(err => console.log(err))

	if (
		address &&
		name &&
		symbol &&
		decimals &&
		defaults.network.chainId
	) {
		token = {
			'chainId':defaults.network.chainId,
			'address':address,
			'name':name,
			'symbol':symbol,
			'decimals':decimals,
			'logoURI':'',
		}
	}
	return token
}

const estimateGasCost = async (contractAddress, abi, callName, data, provider) => {
	const contract = new ethers.Contract(
		contractAddress,
		abi,
		provider.getSigner(0),
	)
	const execute = (name, context, args) => {
		return context[name](args)
	}
	return await execute(callName, contract.estimateGas, data)
}

const convertVetherToVader = async (amount, provider) => {
	const contract = new ethers.Contract(
		defaults.address.converter,
		converterAbi,
		provider.getSigner(0),
	)
	return await contract.convert(amount)
}

const getSwapRate = async (from, to, provider) => {
	const contract = new ethers.Contract(
		defaults.address.router,
		provider.getSigner(0),
	)

	return ethers.BigNumber.from(await contract.callStatic.swap(1, from, to))
}

const getSwapFee = async (inputAmount, from, to, provider) => {
	const contract = new ethers.Contract(
		defaults.address.pools,
		provider,
	)

	const baseAmount = ethers.BigNumber.from(await contract.getBaseAmount(to))
	const tokenAmount = ethers.BigNumber.from(await contract.getTokenAmount(to))
	const numerator = tokenAmount.mul(ethers.BigNumber.from(inputAmount).pow(2))
	const denominator = baseAmount.add(1).pow(2)

	return numerator.div(denominator)
}

const swapForAsset = async (amount, from, to, provider) => {
	const contract = new ethers.Contract(
		defaults.address.router,
		provider.getSigner(0),
	)

	return ethers.BigNumber.from(await contract.swap(amount, from, to))
}

const bond = (token, provider) => {
	if (!defaults.address.bond[token]) {
		throw new Error('Invalid token')
	}
	const contract = new ethers.Contract(
		defaults.address.bond[token],
		provider.getSigner(0),
	)
	const price = () => contract.bondPrice()

	const deposit = async (amount, from) => {
		const maxPrice = await price()
		return contract.deposit(amount, maxPrice, from)
	}

	const redeem = (from) => contract.redeem(from)

	const debtRatio = () => contract.debtRatio()

	const maxBondSize = () => contract.maxPayout()

	// amount of bond to payout
	const payoutFor = (amount) => contract.payoutFor(amount)

	// how far into vesting a depositor is
	const percentVestedFor = (from) => contract.percentVestedFor(from)

	// amount of payout token available for claim
	const pendingPayoutFor = (from) => contract.pendingPayoutFor(from)

	return {
		price,
		deposit,
		redeem,
		debtRatio,
		maxBondSize,
		payoutFor,
		percentVestedFor,
		pendingPayoutFor,
	}
}

export {
	approveERC20ToSpend, getERC20BalanceOf, resolveUnknownERC20,
	estimateGasCost, getERC20Allowance, convertVetherToVader,
	getSwapRate, getSwapFee, swapForAsset, addLiquidity,
	bond,
}
