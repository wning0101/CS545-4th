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

nav.offsetList = [
    { x: 0, y: -1 },
    { x: 1, y: -1 },
    { x: -1, y: -1 },
    { x: 1, y: 0 },
    { x: -1, y: 0 },
    { x: 0, y: 1 },
    { x: 1, y: 1 },
    { x: -1, y: 1 },
];

nav.rotateTry = [1, -1, 2, -2, 3, -3, 4];

nav.toCompassDir = (dir) => {
    return nav.compass[dir.y + 1][dir.x + 1];
};

nav.toCoordinateDir = (dir) => {
    return nav.compassToCoordinate[dir];
};

nav.rotate = (dir, amount) => {
    const compassDir = nav.toCompassDir(dir);
    const rotateCompassDir = nav.rotateArr[(nav.rotateArrInd[compassDir] + amount + nav.rotateArr.length) % nav.rotateArr.length];  //BUG HERE: can't call length of rotateArrInd; used rotateArr instead 
    return nav.toCoordinateDir(rotateCompassDir);
};

nav.reflect = (loc, mapLen, isHorizontalReflection) => {
    const hReflect = {
        x: loc.x,
        y: mapLen - loc.y - 1, // SEE BELOW
    };
    const vReflect = {
        x: mapLen - loc.x - 1, // 2 BUG(_S_) HERE!!! loc.y SHOULD BE loc.x; also must subtract 1!!!!!
        y: loc.y,
    };    
    return isHorizontalReflection ? hReflect : vReflect; 
};

nav.isHoReflect = (self) => {
    // self.log('starting reflect check');
    const mapLen = self.map.length;
    var Plausible = true;
    for (let y = 0; y < mapLen && Plausible; y++) {
        for (let x = 0; x < mapLen && Plausible; x++) {
            Plausible = self.map[y][x] === self.map[mapLen - y - 1][x];
        }
    }
    return Plausible
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
    let tryDir = goalDir;
    let ind = 0;
    while (!nav.isPassable(
        nav.applyDir(self.me, tryDir),
        self.getPassableMap(),
        self.getVisibleRobotMap()
    ) && ind < nav.rotateTry.length) {
        tryDir = nav.rotate(goalDir, nav.rotateTry[ind]);
        ind++;
    }
    return tryDir;
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

const pilgrim = {};

pilgrim.takeTurn = (self) => {
    self.log('pilgrim taking turn');
    const visiblebots = self.getVisibleRobots();
    if (self.castle == null) {
        const sameTeamCastles = visiblebots.filter((robot) => 
            robot.team === self.me.team && robot.unit === SPECS.CASTLE,
        );

        self.castle = sameTeamCastles[0];
    }

    if (self.destination == null) {
        const sameTeamPilgrims = visiblebots.filter((robot) =>
            robot.team === self.me.team && robot.unit === SPECS.PILGRIM
        );

        if (sameTeamPilgrims.length > 1) {
            self.resourceDestination = nav.getClosestRsrc(self.me, self.getFuelMap());
        } else {
            self.resourceDestination = nav.getClosestRsrc(self.me, self.getKarboniteMap());
        }

        self.destination = self.resourceDestination;
    }

    const hasKarboniteCapacity = self.me.karbonite === SPECS.UNITS[self.me.unit].KARBONITE_CAPACITY;
    const hasFuelCapacity = self.me.fuel === SPECS.UNITS[self.me.unit].FUEL_CAPACITY;

    self.castleTalk(Math.pow(2, 8) - 1);

    if (hasKarboniteCapacity || hasFuelCapacity) {
        self.destination = self.castle;

        const distanceFromDestination = nav.sqDist(self.me, self.destination);
        if (distanceFromDestination <= 2) {
            self.destination = self.resourceDestination;
            return self.give(
                self.castle.x - self.me.x,
                self.castle.y - self.me.y,
                self.me.karbonite,
                self.me.fuel,
            );
        }
    } else if (nav.sqDist(self.me, self.destination) === 0) {
        return self.mine();
    }

    if (self.destination && !isNaN(self.destination.x) && !isNaN(self.destination.y)) {
        const choice = nav.goto(self, self.destination);
        if (choice) {
            return self.move(choice.x, choice.y);
        }
    }
};

const crusader = {};
crusader.getAttackableBots = (self) => {
  const visibleBots = self.getVisibleRobots();
  return visibleBots.filter((robot) => {
    if (! self.isVisible(robot)){
        return false;
    }

    const dist = (robot.x-self.me.x) ** 2 + (robot.y - self.me.y) ** 2;
    if (robot.team !== self.me.team
        && SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0] <= dist
        && dist <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1] ){
        return true;
    }
    return false;
  });
};

crusader.getAttackingBots = (self) => {
  const visibleBots = self.getVisibleRobots();
  return visibleBots.filter((robot) => {
    if (robot.team === self.me.team) {
        return false;
    }

    if (nav.sqDist(robot, self.me) <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]) {
      return true;
    }

    return false;
  });
};

crusader.moveAwayRandomly = (self, attackingBots) => {
  const randomBot = attackingBots[Math.floor(Math.random() * attackingBots.length)];
  const { x, y } = nav.getDir(self.me, randomBot);

  return self.move((-1) * x, (-1) * y);
};

crusader.attackRandomly = (self, attackableRobots) => {
  const randomBot = attackableRobots[Math.floor(Math.random() * attackableRobots.length)];
  const stringified = JSON.stringify(randomBot);
  const locationX = randomBot.x - self.me.x;
  const locationY = randomBot.y - self.me.y;

  self.log(stringified);
  self.log(`attacking! ${stringified} at loc ${(locationY)}`);

  return self.attack(locationX, locationY);
};

crusader.isEnemyCastle = (self, robot) =>
  robot.team !== self.me.team &&
  robot.unit === SPECS.CASTLE &&
  self.enemyCastles.indexOf(robot.x * 64 + robot.y) < 0;

crusader.markEnemyCastle = (self, robot) => {
  self.log('ENEMY CASTLE FOUND!');
  self.pendingMessage = robot.y;
  self.castleTalk(robot.x);
  self.enemyCastles.push(robot.x * 64 + robot.y);
};

crusader.takeTurn = (self) => {
    self.log('crusader taking turn');
    self.log('START TURN ' + self.step);
    self.log('health: ' + self.me.health);

    var visibleBots = self.getVisibleRobots();
    var attackableBots = crusader.getAttackableBots(self);
    const attackingBots = crusader.getAttackingBots(self);

    // get the number of crusader
    const nearbyCrusaders = visibleBots.filter((robot) => {
      const isSameTeam = self.me.team === robot.team;
      return isSameTeam && robot.unit === SPECS.CRUSADER;
    });
    const nearbyProphets = visibleBots.filter((robot) => {
      const isSameTeam = self.me.team === robot.team;
      return isSameTeam && robot.unit === SPECS.PROPHET;
    });
    if (attackingBots.length > 0) {
      crusader.moveAwayRandomly(self, attackingBots);
    }

    if (self.pendingMessage != null && self.pendingMessage.length > 0) {
      self.castleTalk(self.pendingMessage);
      self.pendingMessage = null;
    } else {
      self.castleTalk(Math.pow(2, 8) - 1);
      visibleBots.forEach((robot) => {
        if (crusader.isEnemyCastle(self, robot)) {
          crusader.markEnemyCastle(self, robot);
        }
      });
    }

    self.log(attackableBots);

    if (attackableBots.length > 0) {
      return crusader.attackRandomly(self, attackableBots);
    }

    if (self.destination == null) {
        self.destination = nav.reflect(self.me, self.mapLen, self.isHoReflect);
    }

    // const { x, y } = nav.goto(self, self.destination);
    
    // const choice = (nearbyCrusaders.length >= 5 || a === 1)
    //   ? nav.goto(self, { x:self.destination.x, y: self.destination.y })
    //   : nav.goto(self, { x:self.destination.x - 9, y: self.destination.y - 9 });

    //   //const choice =  nav.goto(self, { x:self.destination.x - 9, y: self.destination.y - 9 });

    // // return self.move(self.me.x , self.me.y );
    // if (choice) {
    //   return self.move(choice.x, choice.y);
    // }

    //Attack when number is more than 5
    // var size = nearbyCrusaders.length + nearbyProphets.length
    // if(size >= 10 || a === 1){
    //   a = 1;
    //   //go to the destination
    //   const choice = nav.goto(self, { x:self.destination.x, y: self.destination.y });
    //   if (choice) {
    //     return self.move(choice.x, choice.y);
    //   }
  
    // }else{
      //got to the location outside the enemy castle range
      const choice =  nav.goto(self, { x:self.destination.x - 12, y: self.destination.y - 12 });
      if (choice) {
        return self.move(choice.x, choice.y);
     }
  //  }

};

const prophet = {};
var b = 0;
prophet.takeTurn = (self) => {
    self.log('prophet taking turn');
    self.log('START TURN ' + self.step);
    self.log('health: ' + self.me.health);

    var visible = self.getVisibleRobots();
    const nearbyProphet = visible.filter((robot) => {
        const isSameTeam = self.me.team === robot.team;
        return isSameTeam && robot.unit === SPECS.PROPHET;
      });
      const nearbyCrusaders = visible.filter((robot) => {
        const isSameTeam = self.me.team === robot.team;
        return isSameTeam && robot.unit === SPECS.CRUSADER;
      });
    // get attackable robots
    var attackable = visible.filter((r) => {
        if (! self.isVisible(r)){
            return false;
        }
        const dist = (r.x-self.me.x)**2 + (r.y-self.me.y)**2;
        if (r.team !== self.me.team
            && SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0] <= dist
            && dist <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1] ){
            return true;
        }
        return false;
    });

    const attacking = visible.filter(r => {
        if (r.team === self.me.team) {
            return false;
        }

        if (nav.sqDist(r, self.me) <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]) {
            return true;
        } else {
            return false;
        }
    });

    if (attacking.length > 0) {
        const attacker = attacking[0];
        const dir = nav.getDir(self.me, attacker);
        const otherDir = {
            x: -dir.x,
            y: -dir.y,
        };
        return self.move(otherDir.x, otherDir.y);
    }



    if(!self.pendingMessage) {
        for(let i = 0; i < visible.length; i++ ) {
            const robot = visible[i];
            if (robot.team !== self.me.team && robot.unit === SPECS.CASTLE && self.enemyCastles.indexOf(robot.x * 64 + robot.y) < 0) {
                self.log('ENEMY CASTLE FOUND!');
                self.pendingMessage = robot.y;
                self.castleTalk(robot.x);
                self.enemyCastles.push(robot.x * 64 + robot.y);
            }
        }
    } else {
        self.castleTalk(self.pendingMessage);
        self.pendingMessage = null;
    }

    self.log(attackable);

    if (attackable.length>0){
        // attack first robot
        var r = attackable[0];
        self.log('' +r);
        self.log('attacking! ' + r + ' at loc ' + (r.x - self.me.x, r.y - self.me.y));
        return self.attack(r.x - self.me.x, r.y - self.me.y);
    }
    // self.log("Crusader health: " + self.me.health);'
    if (!self.destination) {
        self.destination = nav.reflect(self.me, self.mapLen, self.isHoReflect);
    }

    // const choice = nav.goto(self, self.destination);
    // return self.move(choice.x, choice.y);
    //const choice = nav.goto(self, { x:self.destination.x - 8, y: self.destination.y - 8 });

    // const choice = (nearbyProphet.length >= 5 || b === 1)
    //   ? nav.goto(self, { x:self.destination.x, y: self.destination.y })
    //   : nav.goto(self, { x:self.destination.x - 8, y: self.destination.y - 8 });

    // return self.move(self.me.x , self.me.y );
    // if (choice) {
    //   return self.move(choice.x, choice.y);
    // }
    var size = nearbyCrusaders.length + nearbyProphet.length;
    if(size >= 20 || b === 1){
        b = 1;
        const choice = nav.goto(self, { x:self.destination.x, y: self.destination.y });
        if (choice) {
          return self.move(choice.x, choice.y);
        }
    
      }else{
        let x = self.direction.x;
        const y = self.direction.y;
        while(visible.some(bot=> bot.me.x === x && bot.me.y === y) ){
            x = x+1;
        }
        const choice = nav.goto(self, { x , y });
        if (choice) {
          return self.move(choice.x, choice.y);
       }
     }
};

const preacher = {};

preacher.getAttackableBots = (self) => {
  const visibleBots = self.getVisibleRobots();
  return visibleBots.filter((robot) => {
    if (! self.isVisible(robot)){
        return false;
    }

    const dist = (robot.x-self.me.x) ** 2 + (robot.y - self.me.y) ** 2;
    if (robot.team !== self.me.team
        && SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0] <= dist
        && dist <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1] ){
        return true;
    }
    return false;
  });
};

preacher.getAttackingBots = (self) => {
  const visibleBots = self.getVisibleRobots();
  return visibleBots.filter((robot) => {
    if (robot.team === self.me.team) {
        return false;
    }

    if (nav.sqDist(robot, self.me) <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0]) {
      return true;
    }

    return false;
  });
};

preacher.moveAwayRandomly = (self, attackingBots) => {
  const randomBot = attackingBots[Math.floor(Math.random() * attackingBots.length)];
  const { x, y } = nav.getDir(self.me, randomBot);

  return self.move((-1) * x, (-1) * y);
};

preacher.attackRandomly = (self, attackableRobots) => {
  const randomBot = attackableRobots[Math.floor(Math.random() * attackableRobots.length)];
  const stringified = JSON.stringify(randomBot);
  const locationX = randomBot.x - self.me.x;
  const locationY = randomBot.y - self.me.y;

  self.log(stringified);
  self.log(`attacking! ${stringified} at loc ${(locationY)}`);

  return self.attack(locationX, locationY);
};

preacher.isEnemyCastle = (self, robot) =>
  robot.team !== self.me.team &&
  robot.unit === SPECS.CASTLE &&
  self.enemyCastles.indexOf(robot.x * 64 + robot.y) < 0;

preacher.markEnemyCastle = (self, robot) => {
  self.log('ENEMY CASTLE FOUND!');
  self.pendingMessage = robot.y;
  self.castleTalk(robot.x);
  self.enemyCastles.push(robot.x * 64 + robot.y);
};

preacher.takeTurn = (self) => {
    self.log('preacher taking turn');
    self.log('START TURN ' + self.step);
    self.log('health: ' + self.me.health);

    var visibleBots = self.getVisibleRobots();
    var attackableBots = preacher.getAttackableBots(self);
    const attackingBots = preacher.getAttackingBots(self);

    if (attackingBots.length > 0) {
      preacher.moveAwayRandomly(self, attackingBots);
    }

    if (self.pendingMessage != null && self.pendingMessage.length > 0) {
      self.castleTalk(self.pendingMessage);
      self.pendingMessage = null;
    } else {
      visibleBots.forEach((robot) => {
        if (preacher.isEnemyCastle(self, robot)) {
          preacher.markEnemyCastle(self, robot);
        }
      });
    }

    self.log(attackableBots);

    if (attackableBots.length > 0) {
      return preacher.attackRandomly(self, attackableBots);
    }

    if (self.destination == null) {
        self.destination = nav.reflect(self.me, self.mapLen, self.isHoReflect);
    }

    // const { x, y } = nav.goto(self, self.destination);
    // const { x, y } = nav.goto(self, self.destination);
    const choice = nav.goto(self, { x:self.destination.x - 8, y: self.destination.y - 8 });

    // return self.move(self.me.x , self.me.y );
    // return self.move(x, y);
    if (choice) {
      return self.move(choice.x, choice.y);
    }
    
};

const castle = {};
castle.takeTurn = (self) => {
    self.log('castle taking turn');
   
    const visible = self.getVisibleRobots();
    const messagingRobots = visible.filter(robot => {
        return robot.castle_talk != null;
    });

    const getBuildDir = () => {
        const options = nav.offsetList.filter((direction) => nav.isPassable(
            nav.applyDir(self.me, direction),
            self.getPassableMap(),
            self.getVisibleRobotMap(),
        ));

        return options[0];
    };

    messagingRobots.forEach((robot) => {
        if (robot.castle_talk === 255) {
            return;
        }

        const pendingPacket = self.pendingRecievedMessages[robot.id] || '';
        if (pendingPacket.length === 0) {
            self.pendingRecievedMessages[robot.id] = robot.castle_talk;
        } else {
            self.enemyCastles.push({
                x: pendingPacket,
                y: robot.castle_talk,
            });

            self.pendingRecievedMessages[robot.id] = null;
        }
    });

    self.log(`Total Robots: ${messagingRobots.length}`);

    const attackable = visible.filter((robot) => {
        if (!self.isVisible(robot)){
            return false;
        }

        const distance = (robot.x - self.me.x) ** 2 + (robot.y - self.me.y) ** 2;
        if (
            robot.team !== self.me.team &&
            SPECS.UNITS[self.me.unit].ATTACK_RADIUS[0] <= distance &&
            distance <= SPECS.UNITS[self.me.unit].ATTACK_RADIUS[1]
        ) {
            return true;
        }

        return false;
    });

    if (self.me.turn % 100) {
        self.enemyCastles.forEach((castle) => {
            const { x, y } = castle;
            self.log(`${x}, ${y}`);
        });
    }

    if (attackable.length > 0){
        const robot = attackable[0];
        const stringifiedRobot = JSON.stringify(robot);
        const calculatedX = robot.x - self.me.x;
        const calculatedY = robot.y - self.me.y;

        self.log(stringifiedRobot);
        self.log(`attacking! ${stringifiedRobot} at loc (${calculatedY})`);

        return self.attack(calculatedX, calculatedY);
    }

    if (self.pilgrimsBuilt < 5 && self.karbonite >= 10) {
        const direction = getBuildDir(self.me);
        if (direction != null){
            self.log(`Building a pilgrim at ${(self.me.x + 1)}, ${(self.me.y + 1)}`);
            self.pilgrimsBuilt++;

            return self.buildUnit(SPECS.PILGRIM, direction.x, direction.y);
        }
    } 

    if (self.me.turn > 10 && self.karbonite > 30 && self.fuel > 150 ) {
        // 
        // const direction = getBuildDir(self.me);
        // if (direction != null) {
        //     let type = SPECS.PROPHET;

        //     const generator = Math.floor(Math.random() * 3);
        //     switch (generator) {
        //         case 0:
        //             type = SPECS.PROPHET;
        //         case 1:
        //             type = SPECS.PREACHER;
        //         case 2:
        //             self.crusaderBuilt += 1;
        //             type = SPECS.CRUSADER;
        //         default:
        //             type = SPECS.PROPHET;
        //     }

        //     const id = self.buildUnit(type, direction.x, direction.y);
        //     self.log(`----- built a unit of type ${type} with id: ${JSON.stringify(id)}`);
        //     return id;
        // }
            const direction = getBuildDir();

            
            if(direction != null){
                let type = SPECS.PILGRIM;
                if(self.crusadersBuilt % 5 !== 0 || self.crusadersBuilt === 0){
                    type = SPECS.CRUSADER;
                    self.crusadersBuilt += 1;   
                }else if(self.prophetBuilt % 25!== 0 || self.prophetBuilt === 0) {
                    type = SPECS.PROPHET;
                    self.prophetBuilt += 1;
                }else if(self.preacherBuilt % 2!== 0 || self.preacherBuilt === 0){
                    type = SPECS.PREACHER;
                    self.preacherBuilt += 1;
                // }else if (self.prilgrimsBuilt % 3 !== 0 || self.pilgrimsBuilt === 0){
                //     type = SPECS.PILGRIM
                //     self.pilgrimsBuilt += 1;              
                }else{
                    self.crusadersBuilt += 1;
                    self.preacherBuilt += 1;
                    self.prophetBuilt += 1;
                }
                // if( type === SPECS.PROPHET){
                //     console.log("Making Prophets")
                //     return self.buildUnit(type, direction.x+ x + self.prophetBuilt % 5 - 1, direction.y + y - Math.floor(self.prophetBuilt / 5));
                // }else{
                    return self.buildUnit(type, direction.x, direction.y);
                // }
            } else {
                self.log('direction is null');
            }
            
    } else{
        self.log(`karbonite: ${self.karbonite}`);
        self.log(`fuel: ${self.karbonite}`);
        self.log(`turn: ${self.me.turn}`);
        
    }
};

class MyRobot extends BCAbstractRobot {
    constructor() {
        super();
        this.pendingRecievedMessages = {};
        this.enemyCastles = [];
        this.myType = undefined;
        this.pilgrimsBuilt = 0;
        this.crusadersBuilt = 0;
        this.prophetBuilt = 0;
        this.preacherBuilt = 0;
        this.isHoReflect = true;
        this.mapLen = -1;
    }

    turn() {
        if (this.me.turn === 1) {
            this.isHoReflect = nav.isHoReflect(this);
            this.mapLen = this.map.length;
        }
        if (this.myType === undefined){
            switch(this.me.unit) {
                case SPECS.PROPHET:
                    this.myType = prophet;
                    break;
                case SPECS.CASTLE:
                    this.myType = castle;
                    break;
                case SPECS.PILGRIM:
                    this.myType = pilgrim;
                    break;
                case SPECS.CRUSADER:
                    this.myType = crusader;
                    break;
                case SPECS.PREACHER:
                    this.myType = preacher;
                    break;
            }
        }

        return this.myType.takeTurn(this);
    }
}
var robot = new MyRobot();
