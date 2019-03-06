import {BCAbstractRobot, SPECS} from 'battlecode';

import {Direction} from './Direction'
import {MapLocation} from './MapLocation'

var step = -1;

class MyRobot extends BCAbstractRobot {
    turn() {
        step++;
        const loc = new MapLocation(this.me.x, this.me.y)

        if (this.me.unit === SPECS.CRUSADER) {
            // this.log("Crusader health: " + this.me.health);
            const dir = Direction.random()
            const target = loc.addN(dir, 3)
            if (!dir.isCardinal()) {
                const target = loc.addN(dir, 2)
            }
            return this.move(target.x - loc.x, target.y - loc.y);
        }

        else if (this.me.unit === SPECS.CASTLE) {
            const dir = Direction.random()
            if (step % 10 === 0) {
                this.log("Building a crusader at " + (this.me.x+dir.dx) + ", " + (this.me.y+dir.dy));
                return this.buildUnit(SPECS.CRUSADER, dir.dx, dir.dy);
            } else {
                return // this.log("Castle health: " + this.me.health);
            }
        }

    }
}

