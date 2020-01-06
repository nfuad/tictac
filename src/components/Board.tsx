import * as React from "react";

// custom imports
import Square from "./Square";

interface Props {
  squares: any;
  onClick: (number) => any;
}

export default (props: Props) => {
  // Create the 3 x 3 board
  const createBoard = (row: number, col: number) => {
    const board = [];
    let cellCounter = 0;

    for (let i = 0; i < row; i += 1) {
      const columns = [];
      for (let j = 0; j < col; j += 1) {
        columns.push(renderSquare(cellCounter++));
      }
      board.push(
        <div key={i} className="board-row">
          {columns}
        </div>
      );
    }

    return board;
  };

  const renderSquare = (i: number) => {
    return (
      <Square
        key={i}
        value={props.squares[i]}
        onClick={() => props.onClick(i)}
      />
    );
  };

  return <div className="board">{createBoard(3, 3)}</div>;
};
