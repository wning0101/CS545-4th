import { expect } from 'chai';
import 'mocha';
import { Direction } from './Direction';
describe('Direction', () => {
describe('isCardinal', () => {
    it('should be true for north', () => {
        expect(Direction.NORTH.isCardinal()).to.be.true;
    });
    it('should be false for north east', () => {
        expect(Direction.NORTH_EAST.isCardinal()).to.be.false;
    });
});
describe('opposite', () => {
    it('should return south for north', () => {
        expect(Direction.NORTH.opposite()).to.equal(Direction.SOUTH);
    });
    it('should return north east for south west', () => {
        expect(Direction.SOUTH_WEST.opposite()).to.equal(Direction.NORTH_EAST);
    });

});
describe('equals', () => {
    it('should return true for north.equals(north)', () => {
        expect(Direction.NORTH.equals(Direction.NORTH)).to.be.true;
    });

    it('should return true for north.equals(south)', () => {
        expect(Direction.NORTH.equals(Direction.SOUTH)).to.be.false;
    });
});
describe('rotateRight', () => {
    it('should return none for none', () => {
        expect(Direction.NONE.rotateRight()).to.equal(Direction.NONE);
    });
    it('should return north east for north', () => {
        expect(Direction.NORTH.rotateRight()).to.equal(Direction.NORTH_EAST);
    });
    it('should return east for north east ', () => {
        expect(Direction.NORTH_EAST.rotateRight()).to.equals(Direction.EAST);
    });
});
describe('rotate90Right', () => {
    it('should return none for none', () => {
        expect(Direction.NONE.rotate90Right()).to.equal(Direction.NONE);
    });
    it('should return east for north', () => {
        expect(Direction.NORTH.rotate90Right()).to.equal(Direction.EAST);
    });
    it('should return south east for north east ', () => {
        expect(Direction.NORTH_EAST.rotate90Right()).to.equal(Direction.SOUTH_EAST);
    });
});
describe('rotateLeft', () => {
    it('should return none for none', () => {
        expect(Direction.NONE.rotateLeft()).to.equal(Direction.NONE);
    });
    it('should return north for north east', () => {
        expect(Direction.NORTH_EAST.rotateLeft()).to.equal(Direction.NORTH);
    });
    it('should return north east for east ', () => {
        expect(Direction.EAST.rotateLeft()).to.equal(Direction.NORTH_EAST);
    });
});
describe('rotate90Left', () => {
    it('should return none for none', () => {
        expect(Direction.NONE.rotate90Left()).to.equal(Direction.NONE);
    });
    it('should return north for east', () => {
        expect(Direction.EAST.rotate90Left()).to.equal(Direction.NORTH);
    });
    it('should return north east for south east ', () => {
        expect(Direction.SOUTH_EAST.rotate90Left()).to.equal(Direction.NORTH_EAST);
    });
});
});