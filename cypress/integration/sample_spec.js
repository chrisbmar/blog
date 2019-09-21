describe('Home page loads correctly', () => {

    it('Visits the blog homepage', () => {
      cy.visit('http://localhost:3000/');
    });

    it('contains "BLOG - Chris Martin" in the title', () => {
        cy.title().should('contain', 'BLOG - Chris Martin');
    });

    it('navbar is suitable for ipad size and up to desktop', () => {
        cy.viewport('ipad-mini');
        cy.get('#nav-options').should("be.visible");
    });

});

describe('Nav bar list items loads correct pages', () => {

    beforeEach(() => {
        cy.visit('http://localhost:3000/');
    });

    it('Daily blog title on click returns to the homepage', () => {
        cy.get('.navbar-brand').click();

        cy.get('#form-signin').should("be.visible");
    });

    it('Home list item on click returns to the homepage', () => {
        cy.get('#home').click();

        cy.get('#form-signin').should("be.visible");
    });

    it('About list item on click goes to about page', () => {
        cy.get('#about').click();

        cy.url().should('contain', '/about');
    });

    it('Contact list item on click goes to about page', () => {
        cy.get('#contact').click();

        cy.url().should('contain', '/contact');
    });

});

describe('blog posts are loaded correctly', () => {

    beforeEach(() => {
        cy.visit('http://localhost:3000/');
    });

    it('blog posts are rendered on home page', () => {
        cy.get('.blog-post').should("be.visible");
        cy.get('h1').contains('Fourth blog post')
    });

    it('blog post has all relevant information', () => {
        cy.get('img').should("be.visible");
        cy.get('.postinfo-container').should("be.visible");
        cy.get('.author-read-more').should("be.visible");
    });

    it('Author name on click opens ABOUT page', () => {
        cy.get('#authorInfo').click();

        cy.url().should('contain', '/about');
    });

    it('Read more on click opens up blog post in detail', () => {

        cy.get('#readMore').click();

        cy.url().should('contain', '/posts');
    });

    it('Does not contain any markdown format in rendered blog post', () => {
        cy.get('.blog-post').should('not.have.text', '#');
    });

});

describe('Newsletter signup success', () => {

    it('Signs up valid email to newsletter', () => {
        cy.visit('http://localhost:3000/');

        cy.get('input[name=fName]').type("chris");
        cy.get('input[name=lName]').type("martin");
        cy.get('input[name=email]').type("chris@aol.com");
        cy.get('button').click();

        cy.get('.lead').should('have.text', 'There was an error. chris@aol.com Already exists in the newsletter database. Please try again.')
    });

    it('Does not sign up an invalid email to newsletter', () => {
        cy.visit('http://localhost:3000/');

        cy.get('input[name=fName]').type("chris");
        cy.get('input[name=lName]').type("martin");
        cy.get('input[name=email]').type("chris@1.com");
        cy.get('button').click();

        cy.get('.lead').should('have.text', 'There was an error. chris@1.com looks fake or invalid. Please try again.');
    });

});

describe('Authentication works correctly', () => {

    it('Does not register user without access code', () => {
        cy.visit('http://localhost:3000/register');

        cy.get('input[name=username]').type("chris@1.com");
        cy.get('input[name=password]').type("123");
        cy.get('button').click();

        cy.get('.lead').should('have.text', 'There was an error. Access code is not valid. Please try again.');
    });

    it('Registers a user with correct access code', () => {
        cy.visit('http://localhost:3000/register');

        cy.get('input[name=code]').type('test');
        cy.get('input[name=username]').type("chris@1.com");
        cy.get('input[name=password]').type("123");
        cy.get('button').click();

        cy.get('h1').should('have.text', 'Success!');
    });

    it('Logs in an authenticated user', () => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[name=username]').type("test@fakeemail.com");
        cy.get('input[name=password]').type("123");
        cy.get('button').click();

        cy.get('h1').should('have.text', 'Success!');
    });

    it('Does not log in an unauthenticated user', () => {
        cy.visit('http://localhost:3000/login');
        cy.get('input[name=username]').type("fakeemail@123.com");
        cy.get('input[name=password]').type("123");
        cy.get('button').click();

        cy.get('.lead').should('have.text', 'There was an error. Email or password is incorrect. Please try again.');
    });

});

describe('Loads correctly for mobile', () => {
    
    beforeEach(() => {
        cy.visit('http://localhost:3000/');
        cy.viewport('iphone-6');
    });

    it('Does not display desktop navbar', () => {
        cy.get('#nav-options').should("not.be.visible");
    });

    it('Does display mobile menu bars icon', () => {
        cy.get('#bars').should("be.visible");
    });

    it('Mobile nav menu toggles on click', () => {

        cy.get('#bars').click();
        cy.get('#nav-options').should("be.visible");

        cy.get('#bars').click();
        cy.get('#nav-options').should("not.be.visible");

    });

});