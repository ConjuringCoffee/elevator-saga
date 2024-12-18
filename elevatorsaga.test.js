const fs = require('fs');

test('First test', () => {

    const createElevator = () => {
        return {
            on: () => { },
        };
    }

    const createFloor = (/** @type {number} */ floorNumber) => {
        return {
            floorNum: () => floorNumber,
            on: () => { }
        };
    };

    const mockElevators = [createElevator(), createElevator()];
    const mockFloors = [createFloor(0), createFloor(1)];

    const data = fs.readFileSync('./elevatorsaga.js', 'utf8');

    const game = eval(data);
    game.init(mockElevators, mockFloors);

    // @ts-ignore
    expect(mockElevators[0]._index).toBe(0);
    // @ts-ignore
    expect(mockElevators[1]._index).toBe(1);
});