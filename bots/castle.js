import { SPECS } from 'bc19';
import nav from './nav.js';

const castle = {};
let x = -2;
let y = -2;
castle.getMessagingRobots = (bots) => bots.filter(robot => {
    return robot.castle_talk != null;
});
castle.takeTurn = (self) => {
    self.log('castle taking turn');
   
    const visible = self.getVisibleRobots();
    const messagingRobots = this.getMessagingRobots(visible)

    const getBuildDir = () => {
        const options = nav.offsetList.filter((direction) => nav.isPassable(
            nav.applyDir(self.me, direction),
            self.getPassableMap(),
            self.getVisibleRobotMap(),
        ));

        return options[0];
    }

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
                let type = SPECS.PILGRIM
                if(self.crusadersBuilt % 5 !== 0 || self.crusadersBuilt === 0){
                    type = SPECS.CRUSADER;
                    self.crusadersBuilt += 1;   
                }else if(self.prophetBuilt % 25!== 0 || self.prophetBuilt === 0) {
                    type = SPECS.PROPHET
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

export default castle;
