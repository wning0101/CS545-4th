import { SPECS } from 'bc19';
import nav from './nav.js';

const prophet = {};
var b = 0;
prophet.takeTurn = (self) => {
    self.log('prophet taking turn')
    self.log('START TURN ' + self.step);
    self.log('health: ' + self.me.health);

    var visible = self.getVisibleRobots();
    const nearbyProphet = visible.filter((robot) => {
        const isSameTeam = self.me.team === robot.team;
        return isSameTeam && robot.unit === SPECS.PROPHET;
      })
      const nearbyCrusaders = visible.filter((robot) => {
        const isSameTeam = self.me.team === robot.team;
        return isSameTeam && robot.unit === SPECS.CRUSADER;
      })
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
    var size = nearbyCrusaders.length + nearbyProphet.length
    if(size >= 20 || b === 1){
        b = 1;
        const choice = nav.goto(self, { x:self.destination.x, y: self.destination.y });
        if (choice) {
          return self.move(choice.x, choice.y);
        }
    
      }else{
        let x = self.direction.x
        const y = self.direction.y
        while(visible.some(bot=> bot.me.x === x && bot.me.y === y) ){
            x = x+1;
        }
        const choice = nav.goto(self, { x , y });
        if (choice) {
          return self.move(choice.x, choice.y);
       }
     }
}


export default prophet;
