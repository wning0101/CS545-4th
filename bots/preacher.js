import {SPECS} from 'battlecode';
import nav from './nav.js';

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
  self.log(`attacking! ${stringified} at loc ${(locationX, locationY)}`);

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
    self.log('preacher taking turn')
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
    
}


export default preacher;
