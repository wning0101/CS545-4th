'use strict';

var SPECS = {"COMMUNICATION_BITS":16,"CASTLE_TALK_BITS":8,"MAX_ROUNDS":1000,"TRICKLE_FUEL":25,"INITIAL_KARBONITE":100,"INITIAL_FUEL":500,"MINE_FUEL_COST":1,"KARBONITE_YIELD":2,"FUEL_YIELD":10,"MAX_TRADE":1024,"MAX_BOARD_SIZE":64,"MAX_ID":4096,"CASTLE":0,"CHURCH":1,"PILGRIM":2,"CRUSADER":3,"PROPHET":4,"PREACHER":5,"RED":0,"BLUE":1,"CHESS_INITIAL":100,"CHESS_EXTRA":20,"TURN_MAX_TIME":200,"MAX_MEMORY":50000000,"UNITS":[{"CONSTRUCTION_KARBONITE":null,"CONSTRUCTION_FUEL":null,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":200,"VISION_RADIUS":100,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,64],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":50,"CONSTRUCTION_FUEL":200,"KARBONITE_CAPACITY":null,"FUEL_CAPACITY":null,"SPEED":0,"FUEL_PER_MOVE":null,"STARTING_HP":100,"VISION_RADIUS":100,"ATTACK_DAMAGE":0,"ATTACK_RADIUS":0,"ATTACK_FUEL_COST":0,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":10,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":1,"STARTING_HP":10,"VISION_RADIUS":100,"ATTACK_DAMAGE":null,"ATTACK_RADIUS":null,"ATTACK_FUEL_COST":null,"DAMAGE_SPREAD":null},{"CONSTRUCTION_KARBONITE":15,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":9,"FUEL_PER_MOVE":1,"STARTING_HP":40,"VISION_RADIUS":49,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":10,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":25,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":2,"STARTING_HP":20,"VISION_RADIUS":64,"ATTACK_DAMAGE":10,"ATTACK_RADIUS":[16,64],"ATTACK_FUEL_COST":25,"DAMAGE_SPREAD":0},{"CONSTRUCTION_KARBONITE":30,"CONSTRUCTION_FUEL":50,"KARBONITE_CAPACITY":20,"FUEL_CAPACITY":100,"SPEED":4,"FUEL_PER_MOVE":3,"STARTING_HP":60,"VISION_RADIUS":16,"ATTACK_DAMAGE":20,"ATTACK_RADIUS":[1,16],"ATTACK_FUEL_COST":15,"DAMAGE_SPREAD":3}]};

function insulate(content) {
    return JSON.parse(JSON.stringify(content));
}

class BCAbstractRobot {
    constructor() {
        this._bc_reset_state();
    }

    // Hook called by runtime, sets state and calls turn.
    _do_turn(game_state) {
        this._bc_game_state = game_state;
        this.id = game_state.id;
        this.karbonite = game_state.karbonite;
        this.fuel = game_state.fuel;
        this.last_offer = game_state.last_offer;

        this.me = this.getRobot(this.id);

        if (this.me.turn === 1) {
            this.map = game_state.map;
            this.karbonite_map = game_state.karbonite_map;
            this.fuel_map = game_state.fuel_map;
        }

        try {
            var t = this.turn();
        } catch (e) {
            t = this._bc_error_action(e);
        }

        if (!t) t = this._bc_null_action();

        t.signal = this._bc_signal;
        t.signal_radius = this._bc_signal_radius;
        t.logs = this._bc_logs;
        t.castle_talk = this._bc_castle_talk;

        this._bc_reset_state();

        return t;
    }

    _bc_reset_state() {
        // Internal robot state representation
        this._bc_logs = [];
        this._bc_signal = 0;
        this._bc_signal_radius = 0;
        this._bc_game_state = null;
        this._bc_castle_talk = 0;
        this.me = null;
        this.id = null;
        this.fuel = null;
        this.karbonite = null;
        this.last_offer = null;
    }

    // Action template
    _bc_null_action() {
        return {
            'signal': this._bc_signal,
            'signal_radius': this._bc_signal_radius,
            'logs': this._bc_logs,
            'castle_talk': this._bc_castle_talk
        };
    }

    _bc_error_action(e) {
        var a = this._bc_null_action();
        
        if (e.stack) a.error = e.stack;
        else a.error = e.toString();

        return a;
    }

    _bc_action(action, properties) {
        var a = this._bc_null_action();
        if (properties) for (var key in properties) { a[key] = properties[key]; }
        a['action'] = action;
        return a;
    }

    _bc_check_on_map(x, y) {
        return x >= 0 && x < this._bc_game_state.shadow[0].length && y >= 0 && y < this._bc_game_state.shadow.length;
    }
    
    log(message) {
        this._bc_logs.push(JSON.stringify(message));
    }

    // Set signal value.
    signal(value, radius) {
        // Check if enough fuel to signal, and that valid value.
        
        var fuelNeeded = Math.ceil(Math.sqrt(radius));
        if (this.fuel < fuelNeeded) throw "Not enough fuel to signal given radius.";
        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.COMMUNICATION_BITS)) throw "Invalid signal, must be int within bit range.";
        if (radius > 2*Math.pow(SPECS.MAX_BOARD_SIZE-1,2)) throw "Signal radius is too big.";

        this._bc_signal = value;
        this._bc_signal_radius = radius;

        this.fuel -= fuelNeeded;
    }

    // Set castle talk value.
    castleTalk(value) {
        // Check if enough fuel to signal, and that valid value.

        if (!Number.isInteger(value) || value < 0 || value >= Math.pow(2,SPECS.CASTLE_TALK_BITS)) throw "Invalid castle talk, must be between 0 and 2^8.";

        this._bc_castle_talk = value;
    }

    proposeTrade(karbonite, fuel) {
        if (this.me.unit !== SPECS.CASTLE) throw "Only castles can trade.";
        if (!Number.isInteger(karbonite) || !Number.isInteger(fuel)) throw "Must propose integer valued trade."
        if (Math.abs(karbonite) >= SPECS.MAX_TRADE || Math.abs(fuel) >= SPECS.MAX_TRADE) throw "Cannot trade over " + SPECS.MAX_TRADE + " in a given turn.";

        return this._bc_action('trade', {
            trade_fuel: fuel,
            trade_karbonite: karbonite
        });
    }

    buildUnit(unit, dx, dy) {
        if (this.me.unit !== SPECS.PILGRIM && this.me.unit !== SPECS.CASTLE && this.me.unit !== SPECS.CHURCH) throw "This unit type cannot build.";
        if (this.me.unit === SPECS.PILGRIM && unit !== SPECS.CHURCH) throw "Pilgrims can only build churches.";
        if (this.me.unit !== SPECS.PILGRIM && unit === SPECS.CHURCH) throw "Only pilgrims can build churches.";
        
        if (!Number.isInteger(dx) || !Number.isInteger(dx) || dx < -1 || dy < -1 || dx > 1 || dy > 1) throw "Can only build in adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't build units off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] > 0) throw "Cannot build on occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot build onto impassable terrain.";
        if (this.karbonite < SPECS.UNITS[unit].CONSTRUCTION_KARBONITE || this.fuel < SPECS.UNITS[unit].CONSTRUCTION_FUEL) throw "Cannot afford to build specified unit.";

        return this._bc_action('build', {
            dx: dx, dy: dy,
            build_unit: unit
        });
    }

    move(dx, dy) {
        if (this.me.unit === SPECS.CASTLE || this.me.unit === SPECS.CHURCH) throw "Churches and Castles cannot move.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't move off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot move outside of vision range.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] !== 0) throw "Cannot move onto occupied tile.";
        if (!this.map[this.me.y+dy][this.me.x+dx]) throw "Cannot move onto impassable terrain.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);  // Squared radius
        if (r > SPECS.UNITS[this.me.unit]['SPEED']) throw "Slow down, cowboy.  Tried to move faster than unit can.";
        if (this.fuel < r*SPECS.UNITS[this.me.unit]['FUEL_PER_MOVE']) throw "Not enough fuel to move at given speed.";

        return this._bc_action('move', {
            dx: dx, dy: dy
        });
    }

    mine() {
        if (this.me.unit !== SPECS.PILGRIM) throw "Only Pilgrims can mine.";
        if (this.fuel < SPECS.MINE_FUEL_COST) throw "Not enough fuel to mine.";
        
        if (this.karbonite_map[this.me.y][this.me.x]) {
            if (this.me.karbonite >= SPECS.UNITS[SPECS.PILGRIM].KARBONITE_CAPACITY) throw "Cannot mine, as at karbonite capacity.";
        } else if (this.fuel_map[this.me.y][this.me.x]) {
            if (this.me.fuel >= SPECS.UNITS[SPECS.PILGRIM].FUEL_CAPACITY) throw "Cannot mine, as at fuel capacity.";
        } else throw "Cannot mine square without fuel or karbonite.";

        return this._bc_action('mine');
    }

    give(dx, dy, karbonite, fuel) {
        if (dx > 1 || dx < -1 || dy > 1 || dy < -1 || (dx === 0 && dy === 0)) throw "Can only give to adjacent squares.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't give off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] <= 0) throw "Cannot give to empty square.";
        if (karbonite < 0 || fuel < 0 || this.me.karbonite < karbonite || this.me.fuel < fuel) throw "Do not have specified amount to give.";

        return this._bc_action('give', {
            dx:dx, dy:dy,
            give_karbonite:karbonite,
            give_fuel:fuel
        });
    }

    attack(dx, dy) {
        if (this.me.unit === SPECS.CHURCH) throw "Churches cannot attack.";
        if (this.fuel < SPECS.UNITS[this.me.unit].ATTACK_FUEL_COST) throw "Not enough fuel to attack.";
        if (!this._bc_check_on_map(this.me.x+dx,this.me.y+dy)) throw "Can't attack off of map.";
        if (this._bc_game_state.shadow[this.me.y+dy][this.me.x+dx] === -1) throw "Cannot attack outside of vision range.";

        var r = Math.pow(dx,2) + Math.pow(dy,2);
        if (r > SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][1] || r < SPECS.UNITS[this.me.unit]['ATTACK_RADIUS'][0]) throw "Cannot attack outside of attack range.";

        return this._bc_action('attack', {
            dx:dx, dy:dy
        });
        
    }


    // Get robot of a given ID
    getRobot(id) {
        if (id <= 0) return null;
        for (var i=0; i<this._bc_game_state.visible.length; i++) {
            if (this._bc_game_state.visible[i].id === id) {
                return insulate(this._bc_game_state.visible[i]);
            }
        } return null;
    }

    // Check if a given robot is visible.
    isVisible(robot) {
        return ('unit' in robot);
    }

    // Check if a given robot is sending you radio.
    isRadioing(robot) {
        return robot.signal >= 0;
    }

    // Get map of visible robot IDs.
    getVisibleRobotMap() {
        return this._bc_game_state.shadow;
    }

    // Get boolean map of passable terrain.
    getPassableMap() {
        return this.map;
    }

    // Get boolean map of karbonite points.
    getKarboniteMap() {
        return this.karbonite_map;
    }

    // Get boolean map of impassable terrain.
    getFuelMap() {
        return this.fuel_map;
    }

    // Get a list of robots visible to you.
    getVisibleRobots() {
        return this._bc_game_state.visible;
    }

    turn() {
        return null;
    }
}

const nav = {};

nav.compass = [
    ['NW', 'N', 'NE'],
    ['W', 'C', 'E'],
    ['SW', 'S', 'SE'],
];

nav.rotateArr = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
nav.rotateArrInd = {
    'N': 0,
    'NE': 1,
    'E': 2,
    'SE': 3,
    'S': 4,
    'SW': 5,
    'W': 6,
    'NW': 7,
};

nav.compassToCoordinate = {
    'N': { x: 0, y: -1 },
    'NE': { x: 1, y: -1 },
    'NW': { x: -1, y: -1 },
    'E': { x: 1, y: 0 },
    'W': { x: -1, y: 0 },
    'S': { x: 0, y: 1 },
    'SE': { x: 1, y: 1 },
    'SW': { x: -1, y: 1 },
};

nav.toCompassDir = (dir) => {
    return nav.compass[dir.y + 1][dir.x + 1];
};

nav.toCoordinateDir = (dir) => {
    return nav.compassToCoordinate[dir];
};

nav.rotate = (dir, amount) => {
    const compassDir = nav.toCompassDir(dir);
    const rotateCompassDir = nav.rotateArr[(nav.rotateArrInd[compassDir] + amount) % nav.rotateArr.length];  //BUG HERE: can't call length of rotateArrInd; used rotateArr instead
    return nav.toCoordinateDir(rotateCompassDir);
};

//  This function create the destination for target by setting the destination at the symmetric location
//  It check if the map is horizon reflect or not in order to choose the x symmetric location or y symmetric location
nav.reflect = (loc, mapLen, isHorizontalReflection) => {
    const hReflect = {
        x: loc.x,
        y: mapLen - loc.y - 1, // SEE BELOW
    };
    const vReflect = {
        x: mapLen - loc.x - 1, // 2 BUG(_S_) HERE!!! loc.y SHOULD BE loc.x; also must subtract 1!!!!!
        y: loc.y,
    };
    if (isHorizontalReflection){
        return hReflect;
    }

    else{
        return vReflect;
    }
};

//  This function checks the map is horizon reflect or not
nav.isHoReflect = (self) => {
    const mapLen = self.map.length;
    var Plausible = true;
    for (let y = 0; y < mapLen && Plausible; y++) {
        for (let x = 0; x < mapLen && Plausible; x++) {
            if (self.map[y][x] === self.map[mapLen - y - 1][x]){
                Plausible = true;
            }
            else{
                Plausible = false;
            }
        }
    }
    return Plausible;
};

nav.getDir = (start, target) => {
    const newDir = {
        x: target.x - start.x,
        y: target.y - start.y,
    };

    if (newDir.x < 0) {
        newDir.x = -1;
    } else if (newDir.x > 0) {
        newDir.x = 1;
    }

    if (newDir.y < 0) {
        newDir.y = -1;
    } else if (newDir.y > 0) {
        newDir.y = 1;
    }

    return newDir;
};

nav.isPassable = (loc, fullMap, robotMap) => {
    const { x, y } = loc;
    const mapLen = fullMap.length;
    if (x >= mapLen || x < 0) {
        return false;
    } else if (y >= mapLen || y < 0) {
        return false;
    } else if (robotMap[y][x] > 0 || !fullMap[y][x]) {
        return false;
    } else {
        return true;
    }
};

nav.applyDir = (loc, dir) => {
    return {
        x: loc.x + dir.x,
        y: loc.y + dir.y,
    };
};

nav.goto = (self, destination) => {
    let goalDir = nav.getDir(self.me, destination);
    if (goalDir.x === 0 && goalDir.y === 0) {
        return goalDir;
    }
    let tryDir = 0;
    while (!nav.isPassable(
        nav.applyDir(self.me, goalDir),
        self.getPassableMap(),
        self.getVisibleRobotMap()
    ) && tryDir < nav.rotateArr.length) {
        goalDir = nav.rotate(goalDir, 1);
        tryDir++;
    }
    return goalDir;
};

nav.sqDist = (start, end) => {
    return Math.pow(start.x - end.x, 2) + Math.pow(start.y - end.y, 2);
};

nav.getClosestRsrc = (loc, rsrcMap) => {
    const mapLen = rsrcMap.length;
    let closestLoc = null;
    let closestDist = 100000; // Large number;
    for (let y = 0; y < mapLen; y++) {
        for (let x = 0; x < mapLen; x++) {
            if (rsrcMap[y][x] && nav.sqDist({ x, y }, loc) < closestDist) {
                closestDist = nav.sqDist({ x, y }, loc);
                closestLoc = { x, y };
            }
        }
    }
    return closestLoc;
};


class MyRobot extends BCAbstractRobot {

    constructor() {
            super();

            this.pendingRecievedMessages = {};
            this.enemyCastles = [];
            this.crusaderBuilt = 0;
            this.step = -1;
            this.pilgrimsBuilt = 0;
            this.pilgrimmax = 10;
            this.prophetBuilt = 0;
            this.preacherBuilt = 0;
            this.crusadermax = 10;
            this.prophetmax = 10;
            this.isHoReflect = true;
            this.mapLen = -1;
            this.one = true;
            this.two = true;
        }
    turn() {
        this.step++;
        if (this.step === 0) {
                    this.isHoReflect = nav.isHoReflect(this);
                    this.mapLen = this.map.length;
                }
        if (this.karbonite >500){
            this.prophetBuilt -= 1;
            this.preacherBuilt -= 1;
            this.crusaderBuilt -= 1;
        }

        if (this.me.unit === SPECS.preacher) {
            this.log('preacher taking turn');

                var visible = this.getVisibleRobots();

                // get attackable robots
                var attackable = visible.filter((r) => {
                    if (! this.isVisible(r)){
                        return false;
                    }
                    const dist = (r.x-this.me.x)**2 + (r.y-this.me.y)**2;
                    if (r.team !== this.me.team
                        && SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0] <= dist
                        && dist <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1] ){
                        return true;
                    }
                    return false;
                });

                const attacking = visible.filter(r => {
                    if (r.team === this.me.team) {
                        return false;
                    }

                    if (nav.sqDist(r, this.me) <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0]) {
                        return true;
                    } else {
                        return false;
                    }
                });

                if (attacking.length > 0) {
                    const attacker = attacking[0];
                    const dir = nav.getDir(this.me, attacker);
                    const otherDir = {
                        x: -dir.x,
                        y: -dir.y,
                    };
                    return this.move(otherDir.x, otherDir.y);
                }

                if (attackable.length>0){
                    // attack first robot
                    var r = attackable[0];
                    this.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    return this.attack(r.x - this.me.x, r.y - this.me.y);
                }

                    if (!this.destination) {
                    this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                }

                const choice = nav.goto(this, this.destination);
                return this.move(choice.x, choice.y);
}
        if (this.me.unit === SPECS.CRUSADER) {
            this.log('crusader taking turn');

                var visible = this.getVisibleRobots();

                // get attackable robots
                var attackable = visible.filter((r) => {
                    if (! this.isVisible(r)){
                        return false;
                    }
                    const dist = (r.x-this.me.x)**2 + (r.y-this.me.y)**2;
                    if (r.team !== this.me.team
                        && SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0] <= dist
                        && dist <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1] ){
                        return true;
                    }
                    return false;
                });

                const attacking = visible.filter(r => {
                    if (r.team === this.me.team) {
                        return false;
                    }

                    if (nav.sqDist(r, this.me) <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0]) {
                        return true;
                    } else {
                        return false;
                    }
                });

                if (attacking.length > 0) {
                    const attacker = attacking[0];
                    const dir = nav.getDir(this.me, attacker);
                    const otherDir = {
                        x: -dir.x,
                        y: -dir.y,
                    };
                    return this.move(otherDir.x, otherDir.y);
                }

                if (attackable.length>0){
                    // attack first robot
                    var r = attackable[0];
                    this.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!');
                    return this.attack(r.x - this.me.x, r.y - this.me.y);
                }

                    if (!this.destination) {
                    this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                }

                const choice = nav.goto(this, this.destination);
                return this.move(choice.x, choice.y);
}
        if (this.me.unit === SPECS.PROPHET){
                this.log('prophet taking turn');

                var visible = this.getVisibleRobots();

                // get attackable robots
                var attackable = visible.filter((r) => {
                    if (! this.isVisible(r)){
                        return false;
                    }
                    const dist = (r.x-this.me.x)**2 + (r.y-this.me.y)**2;
                    if (r.team !== this.me.team
                        && SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0] <= dist
                        && dist <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1] ){
                        return true;
                    }
                    return false;
                });

                const attacking = visible.filter(r => {
                    if (r.team === this.me.team) {
                        return false;
                    }

                    if (nav.sqDist(r, this.me) <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0]) {
                        return true;
                    } else {
                        return false;
                    }
                });

                if (attacking.length > 0) {
                    const attacker = attacking[0];
                    const dir = nav.getDir(this.me, attacker);
                    const otherDir = {
                        x: -dir.x,
                        y: -dir.y,
                    };
                    return this.move(otherDir.x, otherDir.y);
                }


                if (attackable.length>0){
                    // attack first robot
                    var r = attackable[0];
                    this.log('attacking!!!!!!!!!!!!!!!!!!');
                    return this.attack(r.x - this.me.x, r.y - this.me.y);
                }

                    if (!this.destination) {
                    this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                }

                const choice = nav.goto(this, this.destination);
                return this.move(choice.x, choice.y);

        }
        if (this.me.unit === SPECS.PILGRIM){
            this.log('pilgrim taking turn');
                var visiblebots = this.getVisibleRobots();
                // On the first turn, find out our base
                if (!this.castle) {
                    this.castle = visiblebots
                        .filter(robot => robot.team === this.me.team && robot.unit === SPECS.CASTLE)[0];
                }

                // if we don't have a destination, figure out what it is.
                if (!this.destination) {
                    // need to figure out if 1st or 2nd pilgrim: if 1st get karb, else fuel
                    if (visiblebots
                        .filter(robot => robot.team === this.me.team && robot.unit === SPECS.PILGRIM).length > 1){
                        // can see another pilgrim on my team
                        this.resourceDestination = nav.getClosestRsrc(this.me, this.getFuelMap());
                    } else {
                        this.resourceDestination = nav.getClosestRsrc(this.me, this.getKarboniteMap());
                    }
                    this.destination = this.resourceDestination;
                }

                // If we're near our destination, do the thing
                if (this.me.karbonite === SPECS.UNITS[this.me.unit].KARBONITE_CAPACITY
                        || this.me.fuel === SPECS.UNITS[this.me.unit].FUEL_CAPACITY) {
                    this.destination = this.castle;
                    if (nav.sqDist(this.me, this.destination) <= 2) {
                        this.destination = this.resourceDestination;
                        this.log('pilgrim is taking resource back');
                        return this.give(
                            this.castle.x - this.me.x,
                            this.castle.y - this.me.y,
                            this.me.karbonite,
                            this.me.fuel);
                    }
                } else {
                    if (nav.sqDist(this.me, this.destination) === 0) {
                        this.log('pilgrim is mining');
                        return this.mine();
                    }
                }
                // If we have nothing else to do, move to our destination.
                const choice = nav.goto(this, this.destination);

                return this.move(choice.x, choice.y);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            if (this.pilgrimsBuilt < this.pilgrimmax || this.fuel < 200) {
                this.log('Building a pilgrim');
                this.pilgrimsBuilt++;
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)];
                return this.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);
            }
            if (this.pilgrimsBuilt >= 5 && this.karbonite > 100 && this.fuel > 300 && this.crusaderBuilt<10){
                this.log('Building a crusader');
                this.crusaderBuilt++;
                if(this.crusaderBuilt%3 < 1){
                    this.pilgrimmax++;
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)];
                return this.buildUnit(SPECS.CRUSADER, choice[0], choice[1]);
            }

            if (this.crusaderBuilt >= 5 && this.karbonite > 200 && this.fuel > 200 && this.prophetBuilt<10){
                this.log('Building a prophet');
                this.prophetBuilt++;
                if(this.prophetBuilt%3 < 1){
                    this.pilgrimmax++;
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)];
                return this.buildUnit(SPECS.PROPHET, choice[0], choice[1]);
            }

            if (this.prophetBuilt >= 5 && this.karbonite > 300 && this.fuel > 700 && this.preacherBuilt<10){
                this.log('Building a preacher');
                this.preacherBuilt++;
                if(this.preacherBuilt%3 < 1){
                    this.pilgrimmax++;
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)];
                return this.buildUnit(SPECS.PREACHER, choice[0], choice[1]);
            }

            else {
                return this.log("Castle health: " + this.me.health);
            }
        }

    }
}

var robot = new MyRobot();
var robot = new MyRobot();
