import React from 'react'
import * as BooksAPI from './api/BooksAPI'
import './App.css'
import { Link } from 'react-router-dom'
import { Route } from 'react-router-dom'
import BookShelfComponent from './components/BookShelfComponent'

class BooksApp extends React.Component {
  state = {
    /**
     * TODO: Instead of using this state variable to keep track of which page
     * we're on, use the URL in the browser's address bar. This will ensure that
     * users can use the browser's back and forward buttons to navigate between
     * pages, as well as provide a good URL they can bookmark and share.
     */
    showSearchPage: false,
    availableBooks:[],
    shelves: [
           {
             'id':'currentlyReading',
             'name':'Reading now'
           },
           {
             'id':'read',
             'name':'Already read'
           },
           {
             'id':'wantToRead',
             'name':'Want to Read'
           }
         ],
    myBooks: [],
    searchResults: []
    }

  // get only the fields that we want
  getBookInfo = (bookRaw) => {
    var r = {
      'title': bookRaw.title,
      'cover_url': bookRaw.imageLinks.thumbnail,
      'shelf': bookRaw.shelf,
      'id': bookRaw.id
    }
    if (bookRaw.authors) {
      r['author'] = bookRaw.authors.join(", ")
    } else {
      r['author'] = 'Unknown'
    }
    return r
  }

  // initialize the data
  componentDidMount() {
    BooksAPI.getAll().then((books) => {
        console.log(books)
        if ("error" in books) {
          this.setState({ myBooks: []
          })
          return
        }
        // map the results to books objects
        let result = books.map( (book) => this.getBookInfo(book) );

        // save the search "shelf" into the variable
        this.setState({
          myBooks: result
        })
      })
    }

  // get all the books that belong to a specific shelf
  getShelfBooks = (shelfId) => {
    var ret = this.state.myBooks.filter((book) => book.shelf===shelfId)

    return ret || []
  }

  // update local database with the new book setup
  updateLocal = (book, shelf) => {
    var objIndex = this.state.myBooks.findIndex((item => item.id === book.id));

    // check if it updating or removing
    if (objIndex>-1) {
      // the book is on my shelf already. Update to the new shelf
      this.setState((state) => {
          state.myBooks[objIndex].shelf = shelf
      })
    } else {
      if (shelf) {
        // not in my books. remove from the search and add to the shelf
        objIndex = this.state.searchResults.findIndex((item => item.id === book.id));
        book.shelf = shelf

        // add object
        this.setState((state) => {
            state.myBooks.push(book)
            state.searchResults.splice(objIndex, 1)
        })
      } else {
        // remove object
        this.setState((state) => {
            state.myBooks.splice(objIndex, 1)
        })
      }
    }
  }

  // change the shelf remotely and locally only if the remote was done
  changeShelf = (shelf, book) => {
    // update the server and continue only if it was ok
    BooksAPI.update(book, shelf).then( (ret) => {
      console.log(ret)
      if ("error" in ret) {
        window.alert("Error updating remotely");
        return
      }

      // update locally
      this.updateLocal(book, shelf)
    })
  }

  resetSearch = () => {
    this.setState({ searchResults: []
    })
  }
  searchMovie = (query) => {
    // reset if query is empty
    if (query ==='') {
      this.resetSearch()
      return
    }

    // search for the book
    BooksAPI.search(query, 10).then( (books) => {
      //console.log(books)
      if ("error" in books) {
        this.setState({ searchResults: []
        })
        return
      }
      // map the results to books objects
      let result = books.map( (book) => {
          var r = {
            'title': book.title,
            'cover_url': book.imageLinks.thumbnail,
            'shelf': book.shelf,
            'id': book.id
          }
          if (book.authors) {
            r['author'] = book.authors.join(", ")
          } else {
            r['author'] = 'Unknown'
          }
          return r
        });

      // save the search "shelf" into the variable
      this.setState({
        searchResults: result
      })
    })
  }

  render() {
    return (

      <div className="app">
        <Route path='/search' render={() => (
          <div className="search-books">
            <div className="search-books-bar">
              <Link className="close-search" to="/">Close</Link>
              <div className="search-books-input-wrapper">
                <input type="text" placeholder="Search by title or author"
                  onChange={(event) => this.searchMovie(event.target.value)}/>
              </div>
            </div>
            <div className="search-books-results">
              <ol className="books-grid">
                <BookShelfComponent
                    books={this.state.searchResults}
                    key={'search'}
                    name='Search'
                    changeShelf={this.changeShelf}/>
              </ol>
            </div>
          </div>
        )}/>
        <Route exact path='/' render={() => (
          <div className="list-books">
            <div className="list-books-title">
              <h1>MyReads</h1>
            </div>
            <div className="list-books-content">
                {this.state.shelves.map( (shelf)=> {
                  return (<BookShelfComponent
                          books={this.getShelfBooks(shelf.id)}
                          name={shelf.name}
                          key={shelf.name}
                          changeShelf={this.changeShelf}/>)
                })}
            </div>
            <div className="open-search">
              <Link to="/search">Add a book</Link>
            </div>
          </div>
        )}/>
      </div>
    )
  }
}

export default BooksApp
