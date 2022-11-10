/** Integration tests for books route */

process.env.NODE_ENV = "test"

const request = require("supertest");

const app = require("../app");
const db = require("../db");

// isbn of sample book
let book_isbn;

beforeEach(async() => {
    let result = await db.query(`
        INSERT INTO 
            books(isbn, amazon_url, author, language, pages, publisher, title, year)
            VALUES(
                '123432122',
                'https://amazon.com/taco',
                'Elie',
                'English',
                100,
                'Nothing publishers',
                'my first book', 
                2008
            )
        RETURNING isbn`);
    book_isbn = result.rows[0].isbn
});

describe("POST /books", function() {
    test("Creates a new book", async function() {
        const response = await request(app)
            .post('/books')
            .send({
                isbn: '32794782',
                amazon_url: "https://taco.com",
                author: "test",
                language: "english",
                pages: 1000,
                publisher: "huge publishing",
                title: "huge title",
                year: 2022
            });
        expect(response.statusCode).toBe(201);
        expect(response.body.book).toHaveProperty("isbn");
    });

    test("Prevents a book creation without required title", async function() {
        const response = await request(app)
            .post(`/books`)
            .send({year: 2022});
        expect(response.statusCode).toBe(400);
    });
});

describe("GET /books", function() {
    test("GET a list of 1 book", async function() {
        const response = await request(app)
            .get(`/books`);
        const books = response.body.books;
        expect(books).toHaveLength(1);
        expect(books[0]).toHaveProperty("isbn");
        expect(books[0]).toHaveProperty("amazon_url");
    });
});

describe("GET /books/:isbn", function() {
    test("Gets a single book", async function() {
        const response = await request(app)
            .get(`/books/${book_isbn}`);
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.body.book.isbn).toBe(book_isbn);
    });

    test("Responds with 404 if no book is found", async function() {
        const response = await request(app)
            .get(`/books/9999`);
        expect(response.statusCode).toBe(404);
    });
});

describe("PUT /books/:isbn", function() {
    test("Updates a single book", async function() {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                amazon_url: "https://burrito.com",
                author: "chipotle",
                language: "spanish",
                pages: 1000,
                publisher: "deez publishes",
                title: "BOOK UPDATED",
                year: 2022
            });
        expect(response.body.book).toHaveProperty("isbn");
        expect(response.statusCode).toBe(200);
        expect(response.body.book.title).toBe("BOOK UPDATED");
    });

    test("Prevents a bad book update", async function() {
        const response = await request(app)
            .put(`/books/${book_isbn}`)
            .send({
                isbn: "32794782",
                badField: "Do not add me!",
                amazon_url: "https://banana.com",
                author: "peepee",
                language: "espanol",
                pages: 1,
                publisher: "chemistry publishers",
                title: "bad update",
                year: 1995
            });
        expect(response.statusCode).toBe(400);
    });

    test("Responds with 404 if no book can be found", async function() {
        const response = await request(app)
            .delete(`/books/69420`)
        expect(response.statusCode).toBe(404);
    });
});

describe("DELETE /books/:isbn", function() {
    test("DELETES a single book", async function() {
        const response = await request(app)
            .delete(`/books/${book_isbn}`)
        expect(response.statusCode).toBe(200);
        expect(response.body).toEqual({message: "Book deleted"});
    });
});

afterEach(async function() {
    await db.query("DELETE FROM books");
});

afterAll(async function() {
    db.end()
});