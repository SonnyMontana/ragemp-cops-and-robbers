const Players = require('../modules/players');
const requiredExperiences = require("../data/xpdata"); // 8000 levels from GTA Online - credit: https://pastebin.com/fFkUygTy
const maxLevel = requiredExperiences.length - 1;
const maxExperience = requiredExperiences[maxLevel];
const Config = require('../data/config.json');

const clamp = (value, min, max) => {
    return value <= min ? min : value >= max ? max : value;
};

const levelFromXP = (xp) => {
    return clamp(requiredExperiences.findIndex(lvlXP => lvlXP >= xp), 1, maxLevel);
};


module.exports = {
    
    "sJobSelection": (player, job) => {
        if(job == 0) {
            player.notifyWithPicture("New message", "Boss", "Hey, you're employed as hacker now, so do your job! Don't know what to do ? Type /jobHelp", "CHAR_CHAT_CALL", 1, false, 0, 139);
        }
        Players.setPlayerJob(player.ID, job);
        player.setXP(Players.getPlayerXP(player.ID));
    },
    "playerReady": (player) => {
        // Sets the player's level to newLevel. (will also change player's XP)
        player.data.currentXP = 0;
        player.data.currentLevel = 1;
        player.setLevel = function(newLevel) {
            let prevLevel = this.data.currentLevel;
            this.data.currentLevel = clamp(newLevel, 1, maxLevel);

            if (this.data.currentLevel != prevLevel) {
                let prevXP = this.data.currentXP;
                this.data.currentXP = requiredExperiences[this.data.currentLevel - 1] + ((this.data.currentLevel > 1) ? 1 : 0);
                Players.setXP(player.ID, this.data.currentXP);

                if (this.data.currentXP != prevXP) mp.events.call("playerXPChange", this, prevXP, this.data.currentXP, this.data.currentXP - prevXP);
                mp.events.call("playerLevelChange", this, prevLevel, this.data.currentLevel);
                this.call("updateRankBar", [requiredExperiences[this.data.currentLevel - 1], requiredExperiences[this.data.currentLevel], prevXP]);
            }
        };

        // Sets the player's experience to newXP.
        player.setXP = function(newXP) {
            let prevXP = this.data.currentXP;
            this.data.currentXP = clamp(newXP, 0, maxExperience);

            if (this.data.currentXP != prevXP) {
                mp.events.call("playerXPChange", this, prevXP, this.data.currentXP, this.data.currentXP - prevXP);

                let calculatedLevel = levelFromXP(this.data.currentXP);
                if (this.data.currentLevel != calculatedLevel) {
                    mp.events.call("playerLevelChange", this, this.data.currentLevel, calculatedLevel);
                    this.data.currentLevel = calculatedLevel;
                }
                Players.setXP(player.ID, newXP);

                this.call("updateRankBar", [requiredExperiences[this.data.currentLevel - 1], requiredExperiences[this.data.currentLevel], prevXP]);
            }
        };

        // Changes the player's experience by xpAmount.
        player.changeXP = function(xpAmount) {
            let prevXP = this.data.currentXP;
            this.data.currentXP = clamp(prevXP + xpAmount, 0, maxExperience);

            if (this.data.currentXP != prevXP) {
                mp.events.call("playerXPChange", this, prevXP, this.data.currentXP, this.data.currentXP - prevXP);

                let calculatedLevel = levelFromXP(this.data.currentXP);
                if (this.data.currentLevel != calculatedLevel) {
                    mp.events.call("playerLevelChange", this, this.data.currentLevel, calculatedLevel);
                    this.data.currentLevel = calculatedLevel;
                }
                Players.changeXP(player.ID, xpAmount);

                this.call("updateRankBar", [requiredExperiences[this.data.currentLevel - 1], requiredExperiences[this.data.currentLevel], prevXP]);
            }
        };

        // Returns whether the player reached the max level or not.
        player.hasReachedMaxLevel = function() {
            return this.data.currentLevel >= maxLevel && this.data.currentXP >= maxExperience;
        };
        player.updateWantedLevel = function(level) {        
            level = (level > 6) ? 6 : level < 0 ? 0 : level;
            Players.updatePlayerWantedLevel(this.ID, level);
            this.call("setWantedLevel", [level]);
        };
        player.clearWantedLevel = function(message = true) {
            this.call("clearWantedLevel", [message]);
            Players.updatePlayerWantedLevel(this.ID, 6, false);
        };
    },
    
    // HACKERS
    "hackerATM" : (player, id) => {
        job = Players.getPlayerJob(player.ID);
        if(job !== 0) return player.notify("You must be hacker to do this");
        Players.notifyCops("Somebody is trying to hack an ATM!", player.position);
        player.call("hackerConsole", ["ATM"]);
    },
    "hackerATMWithdraw": (player) => {
        cash = Math.floor(Math.random() * Config.maxATMCashHack);
        player.notifyWithPicture("New message", "Boss", `You've stolen <C>${cash}$</C>, pretty nice! \nBut still be aware of cops`, "CHAR_LESTER", 9, false, 18);
        mp.events.call("sCashUpdate", player, cash);
        player.changeXP(500)
        player.updateWantedLevel(1);
        
    }
}

mp.events.add("playerXPChange", (player, oldXP, newXP, difference) => {
    console.log(`${player.name} ${difference < 0 ? "lost" : "gained"} some XP. Old: ${oldXP} - New: ${newXP} - Difference: ${difference}`);
});

mp.events.add("playerLevelChange", (player, oldLevel, newLevel) => {
    console.log(`${player.name} had a level change. Old: ${oldLevel} - New: ${newLevel}`);
});