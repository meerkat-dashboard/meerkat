// adapted from https://github.com/cypress-io/cypress/issues/170#issuecomment-619758213
Cypress.Commands.add(
	'attachFile',
	{prevSubject: 'element'},
	(input, {fixturePath, mimeType}) => {
		cy.fixture(fixturePath, 'base64')
		.then(content => Cypress.Blob.base64StringToBlob(content, mimeType))
		.then(blob => {
			const transfer = new DataTransfer
			transfer.items.add(new File([blob], fixturePath))
			input[0].files = transfer.files

			return input // Cypress chaining
		})
	}
)
