import React from 'react'
import { useLocation } from 'react-router-dom'
import { Flex, useBreakpointValue } from '@chakra-ui/react'
import defaults from '../common/defaults'
import { Link } from 'react-router-dom'
import { Logotype } from './Logotype'
import { WalletConnectionToggle } from './WalletConnectionToggle'
import { BurgerMenu } from './BurgerMenu'

export const Header = (props) => {

	const location = useLocation()
	const pages = [
		{
			name: 'Acquire',
			text: 'Acquire',
			link: '/acquire',
		},
		{
			name: 'Stake',
			text: 'Stake',
			link: '/stake',
		},
		{
			name: 'Farm',
			text: 'Farm',
			link: '/farm',
		},
	]

	const current = {
		background: '#835a81',
		borderRadius: '10px',
		fontWeight: '1000',
		color: '#fff',
	}

	return (
		<Flex
			style={{ justifyContent: 'space-between', alignItems: 'center' }}
			minH={defaults.layout.header.minHeight}
			{...props}>
			<Flex w={{ md: '20%', sm: '30%' }}>
				<Logotype margin='0 8px 0' />
			</Flex>
			<Flex w='auto'
				alignItems='center'
				justifyContent='space-around'
				textTransform='capitalize'
				layerStyle='colorful'
				borderRadius='12px'
				p='0.3rem 0.2rem'
				display={{ base: 'none', md: 'flex' }}
			>
				{pages.map(p =>
					<Link
						key={p.name}
						to={p.link}
						style={ {
							color: 'rgb(213, 213, 213)',
							padding: '0.4rem 0.8rem',
							...(location.pathname === '/' && p.name === 'Acquire' && current),
							...(p.link === location.pathname && current),
							...(p.link === '/pool' && location.pathname.includes('pool') && current),
						}}
					>
						{p.text}
					</Link>)
				}
			</Flex>
			<Flex w='20%' justifyContent='flex-end'>
				{useBreakpointValue({
					base: <BurgerMenu pages={pages}/>,
					md: <WalletConnectionToggle />,
				})}
			</Flex>
		</Flex>
	)
}
