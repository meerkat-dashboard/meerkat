describe('Element - Check Card - Check Data Mode', () => {
	beforeEach(() => {
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"ABC","tags":["onfire"],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc"}')
		cy.visit('/edit/abc')
		cy.get('[data-cy="dashboard#new_element"]').click()
		cy.get('[data-cy="element:type"]').select('check-card')
	})

	describe('When service has plugin output', () => {
		it('displays check state', () => {
			cy.intercept("/icinga/services").as("getServicesFromIcinga")

			// select services
			cy.get('[data-cy="card:check"]').within(() => {
				cy.get('button').click()
				cy.get('li').contains(/^Services$/).click()
			})
			cy.wait("@getServicesFromIcinga")

			// select name of service
			cy.get('[data-cy="card:check_options"]').within(() => {
				cy.get('button').click()
				cy.get('li').contains('sanctuary.hq.sol1.net!Ceph disk usage').click()
			})

			// select plugin output
			cy.get('[data-cy="card:checkDataSelection"]').select('Plugin Output')

			// Check Card content
			// no default, empty regex
			cy.get('.check-content .check-state').invoke('text').should('match', /RAW usage \d+\.\d+%/)

			// has default, empty regex
			cy.get('[data-cy="card:checkDataDefault"]').type('none')
			cy.get('.check-content .check-state').should('have.text', 'none')

			// has default, matching regex
			cy.get('[data-cy="card:checkDataRegexp"]').type('RAW usage (.+)')
			cy.get('.check-content .check-state').invoke('text').should('match', /\d+\.\d+%/)

			// has default, but no regex match
			cy.get('[data-cy="card:checkDataRegexp"]').clear().type('RAW sewerage (.+)')
			cy.get('.check-content .check-state').invoke('text').should('match', /none/)

			// no default, no regex match
			cy.get('[data-cy="card:checkDataDefault"]').clear()
			cy.get('.check-content .check-state').invoke('text').should('match', /ok|warning|critical|unknown/)
		})
	})
})
