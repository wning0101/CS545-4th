import { MapLocation } from './MapLocation';
import { expect } from 'chai';
import 'mocha';
import { Direction } from './Direction';
describe('MapLocation', () => {
describe('equals', () => {
    const start = new MapLocation(20, 20);
    it('should return true for the same location', () => {
        expect(start.equals(start)).to.be.true
    });
    it('should return false for not the same location', () => {
        expect(start.equals(start.add(Direction.NORTH))).to.be.false
    });
});

describe('add', () => {
    const start = new MapLocation(20, 20);
    it('adding north should go north', () => {
        expect(start.add(Direction.NORTH).equals(new MapLocation(start.x, start.y - 1))).to.be.true;
    });
    it('adding south_east should go south_east', () => {
        expect(start.add(Direction.SOUTH_EAST).equals(new MapLocation(start.x + 1, start.y + 1))).to.be.true;
    });
    it('adding none should not change', () => {
        expect(start.add(Direction.NONE).equals(start)).to.be.true;
    });
});

describe('addN', () => {
    const start = new MapLocation(20, 20);
    it('adding north 10  should go north 10', () => {
        expect(start.addN(Direction.NORTH, 10).equals(new MapLocation(start.x, start.y - 10))).to.be.true;
    });
    it('adding south_east 10 should go south_east 10', () => {
        expect(start.addN(Direction.SOUTH_EAST, 10).equals(new MapLocation(start.x + 10, start.y + 10))).to.be.true;
    });
    it('adding none 10 should not change', () => {
        expect(start.addN(Direction.NONE, 10).equals(start)).to.be.true;
    });
});


describe('distanceSqTo', () => {
    const start = new MapLocation(20, 20);
    it('should return zero for the same location', () => {
        expect(start.distanceSqTo(start)).to.equal(0);
    });
    it('should work for direct north', () => {
        expect(
            start.distanceSqTo(start.addN(Direction.NORTH, 10))
        ).to.equal(100);
    });
    it('should work for direct south', () => {
        expect(start.distanceSqTo(start.addN(Direction.SOUTH, 10))).to.equal(100);
    });
    it('should work for direct east', () => {
        expect(start.distanceSqTo(start.addN(Direction.EAST, 10))).to.equal(100);
    });
    it('should work for direct west', () => {
        expect(start.distanceSqTo(start.addN(Direction.WEST, 10))).to.equal(100);
    });
    it('should work for direct north west', () => {
        expect(start.distanceSqTo(start.addN(Direction.WEST, 10).addN(Direction.NORTH, 10))).to.equal(200);
    });
});

describe('isAdjacentTo', () => {
    const start = new MapLocation(20, 20);
    it('should be true for location to the north', () => {
        expect(start.add(Direction.NORTH).isAdjacentTo(start)).to.be.true;
    });
    it('should be true for location to the south_east', () => {
        expect(start.add(Direction.SOUTH_EAST).isAdjacentTo(start)).to.be.true;
    });
    it('should be false for same location', () => {
        expect(start.isAdjacentTo(start)).to.be.false;
    });
});

describe('isCardinallyAdjacentTo', () => {
    const start = new MapLocation(20, 20);
    it('should be true for location to the north', () => {
        expect(start.add(Direction.NORTH).isCardinallyAdjacentTo(start)).to.be.true;
    });
    it('should be false for location to the south_east', () => {
        expect(start.add(Direction.SOUTH_EAST).isCardinallyAdjacentTo(start)).to.be.false;
    });
    it('should be false for same location', () => {
        expect(start.isCardinallyAdjacentTo(start)).to.be.false;
    });
});




describe('directionTo', () => {
    const start = new MapLocation(10, 10);
    it('should return north correctly', () => {
        expect(start.directionTo(new MapLocation(10, 9)).equals(Direction.NORTH)).to.be.true;
    });
    it('should return south correctly', () => {
        expect(start.directionTo(new MapLocation(10, 11)).equals(Direction.SOUTH)).to.be.true;
    });
    it('should return east correctly', () => {
        expect(start.directionTo(new MapLocation(11, 10)).equals(Direction.EAST)).to.be.true;
    });
    it('should return west correctly', () => {
        expect(start.directionTo(new MapLocation(9, 10)).equals(Direction.WEST)).to.be.true;
    });
    it('should return far north correctly', () => {
        expect(start.directionTo(new MapLocation(9, 0)).equals(Direction.NORTH)).to.be.true;
    });
    it('should return far south correctly', () => {
        expect(start.directionTo(new MapLocation(9, 20)).equals(Direction.SOUTH)).to.be.true;
    });
    it('should return far east correctly', () => {
        expect(start.directionTo(new MapLocation(20, 9)).equals(Direction.EAST)).to.be.true;
    });
    it('should return far west correctly', () => {
        expect(start.directionTo(new MapLocation(0, 11)).equals(Direction.WEST)).to.be.true;
    });
    it('should return north east correctly', () => {
        expect(start.directionTo(new MapLocation(11, 9)).equals(Direction.NORTH_EAST)).to.be.true;
    });
    it('should return north west correctly', () => {
        expect(start.directionTo(new MapLocation(9, 9)).equals(Direction.NORTH_WEST)).to.be.true;
    });
    it('should return south east correctly', () => {
        expect(start.directionTo(new MapLocation(11, 11)).equals(Direction.SOUTH_EAST)).to.be.true;
    });
    it('should return south west correctly', () => {
        expect(start.directionTo(new MapLocation(9, 11)).equals(Direction.SOUTH_WEST)).to.be.true;
    });
});
});