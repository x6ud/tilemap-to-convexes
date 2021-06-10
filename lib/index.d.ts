declare type Point = {
    x: number;
    y: number;
};
declare type Contour = Point[];
declare type Polygon = Contour[];
export default class MergePolygons {
    private polygons;
    addPolygon(...vertices: Point[]): void;
    getMergedPolygons(): Polygon[];
    getConvexes(): Contour[];
}
export {};
