import {SPECS} from 'battlecode';
import nav from './nav.js';

const crusader = {};
var a = 0;  //flag to check the number and allow to attack
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
  self.log(`attacking! ${stringified} at loc ${(locationX, locationY)}`);

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
    self.log('crusader taking turn')
    self.log('START TURN ' + self.step);
    self.log('health: ' + self.me.health);

    var visibleBots = self.getVisibleRobots();
    var attackableBots = crusader.getAttackableBots(self);
    const attackingBots = crusader.getAttackingBots(self);

    // get the number of crusader
    const nearbyCrusaders = visibleBots.filter((robot) => {
      const isSameTeam = self.me.team === robot.team;
      return isSameTeam && robot.unit === SPECS.CRUSADER;
    })
    const nearbyProphets = visibleBots.filter((robot) => {
      const isSameTeam = self.me.team === robot.team;
      return isSameTeam && robot.unit === SPECS.PROPHET;
    })
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
    var size = nearbyCrusaders.length + nearbyProphets.length
    if(size >= 10 || a === 1){
      a = 1;
      //go to the destination
      const choice = nav.goto(self, { x:self.destination.x, y: self.destination.y });
      if (choice) {
        return self.move(choice.x, choice.y);
      }
  
    }else{
      //got to the location outside the enemy castle range
      const choice =  nav.goto(self, { x:self.destination.x - 9, y: self.destination.y - 9 });
      if (choice) {
        return self.move(choice.x, choice.y);
     }
   }

}
export default crusader;
