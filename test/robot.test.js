import nav from "../sprint4/nav";
import robotTurn from "../sprint4/robotTurn";
import { expect } from "chai"; 

describe("Test cases for navigation", () => {
    it("compass should have all the directions", () => {
        expect(nav.compass).to.deep.equal([
            ['NW', 'N', 'NE'],
            ['W', 'C', 'E'],
            ['SW', 'S', 'SE'],
        ]);
    });

    it("toCompassDir should throw an error", () => {
        expect(nav.toCompassDir).to.throw("Dir is manadatory!");
    });
});

describe("Test cases for robotTurn", () => {
    it("should return true is 'initial' flag is false", () => {
        expect(robotTurn.shouldCreateInitialState({ initial: false })).to.equal(true);
    });

    it("should return false is 'initial' flag is true", () => {
        expect(robotTurn.shouldCreateInitialState({ initial: true })).to.equal(false);
    });

    it("should return true for 'isSmallRoute'", () => {
        expect(robotTurn.isSmallRoute({ route: 20 })).to.equal(true);
    });

    it("should return true for 'isSmallMap'", () => {
        expect(robotTurn.isSmallRoute({ route: 10 })).to.equal(true);
    });

    it("should return 2 for map size depending on route size", () => {
        expect(robotTurn.getMapSize({ route: 40 })).to.equal(2);
    });

    it("should return 1 for map size and length depending on route size", () => {
        expect(robotTurn.getMapSize({ route: 10, mapLen: 20 })).to.equal(1);
    });

    it("should return 1 for map size and length depending on route size", () => {
        expect(robotTurn.getMapSize({ route: 10, mapLen: 10 })).to.equal(0);
    });

    it("should get value as undefined for smaller route", () => {
        expect(robotTurn.getPilgrimMax({ route: 20 })).to.equal(undefined);
    });

    it("should get value as 1 for normal route", () => {
        expect(robotTurn.getPilgrimMax({ route: 30 })).to.equal(1);
    });

    it("should return true if unit is Preacher", () => {
        const preacher = 5;
        expect(robotTurn.isPreacher({ me: { unit: preacher } }, { PREACHER: preacher })).to.equal(true);
    });

    it("should return true if unit is Prophet", () => {
        const prophet = 5;
        expect(robotTurn.isProphet({ me: { unit: prophet } }, { PROPHET: prophet })).to.equal(true);
    });

    it("should return true if unit is Crusader", () => {
        const crusader = 5;
        expect(robotTurn.isCrusader({ me: { unit: crusader } }, { CRUSADER: crusader })).to.equal(true);
    });

    it("should return true if unit is Pilgrim", () => {
        const pilgrim = 5;
        expect(robotTurn.isPilgrim({ me: { unit: pilgrim } }, { PILGRIM: pilgrim })).to.equal(true);
    });
    it("should return an empty array for rady to attck units", () => {
        expect(robotTurn.getReadyToAttackBots({getVisibleRobots: () => null}, {}).length).to.equal(0);
    });

    it("should return 1 robot for ready to attack bot based on mock data", () => {
        const preacher = 1;
        const crusader = 2;
        const pilgrim = 3;
        expect(robotTurn.getReadyToAttackBots(
            {
                isVisible: () => true,
                getVisibleRobots: () => [
                    { team: 1, unit: preacher },
                    { team: 1, unit: pilgrim },
                    { team: 2, unit: crusader },
                ],
                me: {
                    team: 1,
                },
            },
            { CRUSADER: crusader, PREACHER: preacher },
        ).length).to.equal(1);
    });

    it("should return 1 robot for ready to attack bot based on mock data", () => {
        const preacher = 1;
        const crusader = 2;
        const pilgrim = 3;
        expect(robotTurn.getReadyToAttackBots(
            {
                isVisible: () => false,
                getVisibleRobots: () => [
                    { team: 1, unit: preacher },
                    { team: 1, unit: pilgrim },
                    { team: 2, unit: crusader },
                ],
                me: {
                    team: 1,
                },
            },
            { CRUSADER: crusader, PREACHER: preacher },
        ).length).to.equal(0);
    });

    
    it("should return 1 robot for ready to attack bot based on mock data", () => {
        const preacher = 1;
        const crusader = 2;
        const pilgrim = 3;
        expect(robotTurn.getReadyToAttackBots(
            {
                isVisible: () => true,
                getVisibleRobots: () => [
                    { team: 1, unit: preacher },
                    { team: 1, unit: pilgrim },
                    { team: 4, unit: pilgrim},
                ],
                me: {
                    team: 4,
                },
            },
            { CRUSADER: crusader, PREACHER: preacher },
        ).length).to.equal(0);
    });

    it("should return true if attack confirm is true and length is 0", () => {

        expect(robotTurn.isReadyToAttack({attack_confirm: true}, [])).to.equal(true);
    });

});

