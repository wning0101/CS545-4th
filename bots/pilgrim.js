import { SPECS } from 'battlecode';
import nav from './nav.js';

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
            self.destination = self.resourceDestination
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
}

export default pilgrim;
