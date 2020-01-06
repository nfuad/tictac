import * as React from "react";

interface Props {
  value: String;
  onClick: () => any;
}

const Square = (props: Props) => (
  <button className={`square`} onClick={props.onClick}>
    {props.value}
  </button>
);

export default Square;
