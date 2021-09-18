describe('Dashboard update', () => {
	beforeEach(() => {
		// create abc dashboard
		cy.request({
			method: 'POST',
			url: '/dashboard',
			body: '{"title":"abc","tags":[],"background":null,"elements":[],"globalMute":true,"variables":{},"okSound":"/dashboards-data/ok.mp3","criticalSound":"/dashboards-data/critical.mp3","warningSound":"/dashboards-data/warning.mp3","unknownSound":"/dashboards-data/unknown.mp3","upSound":"/dashboards-data/up.mp3","downSound":"/dashboards-data/down.mp3"}'
		}).its('body').should('include', '{"slug":"abc"}')
		cy.visit('/edit/abc')
	})

	it('updates dashboard title', () => {
		cy.get('[data-cy="dashboard:title"]')
		.clear()
		.type('ABC News')
		cy.contains('Save Dashboard').click()
		cy.visit('/edit/abc-news')
		cy.get('[data-cy="dashboard:title"]').should('have.value', 'ABC News')
	})

	it('updates dashboard tags', () => {
		// add tag
		cy.get('[data-cy="dashboard-tag_input"]')
		  .type('onfire{enter}')
		cy.contains('Save Dashboard').click()
		cy.reload(true)
		cy.contains('onfire').should('be.visible')

		// remove tag
		cy.get('[data-cy="dashboard#remove-tag"]').click()
		cy.get('[data-cy="dashboard:tag"]').should('not.exist');
		cy.reload(true)
		cy.get('[data-cy="dashboard:tag"]').should('not.exist');
	})

	it('updates dashboard background image', () => {
		// add background
		cy.get('[data-cy="dashboard-background_input"]')
  		.attachFile({
			fixturePath: 'Evolution-from-4G-Network-to-5G-Network.png',
			mimeType: 'image/png',
		})
  		.trigger('change', { force: true })
		cy.intercept('POST', '/upload').as('uploadBackgroundImage')
		cy.wait('@uploadBackgroundImage')
		cy.contains('Save Dashboard').click()
		cy.reload(true)
		cy.get('[data-cy="dashboard:background"]')
		.should('be.visible')

		// remove background
		cy.get('[data-cy="dashboard#remove_background"]').click()
		cy.contains('Save Dashboard').click()
		cy.reload(true)
		cy.get('[data-cy="dashboard:background"]')
		.should('not.exist')
	})
})
