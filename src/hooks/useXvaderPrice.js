import { useQuery, gql } from '@apollo/client'

export const useXvaderPrice = (first = 0, pollInterval = 0, type = 'Day') => {

	const query = first > 0 ? gql`
	query {
		globals(
			${first ? `first: ${first}` : ''}
			skip: 0,
			orderBy: timestamp,
			orderDirection: desc,
			where:{ 
				name: "XVADER_PRICE",
				type: "${type}"
			}) {
			id
			name
			value
			type
			timestamp
		}
	}
	` :	gql`
	query {
		global(id: "XVADER_PRICE") {
			id
			name
			value
		}
	}`

	const { data, error, loading } = useQuery(
		query,
		{
   		pollInterval: pollInterval,
		},
	)

	return [data, loading, error]
}