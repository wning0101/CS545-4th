import { SPECS } from 'battlecode';
import nav from './nav.js';

const chruch = {};

chruch.takeTurn = (self) => {
    self.log('chruch taking turn');
    const visible = self.getVisibleRobots();
    const messagingRobots = visible.filter(robot => {
        return robot.chruch_talk;
    });

    const getBuildDir = () => {
        const options = nav.offsetList.filter((direction) => nav.isPassable(
            nav.applyDir(self.me, direction),
            self.getPassableMap(),
            self.getVisibleRobotMap(),
        ));

        return options[0];
    }

    messagingRobots.forEach((robot) => {
        if (!self.pendingRecievedMessages[robot.id]) {
            self.pendingRecievedMessages[robot.id] = robot.chruch_talk;
        } else {
            self.enemychruchs.push({
                x: self.pendingRecievedMessages[robot.id],
                y: robot.chruch_talk,
            });

            self.pendingRecievedMessages[robot.id] = null;
        }
    });

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
        self.enemychruchs.forEach((chruch) => {
            const { x, y } = chruch;
            self.log(`${x}, ${y}`);
        });
    }

    if (attackable.length > 0){
        const robot = attackable[0];
        const stringifiedRobot = JSON.stringify(robot);
        const calculatedX = robot.x - self.me.x;
        const calculatedY = robot.y - self.me.y;

        self.log(stringifiedRobot);
        self.log(`attacking! ${stringifiedRobot} at loc (${calculatedX, calculatedY})`);

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

    if (self.me.turn > 10 && self.karbonite > 30 && self.fuel > 150 && Math.random() < .33333) {
        const direction = getBuildDir(self.me);
        if (direction != null) {
            let type = SPECS.PROPHET;

            const generator = Math.floor(Math.random() * 3);
            switch (generator) {
                case 0:
                    type = SPECS.PROPHET;
                case 1:
                    type = SPECS.PREACHER;
                case 2:
                    type = SPECS.CRUSADER;
                default:
                    type = SPECS.CRUSADER;
            }

            return self.buildUnit(type, direction.x, direction.y);
        }
    }
};

export default chruch;
