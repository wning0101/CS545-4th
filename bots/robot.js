import {BCAbstractRobot, SPECS} from 'bc19';
import nav from './nav.js';
import pilgrim from './pilgrim.js';
import crusader from './crusader.js';
import prophet from './prophet.js';
import preacher from './preacher.js';
import castle from './castle.js';

class MyRobot extends BCAbstractRobot {
    constructor() {
        super();
        this.pendingRecievedMessages = {};
        this.enemyCastles = [];
        this.myType = undefined;
        this.pilgrimsBuilt = 0;
        this.crusadersBuilt = 0;
        this.prophetBuilt = 0;
        this.preacherBuilt = 0;
        this.isHoReflect = true;
        this.mapLen = -1
    }

    turn() {
        if (this.me.turn === 1) {
            this.isHoReflect = nav.isHoReflect(this);
            this.mapLen = this.map.length;
        }
        if (this.myType === undefined){
            switch(this.me.unit) {
                case SPECS.PROPHET:
                    this.myType = prophet;
                    break;
                case SPECS.CASTLE:
                    this.myType = castle;
                    break;
                case SPECS.PILGRIM:
                    this.myType = pilgrim;
                    break;
                case SPECS.CRUSADER:
                    this.myType = crusader;
                    break;
                case SPECS.PREACHER:
                    this.myType = preacher;
                    break;
            }
        }

        return this.myType.takeTurn(this);
    }
}