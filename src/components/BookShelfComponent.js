import React from 'react'
import PropTypes from 'prop-types'
import BookComponent from './BookComponent'
import sortBy from 'sort-by'

class BookShelfComponent extends React.Component {
  static propTypes = {
    books: PropTypes.array.isRequired,
    name: PropTypes.string.isRequired,
    changeShelf: PropTypes.func.isRequired
  }

  render () {
    //console.log(this.props)
    const { books, name, changeShelf } = this.props

    let orderedBooks = books
    orderedBooks.sort(sortBy('title'))

    return (
      <div className="bookshelf">
        <h2 className="bookshelf-title">{name}</h2>
        <div className="bookshelf-books">
          <ol className="books-grid">
            {orderedBooks.map((book) => (
            <li key={book.title + book.author}>
              <BookComponent
                book={book}
                changeShelf={changeShelf}
              />
            </li>
          ))}
          </ol>
        </div>
      </div>
    )
  }
}

export default BookShelfComponent
