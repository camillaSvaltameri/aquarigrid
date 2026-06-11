"use strict";

class Swipe extends Phaser.Scene {
    constructor() {
        super("swipeScene");
    }

    preload() {
        this.load.image("board", "./assets/board.png");
        this.load.image("anchovy", "./assets/Anchovy.png");

        for (const fish of this.getFishDefinitions()) {
            if (fish.key !== "anchovy") {
                this.load.image(fish.key, `./assets/${fish.file}`);
            }
        }

        // Tile assets
        this.load.image("worm", "./assets/worm.png");
        this.load.image("wormMove", "./assets/wormMove.png");
        this.load.image("key", "./assets/key.png");
        this.load.image("loot", "./assets/loot.png");

        // UI / item assets
        this.load.image("uiPanel", "./assets/UIpanel.png");
        this.load.image("unlockMenuBG", "./assets/unlockMenuBG.png");
        this.load.image("medKit", "./assets/medKit.png");
        this.load.image("rock", "./assets/rock.png");
        this.load.image("gold", "./assets/gold.png");
        this.load.image("gem", "./assets/gem.png");
        this.load.image("menu", "./assets/menu.png");

        // Enemy assets
        this.load.image("enemyCan", "./assets/enemyCan.png");
        this.load.image("enemyLure", "./assets/enemyLure.png");
        this.load.image("enemySeaweed", "./assets/enemySeaweed.png");
        this.load.image("enemyWaste", "./assets/enemyWaste.png");

        // Spike mechanism assets
        this.load.image("spikesHigh", "./assets/spikesHigh.png");
        this.load.image("spikesLow", "./assets/spikesLow.png");
        this.load.image("spikesDown", "./assets/spikesDown.png");
    }

    create() {
        this.boardImage = this.add.image(0, 0, "board").setOrigin(0, 0);

        this.boardImage.displayWidth = this.game.config.width;
        this.boardImage.displayHeight = this.game.config.height;

        this.textures.get("anchovy").setFilter(Phaser.Textures.FilterMode.NEAREST);

        for (const fish of this.getFishDefinitions()) {
            if (this.textures.exists(fish.key)) {
                this.textures.get(fish.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
            }
        }

        this.textures.get("worm").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("wormMove").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("key").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("loot").setFilter(Phaser.Textures.FilterMode.NEAREST);

        this.textures.get("uiPanel").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("unlockMenuBG").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("medKit").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("rock").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("gold").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("gem").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("menu").setFilter(Phaser.Textures.FilterMode.NEAREST);

        this.textures.get("enemyCan").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("enemyLure").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("enemySeaweed").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("enemyWaste").setFilter(Phaser.Textures.FilterMode.NEAREST);

        this.textures.get("spikesHigh").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("spikesLow").setFilter(Phaser.Textures.FilterMode.NEAREST);
        this.textures.get("spikesDown").setFilter(Phaser.Textures.FilterMode.NEAREST);

        // -------------------------------
        // TIMING / GAME FEEL
        // -------------------------------
        this.timing = {
            moveDuration: 260,
            tileShiftDuration: 260,
            spawnDuration: 180,

            spikeFrameDelay: 90,
            spikeMiddleHoldDelay: 180,

            turnUnlockDelay: 430,
            levelTransitionDelay: 1200,

            wormWiggleDelay: 350,

            itemFlyDuration: 420
        };

        // -------------------------------
        // GRID CALIBRATION
        // -------------------------------
        this.grid = {
            centerX: 509,
            centerY: 491,
            cellSpacingX: 186,
            cellSpacingY: 197,
            rows: 3,
            cols: 3
        };

        // -------------------------------
        // LEVEL CONFIG
        // -------------------------------
        this.levelConfig = {
            maxChests: 5,
            chestSpawnCooldown: 2,

            maxKeysOnBoard: 2,

            spikeStartsActiveChance: 0.5,

            keyNoSpawnTurns: 5,
            earlyKeyLuckyWeight: 0,

            spawnWeights: {
                spikes: 34,
                enemySeaweed: 18,
                enemyWaste: 12,
                enemyCan: 5,
                enemyLure: 1,

                worm: 25,
                loot: 8,
                key: 2
            },

            damageProfiles: {
                enemySeaweed: {
                    min: 2,
                    max: 3
                },

                enemyWaste: {
                    min: 3,
                    max: 6
                },

                enemyCan: {
                    min: 4,
                    max: 7
                },

                enemyLure: {
                    min: 8,
                    max: 12
                },

                spikes: {
                    weightedValues: [
                        { value: 2, weight: 4 },
                        { value: 3, weight: 7 },
                        { value: 4, weight: 14 },
                        { value: 5, weight: 18 },
                        { value: 6, weight: 18 },
                        { value: 7, weight: 14 },
                        { value: 8, weight: 6 },
                        { value: 9, weight: 4 },
                        { value: 10, weight: 2 },
                        { value: 11, weight: 1 },
                        { value: 12, weight: 1 }
                    ]
                }
            },

            healProfiles: {
                worm: {
                    weightedValues: [
                        { value: 1, weight: 2 },
                        { value: 2, weight: 5 },
                        { value: 3, weight: 14 },
                        { value: 4, weight: 18 },
                        { value: 5, weight: 18 },
                        { value: 6, weight: 14 },
                        { value: 7, weight: 6 },
                        { value: 8, weight: 3 },
                        { value: 9, weight: 2 },
                        { value: 10, weight: 1 }
                    ]
                }
            }
        };

        // -------------------------------
        // PERSISTENT / RUN STATE
        // -------------------------------
        this.currentLevel = 1;

        this.goldCount = 1000;
        this.gemCount = 50;

        //ACTUAL GAMEPLAY VALUES
        //this.medKitCount = 5;
        //this.rockCount = 5;
        
        //DEBUG ONLY
        this.medKitCount = 100;
        this.rockCount = 100;

        this.currentFishKey = "anchovy";

        this.unlockedFishKeys = {
            anchovy: true
        };

        this.fishPieces = {};

        for (const fish of this.getFishDefinitions()) {
            if (fish.unlockType === "drop") {
                this.fishPieces[fish.key] = 0;
            }
        }

        // -------------------------------
        // LEVEL STATE
        // -------------------------------
        this.playerHealth = 20;
        this.playerMaxHealth = 25;

        this.playerGridPos = {
            row: 1,
            col: 1
        };

        this.levelEnded = false;
        this.menuOpen = false;
        this.unlockMenuOpen = false;
        this.unlockScrollY = 0;
        this.unlockMaxScroll = 0;
        this.turnCount = 0;

        this.chestsSpawned = 0;
        this.chestsCollected = 0;
        this.keyCollected = 0;

        this.rockShieldActive = false;
        this.rockShieldSprite = null;

        this.turnsSinceLastChestSpawn = this.levelConfig.chestSpawnCooldown;

        this.isInitializingBoard = false;

        this.board = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];

        this.initializeBoard();

        const startWorldPos = this.gridToWorld(
            this.playerGridPos.row,
            this.playerGridPos.col
        );

        // -------------------------------
        // PLAYER CONTAINERS
        // -------------------------------
        this.playerContainer = this.add.container(startWorldPos.x, startWorldPos.y);
        this.playerVisualContainer = this.add.container(0, 0);

        this.player = this.add.image(0, 0, this.currentFishKey);
        this.player.setScale(5);

        this.healthText = this.add.text(
            20,
            -45,
            `${this.playerHealth}/${this.playerMaxHealth}`,
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        this.healthText.setOrigin(0, 0.5);

        this.playerVisualContainer.add([this.player, this.healthText]);

        this.playerContainer.add(this.playerVisualContainer);
        this.playerContainer.setDepth(10);

        this.startPlayerIdleFloat();

        // -------------------------------
        // UI
        // -------------------------------
        this.createUI();

        this.keys = this.input.keyboard.addKeys({
            up: Phaser.Input.Keyboard.KeyCodes.W,
            down: Phaser.Input.Keyboard.KeyCodes.S,
            left: Phaser.Input.Keyboard.KeyCodes.A,
            right: Phaser.Input.Keyboard.KeyCodes.D,
            enter: Phaser.Input.Keyboard.KeyCodes.ENTER,
            u: Phaser.Input.Keyboard.KeyCodes.U
        });

        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            if (this.unlockMenuOpen) {
                this.scrollUnlockMenu(deltaY);
            }
        });

        this.isMoving = false;

        // this.drawDebugGrid();
    }

    update() {
        if (this.menuOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.u)) {
                if (this.unlockMenuOpen) {
                    this.closeUnlockMenu();
                } else {
                    this.openUnlockMenu();
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
                this.scrollUnlockMenu(-70);
            } else if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
                this.scrollUnlockMenu(70);
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.enter)) {
                if (this.unlockMenuOpen) {
                    this.closeUnlockMenu();
                } else {
                    this.closeMenu();
                }
            }

            return;
        }

        if (this.isMoving || this.levelEnded) {
            return;
        }

        if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
            this.tryMove(-1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
            this.tryMove(1, 0);
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.left)) {
            this.tryMove(0, -1);
        } else if (Phaser.Input.Keyboard.JustDown(this.keys.right)) {
            this.tryMove(0, 1);
        }
    }

    startPlayerIdleFloat() {
        this.tweens.add({
            targets: this.playerVisualContainer,
            y: -8,
            duration: 900,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1
        });
    }

    // -------------------------------
    // UI
    // -------------------------------

    createUI() {
        this.levelText = this.add.text(
            32,
            30,
            `Level ${this.currentLevel}`,
            {
                fontFamily: "Arial",
                fontSize: "34px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 7
            }
        );

        this.levelText.setDepth(200);

        this.goldUI = this.createCounterPanel({
            x: this.game.config.width / 2 - 105,
            y: 90,
            iconKey: "gold",
            text: `${this.goldCount}`,
            side: "left",
            panelWidth: 190
        });

        this.gemUI = this.createCounterPanel({
            x: this.game.config.width / 2 + 105,
            y: 90,
            iconKey: "gem",
            text: `${this.gemCount}`,
            side: "left",
            panelWidth: 170
        });

        this.menuButton = this.add.image(
            this.game.config.width - 55,
            55,
            "menu"
        );

        this.menuButton.setDepth(210);
        this.fitSpriteToCell(this.menuButton, 58, 58);
        this.menuButton.setInteractive({ useHandCursor: true });

        this.menuButton.on("pointerdown", () => {
            this.openMenu();
        });

        this.medKitUI = this.createCounterPanel({
            x: 115,
            y: this.game.config.height - 135,
            iconKey: "medKit",
            text: `${this.medKitCount}`,
            side: "left",
            panelWidth: 180
        });

        this.rockUI = this.createCounterPanel({
            x: 115,
            y: this.game.config.height - 70,
            iconKey: "rock",
            text: `${this.rockCount}`,
            side: "left",
            panelWidth: 180
        });

        this.chestUI = this.createCounterPanel({
            x: this.game.config.width - 165,
            y: this.game.config.height - 135,
            iconKey: "loot",
            text: `${this.chestsCollected}/${this.levelConfig.maxChests}`,
            side: "right",
            panelWidth: 180
        });

        this.keyUI = this.createCounterPanel({
            x: this.game.config.width - 165,
            y: this.game.config.height - 70,
            iconKey: "key",
            text: `${this.keyCollected}/1`,
            side: "right",
            panelWidth: 180
        });

        this.medKitUI.container.setInteractive(
            new Phaser.Geom.Rectangle(-90, -30, 180, 60),
            Phaser.Geom.Rectangle.Contains
        );

        this.rockUI.container.setInteractive(
            new Phaser.Geom.Rectangle(-90, -30, 180, 60),
            Phaser.Geom.Rectangle.Contains
        );

        this.medKitUI.container.on("pointerdown", () => {
            this.useMedKit();
        });

        this.rockUI.container.on("pointerdown", () => {
            this.useRock();
        });
    }

    createCounterPanel(config) {
        const container = this.add.container(config.x, config.y);
        container.setDepth(200);

        const panelWidth = config.panelWidth || 180;

        const panel = this.add.rectangle(
            0,
            0,
            panelWidth,
            56,
            0x000000,
            0.28
        );

        panel.setStrokeStyle(2, 0xffffff, 0.18);

        const iconX = -panelWidth / 2 + 35;
        const textX = -panelWidth / 2 + 72;

        const icon = this.add.image(iconX, 0, config.iconKey);

        if (config.iconKey === "rock") {
            this.fitSpriteToCell(icon, 64, 64);
        } else if (config.iconKey === "medKit") {
            this.fitSpriteToCell(icon, 54, 54);
        } else {
            this.fitSpriteToCell(icon, 46, 46);
        }

        const text = this.add.text(
            textX,
            0,
            config.text,
            {
                fontFamily: "Arial",
                fontSize: "26px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        text.setOrigin(0, 0.5);

        container.add([panel, icon, text]);

        return {
            container: container,
            panel: panel,
            icon: icon,
            text: text
        };
    }

    updateUI() {
        this.levelText.setText(`Level ${this.currentLevel}`);

        this.goldUI.text.setText(`${this.goldCount}`);
        this.gemUI.text.setText(`${this.gemCount}`);

        this.medKitUI.text.setText(`${this.medKitCount}`);
        this.rockUI.text.setText(`${this.rockCount}`);

        this.chestUI.text.setText(`${this.chestsCollected}/${this.levelConfig.maxChests}`);
        this.keyUI.text.setText(`${this.keyCollected}/1`);
    }

    openMenu() {
        if (this.menuOpen) {
            return;
        }

        this.menuOpen = true;

        this.menuOverlay = this.add.container(
            this.game.config.width / 2,
            this.game.config.height / 2
        );

        this.menuOverlay.setDepth(500);

        const backdrop = this.add.rectangle(
            0,
            0,
            this.game.config.width,
            this.game.config.height,
            0x000000,
            0.45
        );

        this.menuText = this.add.text(
            0,
            0,
            "MENU\n\nPress U to see unlocks\nPress ENTER to go back",
            {
                fontFamily: "Arial",
                fontSize: "42px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 8
            }
        );

        this.menuText.setOrigin(0.5);

        this.menuOverlay.add([backdrop, this.menuText]);
    }

    closeMenu() {
        if (this.unlockMenuOpen) {
            this.closeUnlockMenu();
        }

        this.menuOpen = false;

        if (this.menuOverlay) {
            this.menuOverlay.destroy();
            this.menuOverlay = null;
        }
    }

    openUnlockMenu() {
        if (this.unlockMenuOpen) {
            return;
        }

        this.unlockMenuOpen = true;
        this.unlockScrollY = 0;

        if (this.menuText) {
            this.menuText.setVisible(false);
        }
    
        const centerX = this.game.config.width / 2;
        const centerY = this.grid.centerY + 20;

        this.unlockMenuOverlay = this.add.container(centerX, centerY);
        this.unlockMenuOverlay.setDepth(560);

        const bg = this.add.image(0, 0, "unlockMenuBG");
        bg.setDisplaySize(760, 620);
        bg.setAlpha(0.96);

        const title = this.add.text(
            0,
            -275,
            "fish unlocks",
            {
                fontFamily: "Arial",
                fontSize: "34px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 7
            }
        );

        title.setOrigin(0.5);

        const helperText = this.add.text(
            0,
            270,
            "mouse wheel or W/S to scroll • enter to close",
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        helperText.setOrigin(0.5);

        this.unlockListContainer = this.add.container(-305, -205);

        this.unlockMenuOverlay.add([bg, title, this.unlockListContainer, helperText]);

        this.unlockMaskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.unlockMaskGraphics.fillStyle(0xffffff);
        this.unlockMaskGraphics.fillRect(centerX - 340, centerY - 220, 680, 440);

        this.unlockListMask = this.unlockMaskGraphics.createGeometryMask();
        this.unlockListContainer.setMask(this.unlockListMask);

        this.populateUnlockList();
    }

    populateUnlockList() {
        this.unlockListContainer.removeAll(true);

        const fishList = this.getSortedFishDefinitions();
        let currentCategory = "";
        let rowY = 0;
        const rowHeight = 86;

        for (const fish of fishList) {
            const categoryLabel = this.getUnlockCategoryLabel(fish.unlockType);

            if (categoryLabel !== currentCategory) {
                currentCategory = categoryLabel;

                const categoryText = this.add.text(
                    0,
                    rowY,
                    categoryLabel,
                    {
                        fontFamily: "Arial",
                        fontSize: "22px",
                        color: "#ffeaa7",
                        stroke: "#000000",
                        strokeThickness: 5
                    }
                );

                categoryText.setOrigin(0, 0.5);
                this.unlockListContainer.add(categoryText);

                rowY += 36;
            }

            const rowContainer = this.add.container(0, rowY);

            const rowPanel = this.add.rectangle(
                305,
                0,
                610,
                74,
                0x000000,
                0.28
            );

            rowPanel.setStrokeStyle(2, 0xffffff, 0.18);

            const fishSprite = this.add.image(36, 2, fish.key);
            fishSprite.setScale(5);

            const nameText = this.add.text(
                90,
                -14,
                fish.displayName,
                {
                    fontFamily: "Arial",
                    fontSize: "22px",
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 5
                }
            );

            nameText.setOrigin(0, 0.5);

            const statusInfo = this.getFishUnlockStatusText(fish);

            const statusText = this.add.text(
                90,
                18,
                statusInfo.text,
                {
                    fontFamily: "Arial",
                    fontSize: "17px",
                    color: statusInfo.color,
                    stroke: "#000000",
                    strokeThickness: 4
                }
            );

            statusText.setOrigin(0, 0.5);

            rowContainer.add([rowPanel, fishSprite, nameText, statusText]);
            this.unlockListContainer.add(rowContainer);

            rowY += rowHeight;
        }

        const visibleHeight = 440;
        this.unlockMaxScroll = Math.max(0, rowY - visibleHeight);
        this.unlockListContainer.y = -205;
    }

    closeUnlockMenu() {
        this.unlockMenuOpen = false;

        if (this.unlockListContainer) {
            this.unlockListContainer.clearMask();
        }

        if (this.unlockMaskGraphics) {
            this.unlockMaskGraphics.destroy();
            this.unlockMaskGraphics = null;
        }

        this.unlockListMask = null;

        if (this.unlockMenuOverlay) {
            this.unlockMenuOverlay.destroy();
            this.unlockMenuOverlay = null;
        }

        this.unlockListContainer = null;

        if (this.menuText) {
            this.menuText.setVisible(true);
        }
    }

    scrollUnlockMenu(deltaY) {
        if (!this.unlockMenuOpen || !this.unlockListContainer) {
            return;
        }

        this.unlockScrollY = Phaser.Math.Clamp(
            this.unlockScrollY + deltaY,
            0,
            this.unlockMaxScroll
        );

        this.unlockListContainer.y = -205 - this.unlockScrollY;
    }

    getFishDefinitions() {
        return [
            {
                key: "anchovy",
                file: "Anchovy.png",
                displayName: "Anchovy",
                unlockType: "starter",
                piecesRequired: 0,
                dropWeight: 0,
                price: 0
            },
            {
                key: "angelfish",
                file: "Angelfish.png",
                displayName: "Angelfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "anglerfish",
                file: "Anglerfish.png",
                displayName: "Anglerfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "bass",
                file: "Bass.png",
                displayName: "Bass",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "blueAngelfish",
                file: "BlueAngelfish.png",
                displayName: "Blue Angelfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "bluegill",
                file: "Bluegill.png",
                displayName: "Bluegill",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "carp",
                file: "Carp.png",
                displayName: "Carp",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "catfish",
                file: "Catfish.png",
                displayName: "Catfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "clownfish",
                file: "Clownfish.png",
                displayName: "Clownfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "cohoSalmon",
                file: "CohoSalmon.png",
                displayName: "Coho Salmon",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "crab",
                file: "Crab.png",
                displayName: "Crab",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "flounder",
                file: "Flounder.png",
                displayName: "Flounder",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "goby",
                file: "Goby.png",
                displayName: "Goby",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "goldfish",
                file: "Goldfish.png",
                displayName: "Goldfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "greatWhiteShark",
                file: "Great White Shark.png",
                displayName: "Great White Shark",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "groper",
                file: "Groper.png",
                displayName: "Groper",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "guppy",
                file: "Guppy.png",
                displayName: "Guppy",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "jellyfish",
                file: "Jellyfish.png",
                displayName: "Jellyfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "morayEel",
                file: "Moray Eel.png",
                displayName: "Moray Eel",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "napoleonWrasse",
                file: "Napoleon Wrasse.png",
                displayName: "Napoleon Wrasse",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "neonTetra",
                file: "NeonTetra.png",
                displayName: "Neon Tetra",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "perch",
                file: "Perch.png",
                displayName: "Perch",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "pufferfish",
                file: "Pufferfish.png",
                displayName: "Pufferfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "purpleTang",
                file: "PurpleTang.png",
                displayName: "Purple Tang",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "rainbowTrout",
                file: "RainbowTrout.png",
                displayName: "Rainbow Trout",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "ribbonEel",
                file: "RibbonEel.png",
                displayName: "Ribbon Eel",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "seahorse",
                file: "Seahorse.png",
                displayName: "Seahorse",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "shrimp",
                file: "Shrimp.png",
                displayName: "Shrimp",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "silverjawMinnow",
                file: "SilverjawMinnow.png",
                displayName: "Silverjaw Minnow",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "starfish",
                file: "Starfish.png",
                displayName: "Starfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "stingray",
                file: "Stingray.png",
                displayName: "Stingray",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "surgeonfish",
                file: "Surgeonfish.png",
                displayName: "Surgeonfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "tadpole",
                file: "Tadpole.png",
                displayName: "Tadpole",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "tuna",
                file: "Tuna.png",
                displayName: "Tuna",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "upsideDownJellyfish",
                file: "UpsideDownJellyfish.png",
                displayName: "Upside Down Jellyfish",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            },
            {
                key: "yellowTang",
                file: "YellowTang.png",
                displayName: "Yellow Tang",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0
            }
        ];
    }

    getSortedFishDefinitions() {
        const categoryOrder = {
            starter: 0,
            drop: 1,
            coin: 2,
            gem: 3
        };

        return [...this.getFishDefinitions()].sort((a, b) => {
            const categoryA = categoryOrder[a.unlockType] ?? 99;
            const categoryB = categoryOrder[b.unlockType] ?? 99;

            if (categoryA !== categoryB) {
                return categoryA - categoryB;
            }

            return a.displayName.localeCompare(b.displayName);
        });
    }

    getUnlockCategoryLabel(unlockType) {
        switch (unlockType) {
            case "starter":
                return "unlocked fish";
            case "drop":
                return "random drop unlocks";
            case "coin":
                return "coin unlocks";
            case "gem":
                return "gem unlocks";
            default:
                return "other unlocks";
        }
    }

    isFishUnlocked(fishKey) {
        return this.unlockedFishKeys[fishKey] === true;
    }

    getFishUnlockStatusText(fish) {
        if (this.isFishUnlocked(fish.key)) {
            return {
                text: "unlocked",
                color: "#55ff88"
            };
        }

        if (fish.unlockType === "drop") {
            const pieces = this.fishPieces[fish.key] || 0;

            return {
                text: `locked • pieces ${pieces}/${fish.piecesRequired}`,
                color: "#d6d6d6"
            };
        }

        if (fish.unlockType === "coin") {
            return {
                text: `locked • ${fish.price} gold`,
                color: "#ffd76a"
            };
        }

        if (fish.unlockType === "gem") {
            return {
                text: `locked • ${fish.price} gems`,
                color: "#9be8ff"
            };
        }

        return {
            text: "locked",
            color: "#d6d6d6"
        };
    }

    useMedKit() {
        if (this.levelEnded || this.isMoving || this.menuOpen) {
            return;
        }

        if (this.medKitCount <= 0) {
            return;
        }

        if (this.playerHealth >= this.playerMaxHealth) {
            return;
        }

        this.medKitCount--;
        this.changePlayerHealth(10);
        this.updateUI();

        this.flyItemToPlayer("medKit", this.medKitUI.icon, () => {
            // Placeholder for later sparkle/heal animation.
        });
    }

    useRock() {
        if (this.levelEnded || this.isMoving || this.menuOpen) {
            return;
        }

        if (this.rockCount <= 0) {
            return;
        }

        if (this.rockShieldActive) {
            return;
        }

        this.rockCount--;
        this.rockShieldActive = true;
        this.updateUI();

        this.flyItemToPlayer("rock", this.rockUI.icon, () => {
            this.attachRockShieldToPlayer();
        });
    }

    flyItemToPlayer(textureKey, sourceIcon, onCompleteCallback) {
        const sourceWorld = sourceIcon.getWorldTransformMatrix();
        const startX = sourceWorld.tx;
        const startY = sourceWorld.ty;

        const targetWorld = this.getPlayerWorldPosition();

        const flyingItem = this.add.image(startX, startY, textureKey);
        flyingItem.setDepth(250);
        this.fitSpriteToCell(flyingItem, 46, 46);

        this.tweens.add({
            targets: flyingItem,
            x: targetWorld.x + 38,
            y: targetWorld.y + 8,
            scaleX: flyingItem.scaleX * 0.85,
            scaleY: flyingItem.scaleY * 0.85,
            duration: this.timing.itemFlyDuration,
            ease: "Sine.easeInOut",
            onComplete: () => {
                flyingItem.destroy();

                if (onCompleteCallback) {
                    onCompleteCallback();
                }
            }
        });
    }

    attachRockShieldToPlayer() {
        if (this.rockShieldSprite) {
            this.rockShieldSprite.destroy();
        }

        this.rockShieldSprite = this.add.image(44, 10, "rock");
        this.fitSpriteToCell(this.rockShieldSprite, 52, 52);

        this.playerVisualContainer.add(this.rockShieldSprite);
    }

    removeRockShield() {
        if (!this.rockShieldActive) {
            return;
        }

        this.rockShieldActive = false;

        if (this.rockShieldSprite) {
            this.tweens.add({
                targets: this.rockShieldSprite,
                alpha: 0,
                scaleX: this.rockShieldSprite.scaleX * 0.75,
                scaleY: this.rockShieldSprite.scaleY * 0.75,
                duration: 120,
                ease: "Sine.easeIn",
                onComplete: () => {
                    if (this.rockShieldSprite) {
                        this.rockShieldSprite.destroy();
                        this.rockShieldSprite = null;
                    }
                }
            });
        }
    }

    getPlayerWorldPosition() {
        return {
            x: this.playerContainer.x,
            y: this.playerContainer.y
        };
    }

    // -------------------------------
    // PLAYER MOVEMENT
    // -------------------------------

    tryMove(rowChange, colChange) {
        const oldRow = this.playerGridPos.row;
        const oldCol = this.playerGridPos.col;

        const newRow = oldRow + rowChange;
        const newCol = oldCol + colChange;

        if (
            newRow < 0 ||
            newRow >= this.grid.rows ||
            newCol < 0 ||
            newCol >= this.grid.cols
        ) {
            return;
        }

        this.isMoving = true;
        this.turnCount++;
        this.turnsSinceLastChestSpawn++;

        const targetTile = this.board[newRow][newCol];
        let consumedKey = false;

        if (targetTile !== null) {
            consumedKey = targetTile.type === "key";
            this.consumeTile(targetTile);
            this.board[newRow][newCol] = null;
        }

        const playerDied = this.playerHealth <= 0;

        this.playerGridPos.row = newRow;
        this.playerGridPos.col = newCol;

        const newWorldPos = this.gridToWorld(newRow, newCol);

        this.toggleAllSpikes();

        this.shiftAndRefillAfterMove(oldRow, oldCol, rowChange, colChange);

        this.tweens.add({
            targets: this.playerContainer,
            x: newWorldPos.x,
            y: newWorldPos.y,
            duration: this.timing.moveDuration,
            ease: "Sine.easeInOut"
        });

        if (this.rockShieldActive) {
            this.removeRockShield();
        }

        if (consumedKey) {
            this.time.delayedCall(this.timing.turnUnlockDelay, () => {
                this.completeLevel();
            });
        } else if (playerDied) {
            this.time.delayedCall(this.timing.turnUnlockDelay, () => {
                this.failLevel();
            });
        } else {
            this.time.delayedCall(this.timing.turnUnlockDelay, () => {
                this.isMoving = false;
            });
        }
    }

    // -------------------------------
    // LEVEL FLOW
    // -------------------------------

    completeLevel() {
        this.levelEnded = true;
        this.isMoving = true;

        this.showLevelResult("LEVEL COMPLETE");

        this.time.delayedCall(this.timing.levelTransitionDelay, () => {
            this.currentLevel++;
            this.restartLevelState();
        });
    }

    failLevel() {
        this.levelEnded = true;
        this.isMoving = true;

        this.showLevelResult("LEVEL FAILED");

        this.time.delayedCall(this.timing.levelTransitionDelay, () => {
            this.restartLevelState();
        });
    }

    showLevelResult(message) {
        if (this.levelResultOverlay) {
            this.levelResultOverlay.destroy();
        }

        this.levelResultOverlay = this.add.container(
            this.game.config.width / 2,
            this.game.config.height / 2
        );

        this.levelResultOverlay.setDepth(450);

        const overlay = this.add.rectangle(
            0,
            0,
            this.game.config.width,
            this.game.config.height,
            0x000000,
            0.35
        );

        const resultText = this.add.text(
            0,
            0,
            message,
            {
                fontFamily: "Arial",
                fontSize: "48px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 8
            }
        );

        resultText.setOrigin(0.5);

        this.levelResultOverlay.add([overlay, resultText]);
    }

    restartLevelState() {
        if (this.levelResultOverlay) {
            this.levelResultOverlay.destroy();
            this.levelResultOverlay = null;
        }

        this.clearBoard();

        this.playerHealth = 20;
        this.updateHealthText();

        this.playerGridPos = {
            row: 1,
            col: 1
        };

        const startWorldPos = this.gridToWorld(
            this.playerGridPos.row,
            this.playerGridPos.col
        );

        this.playerContainer.setPosition(startWorldPos.x, startWorldPos.y);

        this.levelEnded = false;
        this.isMoving = false;
        this.turnCount = 0;

        this.chestsSpawned = 0;
        this.chestsCollected = 0;
        this.keyCollected = 0;

        this.rockShieldActive = false;

        if (this.rockShieldSprite) {
            this.rockShieldSprite.destroy();
            this.rockShieldSprite = null;
        }

        this.turnsSinceLastChestSpawn = this.levelConfig.chestSpawnCooldown;

        this.board = [
            [null, null, null],
            [null, null, null],
            [null, null, null]
        ];

        this.initializeBoard();
        this.updateUI();
    }

    clearBoard() {
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const tile = this.board[row][col];

                if (tile !== null) {
                    if (tile.wiggleEvent) {
                        tile.wiggleEvent.remove(false);
                        tile.wiggleEvent = null;
                    }

                    if (tile.container) {
                        tile.container.destroy();
                    }
                }
            }
        }
    }

    // -------------------------------
    // BOARD INITIALIZATION
    // -------------------------------

    initializeBoard() {
        this.isInitializingBoard = true;

        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const isPlayerCell =
                    row === this.playerGridPos.row &&
                    col === this.playerGridPos.col;

                if (!isPlayerCell) {
                    this.board[row][col] = this.createRandomTile(row, col);
                }
            }
        }

        this.isInitializingBoard = false;
    }

    createRandomTile(row, col) {
        const tileType = this.pickRandomTileType();
        return this.createTile(tileType, row, col);
    }

    pickRandomTileType() {
        const weights = this.getAdjustedSpawnWeights();

        let totalWeight = 0;

        for (const type in weights) {
            totalWeight += weights[type];
        }

        if (totalWeight <= 0) {
            return "worm";
        }

        let roll = Math.random() * totalWeight;

        for (const type in weights) {
            roll -= weights[type];

            if (roll <= 0) {
                return type;
            }
        }

        return "worm";
    }

    getAdjustedSpawnWeights() {
        const weights = { ...this.levelConfig.spawnWeights };

        if (this.isInitializingBoard) {
            weights.key = 0;
        } else if (this.turnCount <= this.levelConfig.keyNoSpawnTurns) {
            weights.key = this.levelConfig.earlyKeyLuckyWeight;
        }

        if (this.countTilesOfType("key") >= this.levelConfig.maxKeysOnBoard) {
            weights.key = 0;
        }

        if (this.chestsSpawned >= this.levelConfig.maxChests) {
            weights.loot = 0;
        }

        if (this.turnsSinceLastChestSpawn < this.levelConfig.chestSpawnCooldown) {
            weights.loot = 0;
        }

        return weights;
    }

    countTilesOfType(type) {
        let count = 0;

        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const tile = this.board[row][col];

                if (tile !== null && tile.type === type) {
                    count++;
                }
            }
        }

        return count;
    }

    createTile(type, row, col) {
        const worldPos = this.getTileWorldPosition(type, row, col);
        const textureKey = this.getTextureForTileType(type);

        const container = this.add.container(worldPos.x, worldPos.y);
        container.setDepth(3);

        const sprite = this.add.image(0, 0, textureKey);

        if (type === "worm") {
            this.fitSpriteToCell(sprite, 65, 65);
        } else if (this.isEnemyTile(type)) {
            this.fitSpriteToCell(sprite, 84, 84);
        } else {
            this.fitSpriteToCell(sprite, 85, 85);
        }

        container.add(sprite);

        const tile = {
            type: type,
            container: container,
            sprite: sprite,
            valueText: null,
            row: row,
            col: col,
            active: false,
            damage: 0,
            heal: 0,
            wiggleEvent: null,
            wormFrameIsMoving: false
        };

        if (type === "worm") {
            tile.heal = this.getHealForTileType(type);
            tile.valueText = this.createTileValueText(`${tile.heal}`, "#39ff66");
            container.add(tile.valueText);
            this.startWormWiggle(tile);
        }

        if (this.isDamageTile(type)) {
            tile.damage = this.getDamageForTileType(type);
            tile.valueText = this.createTileValueText(`${tile.damage}`, "#ff3030");
            container.add(tile.valueText);
        }

        if (type === "spikes") {
            tile.active = Math.random() < this.levelConfig.spikeStartsActiveChance;
            sprite.setTexture(tile.active ? "spikesHigh" : "spikesDown");
            this.updateSpikeDamageDisplay(tile);
        }

        if (type === "loot") {
            this.chestsSpawned++;
            this.turnsSinceLastChestSpawn = 0;
            console.log(`Chest spawned: ${this.chestsSpawned}/${this.levelConfig.maxChests}`);
        }

        return tile;
    }

    createTileValueText(text, color) {
        const valueText = this.add.text(
            20,
            -45,
            text,
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: color,
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        valueText.setOrigin(0, 0.5);

        return valueText;
    }

    isEnemyTile(type) {
        return (
            type === "enemySeaweed" ||
            type === "enemyWaste" ||
            type === "enemyCan" ||
            type === "enemyLure"
        );
    }

    isDamageTile(type) {
        return (
            type === "spikes" ||
            this.isEnemyTile(type)
        );
    }

    getDamageForTileType(type) {
        const profile = this.levelConfig.damageProfiles[type];

        if (!profile) {
            return 0;
        }

        if (profile.weightedValues) {
            return this.pickWeightedValue(profile.weightedValues);
        }

        return Phaser.Math.Between(profile.min, profile.max);
    }

    getHealForTileType(type) {
        const profile = this.levelConfig.healProfiles[type];

        if (!profile) {
            return 0;
        }

        if (profile.weightedValues) {
            return this.pickWeightedValue(profile.weightedValues);
        }

        return Phaser.Math.Between(profile.min, profile.max);
    }

    pickWeightedValue(weightedValues) {
        let totalWeight = 0;

        for (const entry of weightedValues) {
            totalWeight += entry.weight;
        }

        let roll = Math.random() * totalWeight;

        for (const entry of weightedValues) {
            roll -= entry.weight;

            if (roll <= 0) {
                return entry.value;
            }
        }

        return weightedValues[0].value;
    }

    getTextureForTileType(type) {
        switch (type) {
            case "worm":
                return "worm";
            case "key":
                return "key";
            case "loot":
                return "loot";
            case "spikes":
                return "spikesDown";
            case "enemyCan":
                return "enemyCan";
            case "enemyLure":
                return "enemyLure";
            case "enemySeaweed":
                return "enemySeaweed";
            case "enemyWaste":
                return "enemyWaste";
            default:
                return "worm";
        }
    }

    startWormWiggle(tile) {
        tile.wiggleEvent = this.time.addEvent({
            delay: this.timing.wormWiggleDelay,
            loop: true,
            callback: () => {
                if (!tile.sprite || !tile.sprite.active) {
                    return;
                }

                tile.wormFrameIsMoving = !tile.wormFrameIsMoving;
                tile.sprite.setTexture(tile.wormFrameIsMoving ? "wormMove" : "worm");
            }
        });
    }

    fitSpriteToCell(sprite, maxWidth, maxHeight) {
        const scaleX = maxWidth / sprite.width;
        const scaleY = maxHeight / sprite.height;
        const scale = Math.min(scaleX, scaleY);

        sprite.setScale(scale);
    }

    // -------------------------------
    // TILE CONSUMPTION
    // -------------------------------

    consumeTile(tile) {
        console.log(`Consumed tile: ${tile.type}`);

        if (tile.type === "worm") {
            console.log(`Heal value: ${tile.heal}`);
            this.changePlayerHealth(tile.heal);
        }

        if (this.isDamageTile(tile.type)) {
            const damageTaken = this.getEffectiveDamage(tile);

            console.log(`Damage taken: ${damageTaken}`);

            if (damageTaken > 0 && !this.rockShieldActive) {
                this.changePlayerHealth(-damageTaken);
            } else if (damageTaken > 0 && this.rockShieldActive) {
                console.log("Rock shield blocked damage.");
            }
        }

        if (tile.type === "loot") {
            this.chestsCollected++;
            console.log(`Chests collected: ${this.chestsCollected}/${this.levelConfig.maxChests}`);
            this.updateUI();
        }

        if (tile.type === "key") {
            this.keyCollected = 1;
            this.updateUI();
        }

        if (tile.wiggleEvent) {
            tile.wiggleEvent.remove(false);
            tile.wiggleEvent = null;
        }

        if (tile.container) {
            this.tweens.add({
                targets: tile.container,
                alpha: 0,
                scaleX: tile.container.scaleX * 0.75,
                scaleY: tile.container.scaleY * 0.75,
                duration: 100,
                ease: "Sine.easeIn",
                onComplete: () => {
                    if (tile.container) {
                        tile.container.destroy();
                    }
                }
            });
        }
    }

    getEffectiveDamage(tile) {
        if (tile.type === "spikes" && !tile.active) {
            return 0;
        }

        return tile.damage;
    }

    // -------------------------------
    // SHIFT / REFILL LOGIC
    // -------------------------------

    shiftAndRefillAfterMove(oldRow, oldCol, rowChange, colChange) {
        const newRow = oldRow + rowChange;
        const newCol = oldCol + colChange;

        const lShiftPath = this.getLShiftPath(oldRow, oldCol, newRow, newCol);

        if (lShiftPath !== null) {
            this.shiftAlongPathAndSpawn(lShiftPath);
            return;
        }

        if (rowChange !== 0) {
            this.shiftRowToFillEmptyCell(oldRow, oldCol);
        }

        if (colChange !== 0) {
            this.shiftColToFillEmptyCell(oldCol, oldRow);
        }
    }

    getLShiftPath(oldRow, oldCol, newRow, newCol) {
        const moveKey = `${oldRow},${oldCol}->${newRow},${newCol}`;

        const paths = {
            "1,0->2,0": [
                { row: 0, col: 2 },
                { row: 0, col: 1 },
                { row: 0, col: 0 },
                { row: 1, col: 0 }
            ],

            "1,0->0,0": [
                { row: 2, col: 2 },
                { row: 2, col: 1 },
                { row: 2, col: 0 },
                { row: 1, col: 0 }
            ],

            "1,2->2,2": [
                { row: 0, col: 0 },
                { row: 0, col: 1 },
                { row: 0, col: 2 },
                { row: 1, col: 2 }
            ],

            "1,2->0,2": [
                { row: 2, col: 0 },
                { row: 2, col: 1 },
                { row: 2, col: 2 },
                { row: 1, col: 2 }
            ],

            "0,1->0,0": [
                { row: 2, col: 2 },
                { row: 1, col: 2 },
                { row: 0, col: 2 },
                { row: 0, col: 1 }
            ],

            "0,1->0,2": [
                { row: 2, col: 0 },
                { row: 1, col: 0 },
                { row: 0, col: 0 },
                { row: 0, col: 1 }
            ],

            "2,1->2,0": [
                { row: 0, col: 2 },
                { row: 1, col: 2 },
                { row: 2, col: 2 },
                { row: 2, col: 1 }
            ],

            "2,1->2,2": [
                { row: 0, col: 0 },
                { row: 1, col: 0 },
                { row: 2, col: 0 },
                { row: 2, col: 1 }
            ]
        };

        return paths[moveKey] || null;
    }

    shiftAlongPathAndSpawn(path) {
        for (let i = path.length - 1; i > 0; i--) {
            const destination = path[i];
            const source = path[i - 1];

            this.moveTile(
                source.row,
                source.col,
                destination.row,
                destination.col
            );
        }

        const spawnCell = path[0];
        this.spawnTileAt(spawnCell.row, spawnCell.col);
    }

    shiftRowToFillEmptyCell(row, emptyCol) {
        if (emptyCol === 0) {
            this.moveTile(row, 1, row, 0);
            this.moveTile(row, 2, row, 1);
            this.spawnTileAt(row, 2);
        } else if (emptyCol === 2) {
            this.moveTile(row, 1, row, 2);
            this.moveTile(row, 0, row, 1);
            this.spawnTileAt(row, 0);
        } else {
            const fillFromLeft = Math.random() < 0.5;

            if (fillFromLeft) {
                this.moveTile(row, 0, row, 1);
                this.spawnTileAt(row, 0);
            } else {
                this.moveTile(row, 2, row, 1);
                this.spawnTileAt(row, 2);
            }
        }
    }

    shiftColToFillEmptyCell(col, emptyRow) {
        if (emptyRow === 0) {
            this.moveTile(1, col, 0, col);
            this.moveTile(2, col, 1, col);
            this.spawnTileAt(2, col);
        } else if (emptyRow === 2) {
            this.moveTile(1, col, 2, col);
            this.moveTile(0, col, 1, col);
            this.spawnTileAt(0, col);
        } else {
            const fillFromTop = Math.random() < 0.5;

            if (fillFromTop) {
                this.moveTile(0, col, 1, col);
                this.spawnTileAt(0, col);
            } else {
                this.moveTile(2, col, 1, col);
                this.spawnTileAt(2, col);
            }
        }
    }

    moveTile(fromRow, fromCol, toRow, toCol) {
        const tile = this.board[fromRow][fromCol];

        if (tile === null) {
            this.board[toRow][toCol] = null;
            return;
        }

        this.board[toRow][toCol] = tile;
        this.board[fromRow][fromCol] = null;

        tile.row = toRow;
        tile.col = toCol;

        const worldPos = this.getTileWorldPosition(tile.type, toRow, toCol);

        this.tweens.add({
            targets: tile.container,
            x: worldPos.x,
            y: worldPos.y,
            duration: this.timing.tileShiftDuration,
            ease: "Sine.easeInOut"
        });
    }

    spawnTileAt(row, col) {
        const tile = this.createRandomTile(row, col);

        const finalScaleX = tile.container.scaleX;
        const finalScaleY = tile.container.scaleY;

        tile.container.setAlpha(0);
        tile.container.setScale(finalScaleX * 0.65, finalScaleY * 0.65);

        this.tweens.add({
            targets: tile.container,
            alpha: 1,
            scaleX: finalScaleX,
            scaleY: finalScaleY,
            duration: this.timing.spawnDuration,
            delay: 80,
            ease: "Back.Out"
        });

        this.board[row][col] = tile;
    }

    // -------------------------------
    // SPIKES
    // -------------------------------

    toggleAllSpikes() {
        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const tile = this.board[row][col];

                if (tile !== null && tile.type === "spikes") {
                    const newActiveState = !tile.active;
                    this.animateSpikeTile(tile, newActiveState);
                    tile.active = newActiveState;
                    this.updateSpikeDamageDisplay(tile);
                }
            }
        }
    }

    updateSpikeDamageDisplay(tile) {
        if (tile.type !== "spikes" || !tile.valueText) {
            return;
        }

        const displayDamage = tile.active ? tile.damage : 0;
        tile.valueText.setText(`${displayDamage}`);
    }

    animateSpikeTile(tile, shouldBecomeActive) {
        if (!tile.sprite) {
            return;
        }

        const frameDelay = this.timing.spikeFrameDelay;
        const middleHold = this.timing.spikeMiddleHoldDelay;

        if (shouldBecomeActive) {
            tile.sprite.setTexture("spikesDown");

            this.time.delayedCall(frameDelay, () => {
                if (tile.sprite && tile.sprite.active) {
                    tile.sprite.setTexture("spikesLow");
                }
            });

            this.time.delayedCall(frameDelay + middleHold, () => {
                if (tile.sprite && tile.sprite.active) {
                    tile.sprite.setTexture("spikesHigh");
                }
            });
        } else {
            tile.sprite.setTexture("spikesHigh");

            this.time.delayedCall(frameDelay, () => {
                if (tile.sprite && tile.sprite.active) {
                    tile.sprite.setTexture("spikesLow");
                }
            });

            this.time.delayedCall(frameDelay + middleHold, () => {
                if (tile.sprite && tile.sprite.active) {
                    tile.sprite.setTexture("spikesDown");
                }
            });
        }
    }

    // -------------------------------
    // HEALTH
    // -------------------------------

    updateHealthText() {
        this.healthText.setText(`${this.playerHealth}/${this.playerMaxHealth}`);
    }

    setPlayerHealth(newHealth) {
        this.playerHealth = Phaser.Math.Clamp(
            newHealth,
            0,
            this.playerMaxHealth
        );

        this.updateHealthText();
    }

    changePlayerHealth(amount) {
        this.setPlayerHealth(this.playerHealth + amount);
    }

    // -------------------------------
    // GRID HELPERS
    // -------------------------------

    gridToWorld(row, col) {
        return {
            x: this.grid.centerX + (col - 1) * this.grid.cellSpacingX,
            y: this.grid.centerY + (row - 1) * this.grid.cellSpacingY
        };
    }

    getTileWorldPosition(type, row, col) {
        const worldPos = this.gridToWorld(row, col);

        if (type === "worm") {
            worldPos.y -= 18;
        }

        return worldPos;
    }

    drawDebugGrid() {
        const graphics = this.add.graphics();
        graphics.lineStyle(3, 0xff0000, 0.8);

        const cellWidth = this.grid.cellSpacingX;
        const cellHeight = this.grid.cellSpacingY;

        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const center = this.gridToWorld(row, col);

                graphics.strokeRect(
                    center.x - cellWidth / 2,
                    center.y - cellHeight / 2,
                    cellWidth,
                    cellHeight
                );

                graphics.fillStyle(0xff0000, 1);
                graphics.fillCircle(center.x, center.y, 5);
            }
        }
    }
}