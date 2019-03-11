import nav from './nav';

const robotTurn = {};

robotTurn.shouldCreateInitialState = (robotInstance) => !robotInstance.initial;
robotTurn.isSmallRoute = (robotInstance) => robotInstance.route <= 25;
robotTurn.isSmallMap = (robotInstance) => robotInstance.mapLen < 15;
robotTurn.getMapSize = (robotInstance) => robotTurn.isSmallRoute(robotInstance)
    ? robotTurn.isSmallMap(robotInstance) ? 0 : 1
    : 2;
robotTurn.getPilgrimMax = (robotInstance) => robotTurn.isSmallRoute(robotInstance) ? undefined : 1;
robotTurn.isPreacher = (robotInstance, SPECS = {}) => robotInstance.me.unit === SPECS.PREACHER;
robotTurn.isProphet = (robotInstance, SPECS = {}) => robotInstance.me.unit === SPECS.PROPHET;
robotTurn.isCrusader = (robotInstance, SPECS = {}) => robotInstance.me.unit === SPECS.CRUSADER;
robotTurn.isPilgrim = (robotInstance, SPECS = {}) => robotInstance.me.unit === SPECS.PILGRIM;

robotTurn.createInitialState = (robotInstance) => ({
    isHoReflect: nav.isHoReflect(robotInstance),
    mapLen: robotInstance.map.length,
    enemy: nav.reflect(robotInstance.me, robotInstance.mapLen, robotInstance.isHoReflect),
    route: Math.abs(robotInstance.me.x - robotInstance.enemy[0]) + Math.abs(robotInstance.me.y - robotInstance.enemy[1]),
    initial: true,
    map_size: robotTurn.getPilgrimMax(),
    pilgrimmax: robotTurn.getPilgrimMax(),
});

robotTurn.getReadyToAttackBots = (robotInstance, specs) => 
    (robotInstance.getVisibleRobots() || []).filter((a) => {
        if (! robotInstance.isVisible(a)){
            return false;
        }
        if (a.team === robotInstance.me.team && a.unit === specs.CRUSADER){
            return true
        }
        if (a.team === robotInstance.me.team && a.unit === specs.PREACHER){
            return true
        }
        return false;
    });

robotTurn.isReadyToAttack = (robotInstance, readytoattack) => readytoattack.length > 2 || robotInstance.attack_confirm

robotTurn.takeTurn = (robotInstance) => {
    robotInstance.step++;

    // robotInstance statement is creating the initial state, including which type of symmetric and what's the size of the map
    robotInstance = {
        ...robotInstance,
        ...robotTurn.createInitialState(),
    };

    if (robotTurn.isPreacher(robotInstance, SPECS)) {
        robotInstance.log('preacher taking turn')

            var visible = robotInstance.getVisibleRobots();

            // collecting nearby preacher
            var readytoattack = robotTurn.getReadyToAttackBots(robotInstance, specs);

            var attackable = visible.filter((r) => {
                if (! robotInstance.isVisible(r)){
                    return false;
                }
                const dist = (r.x-robotInstance.me.x)**2 + (r.y-robotInstance.me.y)**2;
                if (r.team !== robotInstance.me.team
                    && SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[0] <= dist
                    && dist <= SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[1] ){
                    return true;
                }
                return false;
            });

            const attacking = visible.filter(r => {
                if (r.team === robotInstance.me.team) {
                    return false;
                }

                if (nav.sqDist(r, robotInstance.me) <= SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[0]) {
                    return true;
                } else {
                    return false;
                }
            });

            if (attacking.length > 0) {
                const attacker = attacking[0];
                const dir = nav.getDir(robotInstance.me, attacker);
                const otherDir = {
                    x: -dir.x,
                    y: -dir.y,
                };
                return robotInstance.move(otherDir.x, otherDir.y);
            }

            if (attackable.length>0){
                // attack first robot
                var r = attackable[0];
                robotInstance.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                return robotInstance.attack(r.x - robotInstance.me.x, r.y - robotInstance.me.y);
            }

            if (!robotInstance.destination) {
                robotInstance.destination = nav.reflect(robotInstance.me, robotInstance.mapLen, robotInstance.isHoReflect);
            }

            if (!robotInstance.turnaround) {
                robotInstance.turnaround = 1
            }

            if (robotInstance.me.x <= robotInstance.destination.x+1 && robotInstance.me.x >= robotInstance.destination.x-1){
                if(robotInstance.me.y <= robotInstance.destination.y+1 && robotInstance.me.y >= robotInstance.destination.y-1){
                    if(robotInstance.turnaround === 1){
                        robotInstance.destination = nav.reflect(robotInstance.me, robotInstance.mapLen, !robotInstance.isHoReflect);
                        robotInstance.turnaround === 2;
                    }
                    if(robotInstance.turnaround === 2){
                        robotInstance.destination = nav.reflect(robotInstance.me, robotInstance.mapLen, robotInstance.isHoReflect);
                        robotInstance.turnaround === 1
                    }
                }
            }

            if (robotInstance.map_size < 2){
                const choice = nav.goto(robotInstance, robotInstance.destination);
                return robotInstance.move(choice.x, choice.y);
            }

            //if there are more than 2 preacher or prophet, then go atttacking
            //unit test: if they go attacking after they have enough company

            if(robotTurn.isReadyToAttack(robotInstance, readytoattack)){
                robotInstance.attack_confirm = true;
                const choice = nav.goto(robotInstance, robotInstance.destination);
                return robotInstance.move(choice.x, choice.y);
            }
            else{
                if(robotInstance.isHoReflect){
                    if(robotInstance.destination.y > robotInstance.mapLen/2 ){
                        var choice1 = {x: robotInstance.destination.x, y: robotInstance.mapLen/2 -5,}
                    }
                    else{
                        var choice1 = {x: robotInstance.destination.x, y: robotInstance.mapLen/2 +5,}
                    }
                    const choices1 = nav.goto(robotInstance, choice1);
                    return robotInstance.move(choices1.x, choices1.y);
                }
                else{
                    if(robotInstance.destination.x > robotInstance.mapLen/2 ){
                        var choice2 = {x: robotInstance.mapLen/2 +5, y: robotInstance.destination.y,}
                    }
                    else{
                        var choice2 = {x: robotInstance.mapLen/2 -5, y: robotInstance.destination.y,}
                    }
                    const choices2 = nav.goto(robotInstance, choice2);
                    return robotInstance.move(choices2.x, choices2.y);
                }
            }
            //return robotInstance.move(choice.x, choice.y);
    }
    if (robotTurn.isProphet()) {
        robotInstance.log('prophet taking turn')

            var visible = robotInstance.getVisibleRobots();

            // get nearby preacher
            var readytoattack = visible.filter((a) => {
                if (! robotInstance.isVisible(a)){
                    return false;
                }
                if (a.team === robotInstance.me.team && a.unit === SPECS.PROPHET){
                    return true
                }
                if (a.team === robotInstance.me.team && a.unit === SPECS.PREACHER){
                    return true
                }
                return false;
            });

            var attackable = visible.filter((r) => {
                if (! robotInstance.isVisible(r)){
                    return false;
                }
                const dist = (r.x-robotInstance.me.x)**2 + (r.y-robotInstance.me.y)**2;
                if (r.team !== robotInstance.me.team
                    && SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[0] <= dist
                    && dist <= SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[1] ){
                    return true;
                }
                return false;
            });

            const attacking = visible.filter(r => {
                if (r.team === robotInstance.me.team) {
                    return false;
                }

                if (nav.sqDist(r, robotInstance.me) <= SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[0]) {
                    return true;
                } else {
                    return false;
                }
            });

            if (attacking.length > 0) {
                const attacker = attacking[0];
                const dir = nav.getDir(robotInstance.me, attacker);
                const otherDir = {
                    x: -dir.x,
                    y: -dir.y,
                };
                return robotInstance.move(otherDir.x, otherDir.y);
            }

            if (attackable.length>0){
                // attack first robot
                var r = attackable[0];
                robotInstance.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                return robotInstance.attack(r.x - robotInstance.me.x, r.y - robotInstance.me.y);
            }

            if (!robotInstance.destination) {
                robotInstance.destination = nav.reflect(robotInstance.me, robotInstance.mapLen, robotInstance.isHoReflect);
            }

            if (robotInstance.map_size < 2){
                const choice = nav.goto(robotInstance, robotInstance.destination);
                return robotInstance.move(choice.x, choice.y);
            }

            //if there are more than 2 preacher or prophet, then go atttacking
            //unit test: if they go attacking after they have enough company
            if(readytoattack.length > 2 || robotInstance.attack_confirm){
                robotInstance.attack_confirm = true;
                const choice = nav.goto(robotInstance, robotInstance.destination);
                return robotInstance.move(choice.x, choice.y);
            }
            else{
                if(robotInstance.isHoReflect){
                    if(robotInstance.destination.y > robotInstance.mapLen/2 ){
                        var choice1 = {x: robotInstance.destination.x, y: robotInstance.mapLen/2 -5,}
                    }
                    else{
                        var choice1 = {x: robotInstance.destination.x, y: robotInstance.mapLen/2 +5,}
                    }
                    const choices1 = nav.goto(robotInstance, choice1);
                    return robotInstance.move(choices1.x, choices1.y);
                }
                else{
                    if(robotInstance.destination.x > robotInstance.mapLen/2 ){
                        var choice2 = {x: robotInstance.mapLen/2 +5, y: robotInstance.destination.y,}
                    }
                    else{
                        var choice2 = {x: robotInstance.mapLen/2 -5, y: robotInstance.destination.y,}
                    }
                    const choices2 = nav.goto(robotInstance, choice2);
                    return robotInstance.move(choices2.x, choices2.y);
                }
            }
            //return robotInstance.move(choice.x, choice.y);
    }
    if (robotTurn.isCrusader(robotInstance, SPECS)) {
        robotInstance.log('crusader taking turn')

            var visible = robotInstance.getVisibleRobots();

            // get nearby preacher
            var readytoattack = visible.filter((a) => {
                if (! robotInstance.isVisible(a)){
                    return false;
                }
                if (a.team === robotInstance.me.team && a.unit === SPECS.CRUSADER){
                    return true
                }
                if (a.team === robotInstance.me.team && a.unit === SPECS.PROPHET){
                    return true
                }
                if (a.team === robotInstance.me.team && a.unit === SPECS.PREACHER){
                    return true
                }
                return false;
            });

            var attackable = visible.filter((r) => {
                if (! robotInstance.isVisible(r)){
                    return false;
                }
                const dist = (r.x-robotInstance.me.x)**2 + (r.y-robotInstance.me.y)**2;
                if (r.team !== robotInstance.me.team
                    && SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[0] <= dist
                    && dist <= SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[1] ){
                    return true;
                }
                return false;
            });

            const attacking = visible.filter(r => {
                if (r.team === robotInstance.me.team) {
                    return false;
                }

                if (nav.sqDist(r, robotInstance.me) <= SPECS.UNITS[robotInstance.me.unit].ATTACK_RADIUS[0]) {
                    return true;
                } else {
                    return false;
                }
            });

            if (attacking.length > 0) {
                const attacker = attacking[0];
                const dir = nav.getDir(robotInstance.me, attacker);
                const otherDir = {
                    x: -dir.x,
                    y: -dir.y,
                };
                return robotInstance.move(otherDir.x, otherDir.y);
            }

            if (attackable.length>0){
                // attack first robot
                var r = attackable[0];
                robotInstance.log('attacking!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!!');
                return robotInstance.attack(r.x - robotInstance.me.x, r.y - robotInstance.me.y);
            }

            if (!robotInstance.destination) {
                robotInstance.destination = nav.reflect(robotInstance.me, robotInstance.mapLen, robotInstance.isHoReflect);
            }
            if (!robotInstance.turnaround) {
                robotInstance.turnaround = 1
            }

            if (robotInstance.me.x <= robotInstance.destination.x+1 && robotInstance.me.x >= robotInstance.destination.x-1){
                if(robotInstance.me.y <= robotInstance.destination.y+1 && robotInstance.me.y >= robotInstance.destination.y-1){
                    if(robotInstance.turnaround === 1){
                        robotInstance.destination = nav.reflect(robotInstance.me, robotInstance.mapLen, !robotInstance.isHoReflect);
                        robotInstance.turnaround === 2;
                    }
                    if(robotInstance.turnaround === 2){
                        robotInstance.destination = nav.reflect(robotInstance.me, robotInstance.mapLen, robotInstance.isHoReflect);
                        robotInstance.turnaround === 1
                    }
                }
            }


            //if there are more than 2 preacher or prophet or crusader, then go atttacking
            //unit test: if they go attacking after they have enough company
            if(readytoattack.length > 2 || robotInstance.attack_confirm){
                robotInstance.attack_confirm = true;
                const choice = nav.goto(robotInstance, robotInstance.destination);
                return robotInstance.move(choice.x, choice.y);
            }
            else{
                if(robotInstance.isHoReflect){
                    if(robotInstance.destination.y > robotInstance.mapLen/2 ){
                        var choice1 = {x: robotInstance.destination.x, y: robotInstance.mapLen/2,}
                    }
                    else{
                        var choice1 = {x: robotInstance.destination.x, y: robotInstance.mapLen/2,}
                    }
                    const choices1 = nav.goto(robotInstance, choice1);
                    return robotInstance.move(choices1.x, choices1.y);
                }
                else{
                    if(robotInstance.destination.x > robotInstance.mapLen/2 ){
                        var choice2 = {x: robotInstance.mapLen/2, y: robotInstance.destination.y,}
                    }
                    else{
                        var choice2 = {x: robotInstance.mapLen/2, y: robotInstance.destination.y,}
                    }
                    const choices2 = nav.goto(robotInstance, choice2);
                    return robotInstance.move(choices2.x, choices2.y);
                }
            }
            //return robotInstance.move(choice.x, choice.y);
    }


    if (robotTurn.isPilgrim(robotInstance, SPECS)){
        robotInstance.log('pilgrim taking turn')
            var visiblebots = robotInstance.getVisibleRobots()

            var readytoexplore = visiblebots.filter(a => {
                if (! robotInstance.isVisible(a)){
                    return false;
                }
                if (a.team === robotInstance.me.team && a.unit === SPECS.PILGRIM){
                    return true
                }
                return false;
            });
            if(!robotInstance.first_birth){
                robotInstance.first_birth = true
            //if there are more than 3 pilgrims round, then go exploring
            //unit test: if they go exploring after it have enough pilgrims in ths base
                if (readytoexplore.length > 3){
                    robotInstance.go_explore = true
                }
                else{
                    robotInstance.go_explore = false
                }
            }

            if (robotInstance.go_explore){

                if (!robotInstance.explore_destination){
                    robotInstance.explore_destination = nav.reflect(robotInstance.me, robotInstance.mapLen, !robotInstance.isHoReflect);
                }
                if (readytoexplore.length < 1){
                        robotInstance.new_explore_destination = nav.getClosestRsrc(robotInstance.me, robotInstance.getKarboniteMap());
                        robotInstance.explore_destination = robotInstance.new_explore_destination[0];
                        robotInstance.buildchurch = true;
                        robotInstance.done = false;
                }


                const choice_t = nav.goto(robotInstance, robotInstance.explore_destination);
                if (robotInstance.buildchurch && !robotInstance.done){
                    if (robotInstance.me.x <= robotInstance.explore_destination.x+5 && robotInstance.me.x >= robotInstance.explore_destination.x-5){
                        if(robotInstance.me.y <= robotInstance.explore_destination.y+5 && robotInstance.me.y >= robotInstance.explore_destination.y-5){
                            robotInstance.done = true;
                            return robotInstance.buildUnit(SPECS.CHURCH, 1, 1)
                        }
                    }
                }

                return robotInstance.move(choice_t.x, choice_t.y)
            }
            // On the first turn, find out our base
            if (!robotInstance.castle) {
                robotInstance.castle = visiblebots
                    .filter(robot => {
                    if (robot.team === robotInstance.me.team && robot.unit === SPECS.CASTLE){
                        return true
                    }
                    if (robot.team === robotInstance.me.team && robot.unit === SPECS.CHURCH){
                        return true
                    }
                    }
                    )[0];

            }

            // if we don't have a destination, figure out what it is.
            if (!robotInstance.destination) {
                // need to figure out if 1st or 2nd pilgrim: if 1st get karb, else fuel

                if (visiblebots
                    .filter(robot => robot.team === robotInstance.me.team && robot.unit === SPECS.PILGRIM).length%2 === 1){
                    // can see another pilgrim on my team
                    robotInstance.resourceDestination = nav.getClosestRsrc(robotInstance.me, robotInstance.getFuelMap());
                } else {
                    robotInstance.resourceDestination = nav.getClosestRsrc(robotInstance.me, robotInstance.getKarboniteMap());
                }



                robotInstance.destination = robotInstance.resourceDestination[0];
            }

            // If we're near our destination, do the thing
            if (robotInstance.me.karbonite === SPECS.UNITS[robotInstance.me.unit].KARBONITE_CAPACITY
                    || robotInstance.me.fuel === SPECS.UNITS[robotInstance.me.unit].FUEL_CAPACITY) {
                robotInstance.destination = robotInstance.castle;
                if (nav.sqDist(robotInstance.me, robotInstance.destination) <= 2) {
                    robotInstance.destination = robotInstance.resourceDestination[0]
                    robotInstance.log('pilgrim is taking resource back')
                    return robotInstance.give(
                        robotInstance.castle.x - robotInstance.me.x,
                        robotInstance.castle.y - robotInstance.me.y,
                        robotInstance.me.karbonite,
                        robotInstance.me.fuel);
                }
            } else {
                if (nav.sqDist(robotInstance.me, robotInstance.destination) === 0) {
                    robotInstance.log('pilgrim is mining')
                    return robotInstance.mine();
                }
            }
            // If we have nothing else to do, move to our destination.
            const choice = nav.goto(robotInstance, robotInstance.destination);

            return robotInstance.move(choice.x, choice.y);
    }

    else if (robotInstance.me.unit === SPECS.CASTLE) {
        var visible = robotInstance.getVisibleRobots();

                        // get nearby preacher
        var surroundpilgrom = visible.filter((a) => {
            robotInstance.castle_number = 0
            if (! robotInstance.isVisible(a)){
                return false;
            }
            if (a.team === robotInstance.me.team && a.unit === SPECS.PILGRIM){
                return true
            }
            if (a.team === robotInstance.me.team && a.unit === SPECS.CASTLE){
                robotInstance.castle_number += 1
            }
            return false;
            });

        //if there are less than 2 pilgrim around the castle, then build on more pilgrim
        //unit test: if the castle builds another pilgrim if there is not enough pilgrim around
        if (surroundpilgrom.length < 2 + 2*robotInstance.castle_number){
            robotInstance.builtpilgram = true;
        }

        if (robotInstance.karbonite === 0 || robotInstance.fuel === 0){
            if(robotInstance.karbonite === 0){
                robotInstance.k_urgent++;
            }
            if(robotInstance.fuel == 0){
                robotInstance.f_urgent++;
            }
        }

        if (robotInstance.k_urgent > 5 || robotInstance.f_urgent > 5){
            if(robotInstance.k_urgent>5){
            robotInstance.k_urgent = 0
            robotInstance.builtpilgram = true;
            }
            else{
            robotInstance.f_urgent = 0
            robotInstance.builtpilgram = true;
            }
        }

        if (robotInstance.pilgrimsBuilt <= robotInstance.pilgrimmax || robotInstance.builtpilgram) {

            robotInstance.log('Building a pilgrim');
            robotInstance.pilgrimsBuilt++;
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            if(robotInstance.pilgrimsBuilt >= 2){
            robotInstance.prophetmax = 100
            }
            robotInstance.builtpilgram = false
            return robotInstance.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);

        }


        if (robotInstance.pilgrimsBuilt >= robotInstance.pilgrimmax && robotInstance.map_size === 2 && robotInstance.karbonite>100){


            robotInstance.log('Building a crusader')
            robotInstance.crusaderBuilt++;

            if(robotInstance.crusaderBuilt >= 3){
                robotInstance.pilgrimmax = 3
            }
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return robotInstance.buildUnit(SPECS.CRUSADER, choice[0], choice[1]);
        }

        if (robotInstance.pilgrimsBuilt >= robotInstance.pilgrimmax && robotInstance.map_size === 0 && robotInstance.karbonite>100){
            robotInstance.log('Building a preacher');
            robotInstance.prophetBuilt++;
            if(robotInstance.prophetBuilt >= 3){
                robotInstance.pilgrimmax = 3
            }
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return robotInstance.buildUnit(SPECS.PREACHER, choice[0], choice[1]);
        }


        if (robotInstance.pilgrimsBuilt >= robotInstance.pilgrimmax && robotInstance.map_size === 1 && robotInstance.karbonite>100){
            robotInstance.log('Building a crusader');
            robotInstance.crusaderBuilt++;
            if(robotInstance.crusaderBuilt >= 3){
                robotInstance.pilgrimmax = 3
            }
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return robotInstance.buildUnit(SPECS.CRUSADER, choice[0], choice[1]);
        }


        else {
            return robotInstance.log("Castle health: " + robotInstance.me.health);
        }
    }
    else if (robotInstance.me.unit === SPECS.CHURCH) {
        var visible = robotInstance.getVisibleRobots();

                        // get nearby preacher
        var surroundpilgrom = visible.filter((a) => {
            robotInstance.castle_number = 0
            if (! robotInstance.isVisible(a)){
                return false;
            }
            if (a.team === robotInstance.me.team && a.unit === SPECS.PILGRIM){
                return true
            }
            if (a.team === robotInstance.me.team && a.unit === SPECS.CASTLE){
                robotInstance.castle_number += 1
            }
            return false;
            });
        if (surroundpilgrom.length < 2 + 2*robotInstance.castle_number){
            robotInstance.builtpilgram = true;
        }

        if (robotInstance.karbonite === 0 || robotInstance.fuel === 0){
            if(robotInstance.karbonite === 0){
                robotInstance.k_urgent++;
            }
            if(robotInstance.fuel == 0){
                robotInstance.f_urgent++;
            }
        }

        if (robotInstance.k_urgent > 5 || robotInstance.f_urgent > 5){
            if(robotInstance.k_urgent>5){
            robotInstance.k_urgent = 0
            robotInstance.builtpilgram = true;
            }
            else{
            robotInstance.f_urgent = 0
            robotInstance.builtpilgram = true;
            }
        }

        if (robotInstance.pilgrimsBuilt <= robotInstance.pilgrimmax || robotInstance.builtpilgram) {

            robotInstance.log('Building a pilgrim');
            robotInstance.pilgrimsBuilt++;
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            if(robotInstance.pilgrimsBuilt >= 2){
            robotInstance.prophetmax = 100
            }
            robotInstance.builtpilgram = false
            return robotInstance.buildUnit(SPECS.PILGRIM, choice[0], choice[1]);

        }


        if (robotInstance.pilgrimsBuilt >= robotInstance.pilgrimmax && robotInstance.map_size === 2){

            robotInstance.log('Building a crusader')
            robotInstance.crusaderBuilt++;

            if(robotInstance.crusaderBuilt >= 3){
                robotInstance.pilgrimmax = 3
            }
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return robotInstance.buildUnit(SPECS.CRUSADER, choice[0], choice[1]);
        }

        if (robotInstance.pilgrimsBuilt >= robotInstance.pilgrimmax && robotInstance.map_size === 0){
            robotInstance.log('Building a preacher');
            robotInstance.prophetBuilt++;
            if(robotInstance.prophetBuilt >= 3){
                robotInstance.pilgrimmax = 3
            }
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return robotInstance.buildUnit(SPECS.PREACHER, choice[0], choice[1]);
        }


        if (robotInstance.pilgrimsBuilt >= robotInstance.pilgrimmax && robotInstance.map_size === 1){
            robotInstance.log('Building a crusader');
            robotInstance.crusaderBuilt++;
            if(robotInstance.crusaderBuilt >= 3){
                robotInstance.pilgrimmax = 3
            }
            const choices = [[0,-1], [1, -1], [1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1]];
            const choice = choices[Math.floor(Math.random()*choices.length)]
            return robotInstance.buildUnit(SPECS.CRUSADER, choice[0], choice[1]);
        }


        else {
            return robotInstance.log("Castle health: " + robotInstance.me.health);
        }
    }
}

export default robotTurn;
