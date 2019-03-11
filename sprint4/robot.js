import {BCAbstractRobot, SPECS} from 'battlecode';

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
    const rotateCompassDir = nav.rotateArr[(nav.rotateArrInd[compassDir] + amount) % nav.rotateArr.length];
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
    let second_close = null;
    let third_close = null;
    let temp = null;
    let closestDist = 100000; // Large number;
    for (let y = 0; y < mapLen; y++) {
        for (let x = 0; x < mapLen; x++) {
            if (rsrcMap[y][x] && nav.sqDist({ x, y }, loc) < closestDist) {
                temp = second_close;
                second_close = closestLoc;
                third_close = second_close
                closestDist = nav.sqDist({ x, y }, loc);
                closestLoc = { x, y };
            }
        }
    }
    return [closestLoc, second_close, third_close];
};

var global_x = 0
var global_y = 0

class MyRobot extends BCAbstractRobot {

    constructor() {
            super();

            this.pendingRecievedMessages = {};
            this.enemyCastles = [];
            this.crusaderBuilt = 0;
            this.step = -1;
            this.pilgrimsBuilt = 0;
            this.pilgrimmax = 3;
            this.prophetBuilt = 0;
            this.preacherBuilt = 0;
            this.prophetmax = 10;
            this.troop = 0
            this.isHoReflect = true;
            this.mapLen = -1
            this.posx = 0
            this.posy = 0
            this.layer = 0
            this.direction = 1
            this.crusader_x = 0
            this.crusader_y = 0
            this.map_size = 0
            this.enemy = [0,0]
            this.route = 0
            this.initial = false
            this.pilgrim = false
            this.k_urgent = 0
            this.f_urgent = 0
        }
    turn() {
        this.step++;
        // This statement is creating the initial state, including which type of symmetric and what's the size of the map
        if (!this.initial) {
                    this.isHoReflect = nav.isHoReflect(this);
                    // symmetric type
                    // unit test: if the type is right, vertical or horizontal
                    this.mapLen = this.map.length;
                    // enemy position
                    // unit test: if enemy is around there
                    this.enemy = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                    // distance between enemy and us
                    // uint test: if the distance is right
                    this.route = Math.abs(this.me.x - this.enemy[0]) + Math.abs(this.me.y - this.enemy[1])

                    // Setting the map_size: 0 is the smallest, 1 is the medium, 2 is the biggest
                    // unit test: if the size is correct
                    if(this.route <= 25){
                        if(this.mapLen < 15){
                            this.map_size = 0
                        }
                        else{
                            this.map_size = 1
                        }
                    }
                    else{
                        this.map_size = 2
                        this.pilgrimmax = 2
                    }
                    this.initial = true
                }

        if (this.me.unit === SPECS.PREACHER) {
            this.log('preacher taking turn')

                var visible = this.getVisibleRobots();

                // collecting nearby preacher
                var readytoattack = visible.filter((a) => {
                    if (! this.isVisible(a)){
                        return false;
                    }
                    if (a.team === this.me.team && a.unit === SPECS.CRUSADER){
                        return true
                    }
                    if (a.team === this.me.team && a.unit === SPECS.PREACHER){
                        return true
                    }
                    return false;
                });

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

                if (!this.turnaround) {
                    this.turnaround = 1
                }

                if (this.me.x <= this.destination.x+1 && this.me.x >= this.destination.x-1){
                    if(this.me.y <= this.destination.y+1 && this.me.y >= this.destination.y-1){
                        if(this.turnaround === 1){
                            this.destination = nav.reflect(this.me, this.mapLen, !this.isHoReflect);
                            this.turnaround === 2;
                        }
                        else if(this.turnaround === 2){
                            this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                            this.turnaround === 1
                        }
                    }
                }

                /*
                if (this.map_size < 2){
                    const choice = nav.goto(this, this.destination);
                    return this.move(choice.x, choice.y);
                }
                */

                //if there are more than 2 preacher or prophet, then go atttacking
                //unit test: if they go attacking after they have enough company

                if(readytoattack.length > 2 || this.attack_confirm){
                    this.attack_confirm = true;
                    const choice = nav.goto(this, this.destination);
                    return this.move(choice.x, choice.y);
                }
                else{
                    if(this.isHoReflect){
                        if(this.destination.y > this.mapLen/2 ){
                            var choice1 = {x: this.destination.x, y: this.mapLen/2 -5,}
                        }
                        else{
                            var choice1 = {x: this.destination.x, y: this.mapLen/2 +5,}
                        }
                        const choices1 = nav.goto(this, choice1);
                        return this.move(choices1.x, choices1.y);
                    }
                    else{
                        if(this.destination.x > this.mapLen/2 ){
                            var choice2 = {x: this.mapLen/2 +5, y: this.destination.y,}
                        }
                        else{
                            var choice2 = {x: this.mapLen/2 -5, y: this.destination.y,}
                        }
                        const choices2 = nav.goto(this, choice2);
                        return this.move(choices2.x, choices2.y);
                    }
                }
                //return this.move(choice.x, choice.y);
        }
        if (this.me.unit === SPECS.PROPHET) {
            this.log('prophet taking turn')

                var visible = this.getVisibleRobots();

                // get nearby preacher
                var readytoattack = visible.filter((a) => {
                    if (! this.isVisible(a)){
                        return false;
                    }
                    if (a.team === this.me.team && a.unit === SPECS.PROPHET){
                        return true
                    }
                    if (a.team === this.me.team && a.unit === SPECS.PREACHER){
                        return true
                    }
                    return false;
                });

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

                if (!this.turnaround) {
                    this.turnaround = 1
                }

                if (this.me.x <= this.destination.x+3 && this.me.x >= this.destination.x-3){
                    if(this.me.y <= this.destination.y+3 && this.me.y >= this.destination.y-3){
                        if(this.turnaround === 1){
                            this.destination = nav.reflect(this.me, this.mapLen, !this.isHoReflect);
                            this.turnaround === 2;
                        }
                        else if(this.turnaround === 2){
                            this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                            this.turnaround === 1
                        }
                    }
                }


                //if there are more than 2 preacher or prophet, then go atttacking
                //unit test: if they go attacking after they have enough company
                if(readytoattack.length > 2 || this.attack_confirm){
                    this.attack_confirm = true;
                    const choice = nav.goto(this, this.destination);
                    return this.move(choice.x, choice.y);
                }
                else{
                    if(this.isHoReflect){
                        if(this.destination.y > this.mapLen/2 ){
                            var choice1 = {x: this.destination.x, y: this.mapLen/2 -5,}
                        }
                        else{
                            var choice1 = {x: this.destination.x, y: this.mapLen/2 +5,}
                        }
                        const choices1 = nav.goto(this, choice1);
                        return this.move(choices1.x, choices1.y);
                    }
                    else{
                        if(this.destination.x > this.mapLen/2 ){
                            var choice2 = {x: this.mapLen/2 +5, y: this.destination.y,}
                        }
                        else{
                            var choice2 = {x: this.mapLen/2 -5, y: this.destination.y,}
                        }
                        const choices2 = nav.goto(this, choice2);
                        return this.move(choices2.x, choices2.y);
                    }
                }
                //return this.move(choice.x, choice.y);
        }
        if (this.me.unit === SPECS.CRUSADER) {
            this.log('crusader taking turn')

                var visible = this.getVisibleRobots();

                // get nearby preacher
                var readytoattack = visible.filter((a) => {
                    if (! this.isVisible(a)){
                        return false;
                    }
                    if (a.team === this.me.team && a.unit === SPECS.CRUSADER){
                        return true
                    }
                    if (a.team === this.me.team && a.unit === SPECS.PROPHET){
                        return true
                    }
                    if (a.team === this.me.team && a.unit === SPECS.PREACHER){
                        return true
                    }
                    return false;
                });

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
                if (!this.turnaround) {
                    this.turnaround = 1
                }

                if (this.me.x <= this.destination.x+3 && this.me.x >= this.destination.x-3){
                    if(this.me.y <= this.destination.y+3 && this.me.y >= this.destination.y-3){
                        if(this.turnaround === 1){
                            this.destination = nav.reflect(this.me, this.mapLen, !this.isHoReflect);
                            this.turnaround === 2;
                        }
                        else if(this.turnaround === 2){
                            this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                            this.turnaround === 1
                        }
                    }
                }


                //if there are more than 2 preacher or prophet or crusader, then go atttacking
                //unit test: if they go attacking after they have enough company
                if(readytoattack.length > 2 || this.attack_confirm){
                    this.attack_confirm = true;
                    const choice = nav.goto(this, this.destination);
                    return this.move(choice.x, choice.y);
                }
                else{
                    if(this.isHoReflect){
                        if(this.destination.y > this.mapLen/2 ){
                            var choice1 = {x: this.destination.x, y: this.mapLen/2,}
                        }
                        else{
                            var choice1 = {x: this.destination.x, y: this.mapLen/2,}
                        }
                        const choices1 = nav.goto(this, choice1);
                        return this.move(choices1.x, choices1.y);
                    }
                    else{
                        if(this.destination.x > this.mapLen/2 ){
                            var choice2 = {x: this.mapLen/2, y: this.destination.y,}
                        }
                        else{
                            var choice2 = {x: this.mapLen/2, y: this.destination.y,}
                        }
                        const choices2 = nav.goto(this, choice2);
                        return this.move(choices2.x, choices2.y);
                    }
                }
                //return this.move(choice.x, choice.y);
        }


        if (this.me.unit === SPECS.PILGRIM){
            this.log('pilgrim taking turn')
                var visiblebots = this.getVisibleRobots()

                var readytoexplore = visiblebots.filter(a => {
                    if (! this.isVisible(a)){
                        return false;
                    }
                    if (a.team === this.me.team && a.unit === SPECS.PILGRIM){
                        return true
                    }
                    return false;
                });

                var seechurch = visiblebots.filter(k => {
                    if (! this.isVisible(k)){
                        return false;
                    }
                    if (k.team === this.me.team && k.unit === SPECS.CHURCH){
                        return true
                    }
                    return false;
                });

                if(!this.first_birth){
                    this.first_birth = true
                //if there are more than 3 pilgrims round, then go exploring
                //unit test: if they go exploring after it have enough pilgrims in ths base
                    if (readytoexplore.length > 2){
                        this.go_explore = true
                    }
                    else{
                        this.go_explore = false
                    }
                }

                if (this.go_explore){

                    if (!this.explore_destination){
                        this.explore_destination = nav.reflect(this.me, this.mapLen, !this.isHoReflect);
                    }
                    if (readytoexplore.length < 2){
                            this.new_explore_destination = nav.getClosestRsrc(this.me, this.getKarboniteMap());
                            this.explore_destination = this.new_explore_destination[0];
                            this.buildchurch = true;
                            this.done = false;
                    }

                    if(seechurch.length > 0){
                        this.done = true;
                        this.go_explore = false;
                    }

                    if (this.buildchurch && !this.done){
                        if (this.me.x <= this.explore_destination.x+2 && this.me.x >= this.explore_destination.x-2){
                            if(this.me.y <= this.explore_destination.y+2 && this.me.y >= this.explore_destination.y-2){
                                const choices_C = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                                const choice_C = choices_C[Math.floor(Math.random()*choices_C.length)]
                                return this.buildUnit(SPECS.CHURCH, choice_C[0], choice_C[1])
                            }
                        }
                    }


                    var choice_t1 = {x: this.explore_destination.x, y: this.explore_destination.y,}
                    const choice_t = nav.goto(this, choice_t1);
                    return this.move(choice_t.x, choice_t.y)
                }
                // On the first turn, find out our base
                if (!this.castle) {
                    this.castle = visiblebots
                        .filter(robot => {
                        if (robot.team === this.me.team && robot.unit === SPECS.CASTLE){
                            return true
                        }
                        if (robot.team === this.me.team && robot.unit === SPECS.CHURCH){
                            return true
                        }
                        }
                        )[0];

                }

                // if we don't have a destination, figure out what it is.
                if (!this.destination) {
                    // need to figure out if 1st or 2nd pilgrim: if 1st get karb, else fuel

                    if (visiblebots
                        .filter(robot => robot.team === this.me.team && robot.unit === SPECS.PILGRIM).length%2 === 1){
                        // can see another pilgrim on my team
                        this.resourceDestination = nav.getClosestRsrc(this.me, this.getFuelMap());
                    } else {
                        this.resourceDestination = nav.getClosestRsrc(this.me, this.getKarboniteMap());
                    }



                    this.destination = this.resourceDestination[0];
                }

                // If we're near our destination, do the thing
                if (this.me.karbonite === SPECS.UNITS[this.me.unit].KARBONITE_CAPACITY
                        || this.me.fuel === SPECS.UNITS[this.me.unit].FUEL_CAPACITY) {
                    this.destination = this.castle;
                    if (nav.sqDist(this.me, this.destination) <= 2) {
                        this.destination = this.resourceDestination[0]
                        this.log('pilgrim is taking resource back')
                        return this.give(
                            this.castle.x - this.me.x,
                            this.castle.y - this.me.y,
                            this.me.karbonite,
                            this.me.fuel);
                    }
                } else {
                    if (nav.sqDist(this.me, this.destination) === 0) {
                        this.log('pilgrim is mining')
                        return this.mine();
                    }
                }
                // If we have nothing else to do, move to our destination.
                const choice = nav.goto(this, this.destination);

                return this.move(choice.x, choice.y);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            var visible = this.getVisibleRobots();

                            // get nearby preacher
            var surroundpilgrom = visible.filter((a) => {
                this.castle_number = 0
                if (! this.isVisible(a)){
                    return false;
                }
                if (a.team === this.me.team && a.unit === SPECS.PILGRIM){
                    return true
                }
                if (a.team === this.me.team && a.unit === SPECS.CASTLE){
                    this.castle_number += 1
                }
                return false;
                });

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

            if (attackable.length>0){
                    // attack first robot
                    var r = attackable[0];
                    this.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    return this.attack(r.x - this.me.x, r.y - this.me.y);
                }

            //if there are less than 2 pilgrim around the castle, then build on more pilgrim
            //unit test: if the castle builds another pilgrim if there is not enough pilgrim around
            if (surroundpilgrom.length < 2*this.castle_number){
                this.builtpilgram = true;
            }

            if (this.karbonite === 0 || this.fuel === 0){
                if(this.karbonite === 0){
                    this.k_urgent++;
                }
                if(this.fuel == 0){
                    this.f_urgent++;
                }
            }

            if (this.k_urgent > 5 || this.f_urgent > 5){
                if(this.k_urgent>5){
                this.k_urgent = 0
                this.builtpilgram = true;
                }
                else{
                this.f_urgent = 0
                this.builtpilgram = true;
                }
            }

            if(surroundpilgrom.length >= 3){
            	this.threepilgrim = true;
            }

            if (this.pilgrimsBuilt < this.pilgrimmax || this.builtpilgram || !this.threepilgrim) {

                this.log('Building a pilgrim');
                this.pilgrimsBuilt++;
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                this.builtpilgram = false
                return this.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);

            }

             

            if (this.pilgrimsBuilt >= this.pilgrimmax && this.karbonite > 40 && this.threepilgrim){


                this.log('Building a preacher')
                this.preacherBuilt++;

                if(this.preacherBuilt >= 3){
                    this.pilgrimmax = 3
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                return this.buildUnit(SPECS.PREACHER, choice[0], choice[1]);
            }
            

            if (this.preacherBuilt >= 50 && surroundpilgrom.length >= 2){
                this.log('Building a crusader');
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                return this.buildUnit(SPECS.CRUSADER, choice[0], choice[1]);
            }
            /*

            if (this.pilgrimsBuilt >= this.pilgrimmax && this.map_size === 1 && this.karbonite>100){
                this.log('Building a crusader');
                this.crusaderBuilt++;
                if(this.crusaderBuilt >= 3){
                    this.pilgrimmax = 3
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                return this.buildUnit(SPECS.CRUSADER, choice[0], choice[1]);
            }

			*/
            else {
                return this.log("Castle health: " + this.me.health);
            }
        }
        else if (this.me.unit === SPECS.CHURCH) {

        	this.log("CHURCH~~~~~~~~~~~~~~~~CHURCH")
            var visible = this.getVisibleRobots();

                            // get nearby preacher
            var surroundpilgrom = visible.filter((a) => {
                this.castle_number = 0
                if (! this.isVisible(a)){
                    return false;
                }
                if (a.team === this.me.team && a.unit === SPECS.PILGRIM){
                    return true
                }
                if (a.team === this.me.team && a.unit === SPECS.CASTLE){
                    this.castle_number += 1
                }
                if (a.team === this.me.team && a.unit === SPECS.CHURCH){
                    this.castle_number += 1
                }
                return false;
                });

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

            if (attackable.length>0){
                    // attack first robot
                    var r = attackable[0];
                    this.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    return this.attack(r.x - this.me.x, r.y - this.me.y);
                }

            if (surroundpilgrom.length < 3*this.castle_number){
                this.builtpilgram = true;
            }

            if (this.karbonite === 0 || this.fuel === 0){
                if(this.karbonite === 0){
                    this.k_urgent++;
                }
                if(this.fuel == 0){
                    this.f_urgent++;
                }
            }

            if (this.k_urgent > 5 || this.f_urgent > 5){
                if(this.k_urgent>5){
                this.k_urgent = 0
                this.builtpilgram = true;
                }
                else{
                this.f_urgent = 0
                this.builtpilgram = true;
                }
            }

            if (this.pilgrimsBuilt <= this.pilgrimmax || this.builtpilgram) {

                this.log('Building a pilgrim');
                this.pilgrimsBuilt++;
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                if(this.pilgrimsBuilt >= 2){
                this.prophetmax = 100
                }
                this.builtpilgram = false
                return this.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);

            }


            if (this.pilgrimsBuilt >= this.pilgrimmax && this.karbonite > 60 && this.fuel > 60){

                this.log('Building a prophet')
                this.crusaderBuilt++;

                if(this.crusaderBuilt >= 3){
                    this.pilgrimmax = 3
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                return this.buildUnit(SPECS.PROPHET, choice[0], choice[1]);
            }

            else {
                return this.log("Castle health: " + this.me.health);
            }
        }
    }
}

var robot = new MyRobot();
/*
                if(!this.check_pos){
                if(this.posx === this.layer && this.posy === this.layer){
                    this.layer += 1;
                    this.posx += 1;
                    this.posy += 1;
                    this.crusader_x = this.me.x + this.posx
                    this.crusader_y = this.me.y + this.posy
                    this.posy -= 2;
                    this.direction = 2
                }

                else if(this.posx === this.layer && this.posy === -(this.layer)){
                    this.crusader_x = this.me.x + this.posx
                    this.crusader_y = this.me.y + this.posy
                    this.posx -= 2;
                    this.direction = 3
                }
                else if(this.posx === -(this.layer) && this.posy === -(this.layer)){
                    this.crusader_x = this.me.x + this.posx
                    this.crusader_y = this.me.y + this.posy
                    this.posy += 2;
                    this.direction = 4
                }
                else if(this.posx === -(this.layer) && this.posy === this.layer){
                    this.crusader_x = this.me.x + this.posx
                    this.crusader_y = this.me.y + this.posy
                    this.posx += 2;
                    this.direction = 1
                }

                else if(this.direction === 2){
                    this.crusader_x = this.me.x + this.posx
                    this.crusader_y = this.me.y + this.posy
                    this.posy -= 2;
                }
                else if(this.direction === 3){
                    this.crusader_x = this.me.x + this.posx
                    this.crusader_y = this.me.y + this.posy
                    this.posx -= 2;
                }
                else if(this.direction === 4){
                    this.crusader_x = this.me.x + this.posx
                    this.crusader_y = this.me.y + this.posy
                    this.posy += 2;
                }
                else if(this.direction === 1){
                    this.crusader_x = this.me.x + this.posx
                    this.crusader_y = this.me.y + this.posy
                    this.posx += 2;
                }
                    */
