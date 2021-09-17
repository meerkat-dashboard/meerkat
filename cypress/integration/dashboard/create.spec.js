describe('Dashboard create', () => {
  it('creates dashboard', () => {
    cy.visit('/')
    cy.contains('Create New Dashboard').click()
    cy.get('[data-cy="dashboard:title"]').type('Home LAN')
    cy.get('[data-cy="dashboard#create"]').click()

    cy.get('[data-cy="dashboard:title"]').should('have.value', 'Home LAN')
    cy.url().should('include', '/edit/home-lan')
  })
})
