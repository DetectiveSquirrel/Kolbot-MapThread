/* TO-DO List
	Add more buttons for act 2 town

	To move stats window hold left ctrl and click middle mouse button, this location is saved :)

	.find shrine - finds xp shrine in area
	.kill mobs - stuff for DrDentist
	.count keys says key count of each key
*/


include("json2.js");
include("NTItemParser.dbl");
include("OOG.js");
include("AutoMule.js");
include("Gambling.js");
include("CraftingSystem.js");
include("TorchSystem.js");
include("MuleLogger.js");
include("common/Attack.js");
include("common/Cubing.js");
include("common/CollMap.js");
include("common/Config.js");
include("common/Loader.js");
include("common/Misc.js");
include("common/Pickit.js");
include("common/Pather.js");
include("common/Precast.js");
include("common/Prototypes.js");
include("common/Runewords.js");
include("common/Storage.js");
include("common/Town.js");
include("ItemDB.js");

// Custom Libs
include("common/Color.js");
include("common/KeyboardMap.js");

Config.init();


/*
	Keybinds can be found here: www.cambiaresearch.com/articles/15/javascript-char-codes-key-codes

	Usage: [KeyCode, "Text In Menu"]
	Example: http://puu.sh/wwrjb/810d137b08.jpg
*/

var Keybinds = {
	// Auto Tele
	NextArea: 			[96, "Next Area"],
	PreviousArea: 		[97, "Previous Area"],
	Waypoint: 			[98, "Waypoint"],
	PointOfInterest: 	[99, "Point of Interest"],
	SideArea: 			[100, "Sidea Area"],

	// Hud
	MonstersOnMap: 		[103, "Toggle Monsters on Map"],
	LinesOnMap: 		[104, "Toggle Areas on Map"],
	StatBox: 			[105, "Toggle Character Stats"],
	MenuBox: 			[107, "Toggle This Menu"],

	// Chaos Assistant: activated when entering Chaos Sanctuary
	ChaosVizier: 			[53, "Chaos Assistant: Go To Vizier"],
	ChaosSeis: 				[54, "Chaos Assistant: Go To Seis"],
	ChaosInfector: 			[55, "Chaos Assistant: Go To Infector"],
	ChaosDiablo: 			[56, "Chaos Assistant: Go To Star"],
	ChaosToggleOpenSeal: 	[57, "Chaos Assistant: Toggle Seal Activation"],
	ChaosCharToLeaveTeam: 	[48, "Chaos Assistant: Sends leave team message"]
};

// Custom addition for drDentist, pay no mind to this.
// Associated with Keybinds.ChaosCharToLeaveTeam
var ChaosAssitantSecondary = {
	// Char name in game to tell to leave party (specifically for custom Follower.js)
	// Case SeNsItIvE
	CharName: "SJF"
};

var SaveInfo = {
	create: function () {
		var obj, string;

		obj = {
			StatBoxX: 450,
			StatBoxY: 50,
		};

		string = JSON.stringify(obj);

		//FileTools.writeText("data/MapHelperSettings.json", string);
		Misc.fileAction("data/MapHelperSettings.json", 1, string);

		return obj;
	},

	getObj: function () {
		var obj, string;

		if (!FileTools.exists("data/MapHelperSettings.json")) {
			DataFile.create();
		}

		//string = FileTools.readText("data/MapHelperSettings.json");
		string = Misc.fileAction("data/MapHelperSettings.json", 0);

		try {
			obj = JSON.parse(string);
		} catch (e) {
			// If we failed, file might be corrupted, so create a new one
			obj = this.create();
		}

		if (obj) {
			return obj;
		}

		print("Error reading DataFile. Using null values.");

		return {StatBoxX: 450, StatBoxY: 50};
	},

	getStats: function () {
		var obj = this.getObj();

		return Misc.clone(obj);
	},

	updateStats: function (arg, value) {

		var i, obj, string,
			statArr = [];

		if (typeof arg === "object") {
			statArr = arg.slice();
		}

		if (typeof arg === "string") {
			statArr.push(arg);
		}

		obj = this.getObj();

		for (i = 0; i < statArr.length; i += 1) {
			switch (statArr[i]) {
			case "StatBoxX":
				obj.StatBoxX = value;

				break;
			case "StatBoxY":
				obj.StatBoxY = value;

				break;
			default:
				obj[statArr[i]] = value;

				break;
			}
		}

		string = JSON.stringify(obj);

		//FileTools.writeText("data/MapHelperSettings.json", string);
		Misc.fileAction("data/MapHelperSettings.json", 1, string);
	}
};

var Hooks = {
	monsters: {
		hooks: [],
		enabled: true,

		check: function () {
			if (!this.enabled) {
				this.flush();

				return;
			}

			var i, unit;

			for (i = 0; i < this.hooks.length; i += 1) {
				if (!copyUnit(this.hooks[i].unit).x) {
					this.hooks[i].hook[0].remove();
					this.hooks.splice(i, 1);

					i -= 1;
				}
			}

			unit = getUnit(1);

			if (unit) {
				do {
					if (Attack.checkMonster(unit)) {
						if (!this.getHook(unit)) {
							this.add(unit);
						} else {
							this.updateCoords(unit);
							//this.updateText(unit);
						}
					} else {
						this.remove(unit);
					}
				} while (unit.getNext());
			}
		},

		newHook: function (unit) {
			var array 					= [],
				HookText 				= unitDrawName(unit),
				X 						= unit.x,
				Y 						= unit.y,
				Color 					= specTypeColor(unit),
				TextSize 				= unitDrawTextSize(unit),
				UnitSpecType 			= unit.spectype,
				UniqueBossSpecType 		= 0x04,
				UniqueQuestModSpecType 	= 0x05,
				MagicSpecType		 	= 0x06,
				BossMinionSpecType		= 0x08;

			array.push(new Text(HookText, X, Y, Color, TextSize, null, true));

			switch(UnitSpecType) {
				case BossMinionSpecType:
					array[array.length-1].zorder=3;
					break;
				case MagicSpecType:
					array[array.length-1].zorder=2;
					break;
				case UniqueBossSpecType:
					array[array.length-1].zorder=5;
					break;
				case UniqueQuestModSpecType:
					array[array.length-1].zorder=4;
					break;
				default:
					array[array.length-1].zorder=1;
					break;
			}
			
			return array;
		},

		add: function (unit) {
			this.hooks.push({
				unit: copyUnit(unit),
				hook: this.newHook(unit)
			});
		},

		updateCoords: function (unit) {
			var hook 			= this.getHook(unit),
				hookZero 		= hook[0],
				X 				= unit.x,
				Y 				= unit.y;

			if (!hook) {
				return false;
			}

			hookZero.x = X;
			hookZero.y = Y;

			return true;
		},

		updateText: function (unit) {
			var hook 		= this.getHook(unit),
				hookText 	= hook[0].text,
				NewText 	= unitDrawName(unit);

			if (!hook) {
				return false;
			}

			hookText = NewText;

			return true;
		},

		getHook: function (unit) {
			var i;

			for (i = 0; i < this.hooks.length; i += 1) {
				if (this.hooks[i].unit.gid === unit.gid) {
					return this.hooks[i].hook;
				}
			}

			return false;
		},

		remove: function (unit) {
			var i;

			for (i = 0; i < this.hooks.length; i += 1) {
				if (this.hooks[i].unit.gid === unit.gid) {
					this.hooks[i].hook[0].remove();
					this.hooks.splice(i, 1);

					return true;
				}
			}

			return false;
		},

		flush: function () {
			while (this.hooks.length) {
				this.hooks[0].hook[0].remove();
				this.hooks.shift();
			}
		}
	},

	keyMenu: {
		hooks: [],
		enabled: false,
		mouseCoords: [450, 50],
		MenuSize: 0,

		MenuLength: function (obj) {
		    var size = 0, key;
		    for (key in obj) {
		        if (obj.hasOwnProperty(key)) size++;
		    }
		    this.MenuSize = size;
		},

		updateStatBoxPos: function () {
			SaveInfo.updateStats("KeyMenuBoxX", this.mouseCoords[0]);
			SaveInfo.updateStats("KeyMenuBoxY", this.mouseCoords[1]);

			if (!this.getHook("KeyMenuBackgroundBox")) {
				this.add("KeyMenuBackground");
				this.add("KeyMenuKeybinds");
			} else {
				var i, startArrayPoint = 15, size = 0;
				
				for (var key in Keybinds) {
					 if (Keybinds.hasOwnProperty(key)) {
						this.getHook(size).hook.x = this.mouseCoords[0]+7;
						this.getHook(size).hook.y = this.mouseCoords[1]+startArrayPoint;
						this.getHook(size).hook.zorder = 16;
						startArrayPoint += 10;
						size++;
					}
				}

				this.getHook("KeyMenuBackgroundBorder").hook.x = this.mouseCoords[0];
				this.getHook("KeyMenuBackgroundBorder").hook.y = this.mouseCoords[1];
				this.getHook("KeyMenuBackgroundBorder").hook.zorder = 15;

				this.getHook("KeyMenuBackgroundBox").hook.x = this.mouseCoords[0];
				this.getHook("KeyMenuBackgroundBox").hook.y = this.mouseCoords[1];
				this.getHook("KeyMenuBackgroundBox").hook.zorder = 14;

			}
		},

		check: function () {
			this.MenuLength(Keybinds);

			if (!this.enabled) {
				this.flush();

				return;
			}

			if (!this.getHook("KeyMenuBackgroundBox")) {
				this.add("KeyMenuBackground");
				this.add("KeyMenuKeybinds");
			} else {
				var i, startArrayPoint = 15, size = 0;
				
				for (var key in Keybinds) {
					 if (Keybinds.hasOwnProperty(key)) {
						this.getHook(size).hook.x = this.mouseCoords[0]+7;
						this.getHook(size).hook.y = this.mouseCoords[1]+startArrayPoint;
						startArrayPoint += 10;
						size++;
					}
				}

			}
		},

		add: function (name) {
			switch (name) {
			case "KeyMenuBackground":
				this.hooks.push({
					name: "KeyMenuBackgroundBox",
					hook: new Box(this.mouseCoords[0], this.mouseCoords[1], 275, (this.MenuSize+1)*10, 0x0, 2, 0)
				});
				this.hooks.push({
					name: "KeyMenuBackgroundBorder",
					hook: new Frame(this.mouseCoords[0], this.mouseCoords[1], 275, (this.MenuSize+1)*10, 0)
				});

				this.getHook("KeyMenuBackgroundBorder").hook.zorder = 15;
				this.getHook("KeyMenuBackgroundBox").hook.zorder = 14;

				break;
			case "KeyMenuKeybinds":
				var i, startArrayPoint = 15, size = 0;
				
				for (var key in Keybinds) {
					 if (Keybinds.hasOwnProperty(key)) {
						this.hooks.push({
							name: size,
							hook: new Text(Color.Green + Keybinds[key][1] + Color.Gold + " :: " + Color.Orange + KeyboardMap[Keybinds[key][0]], this.mouseCoords[0]+7, this.mouseCoords[1]+startArrayPoint, 0, 6, 0)
						});

						this.getHook(size).hook.zorder = 16;
						startArrayPoint += 10;
						size++;
					}
				}
				break;
			}
		},

		getHook: function (name) {
			var i;

			for (i = 0; i < this.hooks.length; i += 1) {
				if (this.hooks[i].name === name) {
					return this.hooks[i];
				}
			}

			return false;
		},
		flush: function () {
			if (getUIFlag(0x0D)) {
				return;
			}

			while (this.hooks.length) {
				this.hooks.shift().hook.remove();
			}
		}
	},

	stats: {
		hooks: [],
		enabled: false,
		myStatTextArray:   [],
		mouseCoords:   [SaveInfo.getStats().StatBoxX, SaveInfo.getStats().StatBoxY],

		updateStats: function () {
			this.myStatTextArray = [
			//	["Name",					"String", 																getStat(), Ammount to deduct from getStat because of Config.FCR/IAS/FHR]
				["Magic Find", 				Color.Gold+me.getStat(80)+"% Better Chance of Getting Magic Items", 	80, 0],
				["Gold Find", 				Color.Gold+me.getStat(79)+"% Extra Gold from Monsters", 				79, 0],
				["Reduced Vendor Price %", 	Color.Gold+"Reduce all Vendor Prices by " + me.getStat(87) + "%", 		87, 0],
				["EXP Gained %", 			Color.Gold+me.getStat(85)+"% Experience Gained",						85,	0],

				["FCR", 					Color.Orange+(me.getStat(105)-Config.FCR)+"% Faster Cast Rate", 		105, Config.FCR],
				["FRW", 					Color.Orange+me.getStat(96)+"% Faster Run/Walk", 						96, 0],
				["FHR", 					Color.Orange+(me.getStat(99)-Config.FHR)+"% Faster Hit Recovery", 		99, Config.FHR],
				["IAS", 					Color.Orange+(me.getStat(93)-Config.IAS)+"% Increased Attack Speed", 	93, Config.IAS],

				["Chance To Freeze", 		Color.Blue+"Freeze Target " + me.getStat(134), 							134, 0],
				["Mana After Kill", 		Color.Blue+"+ "+me.getStat(138)+" Mana after Each Kill", 				138, 0],
				["DMG To Mana", 			Color.Blue+me.getStat(114)+"% Damage Taken Goes to Mana", 				114, 0],
				["Mana Regen", 				Color.Blue+me.getStat(27)+"% Mana Regeneration", 						27, 0],
				["Mana Leech", 				Color.Blue+me.getStat(62)+"% Mana Stolen per Hit", 						62, 0],

				["Life Leech", 				Color.Red+me.getStat(60)+"% Life Stolen per Hit", 						60, 0],
				["Life Replenish", 			Color.Red+"Replenish Life + " + me.getStat(74), 						74, 0],

				["Flee On Hit", 			Color.White+"Hit Causes Monster to Flee " + me.getStat(112) + "%", 		112, 0],
				["Damage Reduction",		Color.White+me.getStat(36)+"% Damage Reduction", 						36, 0],
				["Open Wounds", 			Color.White+me.getStat(135)+"% Chance of Open Wounds", 					135, 0],
				["Crushing Blow", 			Color.White+me.getStat(136)+"% Chance of Crushing Blow", 				136, 0],
				["Deadly Strike", 			Color.White+me.getStat(141)+"% Deadly Strike", 							141, 0],

				["Magic Absorb", 			Color.White+"Magic Absorb "+me.getStat(146)+"%", 						146, 0],
				["Fire Absorb", 			Color.Red+"Fire Absorb "+me.getStat(142)+"%", 							142, 0],
				["Cold Absorb", 			Color.Blue+"Cold Absorb "+me.getStat(148)+"%", 							148, 0],
				["Lightning Absorb", 		Color.Yellow+"Lightning Absorb "+me.getStat(144)+"%", 					144, 0],
				["Poison Length Reduction", Color.Green+"Poison Length Reduced by "+me.getStat(110)+"%", 			110, 0],
			];
		},

		updateStatBoxPos: function () {
			this.mouseCoords = getMouseCoords();
			SaveInfo.updateStats("StatBoxX", this.mouseCoords[0]);
			SaveInfo.updateStats("StatBoxY", this.mouseCoords[1]);

			if (!this.getHook("StatMenuBackgroundBox")) {
				this.add("StatMenuBackground");
				this.add("StatMenuPlayerStats");
			} else {
				var i, startArrayPoint = 15;
				
				for (i = 0; i < this.myStatTextArray.length; i++) {
					if (this.getHook(this.myStatTextArray[i][0])) {
						this.getHook(this.myStatTextArray[i][0]).hook.x = this.mouseCoords[0]+7;
						this.getHook(this.myStatTextArray[i][0]).hook.y = this.mouseCoords[1]+startArrayPoint;
						this.getHook(this.myStatTextArray[i][0]).hook.zorder = 19;
						startArrayPoint += 10;
					}
				}

				this.getHook("StatMenuBackgroundBorder").hook.x = this.mouseCoords[0];
				this.getHook("StatMenuBackgroundBorder").hook.y = this.mouseCoords[1];
				this.getHook("StatMenuBackgroundBorder").hook.zorder = 18;

				this.getHook("StatMenuBackgroundBox").hook.x = this.mouseCoords[0];
				this.getHook("StatMenuBackgroundBox").hook.y = this.mouseCoords[1];
				this.getHook("StatMenuBackgroundBox").hook.zorder = 17;

			}
		},

		check: function () {
			if (!this.enabled) {
				this.flush();

				return;
			}

			if (!this.getHook("StatMenuBackgroundBox")) {
				this.add("StatMenuBackground");
				this.add("StatMenuPlayerStats");
			} else {
				var i, startArrayPoint = 15;
				
				for (i = 0; i < this.myStatTextArray.length; i++) {				
					var CurrentStatToCheck = this.myStatTextArray[i][2],
						CurrentStatToCheckDecution = this.myStatTextArray[i][3],
						CurrentlyHaveStat = (me.getStat(CurrentStatToCheck) - CurrentStatToCheckDecution),
						CurrentHook = this.getHook(this.myStatTextArray[i][0]);

					if (CurrentlyHaveStat >= 1 && CurrentHook) {
						CurrentHook.hook.text = this.myStatTextArray[i][1];
						startArrayPoint += 10;
					} else if (CurrentlyHaveStat >= 1 && !CurrentHook) {
						this.flush();
					} else if (!CurrentlyHaveStat >= 1 && CurrentHook) {
						this.flush();
					}
				}

			}
		},

		add: function (name) {
			var MoreThanZeroStats = 0;

			for (i = 0; i < this.myStatTextArray.length; i++) {					
				var CurrentStatToCheck = this.myStatTextArray[i][2],
					CurrentStatToCheckDecution = this.myStatTextArray[i][3];

				if ((me.getStat(CurrentStatToCheck) - CurrentStatToCheckDecution) > 0) {
					MoreThanZeroStats += 1;
				}

			}

			switch (name) {
			case "StatMenuBackground":
				if (MoreThanZeroStats === 0) {
					this.hooks.push({
						name: "StatMenuBackgroundBox",
						hook: new Box(this.mouseCoords[0], this.mouseCoords[1], 250, (MoreThanZeroStats+2)*10, 0x0, 2, 0)
					});
					this.hooks.push({
						name: "StatMenuBackgroundBorder",
						hook: new Frame(this.mouseCoords[0], this.mouseCoords[1], 250, (MoreThanZeroStats+2)*10, 0)
					});
				} else {
					this.hooks.push({
						name: "StatMenuBackgroundBox",
						hook: new Box(this.mouseCoords[0], this.mouseCoords[1], 250, (MoreThanZeroStats+1)*10, 0x0, 2, 0)
					});
					this.hooks.push({
						name: "StatMenuBackgroundBorder",
						hook: new Frame(this.mouseCoords[0], this.mouseCoords[1], 250, (MoreThanZeroStats+1)*10, 0)
					});
				}

				break;
			case "StatMenuPlayerStats":
				var i, startArrayPoint = 15;

				for (i = 0; i < this.myStatTextArray.length; i++) {

					var CurrentStatToCheck = this.myStatTextArray[i][2],
						CurrentStatToCheckDecution = this.myStatTextArray[i][3];

					if ((me.getStat(CurrentStatToCheck) - CurrentStatToCheckDecution) > 0 && !this.getHook(this.myStatTextArray[i][1])) {
						this.hooks.push({
							name: this.myStatTextArray[i][0],
							hook: new Text(this.myStatTextArray[i][1], this.mouseCoords[0]+7, this.mouseCoords[1]+startArrayPoint, 0, 6, 0)
						});
						startArrayPoint += 10;

					this.getHook(this.myStatTextArray[i][0]).hook.zorder = 19;

					this.getHook("StatMenuBackgroundBorder").hook.zorder = 18;
					this.getHook("StatMenuBackgroundBox").hook.zorder = 17;
					}
				}

				if (MoreThanZeroStats === 0) {

					this.hooks.push({
						name: "No Addititves To Display",
						hook: new Text(Color.Red+"No Addititves To Display", this.mouseCoords[0]+7, this.mouseCoords[1]+startArrayPoint, 0, 6, 0)
					});

					this.getHook("No Addititves To Display").hook.zorder = 19;

				}
				break;
			}
		},

		getHook: function (name) {
			var i;

			for (i = 0; i < this.hooks.length; i += 1) {
				if (this.hooks[i].name === name) {
					return this.hooks[i];
				}
			}

			return false;
		},
		flush: function () {
			if (getUIFlag(0x0D)) {
				return;
			}

			while (this.hooks.length) {
				this.hooks.shift().hook.remove();
			}
		}
	},

	text: {
		hooks: [],
		enabled: true,
		ResistanceHooks: {
			FireRes: {
				Box: {
					X: 65,
					Y: 437,
					Width: 130,
					Height: 13
				},
				Text: {
					X: 65,
					Y: 437,
					Offset: 11,
					Text: "Fire Res: " + showResistances("fire")
				}
			},
			ColdRes: {
				Box: {
					X: 65,
					Y: 450,
					Width: 130,
					Height: 13
				},
				Text: {
					X: 65,
					Y: 450,
					Offset: 11,
					Text: "Cold Res: " + showResistances("cold")
				}
			},
			LightningRes: {
				Box: {
					X: 65,
					Y: 463,
					Width: 130,
					Height: 13
				},
				Text: {
					X: 65,
					Y: 463,
					Offset: 11,
					Text: "Light Res: " + showResistances("light")
				}
			},
			PoisonRes: {
				Box: {
					X: 65,
					Y: 476,
					Width: 130,
					Height: 13
				},
				Text: {
					X: 65,
					Y: 476,
					Offset: 11,
					Text: "Psn Res: " + showResistances("poisn")
				}
			},
		},


		check: function () {
			if (!this.enabled) {
				this.flush();

				return;
			}

			if (!this.getHook("menuBox")) {
				this.add("menuBox");
			}

			if (!this.getHook("manaP")) {
				this.add("manaP");
			} else {
				this.getHook("manaP").hook.text = Math.floor((me.mp/me.mpmax)*100).toString() + "%";
			}

			if (!this.getHook("healthP")) {
				this.add("healthP");
			} else {
				this.getHook("healthP").hook.text = Math.floor((me.hp/me.hpmax)*100).toString() + "%";
			}

			if (!this.getHook("chickenP")) {
				this.add("chickenP");
			}

			if (!this.getHook("FireRes")) {
				this.add("FireRes");
			} else {
				this.getHook("FireRes").hook.text = "Fire Res: " + showResistances("fire");
				this.getHook("FireRes").hook.zorder = 13;
				this.getHook("FireResBorder").hook.zorder = 12;
				this.getHook("FireResBackground").hook.zorder = 11;
			}

			if (!this.getHook("ColdRes")) {
				this.add("ColdRes");
			} else {
				this.getHook("ColdRes").hook.text = "Cold Res: " + showResistances("cold");
				this.getHook("ColdRes").hook.zorder = 13;
				this.getHook("ColdResBorder").hook.zorder = 12;
				this.getHook("ColdResBackground").hook.zorder = 11;
			}

			if (!this.getHook("LightRes")) {
				this.add("LightRes");
			} else {
				this.getHook("LightRes").hook.text = "Light Res: " + showResistances("light");
				this.getHook("LightRes").hook.zorder = 13;
				this.getHook("LightResBorder").hook.zorder = 12;
				this.getHook("LightResBackground").hook.zorder = 11;
			}

			if (!this.getHook("PoisnRes")) {
				this.add("PoisnRes");
			} else {
				this.getHook("PoisnRes").hook.text = "Psn Res: " + showResistances("poisn");
				this.getHook("PoisnRes").hook.zorder = 13;
				this.getHook("PoisnResBorder").hook.zorder = 12;
				this.getHook("PoisnResBackground").hook.zorder = 11;
			}
		},

		add: function (name) {
			var resHeight = 536,
				ResHooks = Hooks.text.ResistanceHooks;



			switch (name) {
			case "monsterStatus":
				this.hooks.push({
					name: "monsterStatus",
					hook: new Text(KeyboardMap[Keybinds.MonstersOnMap[0]] + ": Disable Monsters", 525, 515)
				});

				break;
			case "vectorStatus":
				this.hooks.push({
					name: "vectorStatus",
					hook: new Text(KeyboardMap[Keybinds.LinesOnMap[0]] + ": Disable Vectors", 525, 525)
				});

				break;
			case "statBox":
				this.hooks.push({
					name: "statBox",
					hook: new Text(KeyboardMap[Keybinds.StatBox[0]] + ": Enable Stats", 525, 505)
				});

				break;
			case "menuBox":
				this.hooks.push({
					name: "menuBox",
					hook: new Text(KeyboardMap[Keybinds.MenuBox[0]] + ": Show Keybinds", 525, 525)
				});

				break;
			case "healthP":
				this.hooks.push({
					name: "healthP",
					hook: new Text(Math.floor((me.hp/me.hpmax)*100).toString() + "%", 70, 547, null, null, 2)
				});

				break;
			case "manaP":
				this.hooks.push({
					name: "manaP",
					hook: new Text(Math.floor((me.mp/me.mpmax)*100).toString() + "%", 733, 547, null, null, 2)
				});

				break;
			case "chickenP":
				this.hooks.push({
					name: "chickenP",
					hook: new Text("Chicken: " + Config.LifeChicken + "%", 277, 587, 0, null, null)
				});

				break;


			// RES
			case "FireRes":
				this.hooks.push({
					name: "FireResBackground",
					hook: new Box(ResHooks.FireRes.Box.X, ResHooks.FireRes.Box.Y, ResHooks.FireRes.Box.Width, ResHooks.FireRes.Box.Height, 0x0, 2, 2)
				});

				this.hooks.push({
					name: "FireResBorder",
					hook: new Frame(ResHooks.FireRes.Box.X, ResHooks.FireRes.Box.Y, ResHooks.FireRes.Box.Width, ResHooks.FireRes.Box.Height, 2)
				});

				this.hooks.push({
					name: "FireRes",
					hook: new Text(ResHooks.FireRes.Text.Text, ResHooks.FireRes.Text.X, ResHooks.FireRes.Text.Y + ResHooks.FireRes.Text.Offset, 1, 6, 2)
				});

				break;
			case "ColdRes":
				this.hooks.push({
					name: "ColdResBackground",
					hook: new Box(ResHooks.ColdRes.Box.X, ResHooks.ColdRes.Box.Y, ResHooks.ColdRes.Box.Width, ResHooks.ColdRes.Box.Height, 0x0, 2, 2)
				});

				this.hooks.push({
					name: "ColdResBorder",
					hook: new Frame(ResHooks.ColdRes.Box.X, ResHooks.ColdRes.Box.Y, ResHooks.ColdRes.Box.Width, ResHooks.ColdRes.Box.Height, 2)
				});
				this.hooks.push({
					name: "ColdRes",
					hook: new Text(ResHooks.ColdRes.Text.Text, ResHooks.ColdRes.Text.X, ResHooks.ColdRes.Text.Y + ResHooks.ColdRes.Text.Offset, 3, 6, 2)
				});

				break;
			case "LightRes":
				this.hooks.push({
					name: "LightResBackground",
					hook: new Box(ResHooks.LightningRes.Box.X, ResHooks.LightningRes.Box.Y, ResHooks.ColdRes.Box.Width, ResHooks.ColdRes.Box.Height, 0x0, 2, 2)
				});

				this.hooks.push({
					name: "LightResBorder",
					hook: new Frame(ResHooks.LightningRes.Box.X, ResHooks.LightningRes.Box.Y, ResHooks.ColdRes.Box.Width, ResHooks.ColdRes.Box.Height, 2)
				});
				this.hooks.push({
					name: "LightRes",
					hook: new Text(ResHooks.LightningRes.Text.Text, ResHooks.LightningRes.Text.X, ResHooks.LightningRes.Text.Y + ResHooks.LightningRes.Text.Offset, 9, 6, 2)
				});

				break;
			case "PoisnRes":
				this.hooks.push({
					name: "PoisnResBackground",
					hook: new Box(ResHooks.PoisonRes.Box.X, ResHooks.PoisonRes.Box.Y, ResHooks.PoisonRes.Box.Width, ResHooks.PoisonRes.Box.Height, 0x0, 2, 2)
				});

				this.hooks.push({
					name: "PoisnResBorder",
					hook: new Frame(ResHooks.PoisonRes.Box.X, ResHooks.PoisonRes.Box.Y, ResHooks.PoisonRes.Box.Width, ResHooks.PoisonRes.Box.Height, 2)
				});
				this.hooks.push({
					name: "PoisnRes",
					hook: new Text(ResHooks.PoisonRes.Text.Text, ResHooks.PoisonRes.Text.X, ResHooks.PoisonRes.Text.Y + ResHooks.PoisonRes.Text.Offset, 2, 6, 2)
				});

				break;
			}
		},

		getHook: function (name) {
			var i;

			for (i = 0; i < this.hooks.length; i += 1) {
				if (this.hooks[i].name === name) {
					return this.hooks[i];
				}
			}

			return false;
		},

		timer: function () {
			var min, sec;

			min = Math.floor((getTickCount() - me.gamestarttime) / 60000).toString();

			if (min <= 9) {
				min = "0" + min;
			}

			sec = (Math.floor((getTickCount() - me.gamestarttime) / 1000) % 60).toString();

			if (sec <= 9) {
				sec = "0" + sec;
			}

			return min + ":" + sec;
		},

		flush: function () {
			if (getUIFlag(0x0D)) {
				return;
			}

			while (this.hooks.length) {
				this.hooks.shift().hook.remove();
			}
		}
	},

	vector: {
		hooks: [],
		currArea: 0,
		enabled: true,

		check: function () {
			if (!this.enabled) {
				this.flush();

				return;
			}

			if (me.area !== this.currArea) {
				this.flush();

				var i, exits, wp, poi;

				this.currArea = me.area;
				exits = getArea().exits;

				if (exits) {
					for (i = 0; i < exits.length; i += 1) {
						if (exits[i].target < this.currArea) {
							this.add(exits[i].x, exits[i].y, 10);
						} else {
							this.add(exits[i].x, exits[i].y, me.area === 46 && exits[i].target === getRoom().correcttomb ? 0x69 : 0x99);
						}
					}
				}

				wp = this.getWP();

				if (wp) {
					this.add(wp.x, wp.y, 0x7D);
				}

				poi = this.getPOI();

				if (poi) {
					this.add(poi.x, poi.y, 0xA8);
				}
			} else {
				this.update();
			}
		},

		add: function (x, y, color) {
			this.hooks.push(new Line(me.x, me.y, x, y, color, true));
		},

		update: function () {
			var i;

			for (i = 0; i < this.hooks.length; i += 1) {
				this.hooks[i].x = me.x;
				this.hooks[i].y = me.y;
			}
		},

		flush: function () {
			while (this.hooks.length) {
				this.hooks.shift().remove();
			}

			this.currArea = 0;
		},

		getWP: function () {
			if (Pather.wpAreas.indexOf(me.area) === -1) {
				return false;
			}

			var i, preset,
				wpIDs = [119, 145, 156, 157, 237, 238, 288, 323, 324, 398, 402, 429, 494, 496, 511, 539];

			for (i = 0; i < wpIDs.length; i += 1) {
				preset = getPresetUnit(me.area, 2, wpIDs[i]);

				if (preset) {
					return {
						x: preset.roomx * 5 + preset.x,
						y: preset.roomy * 5 + preset.y
					};
				}
			}

			return false;
		},

		getPOI: function () {
			var unit, name;

			switch (me.area) {
			case 4: // Stony Field
				unit = getPresetUnit(me.area, 1, 737);
				name = "Cairn Stones";

				break;
			case 5: // Dark Wood
				unit = getPresetUnit(me.area, 2, 30);
				name = "Tree";

				break;
			case 25: // Tower Level 5
				unit = getPresetUnit(me.area, 2, 580);
				name = "Countess";

				break;
			case 49: // Sewers 3
				unit = getPresetUnit(me.area, 2, 355);
				name = "Radament";

				break;
			case 54: // Pallace Cellar Level 3
				unit = getPresetUnit(me.area, 2, 298);
				name = "Portal";

				break;
			case 60: // Halls of the Dead 3
				unit = getPresetUnit(me.area, 2, 354);
				name = "Cube";

				break;
			case 74: // Arcane Sanctuary
				unit = getPresetUnit(me.area, 2, 357);
				name = "Summoner";

				break;
			case 64: // Maggot Lair 3
				unit = getPresetUnit(me.area, 1, 749);
				name = "Fat Worm";

				break;
			case 66: // Tal Rasha's Tombs
			case 67:
			case 68:
			case 69:
			case 70:
			case 71:
			case 72:
				unit = getPresetUnit(me.area, 2, 152);
				name = "Orifice";

				break;
			case 78: // Flayer Jungle
				unit = getPresetUnit(me.area, 2, 252);
				name = "Gidbinn";

				break;
			case 102: // Durance of Hate 3
				unit = {
					x: 17588,
					y: 8069
				};
				name = "Mephisto";

				break;
			case 105: // Plains of Despair
				unit = getPresetUnit(me.area, 1, 256);
				name = "Izual";

				break;
			case 107: // River of Flame
				unit = getPresetUnit(me.area, 2, 376);
				name = "Hephasto";

				break;
			case 108: // Chaos Sanctuary
				unit = getPresetUnit(me.area, 2, 255);
				name = "Star";

				break;
			case 111: // Frigid Highlands
			case 112: // Arreat Plateau
			case 117: // Frozen Tundra
				unit = getPresetUnit(me.area, 2, 60);
				name = "Hell Entrance";

				break;
			case 124: // Halls of Vaught
				unit = getPresetUnit(me.area, 2, 462);
				name = "Nihlathak";

				break;
			case 131: // Throne of Destruction
				unit = {
					x: 15112,
					y: 5041
				};
				name = "Throne";

				break;
			}

			if (unit) {
				if (unit instanceof PresetUnit) {
					return {
						x: unit.roomx * 5 + unit.x,
						y: unit.roomy * 5 + unit.y,
						name: name
					};
				}

				return {
					x: unit.x,
					y: unit.y,
					name: name
				};
			}

			return false;
		}
	},

	tele: {
		hooks: [],
		action: null,
		currArea: 0,
		enabled: true,
		prevAreas: [0, 0, 1, 2, 3, 10, 5, 6, 2, 3, 4, 6, 7, 9, 10, 11, 12, 3, 17, 17, 6, 20, 21, 22, 23, 24, 7, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35,
					36, 4, 1, 1, 40, 41, 42, 43, 44, 74, 40, 47, 48, 40, 50, 51, 52, 53, 41, 42, 56, 45, 55, 57, 58, 43, 62, 63, 44, 46, 46, 46, 46, 46,
					46, 46, 1, 54, 1, 75, 76, 76, 78, 79, 80, 81, 82, 76, 76, 78, 86, 78, 88, 87, 89, 81, 92, 80, 80, 81, 81, 82, 82, 83, 100, 101, 102,
					103, 104, 105, 106, 107, 103, 109, 110, 111, 112, 113, 113, 115, 115, 117, 118, 118, 109, 121, 122, 123, 111, 112, 117, 120, 128, 129,
					130, 131, 109, 109, 109, 109],

		event: function (keycode) {
			Hooks.tele.action = keycode;
		},

		check: function () {
			if (!this.enabled) {
				return;
			}

			var hook,
				obj = {
					type: false,
					dest: false
				};

			if (this.action) {
				switch (this.action) {
				case Keybinds.NextArea[0]: // Numpad 0
					hook = this.getHook("Next Area");
					obj.type = "area";

					break;
				case Keybinds.PreviousArea[0]: // Numpad 1
					hook = this.getHook("Previous Area");
					obj.type = "area";

					break;
				case Keybinds.Waypoint[0]: // Numpad 2
					hook = this.getHook("Waypoint");
					obj.type = "wp";

					break;
				case Keybinds.PointOfInterest[0]: // Numpad 3
					hook = this.getHook("POI");
					obj.type = "unit";

					break;
				case Keybinds.SideArea[0]: // Numpad 4
					hook = this.getHook("Side Area");
					obj.type = "area";

					break;
				}

				if (hook) {
					obj.dest = hook.destination;

					scriptBroadcast(JSON.stringify(obj));
				}

				this.action = null;
			}

			if (me.area !== this.currArea) {
				this.flush();
				this.add(me.area);
				addEventListener("keyup", this.event);

				this.currArea = me.area;
			}
		},

		add: function (area) {
			var i, exits, wp, poi, nextCheck,
				nextAreas = [];

			// Specific area override
			nextAreas[7] = 26;
			nextAreas[76] = 78;
			nextAreas[77] = 78;
			nextAreas[113] = 115;
			nextAreas[115] = 117;
			nextAreas[118] = 120;

			if (me.area === 46) {
				nextAreas[46] = getRoom().correcttomb;
			}

			switch (me.area) {
			case 2: // Blood Moor
				this.hooks.push({
					name: "Side Area",
					destination: 8,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(8), 150, 525 - (this.hooks.length * 10))
				});

				break;
			case 6: // Black Marsh
				this.hooks.push({
					name: "Side Area",
					destination: 20,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(20), 150, 525 - (this.hooks.length * 10))
				});

				break;
			case 42: // Dry hills
				this.hooks.push({
					name: "Side Area",
					destination: 56,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(56), 150, 525 - (this.hooks.length * 10))
				});

				break;
			case 43: // Far Oasis
				this.hooks.push({
					name: "Side Area",
					destination: 62,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(62), 150, 525 - (this.hooks.length * 10))
				});

				break;
			case 76:
				this.hooks.push({
					name: "Side Area",
					destination: 85,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(85), 150, 525 - (this.hooks.length * 10))
				});

				break;
			case 78:
				this.hooks.push({
					name: "Side Area",
					destination: 88,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(88), 150, 525 - (this.hooks.length * 10))
				});

				break;
			case 80:
				this.hooks.push({
					name: "Side Area",
					destination: 94,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(94), 150, 525 - (this.hooks.length * 10))
				});

				break;
			case 81:
				this.hooks.push({
					name: "Side Area",
					destination: 92,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(92), 150, 525 - (this.hooks.length * 10))
				});

				break;
			case 113:
				this.hooks.push({
					name: "Side Area",
					destination: 114,
					hook: new Text(KeyboardMap[Keybinds.SideArea[0]] + ": " + Pather.getAreaName(114), 150, 525 - (this.hooks.length * 10))
				});

				break;
			}

			poi = Hooks.vector.getPOI();

			if (poi) {
				this.hooks.push({
					name: "POI",
					destination: {x: poi.x, y: poi.y},
					hook: new Text(KeyboardMap[Keybinds.PointOfInterest[0]] + ": " + poi.name, 150, 525 - (this.hooks.length * 10))
				});
			}

			wp = Hooks.vector.getWP();

			if (wp) {
				this.hooks.push({
					name: "Waypoint",
					destination: {x: wp.x, y: wp.y},
					hook: new Text(KeyboardMap[Keybinds.Waypoint[0]] + ": WP", 150, 525 - (this.hooks.length * 10))
				});
			}

			exits = getArea(area).exits;

			if (exits) {
				for (i = 0; i < exits.length; i += 1) {
					if (exits[i].target === this.prevAreas[me.area]) {
						this.hooks.push({
							name: "Previous Area",
							destination: this.prevAreas[me.area],
							hook: new Text(KeyboardMap[Keybinds.PreviousArea[0]] + ": " + Pather.getAreaName(this.prevAreas[me.area]), 150, 525 - (this.hooks.length * 10))
						});

						break;
					}
				}

				// Check nextAreas first
				for (i = 0; i < exits.length; i += 1) {
					if (exits[i].target === nextAreas[me.area]) {
						this.hooks.push({
							name: "Next Area",
							destination: nextAreas[me.area],
							hook: new Text(KeyboardMap[Keybinds.NextArea[0]] + ": " + Pather.getAreaName(nextAreas[me.area]), 150, 525 - (this.hooks.length * 10))
						});

						nextCheck = true;

						break;
					}
				}

				// In case the area isn't in nextAreas array, use this.prevAreas array
				if (!nextCheck) {
					for (i = 0; i < exits.length; i += 1) {
						if (exits[i].target === this.prevAreas.indexOf(me.area)) {
							this.hooks.push({
								name: "Next Area",
								destination: this.prevAreas.indexOf(me.area),
								hook: new Text(KeyboardMap[Keybinds.NextArea[0]] + ": " + Pather.getAreaName(this.prevAreas.indexOf(me.area)), 150, 525 - (this.hooks.length * 10))
							});

							break;
						}
					}
				}
			}
		},

		getHook: function (name) {
			var i;

			for (i = 0; i < this.hooks.length; i += 1) {
				if (this.hooks[i].name === name) {
					return this.hooks[i];
				}
			}

			return false;
		},

		flush: function () {
			while (this.hooks.length) {
				this.hooks.shift().hook.remove();
			}

			removeEventListener("keyup", this.event);

			this.currArea = 0;
		}
	},

	update: function () {
		while (!me.gameReady) {
			delay(100);
		}

		this.monsters.check();
		this.text.check();
		this.vector.check();
		this.tele.check();
		this.stats.updateStats();
		this.stats.check();
		this.keyMenu.check();
	},

	flush: function () {
		this.monsters.flush();
		this.text.flush();
		this.vector.flush();
		this.tele.flush();
		this.stats.updateStats();
		this.stats.flush();
		this.keyMenu.flush();

		return true;
	}
};

var KillMobs = {

	scriptByArea: {
		1: ["Cows"],
		8: ["Corpsefire"],
		9: ["Coldcrow"],
		17: ["BloodRaven"],
		4: ["Rakanishu"],
		5: ["TreeheadWoodfist"],
		25: ["TheCountess"],
		28: ["TheSmith"],
		33: ["BoneAsh"],
		37: ["Andariel"],
		49: ["Radament"],
		60: ["BloodwitchTheWild"],
		43: ["Beetleburst"],
		64: ["ColdwormTheBurrower"],
		44: ["DarkElder"],
		61: ["Fangskin"],
		54: ["FireEye"],
		74: ["TheSummoner"],
		66: ["Tombs"],
		67: ["Tombs"],
		68: ["Tombs"],
		69: ["Tombs"],
		70: ["Tombs"],
		71: ["Tombs"],
		72: ["Tombs"],
		73: ["Duriel"]
	},	
	
	AttackClearNew: function (range, spectype, bossId, sortfunc, pickit) { // probably going to change to passing an object
		while (!me.gameReady) {
			delay(40);
		}

		if (Config.MFLeader && !!bossId) {
			Pather.makePortal();
			say("clear " + bossId);
		}
		range = 25;
		spectype = 0xF;

		if (bossId === undefined) {
			bossId = false;
		}

		if (sortfunc === undefined) {
			sortfunc = false;
		}

		if (pickit === undefined) {
			pickit = false;
		}

		if (typeof (range) !== "number") {
			throw new Error("Attack.clear: range must be a number.");
		}

		var i, boss, orgx, orgy, target, result, monsterList, start,
			gidAttack = [],
			attackCount = 0;

		if (Config.AttackSkill[1] < 0 || Config.AttackSkill[3] < 0) {
			return false;
		}

		if (!sortfunc) {
			sortfunc = Attack.sortMonsters;
		}

		if (bossId) {
			for (i = 0; !boss && i < 5; i += 1) {
				boss = bossId > 999 ? getUnit(1, -1, -1, bossId) : getUnit(1, bossId);

				delay(200);
			}

			if (!boss) {
				throw new Error("Attack.clear: " + bossId + " not found");
			}

			orgx = boss.x;
			orgy = boss.y;
		} else {
			orgx = me.x;
			orgy = me.y;
		}

		monsterList = [];
		target = getUnit(1);

		if (target) {
			do {
				if ((!spectype || (target.spectype & spectype)) && Attack.checkMonster(target) && Attack.skipCheck(target)) {
					// Speed optimization - don't go through monster list until there's at least one within clear range
					if (!start && getDistance(target, orgx, orgy) <= range &&
							(me.getSkill(54, 1) || !Scripts.Follower || !checkCollision(me, target, 0x1))) {
						start = true;
					}

					monsterList.push(copyUnit(target));
				}
			} while (target.getNext());
		}

		if (!start) {
			return false;
		}

		while (monsterList.length > 0 && attackCount < 300) {
			if (boss) {
				orgx = boss.x;
				orgy = boss.y;
			}

			if (me.dead) {
				return false;
			}

			//monsterList.sort(Sort.units);
			monsterList.sort(sortfunc);

			target = copyUnit(monsterList[0]);

			if (target.x !== undefined && (getDistance(target, orgx, orgy) <= range || (Attack.getScarinessLevel(target) > 7 && getDistance(me, target) <= range)) && Attack.checkMonster(target)) {
				Attack.deploy(target, 25, 5, 15);
				Misc.townCheck(true);
				//me.overhead("attacking " + target.name + " spectype " + target.spectype + " id " + target.classid);
				
				monsterList.shift();
			} else {
				monsterList.shift();
			}
		}
		
		//Attack.deploy(monsterList[0], 25, 5, 15);
		Pather.makePortal();
		Pather.usePortal(null, me.name);
		say("kill");

		return true;
	},

	Corpsefire: function() {
			try {
				if (!Pather.moveToPreset(me.area, 1, 774, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to Corpsefire");
				}
				if (!Attack.clear(15, 0, getLocaleString(3319))) {
					throw new Error("Failed Corpsefire");
				}
			} catch(e) { print(e); }
	},

	BloodRaven: function() {
			try {
				if (!Pather.moveToPreset(me.area, 1, 805,  0, 0, 0xf, true)) {
					throw new Error("Failed to move to Blood Raven");
				}
				if (!Attack.clear(15, 0, getLocaleString(3111))) {
					throw new Error("Failed Blood Raven");
				}
			} catch(e) { print(e); }
	} ,

	Coldcrow: function() {
			try {
				if (!Pather.moveToPreset(me.area, 1, 736, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to Coldcrow");
				}
				if (!Attack.clear(15, 0, getLocaleString(2871))) {
					throw new Error("Failed Coldcrow");
				}
			} catch(e) { print(e); }
	},

	Rakanishu: function() {
			try {
				if (!Pather.moveToPreset(me.area, 1, 737, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to Rakanishu");
				}
				if (!Attack.clear(15, 0, getLocaleString(2872))) {
					throw new Error("Failed Rakanishu");
				}
			} catch(e) { print(e); }
	},

	TreeheadWoodfist: function() {
			try {
				if (!Pather.moveToPreset(me.area, 1, 738, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to Treehead Woodfist");
				}
				if (!Attack.clear(15, 0, getLocaleString(2873))) {
					throw new Error("Failed Treehead Woodfist");
				}
			} catch(e) { print(e); }
	},

	TheCountess: function() {
			try {
				var poi = getPresetUnit(me.area, 2, 580);
				if (!poi) {
					throw new Error("Failed to move to Countess (preset not found)");
				}
				switch (poi.roomx * 5 + poi.x) {
					case 12565:
						Pather.moveTo(12578, 11043);
						break;
					case 12526:
						Pather.moveTo(12548, 11083);
						break;
				}
				if (!Attack.clear(20, 0, getLocaleString(2875))) { 
					throw new Error("Failed The Countess");
				}
			} catch(e) { print(e); }
	},

	TheSmith: function() {
			try {
				if (!Pather.moveToPreset(me.area, 2, 108, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to the Smith");
				}
				if (!Attack.clear(15, 0, getLocaleString(2889))) { 
					throw new Error("Failed The Smith");
				}
			} catch(e) { print(e); }
	},

	BoneAsh: function() { 
			try {
				if (!Pather.moveTo(20047, 4898)) {
					throw new Error("Failed to move to Bone Ash");
				}
				if (!Attack.clear(15, 0, getLocaleString(2878))) {
					throw new Error("Failed Bone Ash");
				}
			} catch(e) { print(e); }
	},

	Andariel: function() {
			try {
				Pather.moveTo(22549, 9520);
				if (!Attack.clear(15, 0, getLocaleString(3021))) {
					throw new Error("Failed Andariel");
				}
			} catch(e) { print(e); }
	},

	Radament: function() {
			try {
				if (!Pather.moveToPreset(me.area, 2, 355, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to Radament");
				}
				if (!Attack.clear(15, 0, getLocaleString(2879))) {
					throw new Error("Failed Radament");
				}
			} catch(e) { print(e); }
	},

	BloodwitchTheWild: function () {
			try {
				if (!Pather.moveToPreset(me.area, 2, 354, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to Bloodwitch the Wild");
				}
				if (!Attack.clear(15, 0, getLocaleString(2880))) {
					throw new Error("Failed Bloodwitch the Wild");
				}
			
			} catch(e) { print(e); }
	},

	Beetleburst: function() {
			try {
				if (!Pather.moveToPreset(me.area, 1, 747, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to Beetleburst");
				}
				if (!Attack.clear(15, 0, getLocaleString(2882))) {
					throw new Error("Beetleburst not found");
				}
			} catch(e) { print(e); }
	},

	ColdwormTheBurrower: function() {
			try {
				if (!Pather.moveToPreset(me.area, 2, 356)) {
					throw new Error("Failed to move to Coldworm the Burrower");
				}
				if (!Attack.clear(15, 0, getLocaleString(2884))) {
					throw new Error("Coldworm the Burrower not found");
				}
				
			} catch(e) { print(e); }
	},

	DarkElder: function() {
			try {
				if (!Pather.moveToPreset(me.area, 1, 751, 0, 0, 0xf, true)) {
					throw new Error("Failed to move to Dark Elder");
				}
				if (!Attack.clear(15, 0, getLocaleString(2886))) {
					throw new Error("Dark Elder not found");
				}
			} catch(e) { print(e); }
	},
	
	Fangskin: function() {
			try {
				if (!Pather.moveTo(15044, 14045)) {
					throw new Error("Failed to move to Fangskin");
				}
				if (!Attack.clear(15, 0, getLocaleString(2881))) {
					throw new Error("Fangskin not found");
				}
			} catch(e) { print(e); }
			//amulet addon
			Pather.moveTo(15044, 14045);
			Pather.makePortal();
			Pather.usePortal(null, me.name);
			say("pickup amulet");
			while(!amuready) delay(20);
			Pather.usePortal(null, me.name);
			//end of amulet addon
	},
	
	FireEye: function() {
		Pather.usePortal(null);
		Pather.moveTo(10073, 8670);
			try {
				if (!Attack.clear(15, 0, getLocaleString(2885))) {
					throw new Error("Fire Eye not found");
				}
			} catch(e) { print(e); }
		Pather.moveTo(10073, 8670);
		Pather.usePortal(null);
	},
	
	TheSummoner: function() {
		try {
			if (!Pather.moveToPreset(me.area, 2, 357)) {
				throw new Error("Failed to move to The Summoner");
			}
			Pather.moveToPreset(me.area, 2, 357);
			Pather.makePortal();
			Pather.usePortal(null, me.name);
			say("kill");
		} catch(e) { print(e); }
	},
	
	Tombs: function() {
		try{
			for (var i = 66; i <= 72; i += 1) {
				if (!Pather.moveToExit(i, true, true)) {
					throw new Error("Failed to move to tomb");
				}

				Attack.clearLevel(0xF);

				if (i === 69) {
					Precast.doPrecast(true);
				}

				if (!Pather.moveToExit(46, true)) {
					throw new Error("Failed to move to Canyon");
				}
			}
		} catch(e) { print(e); }
	},
	
	Duriel: function() {
		try{
			if (!Pather.moveToExit(getRoom().correcttomb, true)) {
			throw new Error("Failed to move to Tal Rasha's Tomb");
			}

			if (!Pather.moveToPreset(me.area, 2, 152, -3, -3)) {
				throw new Error("Failed to move to Orifice");
			}
						
		} catch(e) { print(e); }
	},
	
	Cows: function() {
		this.getLeg = function () {
			var i, portal, wirt, leg, gid;
			if (me.getItem(88)) {
				return me.getItem(88);
			}
			Pather.useWaypoint(4);
			Precast.doPrecast(true);
			Pather.moveToPreset(me.area, 1, 737, 8, 8);
			for (i = 0; i < 6; i += 1) {
				portal = Pather.getPortal(38);
				if (portal) {
					Pather.usePortal(null, null, portal);
					break;
				}
				delay(500);
			}
			if (!portal) {
				throw new Error("Tristram portal not found");
			}
			Pather.moveTo(25048, 5177);
			wirt = getUnit(2, 268);
			for (i = 0; i < 8; i += 1) {
				wirt.interact();
				delay(500);
				leg = getUnit(4, 88);
				if (leg) {
					gid = leg.gid;
					Pickit.pickItem(leg);
					Town.goToTown();
					return me.getItem(-1, -1, gid);
				}
			}
			throw new Error("Failed to get the leg");
		};
		
		this.getTome = function () {
			var tome,
				myTome = me.findItem("tbk", 0, 3),
				akara = Town.initNPC("Shop");
				tome = me.getItem("tbk");
			if (tome) {
				do {
					if (!myTome || tome.gid !== myTome.gid) {
						return copyUnit(tome);
					}
				} while (tome.getNext());
			}
			if (!akara) {
				throw new Error("Failed to buy tome");
			}
			tome = akara.getItem("tbk");
			if (tome.buy()) {
				tome = me.getItem("tbk");
				if (tome) {
					do {
						if (!myTome || tome.gid !== myTome.gid) {
							return copyUnit(tome);
						}
					} while (tome.getNext());
				}
			}
			throw new Error("Failed to buy tome");
		};

		this.openPortal = function (leg, tome) {
			var i;
			if (!Town.openStash()) {
				throw new Error("Failed to open stash");
			}
			if (!Cubing.emptyCube()) {
				throw new Error("Failed to empty cube");
			}
			if (!Storage.Cube.MoveTo(leg) || !Storage.Cube.MoveTo(tome) || !Cubing.openCube()) {
				throw new Error("Failed to cube leg and tome");
			}
			transmute();
			delay(500);
			for (i = 0; i < 10; i += 1) {
				if (Pather.getPortal(39)) {
					return true;
				}
			delay(200);
			}
			throw new Error("Portal not found");
		};

		this.autoChant = function() {
				var unit,
                        chanted = [];
						chantedTick = getTickCount();
                // Player
                unit = getUnit(0);
 
                if (unit) {
                        do {
                                if (unit.name !== me.name && !unit.dead && Misc.inMyParty(unit.name) && getDistance(me, unit) <= 40) { //always chant near and party player
                                        Skill.setSkill(52, 0);
                                        sendPacket(1, 0x11, 4, unit.type, 4, unit.gid);
                                        delay(500);
                                        chanted.push(unit.name);
                                }
                        } while (unit.getNext());
                }
 
                // Minion
                unit = getUnit(1);
 
                if (unit) {
                        do {
                                if (unit.getParent() && chanted.indexOf(unit.getParent().name) > -1 && !unit.getState(16) && getDistance(me, unit) <= 40) {
                                        Skill.setSkill(52, 0);
                                        sendPacket(1, 0x11, 4, unit.type, 4, unit.gid);
                                        delay(500);
                                }
                        } while (unit.getNext());
                }
				needChant = false;
                return true;
		};
		
		var leg, tome, fail;
		// we can begin now
		if (me.getQuest(4, 10)) { // king dead or cain not saved
			say("[ERROR] Already killed the Cow King.");
			fail = true;
		}
		if (!me.getQuest(4, 0)) {
			say("[ERROR] Cain quest incomplete");
			fail = true;
		}
		switch (me.gametype) {
		case 0: // classic
			if (!me.getQuest(26, 0)) { // diablo not completed
				say("[ERROR] Diablo quest incomplete.");
			fail = true;
			}
			break;
		case 1: // expansion
			if (!me.getQuest(40, 0)) { // baal not completed
				say("[ERROR] Baal quest incomplete.");
			fail = true;
			}
			break;
		}
		if (!fail) {
			Town.goToTown(1);
			Town.doChores();
			leg = this.getLeg();
			tome = this.getTome();
			this.openPortal(leg, tome);
			while (getUIFlag(0x1A) || getUIFlag(0x19)) {
				me.cancel();
				delay(10);
			}
			//leave party 
			Town.move("portalspot");
			this.autoChant();
			this.autoChant();
			try { getScript("tools/party.js").stop() } catch (error) {};   // stop party thread to avoid getting in party again
			clickParty(getParty(), 3);   // leave party
			say("kill cows");
		}
	}
};


var ChaosAssistant = {
	FirstEntrance: false,
	ActivateSeal: false,
	Chaos: 108,
	CharToLeaveParty: ChaosAssitantSecondary.CharName,

	inChaos: function () {
		if (me.area == 108) {
			return true;
		}
		return false;
	},

	enterChaosSanctuary: function () {
		if (me.area == this.Chaos && !this.FirstEntrance) {
			this.initLayout();
			this.FirstEntrance = true;
		}
	},

	getLayout: function (seal, value) {
		var sealPreset = getPresetUnit(108, 2, seal);

		if (!seal) {
			throw new Error("Seal preset not found. Can't continue.");
		}

		if (sealPreset.roomy * 5 + sealPreset.y === value || sealPreset.roomx * 5 + sealPreset.x === value) {
			return 1;
		}

		return 2;
	},

	initLayout: function () {
		this.vizLayout = this.getLayout(396, 5275);
		this.seisLayout = this.getLayout(394, 7773);
		this.infLayout = this.getLayout(392, 7893);
		addEventListener("keyup", this.KeyEvent);
		me.overhead("Entered Chaos Sanctuary");
	},

	moveToSeal: function (id) {
		Pather.moveToPreset(108, 2, id, 4);
	},

	openSeal: function (id) {
		Pather.moveToPreset(108, 2, id, 4);

		var seal = getUnit(2, id);

		if (seal) {
			for (var i = 0; i < 3; i += 1) {
				seal.interact();

				var tick = getTickCount();

				while (getTickCount() - tick < 500) {
					if (seal.mode) {
						return true;
					}

					delay(10);
				}
			}
		}

		return false;
	},

	goToVizier: function () {
		if (this.ActivateSeal) {
			me.overhead("Opening Grand Vizier Seal");
			if (this.vizLayout === 1) {
				this.openSeal(395);
				this.openSeal(396);
				Pather.moveTo(7681, 5302);
				Pather.makePortal();
				say("1");
			} else {
				this.openSeal(395);
				this.openSeal(396);
				Pather.moveTo(7675, 5305);
				Pather.makePortal();
				say("1");
			}
		} else {
			me.overhead("Going to Grand Vizier Seal");
			if (this.vizLayout === 1) {
				this.moveToSeal(396);
			} else {
				this.moveToSeal(396);
			}
		}
	},

	goToSeis: function () {
		if (this.ActivateSeal) {
			me.overhead("Opening Seis Seal");
			if (this.seisLayout === 1) {
				this.openSeal(394);
				Pather.moveTo(7773, 5191);
				Pather.makePortal();
				say("1");
			} else {
				this.openSeal(394);
				Pather.moveTo(7794, 5189);
				Pather.makePortal();
				say("1");
			}
		} else {
			me.overhead("Going to Seis Seal");
			if (this.seisLayout === 1) {
				this.moveToSeal(394);
			} else {
				this.moveToSeal(394);
			}
		}
	},

	goToInfector: function () {
		if (this.ActivateSeal) {
			me.overhead("Opening Infector Seal");
			if (this.infLayout === 1) {
				this.openSeal(393);
				this.openSeal(392);
				Pather.moveTo(7893, 5306);
				Pather.makePortal();
				say("1");
			} else {
				this.openSeal(393);
				this.openSeal(392);
				Pather.moveTo(7929, 5294);
				Pather.makePortal();
				say("1");
			}
		} else {
			me.overhead("Going to Infector Seal");
			if (this.infLayout === 1) {
				this.moveToSeal(392);
			} else {
				this.moveToSeal(392);
			}
		}
		
	},

	goToStar: function () {
		if (this.ActivateSeal) {
			me.overhead("Opening Portal At Star");
			Pather.moveTo(7797, 5303);
			Pather.makePortal();
			say("1");
		} else {
			me.overhead("Going to Star");
			Pather.moveTo(7797, 5303);
		}
	},  

	KeyEvent: function (key) {
		switch (key) {
		case Keybinds.ChaosVizier[0]:
			if (me.area == ChaosAssistant.Chaos)
				ChaosAssistant.goToVizier();
			break;
		case Keybinds.ChaosSeis[0]:
			if (me.area == ChaosAssistant.Chaos)
				ChaosAssistant.goToSeis();
			break;
		case Keybinds.ChaosInfector[0]:
			if (me.area == ChaosAssistant.Chaos)
				ChaosAssistant.goToInfector();
			break;
		case Keybinds.ChaosDiablo[0]:
			if (me.area == ChaosAssistant.Chaos)
				ChaosAssistant.goToStar();
			break;
		case Keybinds.ChaosToggleOpenSeal[0]:
			if (!ChaosAssistant.ActivateSeal) {
				ChaosAssistant.ActivateSeal = true;
				me.overhead("Activate Seals: ON");
			} else {
				ChaosAssistant.ActivateSeal = false;
				me.overhead("Activate Seals: OFF");
			}
			break;
		case Keybinds.ChaosCharToLeaveTeam[0]:
			if (me.area == ChaosAssistant.Chaos)
				say(ChaosAssistant.CharToLeaveParty + " leaveparty");
			break;
		}
	},
};

function main() {
	load("tools/maphelper.js");
	print("Map Thread Loaded");
	var actions = [];

	// Initiate load settings
	if (!FileTools.exists("data/MapHelperSettings.json")) {
		SaveInfo.create();
	}

	Attack.clear = KillMobs.AttackClearNew;

	addEventListener("chatmsg",
		function(who, msg) {
			if (who === me.charname) {
				actions.push(msg);
			}
		});

	this.revealArea = function (area) {
		if (!this.revealedAreas) {
			this.revealedAreas = [];
		}

		if (this.revealedAreas.indexOf(area) === -1) {
			delay(500);
			revealLevel(true);
			this.revealedAreas.push(area);
		}
	};

	this.mouseEvent = function (button) {
		switch (button) {
		case 2: // Middle Mouse
			while (keystate(17)) { // left ctrl
				Hooks.stats.updateStatBoxPos();
			}

			break;
		}
	};   

	this.keyEvent = function (key) {
		switch (key) {
		case Keybinds.MonstersOnMap[0]: // Numpad 7
			if (Hooks.monsters.enabled) {
				Hooks.monsters.enabled = false;
			} else {
				Hooks.monsters.enabled = true;
			}

			break;
		case Keybinds.LinesOnMap[0]: // Numpad 8
			if (Hooks.vector.enabled) {
				Hooks.vector.enabled = false;
			} else {
				Hooks.vector.enabled = true;
			}

			break;
		case Keybinds.StatBox[0]: // Numpad 9
			if (Hooks.stats.enabled) {
				Hooks.stats.enabled = false;
			} else {
				Hooks.stats.enabled = true;
			}

			// Find Stats
			/*
			for (i = 0; i < 350; i += 1) {
				if (me.getStat(i) === 33) {
					say("Stat " + i + " = " + me.getStat(i));
				}
				try {
					if (me.getStat(i)[0] === 33) {
						say("Stat " + i + " [0] = " + me.getStat(i));
					}
				} catch (e) {}
			}
			*/

			break;
		case Keybinds.MenuBox[0]: // Numpad +
			if (Hooks.keyMenu.enabled) {
				Hooks.keyMenu.enabled = false;
				Hooks.text.getHook("menuBox").hook.text = KeyboardMap[Keybinds.MenuBox[0]] + ": Show Keybinds";
			} else {
				Hooks.keyMenu.enabled = true;
				Hooks.text.getHook("menuBox").hook.text = KeyboardMap[Keybinds.MenuBox[0]] + ": Hide Keybinds";
			}

			break;
		}
	}; 

	addEventListener("keyup", this.keyEvent);
	addEventListener("mouseclick", this.mouseEvent);

	while (true) {
		while (!me.area || !me.gameReady) {
			delay(100);
		}

		this.revealArea(me.area);
		ChaosAssistant.enterChaosSanctuary();

		
		Hooks.update();

		delay(20);

		try {
			while (getUIFlag(0x05) || getUIFlag(0x04)) {
				Hooks.flush();
				delay(100);
			}

			// Hides hooks when hovering an item
			if (getUnit(101)) {
				while (getUnit(101).location > 0) {
					Hooks.flush();
					delay(100);
					if (!getUnit(101)) {
						break;
					}
				}
			}
		} catch(e) {
			print(e);
		}

		if (actions.length > 0) {
			switch (actions[0]) {
				case ".find shrine": // Included for DrDentist, Finds xp shrine in area and makes portal
					if (Misc.getShrinesInArea(me.area, 15, false)) {
						Pather.makePortal();
					}

					actions.shift();

					break;
				case ".kill mobs": // Included for DrDentist, runs area scripts in KillMobs

					if (KillMobs.scriptByArea[me.area]) {
						me.overhead(KillMobs.scriptByArea[me.area][0]);
						KillMobs[KillMobs.scriptByArea[me.area][0]]();
					} else {
						me.overhead("Nothing here");
					}

					actions.shift();

					break;
				default: // Invalid command
					actions.shift();

					break;
			}
		}
	}
}

function sortPickList(a, b) { // Sort items by size to pick biggest first
    if (b.sizex === a.sizex && b.sizey === a.sizey) { // Same size -  sort by distance
            return getDistance(me, a) - getDistance(me, b);
    }

	return b.sizex * b.sizey - a.sizex * a.sizey;
}

function specTypeColor(unit) {
	var UnitSpecType 			= unit.spectype,
		UniqueBossSpecType 		= 0x04,
		UniqueQuestModSpecType 	= 0x05,
		MagicSpecType		 	= 0x06,
		BossMinionSpecType		= 0x08;

	switch(UnitSpecType) {
		case BossMinionSpecType:
			return 9;
			
			break;
		case MagicSpecType:
			return 3;
			
			break;
		case UniqueBossSpecType:
			return 8;

			break;
		case UniqueQuestModSpecType:
			return 8;

			break;
		default:
			return 0;

			break;
	}
	return false;
}

function unitDrawName(unit) {
	var UniqueMonsterSymbol 	= "O",
		RegularMonsterSymbol 	= "x",
		UnitSpecType 			= unit.spectype,
		UniqueBossSpecType 		= 0x04,
		UniqueQuestModSpecType 	= 0x05;


	switch(UnitSpecType) {
		case UniqueBossSpecType: // "Unique" Boss/Monster
			return UniqueMonsterSymbol;

			break;
		case UniqueQuestModSpecType: // "Unique" Quest specific mobs?
			return UniqueMonsterSymbol;

			break;
		default:
			return RegularMonsterSymbol;

			break;
	}
	return false;
}

function unitDrawTextSize(unit) {
	switch(unit.spectype) {
		case 0x04: // "Unique" Boss/Monster
			return 1;

			break;
		case 0x05: // "Unique" Quest specific mobs?
			return 1;

			break;
		default:
			return null;

			break;
	}
	return false;
}

function showResistances(type) {
	var Divider 				= " ",
		ERROR 					= "N/A",
		ResistanceType 			= type,
		Fire 					= "fire",
		FireRes 				= me.getStat(39),
		Lightning 				= "light",
		LightningRes 			= me.getStat(41),
		Cold 					= "cold",
		ColdRes 				= me.getStat(43),
		Poison 					= "poisn",
		PoisonRes 				= me.getStat(45),
		MagicRes 				= me.getStat(37),
		PhysicalRes 			= me.getStat(36),
		ClassicNightmareMinus 	= -20,
		ExpansionNightmareMinus = -40,
		ClassicHellMinus 		= -50,
		ExpansionHellMinus 		= -100,
		GameType 				= me.gametype,
		ClassicGameType 		= 0,
		ExpansionGameType 		= 1;

	switch (ResistanceType) {
		case Fire:
			switch (GameType) {
				case ClassicGameType:
					return FireRes + Divider + (FireRes+ClassicNightmareMinus) + Divider + (FireRes+ClassicHellMinus);
					break;
				case ExpansionGameType:
					return FireRes + Divider + (FireRes+ExpansionNightmareMinus) + Divider + (FireRes+ExpansionHellMinus);
					break;
			}
			break;
		case Cold:
			switch (GameType) {
				case ClassicGameType:
					return ColdRes + Divider + (ColdRes+ClassicNightmareMinus) + Divider + (ColdRes+ClassicHellMinus);
					break;
				case ExpansionGameType:
					return ColdRes + Divider + (ColdRes+ExpansionNightmareMinus) + Divider + (ColdRes+ExpansionHellMinus);
					break;
			}
			break;
		case Lightning:
			switch (GameType) {
				case ClassicGameType:
					return LightningRes + Divider + (LightningRes+ClassicNightmareMinus) + Divider + (LightningRes+ClassicHellMinus);
					break;
				case ExpansionGameType:
					return LightningRes + Divider + (LightningRes+ExpansionNightmareMinus) + Divider + (LightningRes+ExpansionHellMinus);
					break;
			}
			break;
		case Poison:
			switch (GameType) {
				case ClassicGameType:
					return PoisonRes + Divider + (PoisonRes+ClassicNightmareMinus) + Divider + (PoisonRes+ClassicHellMinus);
					break;
				case ExpansionGameType:
					return PoisonRes + Divider + (PoisonRes+ExpansionNightmareMinus) + Divider + (PoisonRes+ExpansionHellMinus);
					break;
			}
			break;
		default:
			return ERROR
			break;
	}
	return ERROR;
}