describe('Dashboard delete', () => {
	beforeEach(() => {
		// create abc dashboard
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"ABC","tags":[],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc"}')
	})

	it('deletes dashboard from list', () => {
		cy.visit('/')
		cy.get('[data-cy="dashboard#delete"]').click()
		cy.get('[data-cy="#confirm"]').click()
		cy.contains('ABC').should('not.exist')
	})
})
