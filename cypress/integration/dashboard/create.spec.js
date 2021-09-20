describe('Dashboard create', () => {
	it('creates dashboard', () => {
		cy.visit('/')
		cy.contains('Create New Dashboard').click()
		cy.get('[data-cy="dashboard:title"]').type('Home LAN')
		cy.get('[data-cy="dashboard#create"]').click()

		cy.url().should('include', '/edit/home-lan')
		cy.contains('Home LAN').should('be.visible')
	})

	describe('When dashboard abc exists', () => {
		beforeEach(() => {
			cy.request({
				method: 'POST',
				url: '/dashboard',
				body: '{"title":"ABC","tags":["onfire"],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
			}).its('body').should('include', '{"slug":"abc"}')
		})

		it('does NOT overwrite existing abc dashboard', () => {
			cy.visit('/')
			cy.contains('Create New Dashboard').click()
			cy.get('[data-cy="dashboard:title"]').type('ABC')
			cy.get('[data-cy="dashboard#create"]').click()

			cy.url().should('include', '/edit/abc')
			cy.contains('ABC').should('be.visible')
			cy.contains('onfire').should('be.visible')
		})
	})
})
