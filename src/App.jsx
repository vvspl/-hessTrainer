import './App.css';
import ChessBoard from './ChessBoard.js';
import React, { Component } from 'react';
import MuiThemeProvider from 'material-ui/styles/MuiThemeProvider';
import getMuiTheme from 'material-ui/styles/getMuiTheme';
import Header from './Header.js';
import Footer from './Footer.js';
import { WindowResizeListener } from 'react-window-resize-listener';
import Dialog from 'material-ui/Dialog';
import { fenToBoard } from './Fen.js';
import FlatButton from 'material-ui/FlatButton';
import Slider from 'material-ui/Slider';
let startFen = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
let sf = null;

const chessLight = getMuiTheme({
  palette: {
    primary1Color: 'white',
    textColor: '#333',
  },
  appBar: {
    textColor: '#333',
  },
  slider: {
    trackColor: '#aaa',
    selectionColor: '#333',
  },
});

function resized(w, h) {
  if (w < 700) {
    let separators = document.getElementsByClassName('seperator');
    for (let i = 0; i < separators.length; i++) {
      let element = separators[i];
      element.style.marginTop = (-31.0 / 200.0) * w + 1443.0 / 200.0 + 'px';
    }
    let chessBoards = document.getElementsByClassName('chess-board');
    for (let i = 0; i < chessBoards.length; i++) {
      let element = chessBoards[i];
      element.style.fontSize = (1.0 / 8.0) * w - 5.0 / 8.0 + 'px';
    }
    let graves = document.getElementById('graves');
    graves.style.marginTop = (-137.0 / 300.0) * w + 337.0 + 'px';
  }
}

class App extends Component {
  constructor(props) {
    super(props);
    this.state = {
      flipped: false, // Изменено: начальное состояние flipped
      boardIndex: 0,
      newGameDiaOpen: false,
      intelligenceDiaOpen: false,
      historicalStates: [startFen],
      intelligenceLevel: localStorage.getItem('intelligenceLevel')
        ? localStorage.getItem('intelligenceLevel')
        : '10',
    };
  }

  handleToggleFlip = () => {
    this.setState({ flipped: !this.state.flipped });
  };

  requestCloseNewGame = () => {
    this.setState({ newGameDiaOpen: false });
  };
  requestOpenNewGame = () => {
    this.setState({ newGameDiaOpen: true });
  };

  getFallenOnes = () => {
    var orig = 'tJnWlNjTOoOoOoOoZ+Z+Z+Z++Z+Z+Z+ZZ+Z+Z+Z++Z+Z+Z+ZpPpPpPpPRhBqKbHr'.toLowerCase();
    var curr = fenToBoard(this.state.historicalStates[this.state.boardIndex]).toLowerCase();
    orig = orig.replace(/z/g, '');
    orig = orig.replace(/\+/g, '');
    curr = curr.replace(/z/g, '');
    curr = curr.replace(/\+/g, '');
    orig = orig.split('');
    curr = curr.split('');
    for (let i = 0; i < curr.length; i++) {
      if (orig.includes(curr[i])) orig.splice(orig.indexOf(curr[i]), 1);
    }
    return orig.join('');
  };

  handleChessMove = fen => {
    const newHistoricalStates = this.state.historicalStates.slice(0, this.state.boardIndex + 1);
    newHistoricalStates.push(fen);
    this.setState({
      boardIndex: newHistoricalStates.length - 1,
      historicalStates: newHistoricalStates,
    });
    this.getFallenOnes();
  };

  requestCloseIntelligenceDia = () => {
    this.setState({ intelligenceDiaOpen: false });
  };
  requestOpenIntelligenceDia = () => {
    this.setState({ intelligenceDiaOpen: true });
  };
  onChangeIntelligenceLevel = (event, value) => {
    localStorage.setItem('intelligenceLevel', `${value}`);
    this.setState({ intelligenceLevel: `${value}` });
  };
  handleGotoPreviousState = () => {
    if (this.state.boardIndex > 0) {
      this.setState({ boardIndex: this.state.boardIndex - 2 });
    }
  };
  handlePlayForHuman = () => {
    if (sf == null) {
      // eslint-disable-next-line
      sf = eval('stockfish');
    }
    sf.postMessage(`position fen ${this.state.historicalStates[this.state.boardIndex]}`);
    sf.postMessage(`go depth ${this.state.intelligenceLevel}`);
    const newHistoricalStates = this.state.historicalStates.slice(0, this.state.boardIndex + 1);
    this.setState({
      historicalStates: newHistoricalStates,
    });
  };
  handleGotoNextState = () => {
    if (this.state.boardIndex < this.state.historicalStates.length - 2) {
      this.setState({ boardIndex: this.state.boardIndex + 2 });
    }
  };
  requestCreateNewGame = () => {
    this.setState({ newGameDiaOpen: false, boardIndex: 0, historicalStates: [startFen] });
  };

  render() {
    const newGameActions = [
      <FlatButton
        label="Cancel"
        primary={true}
        style={{ color: '#333' }}
        onClick={this.requestCloseNewGame}
      />,
      <FlatButton
        label="OK"
        primary={true}
        style={{ color: '#333' }}
        onClick={this.requestCreateNewGame}
      />,
    ];

    const intelligenceActions = [
      <FlatButton
        label="Cancel"
        primary={true}
        style={{ color: '#333' }}
        onClick={this.requestCloseIntelligenceDia}
      />,
      <FlatButton
        label="OK"
        primary={true}
        style={{ color: '#333' }}
        onClick={this.requestCloseIntelligenceDia}
      />,
    ];

    return (
      <MuiThemeProvider muiTheme={getMuiTheme(chessLight)}>
        <div className="App">
          <Header
            requestOpenNewGame={this.requestOpenNewGame}
            requestOpenIntelligenceDia={this.requestOpenIntelligenceDia}
          />
          <WindowResizeListener
            onResize={windowSize => {
              resized(windowSize.windowWidth, windowSize.windowHeight);
            }}
          />
          <div className="chess-wrapper">
            <FlatButton
              label="Перевернуть доску"
              primary={true}
              style={{ color: '#333' }}
              onClick={this.handleToggleFlip}
            />
            <ChessBoard
              onMove={this.handleChessMove}
              intelligenceLevel={this.state.intelligenceLevel}
              board={this.state.historicalStates[this.state.boardIndex]}
              flipped={this.state.flipped}
            />
          </div>
          <Dialog
            title="New Game"
            actions={newGameActions}
            modal={false}
            open={this.state.newGameDiaOpen}
            onRequestClose={this.handleClose}
          >
            Start a new game?
          </Dialog>
          <Dialog
            title="Artificial Intelligence Settings"
            actions={intelligenceActions}
            modal={false}
            open={this.state.intelligenceDiaOpen}
            onRequestClose={this.requestCloseIntelligenceDia}
          >
            <div className="label">Depth {this.state.intelligenceLevel}</div>
            <Slider
              step={1}
              value={this.state.intelligenceLevel}
              min={1}
              max={20}
              defaultValue={this.state.intelligenceLevel}
              onChange={this.onChangeIntelligenceLevel}
            />
          </Dialog>
          <Footer
            fallenOnes={this.getFallenOnes()}
            playForHuman={this.handlePlayForHuman}
            gotoPreviousState={this.handleGotoPreviousState}
            gotoNextState={this.handleGotoNextState}
          />
        </div>
      </MuiThemeProvider>
    );
  }
}

export default App;
