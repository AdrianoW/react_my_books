import React from 'react'
import * as BooksAPI from './api/BooksAPI'
import './App.css'
import { Link } from 'react-router-dom'
import { Route } from 'react-router-dom'
import BookShelfComponent from './components/BookShelfComponent'

class BooksApp extends React.Component {
  state = {
    myBooks: [],
    searchResults: []
    }

  // the libs I have
  shelves = [
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
       ]

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

  // get my books from server
  getMyBooks = () => {
    BooksAPI.getAll().then((books) => {
        //console.log(books)
        if ("error" in books) {
          this.setState({ myBooks: []
          })
          return
        }
        // map the results to books objects
        let result = books.map( (book) => this.getBookInfo(book) );

        // save the search "shelf" into the variable and reset search
        this.setState({
          myBooks: result,
          searchResults: []
        })
      })
  }

  // initialize the data
  componentDidMount() {
    this.getMyBooks()
    }

  // get all the books that belong to a specific shelf
  getShelfBooks = (shelfId) => {
    var ret = this.state.myBooks.filter((book) => book.shelf===shelfId)
    return ret || []
  }

  updateLocal = (book, shelf) => {
      let objIndex = this.state.myBooks.findIndex((item => item.id === book.id));

      book.shelf = shelf
      this.setState((state) => {
          if(objIndex>1) {
            state.myBooks.splice(objIndex, 1)
          }
          state.myBooks.push(book)
      })
  }

  // change the shelf remotely and locally only if the remote was done
  changeShelf = (shelf, book) => {
    // update the server and continue only if it was ok
    BooksAPI.update(book, shelf).then( (ret) => {
      //console.log(ret)
      if ("error" in ret) {
        window.alert("Error updating remotely");
        return
      }

      // update locally
      this.updateLocal(book, shelf)
      let objIndex = this.state.searchResults.findIndex((item => item.id === book.id));

      // add object
      this.setState((state) => {
          state.searchResults.splice(objIndex, 1)
      })
    })
  }

  // set the search result to empty
  resetSearch = () => {
    this.setState({ searchResults: []
    })
  }

  // get the books from server according to the search query
  searchBook = (query) => {
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

      // create a map to speed up checking
      let mbm = {}
      this.state.myBooks.forEach( (book, idx) => { mbm[book.id] = idx; })

      // map the results to books objects
      let result = books.map( (book) => {
          // add the current state or the faulty search
          // this is a bug in the API, where the books should have
          // my state, not a random one.
          let exists = book.id in mbm
          if (!exists) {
            return this.getBookInfo(book)
          }
          else {
            return this.state.myBooks[mbm[book.id]]
          }
        })

      // save the search "shelf" into the variable
      this.setState({
        searchResults: result
      })
    })
  }

  // returns to main screen
  backFromSearch = () => {
    this.resetSearch()
  }

  // main funciton
  render() {
    return (

      <div className="app">
        <Route path='/search' render={() => (
          <div className="search-books">
            <div className="search-books-bar">
              <Link className="close-search" onClick={() => this.backFromSearch()} to="/">Close</Link>
              <div className="search-books-input-wrapper">
                <input type="text" placeholder="Search by title or author"
                  onChange={(event) => this.searchBook(event.target.value)}/>
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
                {this.shelves.map( (shelf)=> {
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
