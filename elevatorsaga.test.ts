const fs = require('fs');
const data = fs.readFileSync('./elevatorsaga.js', 'utf8');

var mockElevators: Array<Partial<Elevator>> = [];
var mockFloors: Array<Partial<Floor>> = [];

beforeEach(() => {
    const createElevator = () => {
        return {
            on: () => { },
        };
    }

    const createFloor = (floorNumber: number) => {
        return {
            floorNum: () => floorNumber,
            on: () => { }
        };
    };

    mockElevators = [createElevator(), createElevator()];
    mockFloors = [createFloor(0), createFloor(1)];
})

test('All elevators get assigned to an index', () => {
    const game = eval(data);
    game.init(mockElevators, mockFloors);

    expect(mockElevators[0]._index).toBe(0);
    expect(mockElevators[1]._index).toBe(1);
});