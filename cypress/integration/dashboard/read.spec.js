describe('Dashboard read', () => {
	beforeEach(() => {
		// create dashboards
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"ABC","tags":[],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc"}')
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"SBS","tags":[],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"sbs"}')
	})

	it('displays dashboards', () => {
		cy.visit('/')
		cy.contains("ABC").should('be.visible')
		cy.contains("SBS").should('be.visible')

		cy.visit('/view/abc')
		cy.url().should('include', '/view/abc')
		cy.visit('/view/sbs')
		cy.url().should('include', '/view/sbs')
	})
})
