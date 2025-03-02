import { useState, useEffect } from 'react';
import './App.css';

// セルの状態を表す型定義
type CellState = {
  isMine: boolean;
  isRevealed: boolean;
  isFlagged: boolean;
  adjacentMines: number;
};

// ゲームの状態を表す型定義
type GameStatus = 'playing' | 'won' | 'lost';

function App() {
  // 定数定義
  const ROWS = 16;
  const COLS = 16;
  const TOTAL_MINES = 30;

  // ゲームの状態を管理するstate
  const [board, setBoard] = useState<CellState[][]>([]);
  const [gameStatus, setGameStatus] = useState<GameStatus>('playing');
  const [minesLeft, setMinesLeft] = useState(TOTAL_MINES);
  const [firstClick, setFirstClick] = useState(true);

  // ゲームボードの初期化
  useEffect(() => {
    initializeBoard();
  }, []);

  // ボードを初期化する関数
  const initializeBoard = () => {
    // 空のボードを作成
    const newBoard: CellState[][] = Array(ROWS).fill(null).map(() =>
      Array(COLS).fill(null).map(() => ({
        isMine: false,
        isRevealed: false,
        isFlagged: false,
        adjacentMines: 0
      }))
    );

    setBoard(newBoard);
    setGameStatus('playing');
    setMinesLeft(TOTAL_MINES);
    setFirstClick(true);
  };

  // 地雷を配置する関数（最初にクリックしたセルには配置しない）
  const placeMines = (firstRow: number, firstCol: number) => {
    const newBoard = [...board];
    let minesPlaced = 0;

    while (minesPlaced < TOTAL_MINES) {
      const row = Math.floor(Math.random() * ROWS);
      const col = Math.floor(Math.random() * COLS);

      // 最初にクリックしたセルとその周囲8マスには地雷を配置しない
      const isSafeZone = Math.abs(row - firstRow) <= 1 && Math.abs(col - firstCol) <= 1;
      
      if (!newBoard[row][col].isMine && !isSafeZone) {
        newBoard[row][col].isMine = true;
        minesPlaced++;
      }
    }

    // 各セルの周囲の地雷数を計算
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        newBoard[row][col].adjacentMines = countAdjacentMines(newBoard, row, col);
      }
    }

    setBoard(newBoard);
  };

  // セル周囲の地雷数をカウントする関数
  const countAdjacentMines = (board: CellState[][], row: number, col: number) => {
    let count = 0;
    for (let i = -1; i <= 1; i++) {
      for (let j = -1; j <= 1; j++) {
        const newRow = row + i;
        const newCol = col + j;
        if (
          newRow >= 0 && newRow < ROWS &&
          newCol >= 0 && newCol < COLS &&
          board[newRow][newCol].isMine
        ) {
          count++;
        }
      }
    }
    return count;
  };

  // セルをクリックした時の処理
  const handleCellClick = (row: number, col: number) => {
    // ゲームが終了している場合や、既に開いているセル、旗が立っているセルは何もしない
    if (gameStatus !== 'playing' || board[row][col].isRevealed || board[row][col].isFlagged) {
      return;
    }

    // 最初のクリック時に地雷を配置
    if (firstClick) {
      placeMines(row, col);
      setFirstClick(false);
    }

    const newBoard = [...board];
    
    // 地雷をクリックした場合
    if (newBoard[row][col].isMine) {
      newBoard[row][col].isRevealed = true;
      setBoard(newBoard);
      setGameStatus('lost');
      revealAllMines();
      return;
    }

    // 通常のセルをクリック
    revealCell(newBoard, row, col);
    setBoard(newBoard);

    // 勝利条件の確認
    checkWinCondition();
  };

  // セルを右クリックした時の処理（旗を立てる/外す）
  const handleCellRightClick = (e: React.MouseEvent, row: number, col: number) => {
    e.preventDefault();  // コンテキストメニューを表示しない
    
    if (gameStatus !== 'playing' || board[row][col].isRevealed) {
      return;
    }

    const newBoard = [...board];
    if (newBoard[row][col].isFlagged) {
      newBoard[row][col].isFlagged = false;
      setMinesLeft(minesLeft + 1);
    } else {
      newBoard[row][col].isFlagged = true;
      setMinesLeft(minesLeft - 1);
    }
    
    setBoard(newBoard);
  };

  // セルを再帰的に開く処理
  const revealCell = (board: CellState[][], row: number, col: number) => {
    if (
      row < 0 || row >= ROWS || 
      col < 0 || col >= COLS || 
      board[row][col].isRevealed || 
      board[row][col].isFlagged
    ) {
      return;
    }

    board[row][col].isRevealed = true;

    // 周囲に地雷がなければ、周囲のセルも再帰的に開く
    if (board[row][col].adjacentMines === 0) {
      for (let i = -1; i <= 1; i++) {
        for (let j = -1; j <= 1; j++) {
          revealCell(board, row + i, col + j);
        }
      }
    }
  };

  // すべての地雷を表示する
  const revealAllMines = () => {
    const newBoard = [...board];
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        if (newBoard[row][col].isMine) {
          newBoard[row][col].isRevealed = true;
        }
      }
    }
    setBoard(newBoard);
  };

  // 勝利条件の確認
  const checkWinCondition = () => {
    for (let row = 0; row < ROWS; row++) {
      for (let col = 0; col < COLS; col++) {
        // 地雷でないセルがまだ開かれていない場合はゲーム続行
        if (!board[row][col].isMine && !board[row][col].isRevealed) {
          return;
        }
      }
    }
    // すべての非地雷セルが開かれている場合は勝利
    setGameStatus('won');
  };

  // セルの内容を表示する関数
  const renderCell = (cell: CellState) => {
    if (cell.isFlagged) {
      return '🚩';
    }
    if (!cell.isRevealed) {
      return null;
    }
    if (cell.isMine) {
      return '💣';
    }
    if (cell.adjacentMines === 0) {
      return null;
    }
    return cell.adjacentMines;
  };

  // セルのクラスを決定する関数
  const getCellClass = (cell: CellState) => {
    let cellClass = 'cell';
    if (cell.isRevealed) {
      cellClass += ' revealed';
      if (cell.isMine) {
        cellClass += ' mine';
      } else {
        cellClass += ` count-${cell.adjacentMines}`;
      }
    }
    return cellClass;
  };

  return (
    <div className="minesweeper">
      <div className="game-info">
        <div className="mines-left">🚩 {minesLeft}</div>
        <button className="reset-button" onClick={initializeBoard}>
          {gameStatus === 'playing' ? '😊' : gameStatus === 'won' ? '😎' : '😵'}
        </button>
        <div className="game-status">
          {gameStatus === 'playing' ? 'ゲーム中' : gameStatus === 'won' ? '勝ち！' : '負け！'}
        </div>
      </div>
      <div className="board">
        {board.map((row, rowIndex) => (
          <div key={rowIndex} className="row">
            {row.map((cell, colIndex) => (
              <div
                key={`${rowIndex}-${colIndex}`}
                className={getCellClass(cell)}
                onClick={() => handleCellClick(rowIndex, colIndex)}
                onContextMenu={(e) => handleCellRightClick(e, rowIndex, colIndex)}
              >
                {renderCell(cell)}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

export default App;
