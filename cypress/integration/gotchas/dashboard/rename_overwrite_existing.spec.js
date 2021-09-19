describe('When renaming dashboard to the same id as an existing one', () => {
	beforeEach(() => {
		// create abc and abc-news dashboards
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"ABC","tags":[],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc"}')
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"ABC News","tags":["onfire"],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc-news"}')
	})

	it('overwrites existing dashboard of the same id', () => {
		// existing dashboard is NOT tagged with onfire
		cy.visit('/abc')
		cy.contains('onfire').should('not.exist')

		// rename dashboard from abc-news to abc
		cy.visit('/edit/abc-news')
		cy.get('[data-cy="dashboard:title"]').clear().type('ABC')
		cy.contains('Save Dashboard').click()
		cy.url().should('include', '/edit/abc')
		cy.contains('onfire').should('be.visible')
	})
})
