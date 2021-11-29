import React, { useEffect, useState } from 'react'
import BigNumber from 'bignumber.js'
import {
	Box,
	Flex,
	NumberInput,
	NumberInputField,
	Button,
	Image,
	useDisclosure,
	useToast,
} from '@chakra-ui/react'
import { TriangleDownIcon } from '@chakra-ui/icons'
import defaults from '../common/defaults'
import { useWallet } from 'use-wallet'
import { ethers } from 'ethers'
import { approved, swapped, failed } from '../messages'
import {
	getERC20Allowance,
	getERC20BalanceOf,
	getSwapEstimate,
	swapForAsset,
	approveERC20ToSpend,
	MAX_UINT256,
} from '../common/ethereum'
import { TokenSelector } from '../components/TokenSelector'
import { TransactionSettings } from '../components/TransactionSettings'

const flex = {
	flex: '1',
}

const input = {
	variant: 'transparent',
}

const field = {
	fontSize: '1.3rem',
	fontWeight: 'bold',
}

const span = {
	fontSize: '0.7rem',
	opacity: '0.9',
}

const Swap = (props) => {

	const { isOpen, onOpen, onClose } = useDisclosure()
	const { isOpen: isSettingsOpen, onOpen: onSettingsOpen, onClose: onSettingsClose } = useDisclosure()

	const wallet = useWallet()
	const toast = useToast()

	const [isSelect, setIsSelect] = useState(-1)
	const [inAction, setInAction] = useState(false)
	const [isTurn, setIsTurn] = useState(false)
	const [token0, setToken0] = useState(defaults.tokenDefault)
	const [token1, setToken1] = useState(false)
	const [allowance0, setAllowance0] = useState(0)
	const [auto, setAuto] = useState(true)
	const [slippage, setSlippage] = useState(defaults.swap.slippage)
	const [deadline, setDeadline] = useState(defaults.swap.deadline)
	const [balance0, setBalance0] = useState(0)
	const [balance1, setBalance1] = useState(0)
	const [amount0, setAmount0] = useState(0)
	const [amount1, setAmount1] = useState(0)
	const [input0, setInput0] = useState('0')
	const [input1, setInput1] = useState('0')
	const [ratio, setRatio] = useState('')
	const [timeoutId, setTimeoutId] = useState(null)

	const getAllowance0 = async () => {
		if (wallet.account && token0) {
			getERC20Allowance(token0.address, wallet.account, defaults.address.router, defaults.network.provider)
				.then(allowance => {
					setAllowance0(allowance.toString())
				})
		}
	}

	const getBalance0 = async () => {
		if (wallet.account && token0) {
			getERC20BalanceOf(token0.address, wallet.account, defaults.network.provider)
				.then(b => {
					setBalance0(b)
				})
				.catch(err => {
					setBalance0(false)
					console.log(err)
				})
		}
	}

	const getBalance1 = async () => {
		if (wallet.account && token1) {
			getERC20BalanceOf(token1.address, wallet.account, defaults.network.provider)
				.then(b => {
					setBalance1(b)
				})
				.catch(err => {
					setBalance1(false)
					console.log(err)
				})
		}
	}

	const approve = async () => {
		setInAction(true)
		const provider = new ethers.providers.Web3Provider(wallet.ethereum)
		approveERC20ToSpend(token0.address, defaults.address.router, MAX_UINT256, provider)
			.then((result) => {
				getAllowance0()
				setInAction(false)
				if (result) {
					toast(approved)
				}
				else {
					toast(failed)
				}
			})
	}

	const swap = async () => {
		setInAction(true)
		const swapSlippage = auto ? defaults.swap.slippage : slippage
		const amountOutMin = BigNumber(input1).times(100 - swapSlippage).div(100).toFixed()
		swapForAsset(
			token0,
			token1,
			amount0,
			amountOutMin,
			deadline,
			wallet,
		)
			.then((result) => {
				getBalance0()
				getBalance1()
				setAmount0(0)
				setAmount1(0)
				setInAction(false)
				if (result) {
					toast(swapped)
				}
				else {
					toast(failed)
				}
			})
	}

	const onAuto = (value) => {
		setAuto(value)
	}

	const onSlippage = (value) => {
		if (value < 0 || value > 50) {
			setAuto(true)
		}
		setSlippage(value)
	}

	const onDeadline = (value) => {
		if (value < defaults.swap.minDeadline) {
			setDeadline(defaults.swap.minDeadline)
		}
		else if (value > defaults.swap.maxDeadline) {
			setDeadline(defaults.swap.maxDeadline)
		}
		else {
			setDeadline(value)
		}
	}

	useEffect(() => {
		if (!isOpen) setIsSelect(-1)
	}, [isOpen])

	useEffect(() => {
		getAllowance0()
		getBalance0()
	}, [wallet.account, token0])

	useEffect(() => {
		getBalance1()
	}, [wallet.account, token1])

	useEffect(() => {
		if (wallet.account && token0 && token1 && (token0.address != token1.address)) {
			setInput0(amount0)

			if (timeoutId) {
				clearTimeout(timeoutId)
				setTimeoutId(null)
			}

			setTimeoutId(setTimeout(() => {
				getSwapEstimate(token0, token1, amount0, wallet)
					.then(output => {
						const estimate = output.times(Number(amount0) || 0)
						setInput1(estimate.isZero() ? '0' : estimate.toFixed(8))
						const unit = BigNumber(1).div(estimate)
						setRatio(`1 ${token1.symbol} = ${unit.toFormat(unit.isGreaterThan(1) ? 3 : 6)} ${token0.symbol}`)
					})
			}, 500))
		}
	}, [amount0, token0, token1])

	useEffect(() => {
		if (isTurn) {
			setIsTurn(false)
			return
		}

		if (wallet.account && token0 && token1 && (token0.address != token1.address)) {
			setInput1(amount1)

			if (timeoutId) {
				clearTimeout(timeoutId)
				setTimeoutId(null)
			}

			setTimeoutId(setTimeout(() => {
				getSwapEstimate(token0, token1, amount1, wallet)
					.then(output => {
						const estimate = BigNumber(1).div(output).times(Number(amount1) || 0)
						setInput0(estimate.isZero() ? '0' : estimate.toFixed(8))
						const unit = BigNumber(1).div(output)
						setRatio(`1 ${token1.symbol} = ${unit.toFormat(unit.isGreaterThan(1) ? 3 : 6)} ${token0.symbol}`)
					})
			}, 500))
		}
	}, [amount1, token0, token1])

	return (
		<>
			<Box
				height={`calc(100vh - ${defaults.layout.header.minHeight})`}
				maxWidth={defaults.layout.container.sm.width}
				m='0 auto'
				p={{ base: '5rem 1.2rem 0', md: '5rem 0 0' }}
				{...props}
			>
				<Flex
					w='100%'
					maxW='49ch'
					minH='478.65px'
					m='0 auto'
					p='2rem 2.6rem'
					layerStyle='colorful'
					flexDir='column'
				>
					<Flex
						{...flex}
						p='0.3rem 0.3rem'
						flexDir='row'
						justifyContent='space-between'
						alignItems='first baseline'
					>
						<Box
							as='h3'
							m='0'
							fontSize='1.3rem'
							fontWeight='bold'
							textTransform='capitalize'
						>
							Swap
						</Box>
						<Box
							as='button'
							width='22px'
							onClick={() => { onSettingsOpen() }}
						>
							<Image m='0' height='22px' src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 27.42047 27.42047'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23fff;%7D%3C/style%3E%3C/defs%3E%3Cg id='Layer_2' data-name='Layer 2'%3E%3Cg id='Layer_1-2' data-name='Layer 1'%3E%3Cpath class='cls-1' d='M14.57066,27.42047h-1.7209a2.52716,2.52716,0,0,1-2.52429-2.52424V24.314a11.07024,11.07024,0,0,1-1.719-.71352l-.41259.41259a2.52427,2.52427,0,0,1-3.57028-.00038L3.40731,22.79648a2.52414,2.52414,0,0,1,.00033-3.57029l.41227-.41227a11.07,11.07,0,0,1-.71352-1.719H2.52424A2.52714,2.52714,0,0,1,0,14.57071v-1.721a2.52716,2.52716,0,0,1,2.52429-2.52424h.58215A11.0716,11.0716,0,0,1,3.82,8.60655L3.40737,8.194a2.52429,2.52429,0,0,1,.00032-3.57029L4.6241,3.40737a2.524,2.524,0,0,1,3.57023.00032l.41222.41222a11.0785,11.0785,0,0,1,1.719-.71352V2.52424A2.52712,2.52712,0,0,1,12.84981,0h1.7209A2.52711,2.52711,0,0,1,17.095,2.52424v.5822a11.06956,11.06956,0,0,1,1.719.71352l.41259-.41259a2.52428,2.52428,0,0,1,3.57029.00037L24.0131,4.624a2.52414,2.52414,0,0,1-.00032,3.57028l-.41227.41228a11.07152,11.07152,0,0,1,.71352,1.719h.58215a2.52716,2.52716,0,0,1,2.52429,2.52424v1.721A2.52716,2.52716,0,0,1,24.89618,17.095H24.314a11.074,11.074,0,0,1-.71352,1.719l.41259.41259a2.52429,2.52429,0,0,1-.00032,3.57029l-1.21641,1.21635a2.524,2.524,0,0,1-3.57023-.00032l-.41222-.41222a11.07931,11.07931,0,0,1-1.719.71352v.58221A2.5271,2.5271,0,0,1,14.57066,27.42047ZM8.87507,21.91334a9.46917,9.46917,0,0,0,2.45451,1.0189.80328.80328,0,0,1,.60261.77784v1.18615a.91866.91866,0,0,0,.91762.91757h1.7209a.91866.91866,0,0,0,.91762-.91757V23.71008a.80327.80327,0,0,1,.60261-.77784,9.46917,9.46917,0,0,0,2.45451-1.0189.8033.8033,0,0,1,.977.12345l.84018.84023A.91727.91727,0,0,0,21.66,22.8774l1.21716-1.21711a.91741.91741,0,0,0,.00032-1.29738l-.84055-.84056a.80336.80336,0,0,1-.12345-.977,9.46757,9.46757,0,0,0,1.01884-2.45451.80332.80332,0,0,1,.77784-.60255h1.1861a.91866.91866,0,0,0,.91762-.91757v-1.721a.91866.91866,0,0,0-.91762-.91756h-1.1861a.80335.80335,0,0,1-.77784-.60256,9.46944,9.46944,0,0,0-1.01884-2.4545.80338.80338,0,0,1,.12345-.977l.84023-.84023a.91726.91726,0,0,0,.00032-1.29738L21.6604,4.54355A.91737.91737,0,0,0,20.363,4.54322l-.8405.84056a.8033.8033,0,0,1-.977.12344A9.46949,9.46949,0,0,0,16.091,4.48833a.80328.80328,0,0,1-.6026-.77784V2.52423a.91867.91867,0,0,0-.91763-.91757h-1.7209a.91866.91866,0,0,0-.91762.91757V3.71038a.80328.80328,0,0,1-.60261.77784,9.46932,9.46932,0,0,0-2.45451,1.0189.80342.80342,0,0,1-.977-.12345l-.84018-.84023A.91727.91727,0,0,0,5.7606,4.54306L4.54344,5.76017a.91742.91742,0,0,0-.00032,1.29738l.84056.84056a.80337.80337,0,0,1,.12344.977,9.46743,9.46743,0,0,0-1.01884,2.45451.80332.80332,0,0,1-.77784.60255H2.52429a.91874.91874,0,0,0-.91762.91762v1.721a.91866.91866,0,0,0,.91762.91757H3.71038a.80334.80334,0,0,1,.77785.60255,9.469,9.469,0,0,0,1.01884,2.45451.80336.80336,0,0,1-.12345.977l-.84023.84023a.91728.91728,0,0,0-.00032,1.29739l1.217,1.21705a.91737.91737,0,0,0,1.29738.00032l.8405-.84056a.80714.80714,0,0,1,.97707-.12339Z'/%3E%3Cpath class='cls-1' d='M13.71023,19.67633a5.9661,5.9661,0,1,1,5.9661-5.9661A5.97283,5.97283,0,0,1,13.71023,19.67633Zm0-10.32552a4.35943,4.35943,0,1,0,4.35943,4.35942,4.36433,4.36433,0,0,0-4.35943-4.35942Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"/>

							<TransactionSettings
								isOpen={isSettingsOpen}
								onOpen={onSettingsOpen}
								onClose={onSettingsClose}
								onAuto={onAuto}
								onSlippage={onSlippage}
								onDeadline={onDeadline}
								auto={auto}
								slippage={slippage}
								deadline={deadline}
							/>
						</Box>
					</Flex>

					<Flex layerStyle='inputLike'>
						<Box flex='1' pr='0.5rem'>
							{balance0 &&
								<Box as='span' textStyle='uppercase' {...span}>
									Balance: {ethers.utils.formatUnits(balance0, token0.decimals)}&nbsp;{token0.symbol}
								</Box>
							}
							<NumberInput {...flex} {...input} value={input0}>
								<NumberInputField
									placeholder='0.0'
									{...field}
									onChange={(e) => {setAmount0(e.target.value)}}
								/>
							</NumberInput>
						</Box>
						<Box
							as='button'
							display='inline-flex'
							minWidth='23px'
							alignItems='center'
							onClick={() => {
								onOpen()
								setIsSelect(0)
							}}
						>
							<Image
								width='23px'
								height='23px'
								borderRadius='50%'
								objectFit='none'
								background='#fff'
								mr='10px'
								src={token0.logoURI}
							/>
							<Box as='span' fontWeight='bold' alignSelf='center' mr='5px'>{token0.symbol}</Box>
							<TriangleDownIcon
								alignSelf='center'
								height='0.7rem'
								marginTop='1px'
							/>
						</Box>
					</Flex>

					<Box
						as='button'
						m='1rem auto'
						width='22px'
						onClick={() => {
							if (token1) {
								setToken1(token0)
								setBalance1(balance0)
								setToken0(token1)
								setBalance0(balance1)
								setIsTurn(true)
								setAmount0(input1)
							}
						}}
					>
						<Image m='0' height='22px' src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 22.51799 24.3561'%3E%3Cdefs%3E%3Cstyle%3E.cls-1%7Bfill:%23fff;%7D%3C/style%3E%3C/defs%3E%3Cg id='Layer_2' data-name='Layer 2'%3E%3Cg id='Layer_1-2' data-name='Layer 1'%3E%3Cpath class='cls-1' d='M9.35617,19.94679a.76142.76142,0,0,0,0-1.076l-.98424-.98424a.76142.76142,0,0,0-1.076,0l-.98423.98424V5.3279A2.28581,2.28581,0,0,1,8.595,3.04451,1.1432,1.1432,0,0,0,9.73673,1.90282V1.14169A1.1432,1.1432,0,0,0,8.595,0a5.33375,5.33375,0,0,0-5.3279,5.3279V18.87075l-.98423-.98424a.76143.76143,0,0,0-1.07605,0l-.98423.98424a.76142.76142,0,0,0,0,1.076l4.29752,4.298a.38129.38129,0,0,0,.5385,0Z'/%3E%3Cpath class='cls-1' d='M13.16181,4.40931a.76143.76143,0,0,0,0,1.07605l.98423.98423a.76.76,0,0,0,1.07605,0l.98423-.98423V19.0282a2.2858,2.2858,0,0,1-2.28338,2.28339,1.14321,1.14321,0,0,0-1.1417,1.14169v.76113a1.14321,1.14321,0,0,0,1.1417,1.14169,5.33374,5.33374,0,0,0,5.32789-5.3279V5.48536l.98424.98423a.76.76,0,0,0,1.076,0l.98424-.98423a.7614.7614,0,0,0,0-1.07605L17.99783.11132a.38127.38127,0,0,0-.5385,0Z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E"/>
					</Box>

					<Flex layerStyle='inputLike'>
						<Box flex='1' pr='0.5rem'>
							{balance1 &&
								<Box as='span' textStyle='uppercase' {...span}>
									Balance: {ethers.utils.formatUnits(balance1, token1.decimals)}&nbsp;{token1.symbol}
								</Box>
							}
							<NumberInput {...flex} {...input} value={input1}>
								<NumberInputField placeholder='0.0' {...field} onChange={(e) => setAmount1(e.target.value)}/>
							</NumberInput>
						</Box>
						<Box
							as='button'
							display='inline-flex'
							minWidth='42px'
							alignItems='center'
							onClick={() => {
								onOpen()
								setIsSelect(1)
							}}
						>
							<Image
								width='23px'
								height='23px'
								borderRadius='50%'
								objectFit='none'
								background='#fff'
								mr='10px'
								src={token1.logoURI}
							/>
							<Box as='span' fontWeight='bold' alignSelf='center' mr='5px'>
								{token1 ? token1.symbol : 'Select a token'}
							</Box>
							<TriangleDownIcon
								alignSelf='center'
								height='0.7rem'
								marginTop='1px'/>
						</Box>
					</Flex>
					<Flex {...flex}></Flex>
					<Flex ml='auto' mr='12px'>
						{ !BigNumber(amount0).isZero() ? ratio : null}
					</Flex>
					<Button
						minWidth='230px'
						m='2rem auto'
						size='lg'
						variant='solidRadial'
						disabled={inAction || BigNumber(amount0).isZero()}
						onClick={ BigNumber(allowance0).isLessThan(amount0) ? approve : swap}
					>
						<Box
							fontWeight='1000'
						>
							{
								BigNumber(allowance0).isLessThan(amount0)
									? (inAction ? 'APPROVING' : 'APPROVE')
									: (inAction ? 'SWAPPING' : 'SWAP')
							}
						</Box>
					</Button>
				</Flex>
			</Box>

			<TokenSelector
				isSelect={isSelect}
				setToken0={setToken0}
				setToken1={setToken1}
				isOpen={isOpen}
				onOpen={onOpen}
				onClose={onClose}
			/>
		</>
	)
}

export default Swap
