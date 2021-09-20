Cypress.Commands.add(
	'clearDashboards',
	() => {
		cy.request('/dashboard').its('body').then(body => {
			const dashboards = JSON.parse(body)
			if (dashboards.length > 0)
				dashboards.forEach(d => cy.request('DELETE', `/dashboard/${d.slug}`))
		})
	}
)

beforeEach(() => cy.clearDashboards())
