import React, {} from 'react'
import { BrowserRouter as Router, Switch, Route, Redirect, useLocation } from 'react-router-dom'
import { ChakraProvider, Box } from '@chakra-ui/react'
import theme from './themes/vader'
import { UseWalletProvider } from 'use-wallet'
import { Header } from './components/Header'
import Burn from './locations/burn'
import Bonds from './locations/bond/bonds'
import Bond from './locations/bond/bond'
import defaults from './common/defaults'
import { Footer } from './components/Footer'
import { Wave } from './assets/svg/effects/Wave'

const App = () => {

	return (
		<Router>
			<ChakraProvider theme={theme}>
				<UseWalletProvider
					chainId={defaults.network.chainId}
					connectors={defaults.network.connectors}
				>
					<Header
						width={defaults.layout.header.width}
						p={defaults.layout.header.padding}
						justifyContent='center'
						position='relative'
						zIndex='2'/>
					<Switch>
						<Route path='/' exact render={() =>
							<Burn position='relative' zIndex='1'/>
						}/>
						<Route path='/acquire' exact render={() =>
							<Burn position='relative' zIndex='1'/>
						}/>
						<Route path='/bonds' exact render={() =>
							<Bonds position='relative' zIndex='1'/>
						}/>
						<Route path='/bonds/:token' exact render={() =>
							<Bond position='relative' zIndex='1'/>
						}/>
						<Route path='*' render={() =>
							<Redirect to={'/'} />
						} />
					</Switch>
					<Footer
						width='auto'
						height='10vh'
						maxWidth={defaults.layout.container.sm.width}
						m='0 auto'
						opacity='0.8'
						position='relative'
						zIndex='1'
						justifyContent='space-between'
						alignContent='center'
						flexWrap='wrap'
						padding='0rem 2rem 3rem'
						style={{
							gap: '0 2rem',
						}}
					/>
					<Wave
						width='100%'
						height='777.65665px'
						position='absolute'
						left='50%'
						top='65%'
						transform='translate(-50%, -65%)'
						m='0 auto'
						overflowX='hidden'>
						<Box
							id='radialMask'
							width='100%'
							height='100%'
							transform={maskTransform}
						/>
					</Wave>
      	</UseWalletProvider>
			</ChakraProvider>
		</Router>
	)
}

const maskTransform = () => {
	const location = useLocation()
	if(
		location.pathname.includes('pool') ||
		location.pathname.includes('stake')
	) {
		return {
			base: 'scaleX(1.5)',
			md: 'scaleX(1.4)',
			xl: 'scaleX(1.2)',
		}
	}
}

export default App