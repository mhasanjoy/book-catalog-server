# Book Catalog Server

## Application Routes:

### Book

```
/books (POST)
/books (GET all)
/recently-added-books (GET 10 most recent)
/books/65765928e2e1fe602fc13c41 (GET by id)
/books/6576595be2e1fe602fc13c42 (PATCH)
/books/657659dbe2e1fe602fc13c43 (DELETE)
```

Filtering routes of Books

```
/books?genre=Memoir (GET)
/books?publicationYear=2000 (GET)
/books?search=James (GET)
```

### Reviews of Books

```
/reviews/6576595be2e1fe602fc13c42 (POST)
/reviews/6576595be2e1fe602fc13c42 (GET)
```

### Wishlist

```
/users/m.hasanjoy13@gmail.com/wishlist (POST)
/users/m.hasanjoy13@gmail.com/status/6576595be2e1fe602fc13c42 (GET status)
/users/m.hasanjoy13@gmail.com/wishlist (GET all)
/users/m.hasanjoy13@gmail.com/wishlist/657659dbe2e1fe602fc13c43 (DELETE)
```

## [Live Site](https://book-catalog-server-mhasanjoy.vercel.app/)

## [Client](https://book-catalog-524b1.web.app/)
