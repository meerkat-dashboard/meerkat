describe('check card', () => {
	beforeEach(() => {
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"ABC","tags":["onfire"],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc"}')
	})

	describe('when check-data-mode selection is plugin output', () => {
		beforeEach(() => {
			cy.visit('/edit/abc')
			cy.get('[data-cy="dashboard#new_element"]').click()
			cy.get('[data-cy="element:type"]').select('check-card')
	
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

			cy.get('[data-cy="card:pluginOutputDefault"').type('none')
			cy.contains('none').should('be.visible') // wait for debounced input

			cy.contains('Save Dashboard').click()
		})
	
		describe('when viewing with template variables', () => {
			it('has check-data-mode attributes', () => {
				// ensures template returns the right JSON shape
				// to render http://meerkat.host/view/abc?var1=abc
				cy.visit('/view/abc?var1=abc')
				cy.contains('none').should('be.visible')
			})
		})
	})
})
