export class Direction {
    constructor(dx, dy) {
        this.dx = dx
        this.dy = dy
        this.ch = 'u';
        if (this.dx === -1) {
            if (this.dy == -1) {
                this.ch = 'nw';
            }
            else if (this.dy === 0) {
                this.ch = 'w';
            }
            else if (this.dy === 1) {
                this.ch = 'sw';
            }
        }
        else if (this.dx === 0) {
            if (this.dy == -1) {
                this.ch = 'n';
            }
            else if (this.dy === 0) {
                this.ch = 'o';
            }
            else if (this.dy === 1) {
                this.ch = 's';
            }
        }
        else if (this.dx === 1) {
            if (this.dy == -1) {
                this.ch = 'ne';
            }
            else if (this.dy === 0) {
                this.ch = 'e';
            }
            else if (this.dy === 1) {
                this.ch = 'se';
            }
        }
    }
    static random() {
        return Direction.ALL_DIRECTIONS[Math.floor(Math.random() * Direction.ALL_DIRECTIONS.length)];
    }
    toString() {
        return this.ch;
    }
    isCardinal() {
        // TODO: Implement me!  
        return false;
    }
    equals(other) {
        return this.ch === other.ch
    }
    opposite() {
        switch (this.ch) {
            case Direction.NORTH.ch:
                return Direction.SOUTH;
            case Direction.NORTH_EAST.ch:
                return Direction.SOUTH_WEST;
            case Direction.EAST.ch:
                return Direction.WEST;
            case Direction.SOUTH_EAST.ch:
                return Direction.NORTH_WEST;
            case Direction.SOUTH.ch:
                return Direction.NORTH;
            case Direction.SOUTH_WEST.ch:
                return Direction.NORTH_EAST;
            case Direction.WEST.ch:
                return Direction.EAST;
            case Direction.NORTH_WEST.ch:
                return Direction.SOUTH_EAST;
            case Direction.NONE.ch:
                return Direction.NONE;
            default:
                return Direction.NONE;
        }
    }
    rotateRight() {
        switch (this.ch) {
            case Direction.NORTH.ch:
                return Direction.NORTH_EAST;
            case Direction.NORTH_EAST.ch:
                return Direction.EAST;
            case Direction.EAST.ch:
                return Direction.SOUTH_EAST;
            case Direction.SOUTH_EAST.ch:
                return Direction.SOUTH;
            case Direction.SOUTH.ch:
                return Direction.SOUTH_WEST;
            case Direction.SOUTH_WEST.ch:
                return Direction.WEST;
            case Direction.WEST.ch:
                return Direction.NORTH_WEST;
            case Direction.NORTH_WEST.ch:
                return Direction.NORTH;
            case Direction.NONE.ch:
                return Direction.NONE;
            default:
                return Direction.NONE;
        }
    }
    rotate90Right() {
        switch (this.ch) {
            case Direction.NORTH.ch:
                return Direction.EAST;
            case Direction.NORTH_EAST.ch:
                return Direction.SOUTH_EAST;
            case Direction.EAST.ch:
                return Direction.SOUTH;
            case Direction.SOUTH_EAST.ch:
                return Direction.SOUTH_WEST;
            case Direction.SOUTH.ch:
                return Direction.WEST;
            case Direction.SOUTH_WEST.ch:
                return Direction.NORTH_WEST;
            case Direction.WEST.ch:
                return Direction.NORTH;
            case Direction.NORTH_WEST.ch:
                return Direction.NORTH_EAST;
            case Direction.NONE.ch:
                return Direction.NONE;
            default:
                return Direction.NONE;
        }
    }
    rotateLeft() {
        switch (this.ch) {
            case Direction.NORTH.ch:
                return Direction.NORTH_WEST;
            case Direction.NORTH_WEST.ch:
                return Direction.WEST;
            case Direction.WEST.ch:
                return Direction.SOUTH_WEST;
            case Direction.SOUTH_WEST.ch:
                return Direction.SOUTH;
            case Direction.SOUTH.ch:
                return Direction.SOUTH_EAST;
            case Direction.SOUTH_EAST.ch:
                return Direction.EAST;
            case Direction.EAST.ch:
                return Direction.NORTH_EAST;
            case Direction.NORTH_EAST.ch:
                return Direction.NORTH;
            case Direction.NONE.ch:
                return Direction.NONE;
            default:
                return Direction.NONE;
        }
    }
    rotate90Left() {
        switch (this.ch) {
            case Direction.NORTH.ch:
                return Direction.WEST;
            case Direction.NORTH_WEST.ch:
                return Direction.SOUTH_WEST;
            case Direction.WEST.ch:
                return Direction.SOUTH;
            case Direction.SOUTH_WEST.ch:
                return Direction.SOUTH_EAST;
            case Direction.SOUTH.ch:
                return Direction.EAST;
            case Direction.SOUTH_EAST.ch:
                return Direction.NORTH_EAST;
            case Direction.EAST.ch:
                return Direction.NORTH;
            case Direction.NORTH_EAST.ch:
                return Direction.NORTH_WEST;
            case Direction.NONE.ch:
                return Direction.NONE;
            default:
                return Direction.NONE;
        }
    }
}
Direction.NONE = new Direction(0, 0);
Direction.NORTH = new Direction(0, -1);
Direction.SOUTH = new Direction(0, 1);
Direction.EAST = new Direction(1, 0);
Direction.WEST = new Direction(-1, 0);
Direction.NORTH_EAST = new Direction(1, -1);
Direction.NORTH_WEST = new Direction(-1, -1);
Direction.SOUTH_EAST = new Direction(1, 1);
Direction.SOUTH_WEST = new Direction(-1, 1);
Direction.ALL_DIRECTIONS = [Direction.NORTH, Direction.SOUTH,
    Direction.EAST, Direction.WEST, Direction.NORTH_EAST, Direction.NORTH_WEST,
    Direction.SOUTH_EAST, Direction.SOUTH_WEST];
