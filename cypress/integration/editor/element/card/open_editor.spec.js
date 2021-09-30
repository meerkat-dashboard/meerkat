describe('Element - Check Card - Open editor', () => {
	beforeEach(() => {
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"ABC","tags":["onfire"],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc"}')
		cy.visit('/edit/abc')
		cy.get('[data-cy="dashboard#new_element"]').click()
		cy.get('[data-cy="element#close"]').click()
	})

	it('contains button to open editor', () => {
		cy.contains('Edit').click()
		cy.get('[data-cy="element:type"]').should('be.visible')
	})
})
