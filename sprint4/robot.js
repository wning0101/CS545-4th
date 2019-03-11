import { BCAbstractRobot, SPECS } from 'bc19';
import robotTurn from './robotTurn';

class MyRobot extends BCAbstractRobot {

    constructor() {
            super();

            this.pendingRecievedMessages = {};
            this.enemyCastles = [];
            this.crusaderBuilt = 0;
            this.step = -1;
            this.pilgrimsBuilt = 0;
            this.pilgrimmax = 1;
            this.prophetBuilt = 0;
            this.preacherBuilt = 0;
            this.prophetmax = 10;
            this.troop = 0
            this.isHoReflect = true;
            this.mapLen = -1
            this.posx = 0
            this.posy = 0
            this.layer = 0
            this.direction = 1
            this.crusader_x = 0
            this.crusader_y = 0
            this.map_size = 0
            this.enemy = [0,0]
            this.route = 0
            this.initial = false
            this.pilgrim = false
            this.k_urgent = 0
            this.f_urgent = 0
        }
    turn() {
        robotTurn.takeTurn(this, SPECS);
    }
}

var robot = new MyRobot();
