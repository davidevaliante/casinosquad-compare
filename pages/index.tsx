import styled from 'styled-components'
import Head from 'next/head'
import React, { FunctionComponent, useEffect, useState } from 'react'
import axios from 'axios'
import { configuration } from '../configuration'
import AquaClient from '../graphql/aquaClient'
import { Streamer, StreamerBonus } from '../models/streamer'
import Wrapper from '../components/Layouts/Wrapper'
import lowerCase from 'lodash/lowerCase'
import BonusStripe from '../components/BonusStripe/BonusStripe'
import VideoDiscalimer from '../components/VideoDisclaimer/VideoDisclaimer'
import FullPageLoader from '../components/FullPageLoader'
import Container from '../components/Layouts/Container'

interface Props {
	streamerData: Streamer
}

const index: FunctionComponent<Props> = ({ streamerData }) => {
	const [loading, setLoading] = useState(true)
	const [country, setCountry] = useState<string>('')
	useEffect(() => {
		if (country !== '') getBonusList()
	}, [country])
	const [bonuses, setBonuses] = useState<StreamerBonus[] | undefined>(
		undefined
	)
	useEffect(() => {
		console.log(bonuses)
	}, [bonuses])

	console.log(streamerData)

	useEffect(() => {
		geoLocate()
	}, [])

	const geoLocate = async () => {
		const userCountryRequest = await axios.get(configuration.geoApi)
		const countryCode = lowerCase(userCountryRequest.data.country_code2)
		setCountry(countryCode)
	}

	const getBonusList = async () => {
		console.log(`started at ${new Date().getTime()}`)
		let bonusForCountry = streamerData.countryBonusList.filter(
			it => it.label === country
		)
		if (bonusForCountry.length == 0) {
			bonusForCountry = streamerData.countryBonusList.filter(
				it => it.label === 'row'
			)
			setCountry('row')
		}

		const ordering = streamerData.countryBonusList
			.filter(it => it.label === country)[0]
			.ordering.split(' ')

		const requests = bonusForCountry[0].bonuses.map(b =>
			axios.get(`${configuration.api}/bonuses/${b.id}`)
		)

		const bList = await Promise.all(requests)
		let unorderedBonuses = bList.map(r => r.data as StreamerBonus)

		let ordered: StreamerBonus[] = []

		ordering.forEach(code => {
			const matchingBonus = unorderedBonuses.find(
				it => it.compareCode === code
			)
			if (matchingBonus) {
				ordered.push(matchingBonus)
				unorderedBonuses = unorderedBonuses.filter(
					b => b.compareCode !== code
				)
			}
		})

		setBonuses([...ordered, ...unorderedBonuses])
		setLoading(false)
	}

	// const getBonusList = async () => {
	//     let bonusForCountry = streamerData.countryBonusList.filter(it => it.label === country)
	//     if(bonusForCountry.length == 0) bonusForCountry = streamerData.countryBonusList.filter(it => it.label === 'row')

	//     const requests = bonusForCountry[0].bonuses.map(b =>  axios.get(`${configuration.api}/bonuses/${b.id}`))

	//     const bList = await Promise.all(requests)

	//     console.log(bList.map(r => r.data as StreamerBonus[]))

	//     setBonuses(bList.map(r => r.data as StreamerBonus))
	//     setLoading(false)
	// }

	if (loading) return <FullPageLoader />
	if (country !== 'it' && country !== 'mt')
		return (
			<Wrapper>
				<Container>
					<div className='top-bar' style={{ cursor: 'pointer' }}>
						<img className='logo' src='/icons/app_icon.png' />
					</div>

					<div>
						<h1>More Related Videos you can find on YouTube :</h1>

						<div
							style={{
								display: 'flex',
								flexDirection: 'column',
								alignItems: 'center',
								paddingBottom: '4rem',
								paddingTop: '1rem',
								gap: '2rem',
							}}
						>
							<iframe
								width='853'
								height='480'
								src={`https://www.youtube.com/embed/LzY0clEyWcs`}
								frameBorder='0'
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
								allowFullScreen
								title='Embedded youtube'
							/>

							<iframe
								width='853'
								height='480'
								src={`https://www.youtube.com/embed/fKhVbdRAbL0`}
								frameBorder='0'
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
								allowFullScreen
								title='Embedded youtube'
							/>

							<iframe
								width='853'
								height='480'
								src={`https://www.youtube.com/embed/k04XjP_BUP8`}
								frameBorder='0'
								allow='accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture'
								allowFullScreen
								title='Embedded youtube'
							/>

							<VideoDiscalimer countryCode={country} />
						</div>
					</div>
				</Container>
			</Wrapper>
		)
	return (
		<Wrapper>
			<Container>
				<div className='top-bar'>
					<img className='logo' src='/icons/app_icon.png' />
				</div>

				<h1>
					{country === 'it'
						? 'Comparazione offerte di siti legali in Italia:'
						: 'Best Casino to play this games'}
				</h1>

				{bonuses &&
					bonuses.length > 2 &&
					bonuses.map((bonus: StreamerBonus) => (
						<BonusStripe
							key={`${bonus.name}`}
							bonus={bonus}
							countryCode={country}
						/>
					))}

				{bonuses &&
					bonuses.length <= 2 &&
					streamerData.bonuses.map((bonus: StreamerBonus) => (
						<BonusStripe
							key={`${bonus.name}`}
							bonus={bonus}
							countryCode={country}
						/>
					))}

				<div style={{ padding: '1rem' }}>
					<VideoDiscalimer countryCode={country} />
				</div>
				<div className='bottom'>
					<p style={{ textAlign: 'center' }}>
						This service is provided by{' '}
						<a href='https://www.topaffiliation.com'>
							Top Affiliation
						</a>
					</p>
				</div>
			</Container>
		</Wrapper>
	)
}

export async function getServerSideProps({ query }) {
	const pickedBonus = query.options

	const aquaClient = new AquaClient()

	const streamer = await axios.get(
		`${configuration.api}/streamers/${configuration.streamerId}`
	)

	return {
		props: {
			streamerData: streamer.data as Streamer,
		},
	}
}

export default index
