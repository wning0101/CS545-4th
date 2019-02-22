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

nav.toCompassDir = (dir) =>
{
    return nav.compass[dir.y + 1][dir.x + 1];
};

nav.toCoordinateDir = (dir) =>
{
    return nav.compassToCoordinate[dir];
};

nav.rotate = (dir, amount) =>
 {
    const compassDir = nav.toCompassDir(dir);
    const rotateCompassDir = nav.rotateArr[(nav.rotateArrInd[compassDir] + amount) % nav.rotateArr.length];  //BUG HERE: can't call length of rotateArrInd; used rotateArr instead
    return nav.toCoordinateDir(rotateCompassDir);
};

nav.reflect = (loc, mapLen, isHorizontalReflection) =>
{
    const hReflect =
    {
        x: loc.x,
        y: mapLen - loc.y - 1, // SEE BELOW
    };
    const vReflect =
    {
        x: mapLen - loc.x - 1, // 2 BUG(_S_) HERE!!! loc.y SHOULD BE loc.x; also must subtract 1!!!!!
        y: loc.y,
    };
    return isHorizontalReflection ? hReflect : vReflect;
};

nav.isHoReflect = (self) => {
    // self.log('starting reflect check');
    const mapLen = self.map.length
    var Plausible = true;
    for (let y = 0; y < mapLen && Plausible; y++) {
        for (let x = 0; x < mapLen && Plausible; x++) {
            Plausible = self.map[y][x] === self.map[mapLen - y - 1][x]
        }
    }
    return Plausible
}

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

    constructor()
    {
            super();

            this.pendingRecievedMessages = {};
            this.enemyCastles = [];
            this.crusaderBuilt = 0;
            this.step = -1;
            this.pilgrimsBuilt = 0;
            this.pilgrimmax = 10;
            this.prophetBuilt = 0;
            this.preacherBuilt = 0;
            this.crusadermax = 20;
            this.prophetmax = 20;
            this.isHoReflect = true;
            this.mapLen = -1;
            this.one = true;
            this.two = true;
    }

    turn()
    {
        this.step++;
        this.log('step number is')
        this.log(this.step);

        if (this.step === 0)
                {
                    this.isHoReflect = nav.isHoReflect(this);
                    this.mapLen = this.map.length;

                }

       if (this.karbonite >500)
        {
            this.prophetBuilt -= 1;
            this.preacherBuilt -= 1;
            this.crusaderBuilt -= 1;
        }

        if (this.me.unit === SPECS.preacher)
        {
            this.log('preacher taking turn')

                var visible = this.getVisibleRobots();

                // get attackable robots
                var attackable = visible.filter
                (  (r) =>
                    {
                    if (! this.isVisible(r))
                    {
                        return false;
                    }
                    const dist = (r.x-this.me.x)**2 + (r.y-this.me.y)**2;
                    if (r.team !== this.me.team
                        && SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0] <= dist
                        && dist <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1] )
                        {
                        return true;
                        }
                    return false;
                    }
                    );

                const attacking = visible.filter
                (r =>
                {
                    if (r.team === this.me.team)
                    {
                        return false;
                    }

                    if (nav.sqDist(r, this.me) <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0])
                     {
                        return true;
                     }
                     else
                     {
                        return false;
                     }
                }
                );

                if (attacking.length > 0)
                {
                    const attacker = attacking[0];
                    const dir = nav.getDir(this.me, attacker);
                    const otherDir =
                    {
                        x: -dir.x,
                        y: -dir.y,
                    };
                    return this.move(otherDir.x, otherDir.y);
                }

                if (attackable.length>0)
                {
                    // attack first robot
                    var r = attackable[0];
                    this.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                    return this.attack(r.x - this.me.x, r.y - this.me.y);
                }

                if (!this.destination)
                {
                    this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                }

                const choice = nav.goto(this, this.destination);
                return this.move(choice.x, choice.y);
}
        if (this.me.unit === SPECS.CRUSADER) {
            this.log('crusader taking turn')

                var visible = this.getVisibleRobots();

                // get attackable robots
                var attackable = visible.filter
                ((r) =>
                {
                    if (! this.isVisible(r))
                    {
                        return false;
                    }
                    const dist = (r.x-this.me.x)**2 + (r.y-this.me.y)**2;
                    if (r.team !== this.me.team
                        && SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0] <= dist
                        && dist <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1] )
                    {
                        return true;
                    }
                    return false;
                });

                const attacking = visible.filter
                (r =>
                {
                    if (r.team === this.me.team)
                    {
                        return false;
                    }

                    if (nav.sqDist(r, this.me) <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0])
                    {
                        return true;
                    }
                    else
                    {
                        return false;
                    }
                 }
                 );

                if (attacking.length > 0)
                 {
                    const attacker = attacking[0];
                    const dir = nav.getDir(this.me, attacker);
                    const otherDir =
                    {
                        x: -dir.x,
                        y: -dir.y,
                    };
                    return this.move(otherDir.x, otherDir.y);
                 }

                if (attackable.length>0)
                {
                    // attack first robot
                    var r = attackable[0];
                    this.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!');
                    return this.attack(r.x - this.me.x, r.y - this.me.y);
                }

                 if (!this.destination)
                 {
                    this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                 }

                const choice = nav.goto(this, this.destination);
                return this.move(choice.x, choice.y);
}
        if (this.me.unit === SPECS.PROPHET)
        {
                this.log('prophet taking turn')

                var visible = this.getVisibleRobots();

                // get attackable robots
                var attackable = visible.filter
                ((r) =>
                 {
                    if (! this.isVisible(r))
                    {
                        return false;
                    }
                    const dist = (r.x-this.me.x)**2 + (r.y-this.me.y)**2;
                    if (r.team !== this.me.team
                        && SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0] <= dist
                        && dist <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[1] )
                    {
                        return true;
                    }
                    return false;
                  }
                 );

                const attacking = visible.filter
                ( r =>
                {
                    if (r.team === this.me.team)
                    {
                        return false;
                    }

                    if (nav.sqDist(r, this.me) <= SPECS.UNITS[this.me.unit].ATTACK_RADIUS[0])
                     {
                        return true;
                     }
                     else
                     {
                        return false;
                     }
                 }
                 );

                if (attacking.length > 0)
                {
                    const attacker = attacking[0];
                    const dir = nav.getDir(this.me, attacker);
                    const otherDir =
                     {
                        x: -dir.x,
                        y: -dir.y,
                     };
                    return this.move(otherDir.x, otherDir.y);
                }


                if (attackable.length>0)
                {
                    // attack first robot
                    var r = attackable[0];
                    this.log('attacking!!!!!!!!!!!!!!!!!!');
                    return this.attack(r.x - this.me.x, r.y - this.me.y);
                }

                if (!this.destination)
                {
                    this.destination = nav.reflect(this.me, this.mapLen, this.isHoReflect);
                }

                const choice = nav.goto(this, this.destination);
                return this.move(choice.x, choice.y);

        }

        if (this.me.unit === SPECS.PILGRIM)
        {
                this.log('pilgrim taking turn')
                var visiblebots = this.getVisibleRobots()
                // On the first turn, find out our base

                if (!this.castle)
                {
                    this.castle = visiblebots
                        .filter
                        (robot =>
                        robot.team === this.me.team && robot.unit === SPECS.CASTLE)[0];
                }

                // if we don't have a destination, figure out what it is.
                if (!this.destination)
                {
                    // need to figure out if 1st or 2nd pilgrim: if 1st get karb, else fuel
                    if (visiblebots
                        .filter
                        (robot => robot.team === this.me.team && robot.unit === SPECS.PILGRIM).length > 1)
                        {
                        // can see another pilgrim on my team
                        this.resourceDestination = nav.getClosestRsrc(this.me, this.getFuelMap());
                        }
                        else
                        {
                        this.resourceDestination = nav.getClosestRsrc(this.me, this.getKarboniteMap());
                        }
                    this.destination = this.resourceDestination;
                }

                // If we're near our destination, do the thing
                if (this.me.karbonite === SPECS.UNITS[this.me.unit].KARBONITE_CAPACITY
                        || this.me.fuel === SPECS.UNITS[this.me.unit].FUEL_CAPACITY)
                {
                    this.destination = this.castle;
                    if (nav.sqDist(this.me, this.destination) <= 2)
                     {
                        this.destination = this.resourceDestination
                        this.log('pilgrim is taking resource back')
                        this.log(this.fuel)
                        this.log(this.karbonite)
                        return this.give
                        (
                            this.castle.x - this.me.x,
                            this.castle.y - this.me.y,
                            this.me.karbonite,
                            this.me.fuel
                        );
                    }
                }

                else

                {
                    if (nav.sqDist(this.me, this.destination) === 0)
                     {
                        this.log('pilgrim is mining')
                        this.log(this.fuel)
                        return this.mine();
                     }
                }
                // If we have nothing else to do, move to our destination.
                const choice = nav.goto(this, this.destination);

                return this.move(choice.x, choice.y);
        }

        else if (this.me.unit === SPECS.CASTLE)
        {
            if (this.pilgrimsBuilt < this.pilgrimmax || this.fuel < 200)
            {
                this.log('Building a pilgrim');
                this.log(this.fuel);
                this.pilgrimsBuilt++;
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
              // x=choice
                this.log('Bulding at this location');
                this.log(choice[0]);
                this.log('Building at this location');
                this.log(choice[1])
                return this.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);
            }
            if (this.pilgrimsBuilt >= 5 && this.karbonite > 100 && this.fuel > 100 && this.crusaderBuilt<10){
                this.log('Building a crusader');
                this.crusaderBuilt++;
                if(this.crusaderBuilt%3 < 1){
                    this.pilgrimmax++;
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                return this.buildUnit(SPECS.CRUSADER, choice[0], choice[1]);
            }

            if (this.crusaderBuilt >= 5 && this.karbonite > 200 && this.fuel > 200 && this.prophetBuilt<10){
                this.log('Building a prophet');
                this.prophetBuilt++;
                if(this.prophetBuilt%3 < 1){
                    this.pilgrimmax++;
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                this.log(choice)
                return this.buildUnit(SPECS.PROPHET, choice[0], choice[1]);
            }

            if (this.prophetBuilt >= 5 && this.karbonite > 300 && this.fuel > 700 && this.preacherBuilt<10){
                this.log('Building a preacher');
                this.preacherBuilt++;
                if(this.preacherBuilt%3 < 1){
                    this.pilgrimmax++;
                }
                const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
                const choice = choices[Math.floor(Math.random()*choices.length)]
                return this.buildUnit(SPECS.PREACHER, choice[0], choice[1]);
            }

            else {
                return this.log("Castle health: " + this.me.health);
            }
        }

    }
}

var robot = new MyRobot();