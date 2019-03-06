# battlecode-2019-unit-tests

Some example units tests for MapLocation and Direction

Note: There are some failing tests! You should fix them :)

## Installation
First you'll need to install deps:
```
npm install
```

## Running Tests
Then you can run the tests:
```
npm run tests
```
(see package.json for the actual mocha command)

### Output
```
  isCardinal
    ✓ should be true for north
    ✓ should be false for north east

  opposite
    ✓ should return south for north
    ✓ should return north east for south west

  isAdjacentTo
    x should be true for location to the north
    x should be true for location to the south_east
    ✓ should be false for same location

  isCardinallyAdjacentTo
    x should be true for location to the north
    ✓ should be false for location to the south_east
    ✓ should be false for same location

  <more output>
```

## Getting Unit Test Coverage
Make sure to run `npm install` then run:
```
npm run coverage
```

which will produce output:

```
---------------------|----------|----------|----------|----------|-------------------|
File                 |  % Stmts | % Branch |  % Funcs |  % Lines | Uncovered Line #s |
---------------------|----------|----------|----------|----------|-------------------|
All files            |    83.79 |    55.43 |      100 |    83.79 |                   |
 Direction.js        |    59.57 |    45.95 |      100 |    59.57 |... 58,160,166,170 |
 Direction.spec.js   |      100 |      100 |      100 |      100 |                   |
 MapLocation.js      |    90.32 |    94.44 |      100 |    90.32 |           8,33,73 |
 MapLocation.spec.js |      100 |      100 |      100 |      100 |                   |
---------------------|----------|----------|----------|----------|-------------------|

```
can you increase the coverage for Direction.js?
