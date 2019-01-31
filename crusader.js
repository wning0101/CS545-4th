
import {SPECS} from 'battlecode';
import nav from './nav.js';

const crusader = {};

crusader.getAttackableBots = () => {
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

crusader.getAttackingBots = () => {
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

crusader.moveAwayRandomly = (attackingBots) => {
  const randomBot = attackingBots[Math.floor(Math.random(attackingBots) * 100)];
  const { x, y } = nav.getDir(self.me, randomBot);

  return self.move((-1) * x, (-1) * y);
};

crusader.attackRandomly = (attackableRobots) => {
  const randomBot = attackableRobots[Math.floor(Math.random(attackingBots) * 100)];
  const stringified = JSON.stringify(randomBot);
  const locationX = randomBot.x - self.me.x;
  const locationY = randomBot.y - self.me.y;

  self.log(stringified);
  self.log(`attacking! ${stringified} at loc ${(locationX, locationY)}`);

  return self.attack(locationX, locationY);
};

crusader.isEnemyCastle = (robot) =>
  robot.team !== self.me.team &&
  robot.unit === SPECS.CASTLE &&
  self.enemyCastles.indexOf(robot.x * 64 + robot.y) < 0;

crusader.markEnemyCastle = (robot) => {
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
    var attackableBots = self.getAttackableBots();
    const attackingBots = self.getAttackingBots();

    if (attackingBots.length > 0) {
      self.moveAwayRandomly(attackingBots);
    }

    if (self.pendingMessage != null && self.pendingMessage.length > 0) {
      self.castleTalk(self.pendingMessage);
      self.pendingMessage = null;
    } else {
      visibleBots.forEach((robot) => {
        if (self.isEnemyCastle(robot)) {
          self.markEnemyCastle(robot);
        }
      });
    }

    self.log(attackableBots);

    if (attackableBots.length > 0) {
      return self.attackRandomly(attackableBots);
    }

    if (self.destination == null) {
        self.destination = nav.reflect(self.me, self.mapLen, self.isHoReflect);
    }

    const { x, y } = nav.goto(self, self.destination);
    return self.move(x, y);
}


export default crusader;

