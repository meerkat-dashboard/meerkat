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
		cy.location('pathname').should('equal', '/edit/abc-news')
		cy.contains('ABC News').should('be.visible')
	})

	it('updates dashboard tags', () => {
		// add tag
		cy.get('[data-cy="dashboard:tag"]')
		  .type('onfire{enter}')
		cy.contains('Save Dashboard').click()
		cy.contains('onfire').should('be.visible')
		cy.reload()
		.contains('onfire').should('be.visible')

		// remove tag
		cy.get('[data-cy="dashboard#remove-tag"]').click()
		cy.contains('onfire').should('not.exist')
		cy.reload()
		.contains('onfire').should('not.exist')
	})

	it('updates dashboard background image', () => {
		cy.intercept('POST', '/upload').as('uploadBackgroundImage')
		cy.intercept('/dashboard/abc').as('getDashboardJson')

		// add background
		cy.get('input[data-cy="dashboard:background"]')
  		.attachFile({
			fixturePath: 'Evolution-from-4G-Network-to-5G-Network.png',
			mimeType: 'image/png',
		})
  		.trigger('change', { force: true })
		cy.wait('@uploadBackgroundImage')
		cy.contains('Save Dashboard').click()
		cy.get('img[data-cy="dashboard:background"]').should('be.visible')
		cy.reload()
		cy.wait('@getDashboardJson')
		cy.get('img[data-cy="dashboard:background"]').should('be.visible')

		// remove background
		cy.get('[data-cy="dashboard#remove_background"]').click()
		cy.get('img[data-cy="dashboard:background"]').should('not.exist')
		cy.contains('Save Dashboard').click()
		cy.reload()
		.get('img[data-cy="dashboard:background"]').should('not.exist')
	})
})
