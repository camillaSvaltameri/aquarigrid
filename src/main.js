"use strict";

let config = {
    type: Phaser.AUTO,
    width: 1024,
    height: 1024,
    parent: "phaser-game",
    backgroundColor: "#000000",

    pixelArt: true,
    antialias: false,
    roundPixels: true,

    scene: [Swipe]
};

let game = new Phaser.Game(config);