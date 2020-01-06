import * as React from "react";
import PubNubReact from "pubnub-react";
import Swal from "sweetalert2";
import shortid from "shortid";

// custom imports
import Game from "./Game";
import Board from "./Board";
import "../styles/game.css";

// sound effects
const noteLow = require("../sounds/note-low.mp3");

interface State {
  piece: string;
  isPlaying: boolean;
  isRoomCreator: boolean;
  isDisabled: boolean;
  myTurn: boolean;
  showInfo: boolean;
}
export default class App extends React.Component<{}, State> {
  private pubnub: any;
  private lobbyChannel: any;
  private gameChannel: any;
  private roomId: any;

  constructor(props: any) {
    super(props);
    this.pubnub = new PubNubReact({
      publishKey: "pub-c-b7d9ac6b-548a-4134-9016-c664ed0b3356",
      subscribeKey: "sub-c-a288fec2-3083-11ea-9e12-76e5f2bf83fc"
    });

    this.state = {
      piece: "",
      isPlaying: false,
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false,
      showInfo: true
    };

    this.lobbyChannel = null;
    this.gameChannel = null;
    this.roomId = null;
    this.pubnub.init(this);
  }

  componentWillUnmount() {
    this.pubnub.unsubscribe({
      channels: [this.lobbyChannel, this.gameChannel]
    });
  }

  componentDidUpdate() {
    // Check that the player is connected to a channel
    if (this.lobbyChannel != null) {
      this.pubnub.getMessage(this.lobbyChannel, msg => {
        // Start the game once an opponent joins the channel
        if (msg.message.notRoomCreator) {
          const audio = new Audio(noteLow);
          audio.play();

          // Create a different channel for the game
          this.gameChannel = "tictactoegame--" + this.roomId;

          this.pubnub.subscribe({
            channels: [this.gameChannel]
          });

          this.setState({
            isPlaying: true
          });

          // Close the modals if they are opened
          Swal.close();
        }
      });
    }
  }

  // Create a room channel
  onPressCreate = e => {
    // Create a random name for the channel
    this.roomId = shortid.generate().substring(0, 5);
    this.lobbyChannel = "tictactoelobby--" + this.roomId;

    this.pubnub.subscribe({
      channels: [this.lobbyChannel],
      withPresence: true
    });

    // Open the modal
    Swal.fire({
      title: "Share this room ID with your friend",
      text: this.roomId,
      customClass: {
        confirmButton: "confirmation-button"
      }
    });

    this.setState({
      piece: "X",
      isRoomCreator: true,
      isDisabled: true, // Disable the 'Create' button
      myTurn: true, // Room creator makes the 1st move
      showInfo: false
    });
  };

  // The 'Join' button was pressed
  onPressJoin = e => {
    Swal.fire({
      input: "text",
      inputPlaceholder: "Enter Room ID",
      customClass: {
        confirmButton: "confirmation-button"
      }
    }).then(result => {
      // Check if the user typed a value in the input field
      if (result.value) {
        this.joinRoom(result.value);
      }
    });
    this.setState({ showInfo: false });
  };

  // Join a room channel
  joinRoom = value => {
    this.roomId = value;
    this.lobbyChannel = "tictactoelobby--" + this.roomId;

    // Check the number of people in the channel
    this.pubnub
      .hereNow({
        channels: [this.lobbyChannel]
      })
      .then(response => {
        if (response.totalOccupancy < 2) {
          this.pubnub.subscribe({
            channels: [this.lobbyChannel],
            withPresence: true
          });

          this.setState({
            piece: "O"
          });

          this.pubnub.publish({
            message: {
              notRoomCreator: true
            },
            channel: this.lobbyChannel
          });
        } else {
          // Game in progress
          Swal.fire({
            title: "Error",
            text: "Game in progress. Try another room.",
            customClass: {
              confirmButton: "confirmation-button"
            }
          });
        }
      })
      .catch(error => {
        console.log(error);
      });
  };

  // Reset everything
  endGame = () => {
    this.setState({
      piece: "",
      isPlaying: false,
      isRoomCreator: false,
      isDisabled: false,
      myTurn: false
    });

    this.lobbyChannel = null;
    this.gameChannel = null;
    this.roomId = null;

    this.pubnub.unsubscribe({
      channels: [this.lobbyChannel, this.gameChannel]
    });
  };

  render() {
    return (
      <div className="wrapper">
        <div
          className="info"
          style={{ display: !this.state.showInfo ? "none" : "block" }}
        >
          <h1>Multiplayer Tic Tac Toe Game</h1>
          <p>
            Create a private room and share the room id with your friend. Ask
            your friend to join the room with that id. Start playing and have
            fun!
          </p>
          <div className="button-container">
            <button
              className="create-button"
              disabled={this.state.isDisabled}
              onClick={e => this.onPressCreate(e)}
            >
              {" "}
              Create Room
            </button>
            <button className="join-button" onClick={e => this.onPressJoin(e)}>
              {" "}
              Join Room
            </button>
          </div>
        </div>

        {!this.state.isPlaying && (
          <div className="game">
            <div className="board">
              <Board squares={0} onClick={index => null} />
            </div>
          </div>
        )}

        {this.state.isPlaying && (
          <Game
            pubnub={this.pubnub}
            gameChannel={this.gameChannel}
            piece={this.state.piece}
            isRoomCreator={this.state.isRoomCreator}
            myTurn={this.state.myTurn}
            endGame={this.endGame}
          />
        )}
      </div>
    );
  }
}
