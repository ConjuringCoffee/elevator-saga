interface Game {
    init: (elevators, floors) => void;
    update: (dt: number, elevators, floors) => void;
}