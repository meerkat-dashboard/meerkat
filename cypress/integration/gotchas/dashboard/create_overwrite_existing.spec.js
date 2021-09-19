describe('When new dashboard id clash with an existing one', () => {
	beforeEach(() => {
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"ABC","tags":["onfire"],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc"}')
	})

	it('overwrites existing dashboard', () => {
		cy.visit('/')
		cy.contains('Create New Dashboard').click()
		cy.get('[data-cy="dashboard:title"]').type('ABC')
		cy.get('[data-cy="dashboard#create"]').click()
		cy.contains('onfire').should('not.exist')
	})
})
