import { LobbyScene } from "./LobbyScene.js";
import { NameScene } from "./NameScene.js";
import { ClientTetris } from "./Tetris/ClientTetris/ClientTetris.js";

var config: Phaser.Types.Core.GameConfig = {
  width: 1920,
  height: 1080,
  type: Phaser.CANVAS,
  parent: 'game',
  scene: [NameScene, LobbyScene, ClientTetris],
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH
  },
  dom: {
    createContainer: true
  },
  physics: {

    default: "arcade",
    arcade: {
      debug: false
    }
  }
};

new Phaser.Game(config);
