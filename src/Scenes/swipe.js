"use strict";

class Swipe extends Phaser.Scene {
    constructor() {
        super("swipeScene");
        this.saveVersion = 1;
        this.saveStorageKey = "aquarigridSave";
    }

    preload() {
        this.load.image("titleScreenBG", "./assets/titlescreenBG.png");
        this.load.image("board", "./assets/board.png");
        this.load.image("anchovy", "./assets/Anchovy.png");

        for (const fish of this.getFishDefinitions()) {
            if (fish.key !== "anchovy") {
                this.load.image(fish.key, `./assets/${fish.file}`);
            }

            this.load.image(
                this.getFishOutlineKey(fish.key),
                `./assets/${this.getFishOutlineFile(fish.file)}`
            );
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
        this.uiFontFamily = "\"Trebuchet MS\", Verdana, Arial, sans-serif";
        this.installTextDefaults();
        this.createHomeScreen();
        this.createStartupWaitOverlay();
    }

    createStartupWaitOverlay() {
        this.startupWaitOverlay = this.add.container(0, 0);
        this.startupWaitOverlay.setDepth(3000);

        const bg = this.add.rectangle(
            this.game.config.width / 2,
            this.game.config.height / 2,
            this.game.config.width,
            this.game.config.height,
            0x000000,
            1
        );

        bg.setInteractive();

        const waitText = this.add.text(
            this.game.config.width / 2,
            this.game.config.height / 2,
            "Please wait...",
            {
                fontFamily: "Arial",
                fontSize: "38px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        waitText.setOrigin(0.5);
        this.startupWaitOverlay.add([bg, waitText]);

        let dotCount = 0;

        this.startupWaitDotsEvent = this.time.addEvent({
            delay: 350,
            loop: true,
            callback: () => {
                dotCount = (dotCount + 1) % 4;
                waitText.setText(`Please wait${".".repeat(dotCount)}`);
            }
        });

        this.time.delayedCall(10000, () => {
            this.closeStartupWaitOverlay();
        });
    }

    closeStartupWaitOverlay() {
        if (this.startupWaitDotsEvent) {
            this.startupWaitDotsEvent.remove(false);
            this.startupWaitDotsEvent = null;
        }

        if (this.startupWaitOverlay) {
            this.startupWaitOverlay.destroy(true);
            this.startupWaitOverlay = null;
        }
    }

    installTextDefaults() {
        if (this.textDefaultsInstalled) {
            return;
        }

        this.textDefaultsInstalled = true;

        const originalAddText = this.add.text.bind(this.add);

        this.add.text = (x, y, text, style = {}) => {
            return originalAddText(
                x,
                y,
                text,
                {
                    ...style,
                    fontFamily: this.uiFontFamily,
                    resolution: style.resolution || 2
                }
            );
        };
    }

    getLocalStorage() {
        if (typeof localStorage === "undefined") {
            return null;
        }

        return localStorage;
    }

    getSaveData() {
        return {
            saveVersion: this.saveVersion,
            currentLevel: this.currentLevel,
            goldCount: this.goldCount,
            gemCount: this.gemCount,
            keyCount: this.keyCount,
            medKitCount: this.medKitCount,
            rockCount: this.rockCount,
            currentFishKey: this.currentFishKey,
            unlockedFishKeys: { ...this.unlockedFishKeys },
            fishPieces: { ...this.fishPieces },
            playerMaxHealth: this.playerMaxHealth,
            playerStartingHealth: this.playerStartingHealth
        };
    }

    saveProgress() {
        if (!this.gameStarted) {
            return;
        }

        const storage = this.getLocalStorage();

        if (!storage) {
            return;
        }

        try {
            storage.setItem(this.saveStorageKey, JSON.stringify(this.getSaveData()));
        } catch (error) {
            console.warn("Unable to save progress", error);
        }
    }

    loadProgress() {
        const storage = this.getLocalStorage();

        if (!storage) {
            return false;
        }

        try {
            const rawSave = storage.getItem(this.saveStorageKey);

            if (!rawSave) {
                return false;
            }

            const saveData = JSON.parse(rawSave);
            return this.applySaveData(saveData);
        } catch (error) {
            console.warn("Unable to load progress", error);
            return false;
        }
    }

    clearSavedProgress() {
        const storage = this.getLocalStorage();

        if (!storage) {
            return;
        }

        try {
            storage.removeItem(this.saveStorageKey);
        } catch (error) {
            console.warn("Unable to reset progress", error);
        }
    }

    applySaveData(saveData) {
        if (!saveData || saveData.saveVersion !== this.saveVersion) {
            return false;
        }

        const fishDefinitions = this.getFishDefinitions();

        this.currentLevel = this.getSavedInteger(saveData.currentLevel, this.currentLevel, 1);
        this.goldCount = this.getSavedInteger(saveData.goldCount, this.goldCount, 0, this.resourceCaps.gold);
        this.gemCount = this.getSavedInteger(saveData.gemCount, this.gemCount, 0, this.resourceCaps.gems);
        this.keyCount = this.getSavedInteger(saveData.keyCount, this.keyCount, 0, this.resourceCaps.keys);
        this.medKitCount = this.getSavedInteger(saveData.medKitCount, this.medKitCount, 0, this.resourceCaps.medKit);
        this.rockCount = this.getSavedInteger(saveData.rockCount, this.rockCount, 0, this.resourceCaps.rock);

        const savedUnlockedFish = saveData.unlockedFishKeys || {};
        this.unlockedFishKeys = {
            anchovy: true
        };

        for (const fish of fishDefinitions) {
            if (savedUnlockedFish[fish.key] === true) {
                this.unlockedFishKeys[fish.key] = true;
            }
        }

        const savedPieces = saveData.fishPieces || {};
        this.fishPieces = {};

        for (const fish of fishDefinitions) {
            if (fish.unlockType === "drop") {
                this.fishPieces[fish.key] = this.getSavedInteger(
                    savedPieces[fish.key],
                    0,
                    0,
                    fish.piecesRequired
                );

                if (this.fishPieces[fish.key] >= fish.piecesRequired) {
                    this.unlockedFishKeys[fish.key] = true;
                }
            }
        }

        const maxHealthBase = this.healthUpgradeConfig.maxHealth.baseValue;
        const startingHealthBase = this.healthUpgradeConfig.startingHealth.baseValue;

        this.playerMaxHealth = this.getSavedInteger(
            saveData.playerMaxHealth,
            this.playerMaxHealth,
            maxHealthBase,
            this.healthUpgradeConfig.maxHealthCap
        );

        this.playerStartingHealth = this.getSavedInteger(
            saveData.playerStartingHealth,
            this.playerStartingHealth,
            startingHealthBase,
            this.getStartingHealthCap()
        );

        this.playerHealth = this.playerStartingHealth;

        if (this.isFishUnlocked(saveData.currentFishKey)) {
            this.currentFishKey = saveData.currentFishKey;
        } else {
            this.currentFishKey = "anchovy";
        }

        return true;
    }

    getSavedInteger(value, fallback, min, max = Number.MAX_SAFE_INTEGER) {
        if (!Number.isFinite(value)) {
            return fallback;
        }

        return Math.min(
            max,
            Math.max(
                min,
                Math.floor(value)
            )
        );
    }

    getResourceProperty(resourceKey) {
        return {
            gold: "goldCount",
            gems: "gemCount",
            medKit: "medKitCount",
            rock: "rockCount",
            keys: "keyCount"
        }[resourceKey];
    }

    getResourceDisplayName(resourceKey) {
        return {
            gold: "Gold",
            gems: "Gems",
            medKit: "Med Kits",
            rock: "Rocks",
            keys: "Keys"
        }[resourceKey] || "Resource";
    }

    isResourceAtLimit(resourceKey) {
        const property = this.getResourceProperty(resourceKey);

        if (!property) {
            return false;
        }

        return this[property] >= this.resourceCaps[resourceKey];
    }

    showResourceLimitMessage(resourceKey) {
        this.showChestRewardMessage(`Reached limit for ${this.getResourceDisplayName(resourceKey)}`);
    }

    addResource(resourceKey, amount) {
        const property = this.getResourceProperty(resourceKey);

        if (!property) {
            return 0;
        }

        const cap = this.resourceCaps[resourceKey];
        const currentAmount = this[property];
        const nextAmount = Math.min(cap, currentAmount + amount);
        const amountAdded = nextAmount - currentAmount;

        this[property] = nextAmount;

        if (currentAmount + amount >= cap) {
            this.showResourceLimitMessage(resourceKey);
        }

        return amountAdded;
    }

    getAudioDefinitions() {
        return [
            { key: "clickSound", file: "click.mp3" },
            { key: "fishFlopSound", file: "fishFlop.mp3" },
            { key: "spikesSound", file: "spikes.mp3" },
            { key: "levelCompleteSound", file: "levelComplete.mp3" },
            { key: "chestSound", file: "chest.mp3" },
            { key: "keySound", file: "key.mp3" },
            { key: "unlockSound", file: "unlock.mp3" },
            { key: "fishSelectSound", file: "fishSelect.mp3" },
            { key: "bubblesSound", file: "bubbles.mp3" },
            { key: "medKitSound", file: "medKit.mp3" },
            { key: "rockSound", file: "rock.mp3" },
            { key: "healthPurchaseSound", file: "healthPurchase.mp3" },
            { key: "titleScreenBGM", file: "titleScreenBGM.mp3" },
            { key: "gameplayBGM", file: "gameplayBGM.mp3" }
        ];
    }

    startAudioLoading() {
        if (this.audioLoadStarted || this.audioLoadComplete) {
            return;
        }

        this.audioLoadStarted = true;

        let queuedAudio = false;

        for (const audio of this.getAudioDefinitions()) {
            if (!this.cache.audio.exists(audio.key)) {
                this.load.audio(audio.key, `./assets/${audio.file}`);
                queuedAudio = true;
            }
        }

        if (!queuedAudio) {
            this.audioLoadComplete = true;
            return;
        }

        this.load.once("complete", () => {
            this.audioLoadComplete = true;

            if (this.pendingBgmKey) {
                const pendingKey = this.pendingBgmKey;
                this.pendingBgmKey = null;
                this.playBgm(pendingKey);
            }
        });

        this.load.start();
    }

    playSfx(key, config = {}) {
        if (!this.sound || !this.cache.audio.exists(key)) {
            this.startAudioLoading();
            return;
        }

        this.sound.play(key, config);
    }

    playClickSound() {
        this.playSfx("clickSound", { volume: 0.65 });
    }

    playBubblesSound() {
        if (!this.sound || !this.cache.audio.exists("bubblesSound")) {
            return;
        }

        if (this.bubblesFadeTween) {
            this.bubblesFadeTween.stop();
            this.bubblesFadeTween = null;
        }

        if (!this.bubblesHoverSound) {
            this.bubblesHoverSound = this.sound.add("bubblesSound", {
                loop: true,
                volume: 0.45
            });
        }

        this.bubblesHoverSound.setVolume(0.45);

        if (!this.bubblesHoverSound.isPlaying) {
            this.bubblesHoverSound.play();
        }
    }

    stopBubblesSound() {
        if (!this.bubblesHoverSound || !this.bubblesHoverSound.isPlaying) {
            return;
        }

        if (this.bubblesFadeTween) {
            this.bubblesFadeTween.stop();
        }

        this.bubblesFadeTween = this.tweens.addCounter({
            from: this.bubblesHoverSound.volume,
            to: 0,
            duration: 180,
            ease: "Sine.easeOut",
            onUpdate: (tween) => {
                if (this.bubblesHoverSound) {
                    this.bubblesHoverSound.setVolume(tween.getValue());
                }
            },
            onComplete: () => {
                if (this.bubblesHoverSound) {
                    this.bubblesHoverSound.stop();
                    this.bubblesHoverSound.setVolume(0.45);
                }

                this.bubblesFadeTween = null;
            }
        });
    }

    playBgm(key) {
        if (!this.sound || !this.cache.audio.exists(key)) {
            this.pendingBgmKey = key;
            this.startAudioLoading();
            return;
        }

        if (this.currentBgmKey === key && this.currentBgm && this.currentBgm.isPlaying) {
            return;
        }

        if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm.destroy();
            this.currentBgm = null;
        }

        this.currentBgmKey = key;
        this.currentBgm = this.sound.add(key, {
            loop: true,
            volume: 0.42
        });

        this.currentBgm.play();
    }

    createHomeScreen() {
        this.homeScreenOpen = true;
        this.saveProgress();
        this.playBgm("titleScreenBGM");

        if (this.homeOverlay) {
            this.homeOverlay.destroy();
        }

        this.homeOverlay = this.add.container(0, 0);
        this.homeOverlay.setDepth(1000);

        const bg = this.add.image(0, 0, "titleScreenBG").setOrigin(0, 0);
        bg.displayWidth = this.game.config.width;
        bg.displayHeight = this.game.config.height;
        bg.setInteractive();

        const title = this.add.text(
            this.game.config.width / 2,
            145,
            "Aquarigrid",
            {
                fontFamily: "Arial",
                fontSize: "76px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 10
            }
        );

        title.setOrigin(0.5);

        this.tweens.add({
            targets: title,
            y: title.y + 8,
            duration: 1800,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1
        });

        const titleFish = [
            this.createTitleFish("anchovy", 105, this.game.config.height - 118, 3.8, 82, 12, 4300, true, {
                startFlipX: false,
                endFlipX: true,
                delay: 0,
                angle: -3
            }),
            this.createTitleFish("anchovy", 154, this.game.config.height - 145, 3.5, 76, 10, 4380, true, {
                startFlipX: false,
                endFlipX: true,
                delay: 180,
                angle: -2
            }),
            this.createTitleFish("anchovy", 148, this.game.config.height - 92, 3.3, 88, 13, 4260, true, {
                startFlipX: false,
                endFlipX: true,
                delay: 90,
                angle: -4
            }),
            this.createTitleFish("jellyfish", 235, this.game.config.height / 2 - 42, 4, 12, 46, 6500, false, {
                angle: 3
            }),
            this.createTitleFish("crab", this.game.config.width - 150, this.game.config.height / 2 + 78, 4.1, 58, 5, 2700, true, {
                startFlipX: true,
                endFlipX: false,
                angle: 5
            }),
            this.createTitleFish("clownfish", this.game.config.width - 125, 165, 4.4, -78, -18, 5100, true, {
                startFlipX: true,
                endFlipX: false,
                startAngle: 5,
                angle: 12
            }),
            this.createTitleFish("starfish", 112, 170, 4.3, 66, 17, 3800, false, {
                angle: 8
            }),
            this.createTitleFish("blueAngelfish", this.game.config.width - 185, this.game.config.height - 118, 4.4, 72, 9, 5600, true, {
                startFlipX: false,
                endFlipX: true,
                angle: 2
            })
        ];

        const playButton = this.createHomeButton(
            this.game.config.width / 2,
            this.game.config.height / 2 - 20,
            270,
            74,
            "Play",
            "#55ff88",
            () => {
                this.startGameFromHome();
            }
        );

        const tutorialButton = this.createHomeButton(
            this.game.config.width / 2,
            this.game.config.height / 2 + 80,
            270,
            64,
            "Tutorial",
            "#9be8ff",
            () => {
                this.openTutorialPlaceholder();
            }
        );

        const creditsButton = this.createHomeButton(
            this.game.config.width / 2,
            this.game.config.height / 2 + 165,
            210,
            52,
            "Credits",
            "#d6d6d6",
            () => {
                this.openCreditsWindow();
            }
        );

        const titleMenuButton = this.createTitleMenuButton();

        this.homeOverlay.add([bg, title, ...titleFish, playButton, tutorialButton, creditsButton, titleMenuButton]);
    }

    createTitleMenuButton() {
        const button = this.add.image(
            this.game.config.width - 55,
            55,
            "menu"
        );

        this.fitSpriteToCell(button, 58, 58);
        button.setInteractive({ useHandCursor: true });

        button.on("pointerdown", () => {
            this.playClickSound();
            this.openResetProgressConfirm();
        });

        return button;
    }

    createHomeButton(x, y, width, height, label, color, callback) {
        const button = this.add.container(x, y);
        button.baseScale = 1;

        const bg = this.add.rectangle(
            0,
            0,
            width,
            height,
            0x000000,
            0.42
        );

        bg.setStrokeStyle(3, 0xffffff, 0.28);
        bg.setInteractive({ useHandCursor: true });

        const text = this.add.text(
            0,
            0,
            label,
            {
                fontFamily: "Arial",
                fontSize: `${Math.floor(height * 0.42)}px`,
                color: color,
                align: "center",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        text.setOrigin(0.5);

        bg.on("pointerover", () => {
            this.playBubblesSound();

            bg.setFillStyle(0xffffff, 0.18);
            bg.setStrokeStyle(4, 0xffffff, 0.72);
            text.setColor("#ffffff");

            this.tweens.add({
                targets: button,
                scaleX: 1.045,
                scaleY: 1.045,
                duration: 120,
                ease: "Sine.easeOut"
            });
        });

        bg.on("pointerout", () => {
            this.stopBubblesSound();

            bg.setFillStyle(0x000000, 0.42);
            bg.setStrokeStyle(3, 0xffffff, 0.28);
            text.setColor(color);

            this.tweens.add({
                targets: button,
                scaleX: button.baseScale,
                scaleY: button.baseScale,
                duration: 120,
                ease: "Sine.easeOut"
            });
        });

        bg.on("pointerdown", () => {
            this.stopBubblesSound();
            this.playClickSound();
            callback();
        });

        button.add([bg, text]);

        return button;
    }

    openResetProgressConfirm() {
        if (this.resetProgressOverlay) {
            return;
        }

        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;

        this.resetProgressOverlay = this.add.container(centerX, centerY);
        this.resetProgressOverlay.setDepth(1300);

        const backdrop = this.add.rectangle(
            0,
            0,
            this.game.config.width,
            this.game.config.height,
            0x000000,
            0.5
        );

        backdrop.setInteractive();

        const panel = this.add.rectangle(0, 0, 650, 300, 0x000000, 0.82);
        panel.setStrokeStyle(3, 0xffffff, 0.24);

        const promptText = this.add.text(
            0,
            -68,
            "Are you sure?\nThis will erase all saved progress.",
            {
                fontFamily: "Arial",
                fontSize: "27px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        promptText.setOrigin(0.5);

        const yesButton = this.createResetProgressButton(
            -110,
            60,
            "Yes",
            "#ffb0b0",
            () => {
                this.confirmResetProgress();
            }
        );

        const noButton = this.createResetProgressButton(
            110,
            60,
            "No",
            "#55ff88",
            () => {
                this.closeResetProgressConfirm();
            }
        );

        this.resetProgressOverlay.add([
            backdrop,
            panel,
            promptText,
            yesButton,
            noButton
        ]);
    }

    createResetProgressButton(x, y, label, color, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(0, 0, 150, 54, 0x000000, 0.42);
        bg.setStrokeStyle(2, 0xffffff, 0.24);
        bg.setInteractive({ useHandCursor: true });

        const text = this.add.text(
            0,
            0,
            label,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: color,
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        text.setOrigin(0.5);

        bg.on("pointerdown", () => {
            this.playClickSound();
            callback();
        });

        button.add([bg, text]);

        return button;
    }

    closeResetProgressConfirm() {
        if (this.resetProgressOverlay) {
            this.resetProgressOverlay.destroy();
            this.resetProgressOverlay = null;
        }
    }

    confirmResetProgress() {
        this.clearSavedProgress();
        this.gameStarted = false;

        if (this.currentBgm) {
            this.currentBgm.stop();
            this.currentBgm.destroy();
            this.currentBgm = null;
            this.currentBgmKey = null;
        }

        if (typeof window !== "undefined" && window.location) {
            window.location.reload();
            return;
        }

        this.scene.restart();
    }

    openCreditsWindow() {
        if (this.creditsOverlay) {
            return;
        }

        this.creditsScrollY = 0;
        this.creditsMaxScroll = 0;

        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;

        this.creditsOverlay = this.add.container(centerX, centerY);
        this.creditsOverlay.setDepth(1200);

        const backdrop = this.add.rectangle(
            0,
            0,
            this.game.config.width,
            this.game.config.height,
            0x000000,
            0.48
        );

        backdrop.setInteractive();

        const panel = this.add.rectangle(0, 0, 650, 430, 0x000000, 0.86);
        panel.setStrokeStyle(3, 0xffffff, 0.24);

        const title = this.add.text(
            0,
            -178,
            "Credits",
            {
                fontFamily: "Arial",
                fontSize: "36px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 7
            }
        );

        title.setOrigin(0.5);

        const helperText = this.add.text(
            0,
            178,
            "Mouse wheel to scroll • Enter to close",
            {
                fontFamily: "Arial",
                fontSize: "17px",
                color: "#d6d6d6",
                align: "center",
                stroke: "#000000",
                strokeThickness: 4
            }
        );

        helperText.setOrigin(0.5);

        this.creditsListContainer = this.add.container(-260, -125);

        this.creditsOverlay.add([
            backdrop,
            panel,
            title,
            this.creditsListContainer,
            helperText
        ]);

        this.creditsMaskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.creditsMaskGraphics.fillStyle(0xffffff);
        this.creditsMaskGraphics.fillRect(centerX - 290, centerY - 135, 580, 270);

        this.creditsListMask = this.creditsMaskGraphics.createGeometryMask();
        this.creditsListContainer.setMask(this.creditsListMask);

        this.populateCreditsContent();

        this.creditsWheelHandler = (pointer, gameObjects, deltaX, deltaY) => {
            this.scrollCredits(deltaY);
        };

        this.input.on("wheel", this.creditsWheelHandler);

        this.creditsEnterHandler = () => {
            this.closeCreditsWindow();
        };

        this.input.keyboard.once("keydown-ENTER", this.creditsEnterHandler);
    }

    populateCreditsContent() {
        if (!this.creditsListContainer) {
            return;
        }

        this.creditsListContainer.removeAll(true);

        const creditLines = [
            { label: "Game", detail: "By Camilla Shen" },
            { label: "Visual Assets", detail: "Pixel Gnome" },
            { label: "Visual Assets", detail: "Kenney Assets" },
            { label: "Audio Assets", detail: "Pixabay" },
            { label: "Background Music", detail: "Stream Cafe" },
            { label: "Ocean Background", detail: "Magnific wallpaper" },
            { label: "Asset Licensing", detail: "Royalty free assets used throughout" }
        ];

        let rowY = 0;

        for (const credit of creditLines) {
            const labelText = this.add.text(
                0,
                rowY,
                credit.label,
                {
                    fontFamily: "Arial",
                    fontSize: "21px",
                    color: "#ffeaa7",
                    stroke: "#000000",
                    strokeThickness: 5
                }
            );

            labelText.setOrigin(0, 0);

            const detailText = this.add.text(
                0,
                rowY + 27,
                credit.detail,
                {
                    fontFamily: "Arial",
                    fontSize: "20px",
                    color: "#ffffff",
                    stroke: "#000000",
                    strokeThickness: 4,
                    wordWrap: {
                        width: 520
                    }
                }
            );

            detailText.setOrigin(0, 0);
            this.creditsListContainer.add([labelText, detailText]);

            rowY += 70;
        }

        const visibleHeight = 270;
        this.creditsMaxScroll = Math.max(0, rowY - visibleHeight);
        this.creditsListContainer.y = -125;
    }

    closeCreditsWindow() {
        if (this.creditsListContainer) {
            this.creditsListContainer.clearMask();
        }

        if (this.creditsMaskGraphics) {
            this.creditsMaskGraphics.destroy();
            this.creditsMaskGraphics = null;
        }

        this.creditsListMask = null;
        this.creditsListContainer = null;

        if (this.creditsWheelHandler) {
            this.input.off("wheel", this.creditsWheelHandler);
            this.creditsWheelHandler = null;
        }

        if (this.creditsEnterHandler) {
            this.input.keyboard.off("keydown-ENTER", this.creditsEnterHandler);
            this.creditsEnterHandler = null;
        }

        if (this.creditsOverlay) {
            this.creditsOverlay.destroy();
            this.creditsOverlay = null;
        }
    }

    scrollCredits(deltaY) {
        if (!this.creditsOverlay || !this.creditsListContainer) {
            return;
        }

        this.creditsScrollY = Phaser.Math.Clamp(
            this.creditsScrollY + deltaY,
            0,
            this.creditsMaxScroll
        );

        this.creditsListContainer.y = -125 - this.creditsScrollY;
    }

    createTitleFish(textureKey, x, y, scale, swimDistance, bobDistance, duration, shouldFlip, config = {}) {
        const fish = this.add.image(x, y, textureKey);
        fish.setScale(scale);
        fish.setFlipX(config.startFlipX === true);

        if (config.startAngle !== undefined) {
            fish.setAngle(config.startAngle);
        }

        this.tweens.add({
            targets: fish,
            x: x + swimDistance,
            y: y - bobDistance,
            duration: duration,
            delay: config.delay || 0,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1,
            onYoyo: () => {
                if (shouldFlip) {
                    fish.setFlipX(config.endFlipX ?? true);
                }
            },
            onRepeat: () => {
                if (shouldFlip) {
                    fish.setFlipX(config.startFlipX === true);
                }
            }
        });

        this.tweens.add({
            targets: fish,
            angle: config.angle ?? (shouldFlip ? 2.5 : 7),
            duration: duration / 3,
            delay: config.delay || 0,
            ease: "Sine.easeInOut",
            yoyo: true,
            repeat: -1
        });

        return fish;
    }

    openTutorialPlaceholder() {
        if (this.homeTutorialOverlay) {
            return;
        }

        this.tutorialScrollY = 0;
        this.tutorialMaxScroll = 0;

        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;

        this.homeTutorialOverlay = this.add.container(
            centerX,
            centerY
        );

        this.homeTutorialOverlay.setDepth(1200);

        const backdrop = this.add.rectangle(
            0,
            0,
            this.game.config.width,
            this.game.config.height,
            0x000000,
            0.56
        );

        backdrop.setInteractive();

        const panel = this.add.image(0, 0, "unlockMenuBG");
        panel.setDisplaySize(760, 620);
        panel.setAlpha(0.96);

        const title = this.add.text(
            0,
            -275,
            "How to Play",
            {
                fontFamily: "Arial",
                fontSize: "36px",
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
            "Mouse wheel to scroll • Enter to close",
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

        this.tutorialListContainer = this.add.container(-305, -205);

        this.homeTutorialOverlay.add([
            backdrop,
            panel,
            title,
            this.tutorialListContainer,
            helperText
        ]);

        this.tutorialMaskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.tutorialMaskGraphics.fillStyle(0xffffff);
        this.tutorialMaskGraphics.fillRect(centerX - 340, centerY - 220, 680, 440);

        this.tutorialListMask = this.tutorialMaskGraphics.createGeometryMask();
        this.tutorialListContainer.setMask(this.tutorialListMask);

        this.populateTutorialContent();

        this.tutorialWheelHandler = (pointer, gameObjects, deltaX, deltaY) => {
            this.scrollTutorial(deltaY);
        };

        this.input.on("wheel", this.tutorialWheelHandler);

        this.tutorialEnterHandler = () => {
            this.closeTutorialPlaceholder();
        };

        this.input.keyboard.once("keydown-ENTER", this.tutorialEnterHandler);
    }

    closeTutorialPlaceholder() {
        if (this.tutorialListContainer) {
            this.tutorialListContainer.clearMask();
        }

        if (this.tutorialMaskGraphics) {
            this.tutorialMaskGraphics.destroy();
            this.tutorialMaskGraphics = null;
        }

        this.tutorialListMask = null;
        this.tutorialListContainer = null;

        if (this.tutorialWheelHandler) {
            this.input.off("wheel", this.tutorialWheelHandler);
            this.tutorialWheelHandler = null;
        }

        if (this.tutorialEnterHandler) {
            this.input.keyboard.off("keydown-ENTER", this.tutorialEnterHandler);
            this.tutorialEnterHandler = null;
        }

        if (this.homeTutorialOverlay) {
            this.homeTutorialOverlay.destroy();
            this.homeTutorialOverlay = null;
        }
    }

    populateTutorialContent() {
        if (!this.tutorialListContainer) {
            return;
        }

        this.tutorialListContainer.removeAll(true);

        let rowY = 0;

        rowY = this.addTutorialTitle("How to Play Aquarigrid", rowY);
        rowY = this.addTutorialParagraph("Welcome to Aquarigrid, an underwater grid adventure where every move matters.", rowY);
        rowY = this.addTutorialParagraph("Your goal is simple: survive, collect chests, and grab the key to complete the level.", rowY);
        rowY = this.addTutorialDivider(rowY);

        rowY = this.addTutorialHeading("1. Moving Around", rowY);
        rowY = this.addTutorialParagraph("Move your fish around the 3x3 board using W, A, S, and D.", rowY);
        rowY = this.addTutorialIconLine("w", "W = move up", rowY);
        rowY = this.addTutorialIconLine("a", "A = move left", rowY);
        rowY = this.addTutorialIconLine("s", "S = move down", rowY);
        rowY = this.addTutorialIconLine("d", "D = move right", rowY);
        rowY = this.addTutorialParagraph("Each move shifts the board and brings in a new tile. Plan carefully. Danger, healing, treasure, and keys can all appear.", rowY);

        rowY = this.addTutorialHeading("2. Your Goal", rowY);
        rowY = this.addTutorialIconLine("key", "Collect the key to complete the level.", rowY);
        rowY = this.addTutorialParagraph("Once you grab the key, the level ends and any chests you collected during that level will finally open.", rowY);

        rowY = this.addTutorialHeading("3. Chests and Rewards", rowY);
        rowY = this.addTutorialIconLine("chest", "Chests are collected during the level, but they do not open right away.", rowY);
        rowY = this.addTutorialParagraph("To open your collected chests, you must survive and collect the key.", rowY);
        rowY = this.addTutorialParagraph("If you complete the level, your chests open and give rewards such as:", rowY);
        rowY = this.addTutorialIconLine("gold", "Gold", rowY);
        rowY = this.addTutorialIconLine("gem", "Gems", rowY);
        rowY = this.addTutorialIconLine("medkit", "Medkits", rowY);
        rowY = this.addTutorialIconLine("rock", "Rocks", rowY);
        rowY = this.addTutorialIconLine("fish", "Fish pieces", rowY);
        rowY = this.addTutorialIconLine("gem", "Collect all 5 chests in a level to earn a bonus reward of 10 Gems.", rowY);
        rowY = this.addTutorialParagraph("If you fail before collecting the key, you lose the chests you collected during that attempt.", rowY);

        rowY = this.addTutorialHeading("4. Approximate Chest Rewards", rowY);
        rowY = this.addTutorialParagraph("Chest rewards are random. In general:", rowY);
        rowY = this.addTutorialIconLine("gold", "Gold is the most common reward, about 45%.", rowY);
        rowY = this.addTutorialIconLine("fish", "Fish pieces are also common, about 30%.", rowY);
        rowY = this.addTutorialIconLine("medkit", "Medkits are less common, about 10%.", rowY);
        rowY = this.addTutorialIconLine("rock", "Rocks are less common, about 10%.", rowY);
        rowY = this.addTutorialIconLine("gem", "Gems are the rarest reward, about 5%.", rowY);
        //rowY = this.addTutorialParagraph("If there are no eligible fish pieces left to drop, the reward pool will only drop other rewards.", rowY);

        rowY = this.addTutorialHeading("5. Dangerous Tiles", rowY);
        rowY = this.addTutorialParagraph("Some tiles damage you when you move onto them.", rowY);
        rowY = this.addTutorialIconLine("seaweed", "Seaweed", rowY);
        rowY = this.addTutorialIconLine("waste", "Waste", rowY);
        rowY = this.addTutorialIconLine("can", "Can", rowY);
        rowY = this.addTutorialIconLine("lure", "Lure", rowY);
        rowY = this.addTutorialIconLine("spikes", "Spikes", rowY);
        rowY = this.addTutorialParagraph("Some hazards deal more damage than others. Lures are especially dangerous.", rowY);
        rowY = this.addTutorialParagraph("Spikes are tricky because they can switch between safe and dangerous states. Watch whether the spikes are raised or lowered before moving onto them.", rowY);

        rowY = this.addTutorialHeading("6. Healing Tiles", rowY);
        rowY = this.addTutorialIconLine("worm", "Worms heal your fish.", rowY);
        rowY = this.addTutorialParagraph("Move onto a worm to recover health. Healing can help you survive longer and make better use of your max health upgrades.", rowY);

        rowY = this.addTutorialHeading("7. Medkits", rowY);
        rowY = this.addTutorialIconLine("medkit", "Medkits are usable items.", rowY);
        rowY = this.addTutorialParagraph("Use a medkit to restore health during a level. Medkits are best saved for moments when you are damaged and need a safer path forward.", rowY);
        rowY = this.addTutorialParagraph("Medkits cannot heal you beyond your maximum health.", rowY);

        rowY = this.addTutorialHeading("8. Rocks", rowY);
        rowY = this.addTutorialIconLine("rock", "Rocks act like a temporary shield.", rowY);
        rowY = this.addTutorialParagraph("Using a rock protects you from the next damage you would take. After your next move, the rock shield disappears.", rowY);
        rowY = this.addTutorialParagraph("Rocks are useful when you need to move through a dangerous tile or when the board gives you no safe options.", rowY);

        rowY = this.addTutorialHeading("9. Failing a Level", rowY);
        rowY = this.addTutorialParagraph("If your health reaches zero, the level fails.", rowY);
        rowY = this.addTutorialParagraph("When this happens, you have two choices:", rowY);
        rowY = this.addTutorialIconLine("gem", "Spend gems to continue.", rowY);
        rowY = this.addTutorialIconLine("retry", "Retry the level.", rowY);
        rowY = this.addTutorialParagraph("Continuing restores your health to your upgraded starting health and lets you keep going from the current state.", rowY);
        rowY = this.addTutorialParagraph("Retrying restarts the level, but you lose any chests collected during that attempt.", rowY);

        rowY = this.addTutorialHeading("10. Currencies", rowY);
        rowY = this.addTutorialIconLine("gold", "Gold is mainly used for upgrades in the shop.", rowY);
        rowY = this.addTutorialIconLine("gem", "Gems are used for special purchases, such as unlocking certain fish, buying medkits and rocks, or continuing after failure.", rowY);
        rowY = this.addTutorialIconLine("key", "Keys are earned by completing levels and can be spent in the shop to buy fish pieces.", rowY);

        rowY = this.addTutorialHeading("11. The Shop", rowY);
        rowY = this.addTutorialParagraph("Open the menu to access the shop.", rowY);
        rowY = this.addTutorialParagraph("In the shop, you can upgrade both Max Health and Starting Health.", rowY);
        rowY = this.addTutorialParagraph("Max Health increases the highest amount of health you can have.", rowY);
        rowY = this.addTutorialParagraph("Starting Health increases how much health you begin each level with.", rowY);
        rowY = this.addTutorialParagraph("Starting Health cannot reach your full Max Health. It will always stay at least 5 points below your Max Health.", rowY);
        rowY = this.addTutorialParagraph("Examples: 25 Max Health allows 20 Starting Health. 40 Max Health allows 35 Starting Health. 60 Max Health allows 55 Starting Health.", rowY);
        rowY = this.addTutorialParagraph("Upgrades get more expensive as they get stronger. Medkits and rocks can also be purchased for 5 gems each.", rowY);
        rowY = this.addTutorialParagraph("Keys can buy one piece at a time for fish that unlock through pieces and do not require another fish first.", rowY);

        rowY = this.addTutorialHeading("12. Unlocking Fish", rowY);
        rowY = this.addTutorialIconLine("fish", "You can unlock new fish by collecting fish pieces from chests or buying certain fish with gems.", rowY);
        rowY = this.addTutorialParagraph("Some fish are unlocked by collecting enough pieces.", rowY);
        rowY = this.addTutorialIconLine("rainbowTrout", "Rainbow Trout Pieces: 3/10", rowY);
        rowY = this.addTutorialParagraph("Once you collect enough pieces, that fish becomes unlocked. Other fish can be bought directly with gems.", rowY);
        rowY = this.addTutorialParagraph("Some special fish require another fish to be unlocked first.", rowY);
        rowY = this.addTutorialParagraph("Once a fish is unlocked, you can select it from the fish unlock menu. Changing fish is cosmetic, so you can switch fish whenever you want without affecting the level.", rowY);

        rowY = this.addTutorialHeading("13. Quick Tips", rowY);
        rowY = this.addTutorialParagraph("Collecting chests is useful, but only if you survive long enough to grab the key.", rowY);
        rowY = this.addTutorialParagraph("Use rocks when you are forced into danger.", rowY);
        rowY = this.addTutorialParagraph("Use medkits before your health gets too low.", rowY);
        rowY = this.addTutorialParagraph("Gold helps you grow stronger over time.", rowY);
        rowY = this.addTutorialParagraph("Gems are rare, so save them for important unlocks or emergency continues.", rowY);
        rowY = this.addTutorialParagraph("If a fish needs pieces, keep opening chests.", rowY);
        rowY = this.addTutorialParagraph("If a fish says it requires another fish, unlock that required fish first.", rowY);
        rowY = this.addTutorialParagraph("Most importantly: every move changes the board, so look ahead before swimming!", rowY);

        const visibleHeight = 440;
        this.tutorialMaxScroll = Math.max(0, rowY - visibleHeight);
        this.tutorialListContainer.y = -205;
    }

    addTutorialTitle(text, rowY) {
        const titleText = this.add.text(
            0,
            rowY,
            text,
            {
                fontFamily: "Arial",
                fontSize: "27px",
                color: "#ffeaa7",
                stroke: "#000000",
                strokeThickness: 5,
                wordWrap: {
                    width: 610
                }
            }
        );

        titleText.setOrigin(0, 0);
        this.tutorialListContainer.add(titleText);

        return rowY + titleText.height + 16;
    }

    addTutorialHeading(text, rowY) {
        const headingText = this.add.text(
            0,
            rowY + 10,
            text,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#9be8ff",
                stroke: "#000000",
                strokeThickness: 5,
                wordWrap: {
                    width: 610
                }
            }
        );

        headingText.setOrigin(0, 0);
        this.tutorialListContainer.add(headingText);

        return rowY + headingText.height + 24;
    }

    addTutorialParagraph(text, rowY) {
        const paragraphText = this.add.text(
            0,
            rowY,
            text,
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
                lineSpacing: 5,
                wordWrap: {
                    width: 610
                }
            }
        );

        paragraphText.setOrigin(0, 0);
        this.tutorialListContainer.add(paragraphText);

        return rowY + paragraphText.height + 12;
    }

    addTutorialIconLine(iconName, text, rowY) {
        const row = this.add.container(0, rowY);
        const icon = this.createTutorialIcon(iconName);
        icon.setPosition(18, 18);

        const lineText = this.add.text(
            48,
            0,
            text,
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 4,
                lineSpacing: 5,
                wordWrap: {
                    width: 560
                }
            }
        );

        lineText.setOrigin(0, 0);
        row.add([icon, lineText]);
        this.tutorialListContainer.add(row);

        return rowY + Math.max(40, lineText.height + 8);
    }

    addTutorialDivider(rowY) {
        const divider = this.add.rectangle(
            305,
            rowY + 8,
            610,
            2,
            0xffffff,
            0.18
        );

        this.tutorialListContainer.add(divider);

        return rowY + 26;
    }

    createTutorialIcon(iconName) {
        const iconContainer = this.add.container(0, 0);
        const iconMap = {
            key: "key",
            chest: "loot",
            gold: "gold",
            gem: "gem",
            medkit: "medKit",
            rock: "rock",
            fish: "anchovy",
            seaweed: "enemySeaweed",
            waste: "enemyWaste",
            can: "enemyCan",
            lure: "enemyLure",
            spikes: "spikesHigh",
            worm: "worm",
            minnow: "minnow",
            rainbowTrout: "rainbowTrout"
        };

        const textureKey = iconMap[iconName];

        if (textureKey && this.textures.exists(textureKey)) {
            const sprite = this.add.image(0, 0, textureKey);
            this.fitSpriteToCell(sprite, 34, 34);

            if (textureKey === "rock") {
                sprite.y -= 8;
            }

            iconContainer.add(sprite);
            return iconContainer;
        }

        const placeholder = this.add.rectangle(0, 0, 34, 34, 0x000000, 0.34);
        placeholder.setStrokeStyle(2, 0xffffff, 0.26);

        const label = this.add.text(
            0,
            0,
            iconName.toUpperCase().slice(0, 1),
            {
                fontFamily: "Arial",
                fontSize: "16px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 4
            }
        );

        label.setOrigin(0.5);
        iconContainer.add([placeholder, label]);

        return iconContainer;
    }

    scrollTutorial(deltaY) {
        if (!this.homeTutorialOverlay || !this.tutorialListContainer) {
            return;
        }

        this.tutorialScrollY = Phaser.Math.Clamp(
            this.tutorialScrollY + deltaY,
            0,
            this.tutorialMaxScroll
        );

        this.tutorialListContainer.y = -205 - this.tutorialScrollY;
    }

    startGameFromHome() {
        this.closeTutorialPlaceholder();
        this.closeCreditsWindow();

        if (this.homeOverlay) {
            this.homeOverlay.destroy();
            this.homeOverlay = null;
        }

        this.homeScreenOpen = false;
        this.playBgm("gameplayBGM");

        if (!this.gameStarted) {
            this.createGame();
        }
    }

    createGame() {
        this.gameStarted = true;

        this.boardImage = this.add.image(0, 0, "board").setOrigin(0, 0);

        this.boardImage.displayWidth = this.game.config.width;
        this.boardImage.displayHeight = this.game.config.height;

        this.textures.get("anchovy").setFilter(Phaser.Textures.FilterMode.NEAREST);

        for (const fish of this.getFishDefinitions()) {
            if (this.textures.exists(fish.key)) {
                this.textures.get(fish.key).setFilter(Phaser.Textures.FilterMode.NEAREST);
            }

            const outlineKey = this.getFishOutlineKey(fish.key);

            if (this.textures.exists(outlineKey)) {
                this.textures.get(outlineKey).setFilter(Phaser.Textures.FilterMode.NEAREST);
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
            levelTransitionDelay: 3600,

            wormWiggleDelay: 350,

            itemFlyDuration: 420
        };

        // -------------------------------
        // GRID CALIBRATION
        // -------------------------------
        this.grid = {
            centerX: 509,
            centerY: 513,
            cellSpacingX: 195,
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
            firstLevelMaxDamage: 5,
            firstLevelForceKeyTurn: 29,

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

        // chest rewards
        this.chestRewardConfig = {
            continueGemCost: 20,
            fullChestBonusGems: 10,

            dropWeights: {
                gold: 45,
                fishPieces: 30,
                medKit: 10,
                rock: 10,
                gems: 5
            },

            goldDrop: {
                min: 100,
                max: 2500,
                step: 100,
                startWeight: 25,
                minWeight: 1
            },

            gemDropValues: [
                { value: 5, weight: 20 },
                { value: 10, weight: 8 },
                { value: 15, weight: 3 },
                { value: 20, weight: 1 }
            ],

            fishPieceDropValues: [
                { value: 1, weight: 12 },
                { value: 2, weight: 9 },
                { value: 3, weight: 5 },
                { value: 4, weight: 2 },
                { value: 5, weight: 1 }
            ]
        };

        this.healthUpgradeConfig = {
            maxHealthCap: 60,
            startingHealthGap: 5,

            maxHealth: {
                baseValue: 25,
                baseCost: 500,
                linearGrowth: 175,
                curveGrowth: 12
            },

            startingHealth: {
                baseValue: 20,
                baseCost: 800,
                linearGrowth: 230,
                curveGrowth: 18
            }
        };

        this.shopItemConfig = {
            medKitGemCost: 5,
            rockGemCost: 5
        };

        this.resourceCaps = {
            gold: 999999,
            gems: 99999,
            medKit: 200,
            rock: 200,
            keys: 1000
        };

        // -------------------------------
        // PERSISTENT / RUN STATE
        // -------------------------------
        this.currentLevel = 1;

        //ACTUAL GAMEPLAY VALUES!
        this.goldCount = 8000;
        this.gemCount = 200;
        this.keyCount = 0;

        //DEBUG ONLY
        //this.goldCount = 50000;
        //this.gemCount = 5000;
        //this.keyCount = 1000;

        //ACTUAL GAMEPLAY VALUES!
        this.medKitCount = 10;
        this.rockCount = 10;
        
        //DEBUG ONLY
        //this.medKitCount = 100;
        //this.rockCount = 100;

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
        this.playerMaxHealth = this.healthUpgradeConfig.maxHealth.baseValue;
        this.playerStartingHealth = this.healthUpgradeConfig.startingHealth.baseValue;
        this.playerHealth = this.playerStartingHealth;
        this.loadProgress();

        this.playerGridPos = {
            row: 1,
            col: 1
        };

        this.levelEnded = false;
        this.menuOpen = false;
        this.unlockMenuOpen = false;
        this.shopOpen = false;
        this.failChoiceOpen = false;
        this.levelRewardOpen = false;

        this.unlockScrollY = 0;
        this.unlockMaxScroll = 0;
        this.shopScrollY = 0;
        this.shopMaxScroll = 0;
        this.shopContentBaseY = -185;
        this.shopSessionPieceFishKeys = [];
        this.turnCount = 0;

        this.chestsSpawned = 0;
        this.chestsCollected = 0;
        this.keyCollected = 0;
        this.keyHasSpawnedThisLevel = false;

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
            u: Phaser.Input.Keyboard.KeyCodes.U,
            s: Phaser.Input.Keyboard.KeyCodes.S,
            t: Phaser.Input.Keyboard.KeyCodes.T,
            c: Phaser.Input.Keyboard.KeyCodes.C,
            r: Phaser.Input.Keyboard.KeyCodes.R,
            y: Phaser.Input.Keyboard.KeyCodes.Y,
            n: Phaser.Input.Keyboard.KeyCodes.N
        });

        this.input.on("wheel", (pointer, gameObjects, deltaX, deltaY) => {
            if (this.unlockMenuOpen) {
                this.scrollUnlockMenu(deltaY);
            } else if (this.shopOpen) {
                this.scrollShop(deltaY);
            }
        });

        this.isMoving = false;

        // this.drawDebugGrid();
    }

    update() {
        if (this.homeScreenOpen) {
            return;
        }

        if (this.failChoiceOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.c)) {
                this.continueAfterFailure();
            } else if (Phaser.Input.Keyboard.JustDown(this.keys.r)) {
                this.retryAfterFailure();
            }

            return;
        }

        if (this.purchaseConfirmOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.y)) {
                this.confirmFishPurchase();
            } else if (
                Phaser.Input.Keyboard.JustDown(this.keys.n) ||
                Phaser.Input.Keyboard.JustDown(this.keys.enter)
            ) {
                this.cancelFishPurchase();
            }

            return;
        }

        if (this.levelRewardOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.enter)) {
                this.continueAfterRewards();
            }

            return;
        }

        if (this.menuOpen) {
            if (Phaser.Input.Keyboard.JustDown(this.keys.u)) {
                if (this.unlockMenuOpen) {
                    this.closeUnlockMenu();
                } else {
                    this.openUnlockMenu();
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.s)) {
                if (this.shopOpen) {
                    this.closeShop();
                } else {
                    this.openShop();
                }
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.t)) {
                this.closeMenu();
                this.createHomeScreen();
                return;
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.up)) {
                this.scrollUnlockMenu(-70);
            } else if (Phaser.Input.Keyboard.JustDown(this.keys.down)) {
                this.scrollUnlockMenu(70);
            }

            if (Phaser.Input.Keyboard.JustDown(this.keys.enter)) {
                if (this.unlockMenuOpen) {
                    this.closeUnlockMenu();
                } else if (this.shopOpen) {
                    this.closeShop();
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
            x: this.game.config.width / 2 - 220,
            y: 90,
            iconKey: "gold",
            text: `${this.goldCount}`,
            side: "left",
            panelWidth: 175
        });

        this.gemUI = this.createCounterPanel({
            x: this.game.config.width / 2,
            y: 90,
            iconKey: "gem",
            text: `${this.gemCount}`,
            side: "left",
            panelWidth: 170
        });

        this.keyCurrencyUI = this.createCounterPanel({
            x: this.game.config.width / 2 + 210,
            y: 90,
            iconKey: "key",
            text: `${this.keyCount}`,
            side: "left",
            panelWidth: 150
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
            this.playClickSound();
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
            x: this.game.config.width - 115,
            y: this.game.config.height - 135,
            iconKey: "loot",
            text: `${this.chestsCollected}/${this.levelConfig.maxChests}`,
            side: "right",
            panelWidth: 180
        });

        this.keyUI = this.createCounterPanel({
            x: this.game.config.width - 115,
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
            icon.y -= 16;
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
        this.keyCurrencyUI.text.setText(`${this.keyCount}`);

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
            "MENU\n\nPress U to see unlocks\nPress S to open shop\nPress T for title screen\nPress ENTER to go back",
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

        if (this.shopOpen) {
            this.closeShop();
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

        if (this.shopOpen) {
            this.closeShop();
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
            "Fish Unlocks",
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
            "Mouse wheel or W/S to scroll • Enter to close",
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
            const categoryLabel = this.getUnlockCategoryLabel(
                this.getFishMenuCategory(fish)
            );

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

                rowY += 56;
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
            rowPanel.setInteractive({ useHandCursor: true });

            const fishSprite = this.add.image(
                36,
                2,
                this.getFishMenuTextureKey(fish)
            );

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

            const statusDisplay = this.createFishStatusDisplay(fish, 90, 18);

            rowPanel.on("pointerover", () => {
                fishSprite.setTexture(this.getFishOutlineTextureKey(fish.key));
            });

            rowPanel.on("pointerout", () => {
                fishSprite.setTexture(this.getFishMenuTextureKey(fish));
            });

            rowPanel.on("pointerdown", () => {
                this.handleFishClick(fish);
            });

            rowContainer.add([rowPanel, fishSprite, nameText, statusDisplay]);
            this.unlockListContainer.add(rowContainer);

            rowY += rowHeight;
        }

        const visibleHeight = 440;
        this.unlockMaxScroll = Math.max(0, rowY - visibleHeight);
        this.unlockListContainer.y = -205;
    }

    closeUnlockMenu() {
        if (this.purchaseConfirmOpen) {
            this.cancelFishPurchase();
        }

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

    openShop() {
        if (this.shopOpen) {
            return;
        }

        if (this.unlockMenuOpen) {
            this.closeUnlockMenu();
        }

        this.shopOpen = true;
        this.shopScrollY = 0;
        this.shopSessionPieceFishKeys = this.getKeyShopPieceFish().map((fish) => {
            return fish.key;
        });

        if (this.menuText) {
            this.menuText.setVisible(false);
        }

        this.goldUI.container.setDepth(760);
        this.gemUI.container.setDepth(760);
        this.keyCurrencyUI.container.setDepth(760);

        this.shopOverlay = this.add.container(
            this.game.config.width / 2,
            this.grid.centerY + 20
        );

        this.shopOverlay.setDepth(560);

        const bg = this.add.image(0, 0, "unlockMenuBG");
        bg.setDisplaySize(760, 660);
        bg.setAlpha(0.96);

        const title = this.add.text(
            0,
            -290,
            "Shop",
            {
                fontFamily: "Arial",
                fontSize: "38px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 7
            }
        );

        title.setOrigin(0.5);

        this.shopContentBaseY = -185;
        this.shopContent = this.add.container(0, this.shopContentBaseY);

        const shopKeyCounter = this.createShopKeyCounter(282, -286);
        this.shopKeyCountText = shopKeyCounter.text;

        const helperText = this.add.text(
            0,
            285,
            "Mouse wheel to scroll • Click a purchase or press Enter to close",
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

        this.shopOverlay.add([bg, title, shopKeyCounter.container, this.shopContent, helperText]);

        this.shopMaskGraphics = this.make.graphics({ x: 0, y: 0, add: false });
        this.shopMaskGraphics.fillStyle(0xffffff);
        this.shopMaskGraphics.fillRect(
            this.game.config.width / 2 - 340,
            this.grid.centerY + 20 - 250,
            680,
            500
        );

        this.shopListMask = this.shopMaskGraphics.createGeometryMask();
        this.shopContent.setMask(this.shopListMask);

        this.populateShop();
    }

    closeShop() {
        this.shopOpen = false;

        if (this.shopContent) {
            this.shopContent.clearMask();
        }

        if (this.shopMaskGraphics) {
            this.shopMaskGraphics.destroy();
            this.shopMaskGraphics = null;
        }

        this.shopListMask = null;

        if (this.shopOverlay) {
            this.shopOverlay.destroy();
            this.shopOverlay = null;
        }

        this.shopContent = null;
        this.shopKeyCountText = null;
        this.shopSessionPieceFishKeys = [];

        this.goldUI.container.setDepth(200);
        this.gemUI.container.setDepth(200);
        this.keyCurrencyUI.container.setDepth(200);

        if (this.menuText) {
            this.menuText.setVisible(true);
        }
    }

    populateShop() {
        if (!this.shopContent) {
            return;
        }

        this.shopContent.removeAll(true);
        this.updateShopKeyCounter();

        const maxHealthCost = this.getMaxHealthUpgradeCost();
        const startingHealthCost = this.getStartingHealthUpgradeCost();
        const startingHealthCap = this.getStartingHealthCap();
        let rowY = 0;

        const maxHealthRow = this.createShopUpgradeRow({
            y: rowY,
            title: "Max Health",
            valueText: this.canUpgradeMaxHealth()
                ? `${this.playerMaxHealth} → ${this.playerMaxHealth + 1}`
                : `${this.playerMaxHealth} / ${this.healthUpgradeConfig.maxHealthCap}`,
            costText: this.canUpgradeMaxHealth()
                ? `Cost: ${maxHealthCost} Gold`
                : "Max Health capped",
            canUpgrade: this.canUpgradeMaxHealth(),
            canAfford: this.goldCount >= maxHealthCost,
            onPurchase: () => {
                this.purchaseMaxHealthUpgrade();
            }
        });

        rowY += 128;

        const startingHealthRow = this.createShopUpgradeRow({
            y: rowY,
            title: "Starting Health",
            valueText: this.canUpgradeStartingHealth()
                ? `${this.playerStartingHealth} → ${this.playerStartingHealth + 1}`
                : `${this.playerStartingHealth} / ${startingHealthCap}`,
            costText: this.canUpgradeStartingHealth()
                ? `Cost: ${startingHealthCost} Gold`
                : "Upgrade Max Health first",
            canUpgrade: this.canUpgradeStartingHealth(),
            canAfford: this.goldCount >= startingHealthCost,
            onPurchase: () => {
                this.purchaseStartingHealthUpgrade();
            }
        });

        rowY += 114;

        const medKitRow = this.createShopItemRow({
            y: rowY,
            title: "Med Kit",
            iconKey: "medKit",
            valueText: `Owned: ${this.medKitCount}`,
            costText: `Cost: ${this.shopItemConfig.medKitGemCost} Gems`,
            canAfford: this.gemCount >= this.shopItemConfig.medKitGemCost,
            onPurchase: () => {
                this.purchaseMedKit();
            }
        });

        rowY += 98;

        const rockRow = this.createShopItemRow({
            y: rowY,
            title: "Rock",
            iconKey: "rock",
            valueText: `Owned: ${this.rockCount}`,
            costText: `Cost: ${this.shopItemConfig.rockGemCost} Gems`,
            canAfford: this.gemCount >= this.shopItemConfig.rockGemCost,
            onPurchase: () => {
                this.purchaseRock();
            }
        });

        rowY += 104;

        const keyPieceTitle = this.add.text(
            -310,
            rowY,
            "Key Fish Pieces",
            {
                fontFamily: "Arial",
                fontSize: "23px",
                color: "#ffeaa7",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        keyPieceTitle.setOrigin(0, 0.5);
        rowY += 46;

        const keyPieceFish = this.getShopSessionPieceFish();
        const shopRows = [maxHealthRow, startingHealthRow, medKitRow, rockRow, keyPieceTitle];

        if (keyPieceFish.length <= 0) {
            const emptyRow = this.createShopEmptyPieceRow(rowY);
            shopRows.push(emptyRow);
            rowY += 84;
        } else {
            for (const fish of keyPieceFish) {
                const fishRow = this.createShopFishPieceRow(fish, rowY);
                shopRows.push(fishRow);
                rowY += 84;
            }
        }

        this.shopContent.add(shopRows);

        const visibleHeight = 500;
        const bottomScrollPadding = 60;
        this.shopMaxScroll = Math.max(0, rowY - visibleHeight + bottomScrollPadding);
        this.shopScrollY = Phaser.Math.Clamp(
            this.shopScrollY,
            0,
            this.shopMaxScroll
        );
        this.shopContent.y = this.shopContentBaseY - this.shopScrollY;
    }

    createShopKeyCounter(x, y) {
        const container = this.add.container(x, y);

        const panel = this.add.rectangle(0, 0, 132, 46, 0x000000, 0.36);
        panel.setStrokeStyle(2, 0xffffff, 0.18);

        const icon = this.add.image(-42, 0, "key");
        this.fitSpriteToCell(icon, 36, 36);

        const text = this.add.text(
            -8,
            0,
            `${this.keyCount}`,
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        text.setOrigin(0, 0.5);
        container.add([panel, icon, text]);

        return {
            container: container,
            text: text
        };
    }

    updateShopKeyCounter() {
        if (this.shopKeyCountText) {
            this.shopKeyCountText.setText(`${this.keyCount}`);
        }
    }

    scrollShop(deltaY) {
        if (!this.shopOpen || !this.shopContent) {
            return;
        }

        this.shopScrollY = Phaser.Math.Clamp(
            this.shopScrollY + deltaY,
            0,
            this.shopMaxScroll
        );

        this.shopContent.y = this.shopContentBaseY - this.shopScrollY;
    }

    getKeyShopPieceFish() {
        return this.getFishDefinitions()
            .filter((fish) => {
                const pieces = this.fishPieces[fish.key] || 0;

                return (
                    fish.unlockType === "drop" &&
                    !fish.requires &&
                    !this.isFishUnlocked(fish.key) &&
                    pieces < fish.piecesRequired
                );
            })
            .sort((a, b) => {
                return a.displayName.localeCompare(b.displayName);
            });
    }

    getShopSessionPieceFish() {
        return this.shopSessionPieceFishKeys
            .map((fishKey) => {
                return this.getFishDefinitions().find((fish) => {
                    return fish.key === fishKey;
                });
            })
            .filter((fish) => {
                return fish && fish.unlockType === "drop" && !fish.requires;
            });
    }

    createShopEmptyPieceRow(y) {
        const row = this.add.container(0, y);

        const panel = this.add.rectangle(0, 0, 620, 74, 0x000000, 0.28);
        panel.setStrokeStyle(2, 0xffffff, 0.14);

        const text = this.add.text(
            0,
            0,
            "You have unlocked all key purchasable fish!",
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#d6d6d6",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        text.setOrigin(0.5);
        row.add([panel, text]);

        return row;
    }

    createShopFishPieceRow(fish, y) {
        const row = this.add.container(0, y);
        const pieces = this.fishPieces[fish.key] || 0;
        const fishUnlocked = this.isFishUnlocked(fish.key);
        const canBuyPiece = !fishUnlocked && pieces < fish.piecesRequired;
        const canAfford = this.keyCount >= 1;

        const panel = this.add.rectangle(0, 0, 620, 74, 0x000000, 0.28);
        panel.setStrokeStyle(2, 0xffffff, 0.18);

        const fishSprite = this.add.image(-270, 2, fish.key);
        fishSprite.setScale(4.1);

        const nameText = this.add.text(
            -220,
            -15,
            fish.displayName,
            {
                fontFamily: "Arial",
                fontSize: "21px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        nameText.setOrigin(0, 0.5);

        const statusText = this.add.text(
            -220,
            17,
            fishUnlocked
                ? "This fish has already been unlocked"
                : `Pieces: ${pieces}/${fish.piecesRequired}`,
            {
                fontFamily: "Arial",
                fontSize: "17px",
                color: fishUnlocked ? "#55ff88" : "#fff2a8",
                stroke: "#000000",
                strokeThickness: 4
            }
        );

        statusText.setOrigin(0, 0.5);

        const costText = this.add.text(
            130,
            -16,
            fishUnlocked ? "Unlocked" : "Cost: 1 Key",
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: canBuyPiece
                    ? (canAfford ? "#ffeaa7" : "#ffb0b0")
                    : "#d6d6d6",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        costText.setOrigin(0.5);

        const button = this.add.rectangle(
            130,
            20,
            148,
            42,
            0x000000,
            canBuyPiece ? 0.48 : 0.22
        );

        button.setStrokeStyle(2, 0xffffff, canBuyPiece ? 0.28 : 0.12);

        const buttonText = this.add.text(
            130,
            20,
            canBuyPiece ? "Buy Piece" : "Unlocked",
            {
                fontFamily: "Arial",
                fontSize: "18px",
                color: canBuyPiece
                    ? (canAfford ? "#55ff88" : "#ffb0b0")
                    : "#888888",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        buttonText.setOrigin(0.5);

        if (canBuyPiece) {
            button.setInteractive({ useHandCursor: true });
            button.on("pointerdown", () => {
                this.playClickSound();
                this.purchaseFishPieceWithKey(fish.key);
            });
        }

        row.add([panel, fishSprite, nameText, statusText, costText, button, buttonText]);

        return row;
    }

    createShopUpgradeRow(config) {
        const row = this.add.container(0, config.y);

        const panel = this.add.rectangle(
            0,
            0,
            620,
            118,
            0x000000,
            0.34
        );

        panel.setStrokeStyle(2, 0xffffff, 0.18);

        const titleText = this.add.text(
            -270,
            -31,
            config.title,
            {
                fontFamily: "Arial",
                fontSize: "27px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        titleText.setOrigin(0, 0.5);

        const valueText = this.add.text(
            -270,
            12,
            config.valueText,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: "#55ff88",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        valueText.setOrigin(0, 0.5);

        const costText = this.add.text(
            190,
            -24,
            config.costText,
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: config.canUpgrade
                    ? (config.canAfford ? "#ffd76a" : "#ffb0b0")
                    : "#d6d6d6",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        costText.setOrigin(0.5);

        const button = this.add.rectangle(
            190,
            25,
            170,
            48,
            0x000000,
            config.canUpgrade ? 0.48 : 0.22
        );

        button.setStrokeStyle(2, 0xffffff, config.canUpgrade ? 0.28 : 0.12);

        const buttonText = this.add.text(
            190,
            25,
            "Upgrade",
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: config.canUpgrade
                    ? (config.canAfford ? "#55ff88" : "#ffb0b0")
                    : "#888888",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        buttonText.setOrigin(0.5);

        if (config.canUpgrade) {
            button.setInteractive({ useHandCursor: true });
            button.on("pointerdown", () => {
                this.playClickSound();
                config.onPurchase();
            });
        }

        row.add([panel, titleText, valueText, costText, button, buttonText]);

        return row;
    }

    createShopItemRow(config) {
        const row = this.add.container(0, config.y);

        const panel = this.add.rectangle(
            0,
            0,
            620,
            92,
            0x000000,
            0.34
        );

        panel.setStrokeStyle(2, 0xffffff, 0.18);

        const icon = this.add.image(-264, 0, config.iconKey);
        this.fitShopItemIcon(icon, config.iconKey);

        const titleText = this.add.text(
            -220,
            -20,
            config.title,
            {
                fontFamily: "Arial",
                fontSize: "25px",
                color: "#ffffff",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        titleText.setOrigin(0, 0.5);

        const valueText = this.add.text(
            -220,
            18,
            config.valueText,
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: "#55ff88",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        valueText.setOrigin(0, 0.5);

        const costText = this.add.text(
            190,
            -20,
            config.costText,
            {
                fontFamily: "Arial",
                fontSize: "20px",
                color: config.canAfford ? "#9be8ff" : "#ffb0b0",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        costText.setOrigin(0.5);

        const button = this.add.rectangle(
            190,
            22,
            170,
            46,
            0x000000,
            0.48
        );

        button.setStrokeStyle(2, 0xffffff, 0.28);
        button.setInteractive({ useHandCursor: true });

        const buttonText = this.add.text(
            190,
            22,
            "Buy",
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: config.canAfford ? "#55ff88" : "#ffb0b0",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        buttonText.setOrigin(0.5);

        button.on("pointerdown", () => {
            this.playClickSound();
            config.onPurchase();
        });

        row.add([panel, icon, titleText, valueText, costText, button, buttonText]);

        return row;
    }

    fitShopItemIcon(icon, iconKey) {
        if (iconKey === "rock") {
            this.fitSpriteToCell(icon, 52, 52);
            icon.y -= 13;
            return;
        }

        if (iconKey === "medKit") {
            this.fitSpriteToCell(icon, 46, 46);
            return;
        }

        this.fitSpriteToCell(icon, 42, 42);
    }

    getStartingHealthCap() {
        return this.playerMaxHealth - this.healthUpgradeConfig.startingHealthGap;
    }

    canUpgradeMaxHealth() {
        return this.playerMaxHealth < this.healthUpgradeConfig.maxHealthCap;
    }

    canUpgradeStartingHealth() {
        return this.playerStartingHealth < this.getStartingHealthCap();
    }

    getMaxHealthUpgradeCost() {
        const upgradeLevel = this.playerMaxHealth - this.healthUpgradeConfig.maxHealth.baseValue;

        return (
            this.healthUpgradeConfig.maxHealth.baseCost +
            upgradeLevel * this.healthUpgradeConfig.maxHealth.linearGrowth +
            upgradeLevel * upgradeLevel * this.healthUpgradeConfig.maxHealth.curveGrowth
        );
    }

    getStartingHealthUpgradeCost() {
        const upgradeLevel = this.playerStartingHealth - this.healthUpgradeConfig.startingHealth.baseValue;

        return (
            this.healthUpgradeConfig.startingHealth.baseCost +
            upgradeLevel * this.healthUpgradeConfig.startingHealth.linearGrowth +
            upgradeLevel * upgradeLevel * this.healthUpgradeConfig.startingHealth.curveGrowth
        );
    }

    purchaseMaxHealthUpgrade() {
        if (!this.canUpgradeMaxHealth()) {
            this.showChestRewardMessage("Max Health is already capped");
            return;
        }

        const cost = this.getMaxHealthUpgradeCost();

        if (this.goldCount < cost) {
            this.showChestRewardMessage("Not enough Gold");
            return;
        }

        this.goldCount -= cost;
        this.playerMaxHealth++;

        this.time.delayedCall(110, () => {
            this.playSfx("healthPurchaseSound", { volume: 0.7 });
        });

        this.updateHealthText();
        this.updateUI();
        this.populateShop();
        this.saveProgress();
        this.showChestRewardMessage("Max Health upgraded");
    }

    purchaseStartingHealthUpgrade() {
        if (!this.canUpgradeStartingHealth()) {
            this.showChestRewardMessage("Upgrade Max Health first");
            return;
        }

        const cost = this.getStartingHealthUpgradeCost();

        if (this.goldCount < cost) {
            this.showChestRewardMessage("Not enough Gold");
            return;
        }

        this.goldCount -= cost;
        this.playerStartingHealth++;

        this.time.delayedCall(110, () => {
            this.playSfx("healthPurchaseSound", { volume: 0.7 });
        });

        this.updateHealthText();
        this.updateUI();
        this.populateShop();
        this.saveProgress();
        this.showChestRewardMessage("Starting Health upgraded");
    }

    purchaseMedKit() {
        const cost = this.shopItemConfig.medKitGemCost;

        if (this.isResourceAtLimit("medKit")) {
            this.showResourceLimitMessage("medKit");
            return;
        }

        if (this.gemCount < cost) {
            this.showChestRewardMessage("Not enough gems");
            return;
        }

        this.gemCount -= cost;
        this.addResource("medKit", 1);

        this.updateUI();
        this.populateShop();
        this.saveProgress();
        this.showChestRewardMessage(
            this.isResourceAtLimit("medKit")
                ? `Reached limit for ${this.getResourceDisplayName("medKit")}`
                : "Purchased Med Kit"
        );
    }

    purchaseRock() {
        const cost = this.shopItemConfig.rockGemCost;

        if (this.isResourceAtLimit("rock")) {
            this.showResourceLimitMessage("rock");
            return;
        }

        if (this.gemCount < cost) {
            this.showChestRewardMessage("Not enough gems");
            return;
        }

        this.gemCount -= cost;
        this.addResource("rock", 1);

        this.updateUI();
        this.populateShop();
        this.saveProgress();
        this.showChestRewardMessage(
            this.isResourceAtLimit("rock")
                ? `Reached limit for ${this.getResourceDisplayName("rock")}`
                : "Purchased Rock"
        );
    }

    purchaseFishPieceWithKey(fishKey) {
        const fish = this.getFishDefinitions().find((entry) => {
            return entry.key === fishKey;
        });

        if (!fish || fish.unlockType !== "drop" || fish.requires) {
            this.showChestRewardMessage("Fish piece is not available");
            return;
        }

        if (this.isFishUnlocked(fish.key)) {
            this.showChestRewardMessage("This fish has already been unlocked");
            this.populateShop();
            return;
        }

        const currentPieces = this.fishPieces[fish.key] || 0;

        if (currentPieces >= fish.piecesRequired) {
            this.unlockedFishKeys[fish.key] = true;
            this.playSfx("unlockSound", { volume: 0.75 });
            this.updateUI();
            this.populateShop();
            this.saveProgress();
            this.showChestRewardMessage("This fish has already been unlocked");
            return;
        }

        if (this.keyCount < 1) {
            this.showChestRewardMessage("Not enough Keys");
            return;
        }

        this.keyCount--;

        const newPieces = Phaser.Math.Clamp(
            currentPieces + 1,
            0,
            fish.piecesRequired
        );

        this.fishPieces[fish.key] = newPieces;

        if (newPieces >= fish.piecesRequired) {
            this.unlockedFishKeys[fish.key] = true;
            this.playSfx("unlockSound", { volume: 0.75 });
            this.showChestRewardMessage("This fish has already been unlocked");
        } else {
            this.showChestRewardMessage(`Purchased ${fish.displayName} Piece`);
        }

        this.updateUI();
        this.populateShop();
        this.saveProgress();
    }

    getFishOutlineKey(fishKey) {
        return `${fishKey}Outline`;
    }

    getFishOutlineFile(fileName) {
        return fileName.replace(".png", " Outline.png");
    }

    getFishOutlineTextureKey(fishKey) {
        const outlineKey = this.getFishOutlineKey(fishKey);

        if (this.textures.exists(outlineKey)) {
            return outlineKey;
        }

        return fishKey;
    }

    getFishMenuTextureKey(fish) {
        if (fish.key === this.currentFishKey) {
            return this.getFishOutlineTextureKey(fish.key);
        }

        return fish.key;
    }

    handleFishClick(fish) {
        if (this.isFishUnlocked(fish.key)) {
            this.selectFish(fish.key);
            return;
        }

        if (!this.isFishRequirementMet(fish)) {
            this.showChestRewardMessage(`Requires ${this.getFishDisplayNameByKey(fish.requires)}`);
            return;
        }

        if (fish.unlockType === "gem") {
            this.openFishPurchaseConfirm(fish);
            return;
        }

        if (fish.unlockType === "drop") {
            const pieces = this.fishPieces[fish.key] || 0;
            this.showChestRewardMessage(`${fish.displayName}: ${pieces}/${fish.piecesRequired} pieces`);
            return;
        }

        this.showChestRewardMessage("Fish is locked");
    }

    selectFish(fishKey) {
        if (!this.isFishUnlocked(fishKey)) {
            return;
        }

        const fishChanged = fishKey !== this.currentFishKey;

        this.currentFishKey = fishKey;

        if (this.player) {
            this.player.setTexture(this.currentFishKey);
        }

        if (fishChanged) {
            this.playSfx("fishSelectSound", { volume: 0.7 });
        }

        if (this.unlockMenuOpen) {
            this.populateUnlockList();
        }

        this.saveProgress();
        this.showChestRewardMessage(`Selected ${this.getFishDisplayNameByKey(fishKey)}`);
    }

    openFishPurchaseConfirm(fish) {
        if (this.purchaseConfirmOpen) {
            this.cancelFishPurchase();
        }

        this.purchaseConfirmOpen = true;
        this.pendingPurchaseFish = fish;

        const centerX = this.game.config.width / 2;
        const centerY = this.game.config.height / 2;

        this.purchaseConfirmOverlay = this.add.container(centerX, centerY);
        this.purchaseConfirmOverlay.setDepth(720);

        const panel = this.add.rectangle(
            0,
            0,
            610,
            270,
            0x000000,
            0.78
        );

        panel.setStrokeStyle(3, 0xffffff, 0.24);

        const promptText = this.add.text(
            0,
            -62,
            `Purchase ${fish.displayName}\nFor ${fish.price} Gems?`,
            {
                fontFamily: "Arial",
                fontSize: "28px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        promptText.setOrigin(0.5);

        const helperText = this.add.text(
            0,
            98,
            "Press Y for Yes • Press N for No",
            {
                fontFamily: "Arial",
                fontSize: "17px",
                color: "#d6d6d6",
                align: "center",
                stroke: "#000000",
                strokeThickness: 4
            }
        );

        helperText.setOrigin(0.5);

        const yesButton = this.createConfirmButton(
            -105,
            35,
            "Yes",
            "#55ff88",
            () => {
                this.confirmFishPurchase();
            }
        );

        const noButton = this.createConfirmButton(
            105,
            35,
            "No",
            "#ffb0b0",
            () => {
                this.cancelFishPurchase();
            }
        );

        this.purchaseConfirmOverlay.add([
            panel,
            promptText,
            yesButton,
            noButton,
            helperText
        ]);
    }

    createConfirmButton(x, y, label, color, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(
            0,
            0,
            150,
            54,
            0x000000,
            0.42
        );

        bg.setStrokeStyle(2, 0xffffff, 0.24);
        bg.setInteractive({ useHandCursor: true });

        const text = this.add.text(
            0,
            0,
            label,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: color,
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        text.setOrigin(0.5);

        bg.on("pointerdown", () => {
            this.playClickSound();
            callback();
        });

        button.add([bg, text]);

        return button;
    }

    confirmFishPurchase() {
        const fish = this.pendingPurchaseFish;

        if (!fish) {
            this.cancelFishPurchase();
            return;
        }

        if (this.gemCount < fish.price) {
            this.cancelFishPurchase();
            this.showChestRewardMessage("Not enough gems");
            return;
        }

        this.gemCount -= fish.price;
        this.unlockedFishKeys[fish.key] = true;
        this.playSfx("unlockSound", { volume: 0.75 });

        this.cancelFishPurchase();
        this.updateUI();
        this.saveProgress();

        if (this.unlockMenuOpen) {
            this.populateUnlockList();
        }

        this.showChestRewardMessage(`Purchase successful: ${fish.displayName}`);
    }

    cancelFishPurchase() {
        this.purchaseConfirmOpen = false;
        this.pendingPurchaseFish = null;

        if (this.purchaseConfirmOverlay) {
            this.purchaseConfirmOverlay.destroy();
            this.purchaseConfirmOverlay = null;
        }
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
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 350
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
                price: 0,
                requires: "angelfish"
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
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 150
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
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 200
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
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 250
            },
            {
                key: "minnow",
                file: "Minnow.png",
                displayName: "Minnow",
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
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 300
            },
            {
                key: "purpleTang",
                file: "PurpleTang.png",
                displayName: "Purple Tang",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0,
                requires: "yellowTang"
            },
            {
                key: "rainbowTrout",
                file: "RainbowTrout.png",
                displayName: "Rainbow Trout",
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 400
            },
            {
                key: "ribbonEel",
                file: "RibbonEel.png",
                displayName: "Ribbon Eel",
                unlockType: "drop",
                piecesRequired: 10,
                dropWeight: 10,
                price: 0,
                requires: "morayEel"
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
                key: "starfish",
                file: "Starfish.png",
                displayName: "Starfish",
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 150
            },
            {
                key: "stingray",
                file: "Stingray.png",
                displayName: "Stingray",
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 450
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
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 100
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
                unlockType: "gem",
                piecesRequired: 0,
                dropWeight: 0,
                price: 500,
                requires: "jellyfish"
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
            unlocked: 0,
            drop: 1,
            gem: 2,
            coin: 3,
            requirement: 4,
            other: 5
        };

        return [...this.getFishDefinitions()].sort((a, b) => {
            const categoryA = categoryOrder[this.getFishMenuCategory(a)] ?? 99;
            const categoryB = categoryOrder[this.getFishMenuCategory(b)] ?? 99;

            if (categoryA !== categoryB) {
                return categoryA - categoryB;
            }

            return a.displayName.localeCompare(b.displayName);
        });
    }

    getFishMenuCategory(fish) {
        if (this.isFishUnlocked(fish.key)) {
            return "unlocked";
        }

        if (!this.isFishRequirementMet(fish)) {
            return "requirement";
        }

        if (fish.unlockType === "drop") {
            return "drop";
        }

        if (fish.unlockType === "gem") {
            return "gem";
        }

        if (fish.unlockType === "coin") {
            return "coin";
        }

        return "other";
    }

    getUnlockCategoryLabel(category) {
        switch (category) {
            case "unlocked":
                return "Unlocked Fish";
            case "drop":
                return "Random Drop Unlocks";
            case "gem":
                return "Gem Unlocks";
            case "coin":
                return "Coin Unlocks";
            case "requirement":
                return "Locked by Requirement";
            default:
                return "Other Unlocks";
        }
    }

    isFishUnlocked(fishKey) {
        return this.unlockedFishKeys[fishKey] === true;
    }

    isFishRequirementMet(fish) {
        if (!fish.requires) {
            return true;
        }

        return this.isFishUnlocked(fish.requires);
    }

    getFishDisplayNameByKey(fishKey) {
        const fish = this.getFishDefinitions().find((entry) => {
            return entry.key === fishKey;
        });

        if (!fish) {
            return fishKey;
        }

        return fish.displayName;
    }

    getFishUnlockStatusText(fish) {
        if (this.isFishUnlocked(fish.key)) {
            if (fish.key === this.currentFishKey) {
                return {
                    text: "Selected",
                    color: "#55ff88"
                };
            }

            return {
                text: "Unlocked • Click to select",
                color: "#55ff88"
            };
        }

        if (!this.isFishRequirementMet(fish)) {
            return {
                text: `Locked • Requires ${this.getFishDisplayNameByKey(fish.requires)}`,
                color: "#ffb0b0"
            };
        }

        if (fish.unlockType === "drop") {
            const pieces = this.fishPieces[fish.key] || 0;

            return {
                text: `Locked • Pieces ${pieces}/${fish.piecesRequired}`,
                color: "#d6d6d6"
            };
        }

        if (fish.unlockType === "coin") {
            return {
                text: `Locked • ${fish.price} Gold`,
                color: "#ffd76a"
            };
        }

        if (fish.unlockType === "gem") {
            return {
                text: `Locked • ${fish.price} Gems • Click to buy`,
                color: "#9be8ff"
            };
        }

        return {
            text: "Locked",
            color: "#d6d6d6"
        };
    }

    createFishStatusDisplay(fish, x, y) {
        const container = this.add.container(x, y);

        const baseStyle = {
            fontFamily: "Arial",
            fontSize: "17px",
            stroke: "#000000",
            strokeThickness: 4
        };

        if (
            !this.isFishUnlocked(fish.key) &&
            this.isFishRequirementMet(fish) &&
            fish.unlockType === "drop"
        ) {
            const pieces = this.fishPieces[fish.key] || 0;
            const progressColor = pieces > 0 ? "#fff2a8" : "#d6d6d6";

            const prefixText = this.add.text(
                0,
                0,
                "Locked • Pieces ",
                {
                    ...baseStyle,
                    color: "#d6d6d6"
                }
            );

            prefixText.setOrigin(0, 0.5);

            const pieceText = this.add.text(
                prefixText.width,
                0,
                `${pieces}`,
                {
                    ...baseStyle,
                    color: progressColor
                }
            );

            pieceText.setOrigin(0, 0.5);

            const suffixText = this.add.text(
                prefixText.width + pieceText.width,
                0,
                `/${fish.piecesRequired}`,
                {
                    ...baseStyle,
                    color: "#d6d6d6"
                }
            );

            suffixText.setOrigin(0, 0.5);

            container.add([prefixText, pieceText, suffixText]);

            return container;
        }

        const statusInfo = this.getFishUnlockStatusText(fish);

        const statusText = this.add.text(
            0,
            0,
            statusInfo.text,
            {
                ...baseStyle,
                color: statusInfo.color
            }
        );

        statusText.setOrigin(0, 0.5);
        container.add(statusText);

        return container;
    }
    
    getEligiblePieceFish() {
        return this.getFishDefinitions().filter((fish) => {
            const pieces = this.fishPieces[fish.key] || 0;

            return (
                fish.unlockType === "drop" &&
                !this.isFishUnlocked(fish.key) &&
                this.isFishRequirementMet(fish) &&
                pieces < fish.piecesRequired
            );
        });
    }

    pickWeightedFish(fishList) {
        let totalWeight = 0;

        for (const fish of fishList) {
            totalWeight += fish.dropWeight;
        }

        if (totalWeight <= 0) {
            return fishList[0];
        }

        let roll = Math.random() * totalWeight;

        for (const fish of fishList) {
            roll -= fish.dropWeight;

            if (roll <= 0) {
                return fish;
            }
        }

        return fishList[0];
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

        this.playSfx("medKitSound", { volume: 0.75 });

        this.medKitCount--;
        this.changePlayerHealth(10);
        this.updateUI();
        this.saveProgress();

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

        this.playSfx("rockSound", { volume: 0.75 });

        this.rockCount--;
        this.rockShieldActive = true;
        this.updateUI();
        this.saveProgress();

        this.flyItemToPlayer("rock", this.rockUI.icon, () => {
            if (this.rockShieldActive) {
                this.attachRockShieldToPlayer();
            }
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
        if (!this.rockShieldActive && !this.rockShieldSprite) {
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

        if (this.rockShieldActive) {
            this.removeRockShield();
        }

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
        this.levelRewardOpen = true;
        this.addResource("keys", 1);
        this.playSfx("levelCompleteSound", { volume: 0.78 });

        const rewards = this.openLevelChests();
        this.currentLevel++;
        this.saveProgress();

        this.showLevelRewardScreen(rewards);
        this.updateUI();
    }

    continueAfterRewards() {
        this.levelRewardOpen = false;

        if (this.levelResultOverlay) {
            this.levelResultOverlay.destroy();
            this.levelResultOverlay = null;
        }

        this.restartLevelState();
    }

    failLevel() {
        this.levelEnded = true;
        this.isMoving = true;
        this.failChoiceOpen = true;
        this.playSfx("fishFlopSound", { volume: 0.78 });

        this.showLevelResult("LEVEL FAILED", [
            `You collected ${this.chestsCollected}/${this.levelConfig.maxChests} chests`,
            "Retrying will lose all collected chests",
            `Press C to continue for ${this.chestRewardConfig.continueGemCost} gems`,
            "Press R to retry this level"
        ]);
    }

    continueAfterFailure() {
        if (this.gemCount < this.chestRewardConfig.continueGemCost) {
            this.showChestRewardMessage("Not enough gems to continue");
            return;
        }

        this.gemCount -= this.chestRewardConfig.continueGemCost;
        this.playerHealth = this.playerStartingHealth;
        this.updateHealthText();

        this.failChoiceOpen = false;
        this.levelEnded = false;
        this.isMoving = false;

        if (this.levelResultOverlay) {
            this.levelResultOverlay.destroy();
            this.levelResultOverlay = null;
        }

        this.updateUI();
        this.saveProgress();
        this.showChestRewardMessage("Continued with starting health");
    }

    retryAfterFailure() {
        this.failChoiceOpen = false;
        this.restartLevelState();
    }

    showLevelResult(message, detailLines = []) {
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
            -95,
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

        const detailText = this.add.text(
            0,
            25,
            detailLines.join("\n"),
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        detailText.setOrigin(0.5);

        this.levelResultOverlay.add([overlay, resultText, detailText]);
    }

    showLevelRewardScreen(rewards) {
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
            0.45
        );

        const panel = this.add.rectangle(
            0,
            0,
            720,
            560,
            0x000000,
            0.62
        );

        panel.setStrokeStyle(3, 0xffffff, 0.22);

        const titleText = this.add.text(
            0,
            -235,
            "LEVEL COMPLETE",
            {
                fontFamily: "Arial",
                fontSize: "46px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 8
            }
        );

        titleText.setOrigin(0.5);

        const chestText = this.add.text(
            0,
            -188,
            `Opened ${this.chestsCollected} chest${this.chestsCollected === 1 ? "" : "s"}`,
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#ffeaa7",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        chestText.setOrigin(0.5);

        const rewardList = this.add.container(0, -112);

        if (rewards.length === 1 && rewards[0].type === "none") {
            const noRewardText = this.add.text(
                0,
                72,
                "No chests opened",
                {
                    fontFamily: "Arial",
                    fontSize: "28px",
                    color: "#ffffff",
                    align: "center",
                    stroke: "#000000",
                    strokeThickness: 6
                }
            );

            noRewardText.setOrigin(0.5);
            rewardList.add(noRewardText);
        } else {
            const columns = 3;
            const spacingX = 205;
            const spacingY = 135;

            for (let i = 0; i < rewards.length; i++) {
                const reward = rewards[i];
                const col = i % columns;
                const row = Math.floor(i / columns);

                const rewardCard = this.createRewardCard(
                    reward,
                    (col - 1) * spacingX,
                    row * spacingY
                );

                rewardList.add(rewardCard);
            }
        }

        const continueButton = this.createContinueButton(
            0,
            225,
            () => {
                this.continueAfterRewards();
            }
        );

        const helperText = this.add.text(
            0,
            178,
            "Press ENTER to continue",
            {
                fontFamily: "Arial",
                fontSize: "19px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        helperText.setOrigin(0.5);

        this.levelResultOverlay.add([
            overlay,
            panel,
            titleText,
            chestText,
            rewardList,
            helperText,
            continueButton
        ]);
    }

    createRewardCard(reward, x, y) {
        const card = this.add.container(x, y);

        const bg = this.add.rectangle(
            0,
            0,
            170,
            112,
            0x000000,
            0.34
        );

        if (reward.type === "fullChestBonus") {
            bg.setStrokeStyle(3, 0xffd15c, 0.9);
        } else {
            bg.setStrokeStyle(2, 0xffffff, 0.18);
        }

        const icon = this.add.image(0, -18, reward.iconKey);

        if (reward.type === "fishPieces") {
            icon.setScale(5);
        } else if (reward.type === "rock") {
            this.fitSpriteToCell(icon, 58, 58);
            icon.y -= 4;
        } else if (reward.type === "medKit") {
            this.fitSpriteToCell(icon, 54, 54);
        } else {
            this.fitSpriteToCell(icon, 48, 48);
        }

        const amountText = this.add.text(
            0,
            23,
            reward.topText,
            {
                fontFamily: "Arial",
                fontSize: "24px",
                color: reward.type === "fullChestBonus" ? "#ffd15c" : "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        amountText.setOrigin(0.5);

        const labelText = this.add.text(
            0,
            49,
            reward.bottomText,
            {
                fontFamily: "Arial",
                fontSize: "15px",
                color: reward.type === "fullChestBonus" ? "#ffd15c" : "#d6d6d6",
                align: "center",
                stroke: "#000000",
                strokeThickness: 4,
                wordWrap: {
                    width: 150
                }
            }
        );

        labelText.setOrigin(0.5);

        card.add([bg, icon, amountText, labelText]);

        return card;
    }

    createContinueButton(x, y, callback) {
        const button = this.add.container(x, y);

        const bg = this.add.rectangle(
            0,
            0,
            230,
            58,
            0x000000,
            0.42
        );

        bg.setStrokeStyle(2, 0xffffff, 0.24);
        bg.setInteractive({ useHandCursor: true });

        const text = this.add.text(
            0,
            0,
            "Continue",
            {
                fontFamily: "Arial",
                fontSize: "26px",
                color: "#55ff88",
                align: "center",
                stroke: "#000000",
                strokeThickness: 6
            }
        );

        text.setOrigin(0.5);

        bg.on("pointerdown", () => {
            this.playClickSound();
            callback();
        });

        button.add([bg, text]);

        return button;
    }

    restartLevelState() {
        if (this.levelResultOverlay) {
            this.levelResultOverlay.destroy();
            this.levelResultOverlay = null;
        }

        this.clearBoard();

        this.playerHealth = this.playerStartingHealth;
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
        this.failChoiceOpen = false;
        this.levelRewardOpen = false;
        this.turnCount = 0;

        this.chestsSpawned = 0;
        this.chestsCollected = 0;
        this.keyCollected = 0;
        this.keyHasSpawnedThisLevel = false;

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

        if (this.shouldForceFirstLevelKeySpawn()) {
            for (const type in weights) {
                weights[type] = 0;
            }

            weights.key = 1;
            return weights;
        }

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

    shouldForceFirstLevelKeySpawn() {
        return (
            this.currentLevel === 1 &&
            !this.isInitializingBoard &&
            !this.keyHasSpawnedThisLevel &&
            this.turnCount === this.levelConfig.firstLevelForceKeyTurn
        );
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

            if (this.currentLevel === 1) {
                tile.damage = Math.min(tile.damage, this.levelConfig.firstLevelMaxDamage);
            }

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

        if (type === "key") {
            this.keyHasSpawnedThisLevel = true;
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

    pickWeightedKey(weights) {
        let totalWeight = 0;

        for (const key in weights) {
            totalWeight += weights[key];
        }

        if (totalWeight <= 0) {
            return "gold";
        }

        let roll = Math.random() * totalWeight;

        for (const key in weights) {
            roll -= weights[key];

            if (roll <= 0) {
                return key;
            }
        }

        return "gold";
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
            this.playSfx("chestSound", { volume: 0.72 });
            this.chestsCollected++;
            console.log(`Pending chests: ${this.chestsCollected}/${this.levelConfig.maxChests}`);
            this.updateUI();
        }

        if (tile.type === "key") {
            this.playSfx("keySound", { volume: 0.72 });
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

    openLevelChests() {
        const rewards = [];

        if (this.chestsCollected <= 0) {
            rewards.push({
                type: "none",
                text: "No chests opened"
            });

            return rewards;
        }

        for (let i = 0; i < this.chestsCollected; i++) {
            rewards.push(this.rollChestReward());
        }

        if (this.chestsCollected === this.levelConfig.maxChests) {
            rewards.push(this.rewardFullChestBonus());
        }

        if (this.unlockMenuOpen) {
            this.populateUnlockList();
        }

        return rewards;
    }

    rollChestReward() {
        const weights = this.getAdjustedChestDropWeights();
        const rewardType = this.pickWeightedKey(weights);

        switch (rewardType) {
            case "gold":
                return this.rewardGold();
            case "gems":
                return this.rewardGems();
            case "fishPieces":
                return this.rewardFishPieces();
            case "medKit":
                return this.rewardMedKit();
            case "rock":
                return this.rewardRock();
            default:
                return this.rewardGold();
        }
    }

    getAdjustedChestDropWeights() {
        const weights = { ...this.chestRewardConfig.dropWeights };

        if (this.getEligiblePieceFish().length <= 0) {
            weights.fishPieces = 0;
        }

        return weights;
    }

    rewardGold() {
        const amount = this.addResource("gold", this.getGoldDropAmount());


        return {
            type: "gold",
            iconKey: "gold",
            amount: amount,
            topText: `+${amount}`,
            bottomText: "Gold"
        };
    }

    rewardGems() {
        const amount = this.addResource("gems", this.pickWeightedValue(this.chestRewardConfig.gemDropValues));


        return {
            type: "gems",
            iconKey: "gem",
            amount: amount,
            topText: `+${amount}`,
            bottomText: "Gems"
        };
    }

    rewardFullChestBonus() {
        const amount = this.addResource("gems", this.chestRewardConfig.fullChestBonusGems);


        return {
            type: "fullChestBonus",
            iconKey: "gem",
            amount: amount,
            topText: `+${amount}`,
            bottomText: "Bonus Reward"
        };
    }

    rewardMedKit() {
        const amount = this.addResource("medKit", 1);

        return {
            type: "medKit",
            iconKey: "medKit",
            amount: amount,
            topText: `+${amount}`,
            bottomText: "Med Kit"
        };
    }

    rewardRock() {
        const amount = this.addResource("rock", 1);

        return {
            type: "rock",
            iconKey: "rock",
            amount: amount,
            topText: `+${amount}`,
            bottomText: "Rock"
        };
    }

    rewardFishPieces() {
        const eligibleFish = this.getEligiblePieceFish();

        if (eligibleFish.length <= 0) {
            return this.rewardGold();
        }

        const fish = this.pickWeightedFish(eligibleFish);
        const amount = this.pickWeightedValue(this.chestRewardConfig.fishPieceDropValues);
        const currentPieces = this.fishPieces[fish.key] || 0;
        const newPieces = Phaser.Math.Clamp(
            currentPieces + amount,
            0,
            fish.piecesRequired
        );

        this.fishPieces[fish.key] = newPieces;

        if (newPieces >= fish.piecesRequired) {
            this.unlockedFishKeys[fish.key] = true;
            this.playSfx("unlockSound", { volume: 0.75 });

            return {
                type: "fishPieces",
                iconKey: fish.key,
                fishKey: fish.key,
                amount: amount,
                topText: `${amount}x`,
                bottomText: `Unlocked ${fish.displayName}!`
            };
        }

        return {
            type: "fishPieces",
            iconKey: fish.key,
            fishKey: fish.key,
            amount: amount,
            topText: `${amount}x`,
            bottomText: `${fish.displayName} Pieces`
        };
    }

    getGoldDropAmount() {
        const values = [];
        let index = 0;

        for (
            let value = this.chestRewardConfig.goldDrop.min;
            value <= this.chestRewardConfig.goldDrop.max;
            value += this.chestRewardConfig.goldDrop.step
        ) {
            values.push({
                value: value,
                weight: Math.max(
                    this.chestRewardConfig.goldDrop.minWeight,
                    this.chestRewardConfig.goldDrop.startWeight - index
                )
            });

            index++;
        }

        return this.pickWeightedValue(values);
    }

    showChestRewardMessage(message) {
        if (this.chestRewardToast) {
            this.chestRewardToast.destroy();
        }

        this.chestRewardToast = this.add.container(
            this.game.config.width / 2,
            160
        );

        this.chestRewardToast.setDepth((this.menuOpen || this.levelRewardOpen) ? 760 : 420);

        const bg = this.add.rectangle(
            0,
            0,
            520,
            58,
            0x000000,
            0.42
        );

        bg.setStrokeStyle(2, 0xffffff, 0.22);

        const text = this.add.text(
            0,
            0,
            message,
            {
                fontFamily: "Arial",
                fontSize: "22px",
                color: "#ffffff",
                align: "center",
                stroke: "#000000",
                strokeThickness: 5
            }
        );

        text.setOrigin(0.5);

        this.chestRewardToast.add([bg, text]);

        this.tweens.add({
            targets: this.chestRewardToast,
            alpha: 0,
            y: 135,
            duration: 900,
            delay: 900,
            ease: "Sine.easeIn",
            onComplete: () => {
                if (this.chestRewardToast) {
                    this.chestRewardToast.destroy();
                    this.chestRewardToast = null;
                }
            }
        });
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
        let spikeChanged = false;

        for (let row = 0; row < this.grid.rows; row++) {
            for (let col = 0; col < this.grid.cols; col++) {
                const tile = this.board[row][col];

                if (tile !== null && tile.type === "spikes") {
                    spikeChanged = true;
                    const newActiveState = !tile.active;
                    this.animateSpikeTile(tile, newActiveState);
                    tile.active = newActiveState;
                    this.updateSpikeDamageDisplay(tile);
                }
            }
        }

        if (spikeChanged) {
            this.playSfx("spikesSound", { volume: 0.72 });
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