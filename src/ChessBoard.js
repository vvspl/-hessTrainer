import React, { Component } from 'react';
import { fenToBoard } from './Fen.js';
let Chess = require('./chess.js').Chess;
let sf = null;

function showThinkingBar(value) {
  const bar = document.getElementById('thinking-bar');
  if (bar) {
    bar.style.height = '2px';
    bar.style.opacity = value ? '1' : '0';
  }
}

class ChessBoard extends Component {
  constructor(props) {
    super(props);
    this.state = { selectMode: false, from: '', to: '', userColor: 'w', flipped: false };

    let chess = new Chess();
    if (this.state.userColor === 'b') {
      // если первый ход за чёрных, AI делает ход
      let moves = chess.moves();
      let move = moves[Math.floor(Math.random() * moves.length)];
      chess.move(move);
      this.props.onMove(chess.fen());
    }
  }

  refreshBoard(board) {
    for (let row = 0; row < board.length; row++) {
      for (let col = 0; col < board[row].length; col++) {
        const cell = board[row][col];
        const cellId = 'cell-' + String.fromCharCode(97 + col) + -1 * (row - 8);
        const el = document.getElementById(cellId);
        if (el) el.classList.remove('selectable'); // сброс

        if (cell != null && (cell.color === this.state.userColor || true)) {
          if (el) el.classList.add('selectable'); // все фигуры можно выбрать
        }
      }
    }
  }

  componentDidMount() {
    let chess = new Chess(this.props.board);
    this.refreshBoard(chess.board());
    this.forceUpdate();
  }

  nextState(cellCode) {
    let chess = new Chess(this.props.board);

    if (sf == null) {
      // Инициализация Stockfish
      sf = eval('stockfish');
      sf.onmessage = event => {
        let message = event.data ? event.data : event;
        if (message.startsWith('bestmove')) {
          showThinkingBar(false);

          const move = message.split(' ')[1];
          if (move && move !== '(none)') {
            const fromCell = move.substr(0, 2);
            const toCell = move.substr(2, 2);

            const fromEl = document.getElementById('cell-' + fromCell);
            const toEl = document.getElementById('cell-' + toCell);
            if (fromEl) fromEl.classList.add('ai-suggestion-from');
            if (toEl) toEl.classList.add('ai-suggestion-to');
          }
        }
      };
    }

    if (this.state.selectMode) {
      // второй клик — куда ходить
      this.setState({ to: cellCode });
      const moves = chess.moves({ square: this.state.from, verbose: true }).map(m => m.to);
      const piece = chess.get(this.state.from);

      if (moves.includes(cellCode)) {
        // проверка превращения пешки
        if (
          (cellCode[1] === '8' && piece.type === 'p') ||
          (cellCode[1] === '1' && piece.type === 'p')
        ) {
          chess.move({ from: this.state.from, to: cellCode, promotion: 'q' });
        } else {
          chess.move({ from: this.state.from, to: cellCode });
        }

        showThinkingBar(true);
        sf.postMessage(`position fen ${chess.fen()}`);
        sf.postMessage(`go depth ${this.props.intelligenceLevel}`);
        this.props.onMove(chess.fen());
      }

      this.setState({ selectMode: false, from: '', to: '' });

      // сброс подсветок
      const allCells = document.getElementsByClassName('cell');
      for (let i = 0; i < allCells.length; i++) {
        allCells[i].className = 'cell';
      }
    } else {
      // первый клик — выбор фигуры
      const selectableCells = Array.from(document.getElementsByClassName('selectable')).map(
        el => el.id.split('-')[1],
      );
      if (selectableCells.includes(cellCode)) {
        this.setState({ from: cellCode, selectMode: true });
        const el = document.getElementById('cell-' + cellCode);
        if (el) el.classList.add('selected');

        const moves = chess.moves({ square: cellCode, verbose: true }).map(m => m.to);
        for (let i = 0; i < moves.length; i++) {
          const moveEl = document.getElementById('cell-' + moves[i]);
          if (moveEl) moveEl.classList.add('legalnext');
        }
      }
    }

    this.refreshBoard(chess.board());
  }

  render() {
    const boardArray = fenToBoard(this.props.board);
    const row = [];

    for (let i = 0; i < boardArray.length; i++) {
      if (i % 8 === 0 && i !== 0) {
        row.push(<p className="seperator" key={'sep-' + i} />);
      }
      const cellCode = String.fromCharCode(97 + (i % 8)) + String.fromCharCode(57 - (i + 1) / 8);
      row.push(
        <Cell
          key={cellCode}
          cellCode={cellCode}
          onClick={c => this.nextState(c)}
          piece={boardArray[i]}
        />,
      );
    }

    return <div className="chess-board">{row}</div>;
  }
}

class Cell extends Component {
  render() {
    return (
      <span
        id={'cell-' + this.props.cellCode}
        onClick={() => this.props.onClick(this.props.cellCode)}
        className="cell"
      >
        {this.props.piece}
      </span>
    );
  }
}

export default ChessBoard;
