import MergePolygons from '../index'

type Point = { x: number, y: number };

function area(polygon: Point[]) {
    let area = 0;
    for (let i = 0, len = polygon.length; i < len; ++i) {
        const p1 = polygon[i];
        const p2 = polygon[(i + 1) % len];
        area += p1.x * p2.y - p1.y * p2.x;
    }
    return area;
}

function equals(a: number, b: number) {
    return Math.abs(a - b) < 1e-5;
}

test('tilemap-to-convexes', () => {
    const gridSize = 32;
    const tiles: { x: number, y: number }[][] = [];

    function addRect(x: number, y: number) {
        x *= gridSize;
        y *= gridSize;
        tiles.push([
            {x: x, y: y},
            {x: x + gridSize, y: y},
            {x: x + gridSize, y: y + gridSize},
            {x: x, y: y + gridSize}
        ]);
    }

    function addSlopeBR(x: number, y: number) {
        x *= gridSize;
        y *= gridSize;
        tiles.push([
            {x: x, y: y},
            {x: x + gridSize, y: y},
            {x: x + gridSize, y: y + gridSize}
        ]);
    }

    function addSlopeBL(x: number, y: number) {
        x *= gridSize;
        y *= gridSize;
        tiles.push([
            {x: x, y: y},
            {x: x + gridSize, y: y},
            {x: x, y: y + gridSize}
        ]);
    }

    function addSlopeTL(x: number, y: number) {
        x *= gridSize;
        y *= gridSize;
        tiles.push([
            {x: x, y: y},
            {x: x + gridSize, y: y + gridSize},
            {x: x, y: y + gridSize}
        ]);
    }

    function addSlopeTR(x: number, y: number) {
        x *= gridSize;
        y *= gridSize;
        tiles.push([
            {x: x + gridSize, y: y},
            {x: x + gridSize, y: y + gridSize},
            {x: x, y: y + gridSize}
        ]);
    }

    addRect(4, 0);
    addRect(5, 0);
    addRect(4, 1);
    addRect(5, 1);

    addRect(-2, 0);
    addRect(-1, 0);
    addRect(0, 0);
    addRect(1, 0);

    addRect(-2, 1);
    addRect(1, 1);

    addRect(-2, 2);
    addRect(1, 2);

    addRect(-2, 3);
    addRect(-1, 3);
    addRect(0, 3);
    addRect(1, 3);

    addSlopeBR(-3, 3);
    addSlopeBR(-2, 4);
    addSlopeBR(-1, 5);

    addSlopeBL(0, 5);
    addSlopeBL(1, 4);
    addSlopeBL(2, 3);

    addSlopeTL(-1, 4);
    addSlopeTR(0, 4);

    const mergePolygons = new MergePolygons();
    tiles.forEach(tile => mergePolygons.addPolygon(...tile));
    const convexes = mergePolygons.getConvexes();

    expect(equals(
        tiles.map(area).reduce((sum, curr) => sum + curr, 0),
        convexes.map(area).reduce((sum, curr) => sum + curr, 0)
    )).toBe(true);
});
