"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var poly_partition_1 = require("poly-partition");
function area(a, b, c) {
    return (b.y - a.y) * (c.x - b.x) - (b.x - a.x) * (c.y - b.y);
}
function equals(a, b) {
    return a.x === b.x && a.y === b.y;
}
function vectorsAngle(v1x, v1y, v2x, v2y) {
    var angle = Math.atan2(v2y, v2x) - Math.atan2(v1y, v1x);
    if (angle < 0) {
        angle += Math.PI * 2;
    }
    return angle;
}
var MergePolygons = /** @class */ (function () {
    function MergePolygons() {
        this.polygons = [];
    }
    MergePolygons.prototype.addPolygon = function () {
        var vertices = [];
        for (var _i = 0; _i < arguments.length; _i++) {
            vertices[_i] = arguments[_i];
        }
        var edges = [];
        for (var i = 0, len = vertices.length; i < len; ++i) {
            var p0 = vertices[i];
            var p1 = vertices[(i + 1) % len];
            edges.push([{ x: p0.x, y: p0.y }, { x: p1.x, y: p1.y }]);
        }
        this.polygons.push(edges);
    };
    MergePolygons.prototype.getMergedPolygons = function () {
        function hash(point) {
            return point.x + ',' + point.y;
        }
        var edgesMap = new Map();
        var polyEdgesMap = new Map();
        function addEdge(edge) {
            var p1 = hash(edge.edge[0]);
            var p1Edges;
            if (edgesMap.has(p1)) {
                p1Edges = edgesMap.get(p1);
            }
            else {
                p1Edges = new Map();
                edgesMap.set(p1, p1Edges);
            }
            p1Edges.set(hash(edge.edge[1]), edge);
            var polyEdges = polyEdgesMap.get(edge.polygon);
            if (!polyEdges) {
                polyEdges = [];
                polyEdgesMap.set(edge.polygon, polyEdges);
            }
            polyEdges.push(edge);
        }
        function removeEdge(edge) {
            removeEdgeFromMap(edgesMap, edge);
            var polyEdges = polyEdgesMap.get(edge.polygon);
            if (polyEdges) {
                var index = polyEdges.indexOf(edge);
                if (index >= 0) {
                    polyEdges.splice(index, 1);
                }
            }
        }
        function removeEdgeFromMap(map, edge) {
            var p1Hash = hash(edge.edge[0]);
            var p1Edges = map.get(p1Hash);
            if (p1Edges) {
                var p2Hash = hash(edge.edge[1]);
                p1Edges.delete(p2Hash);
            }
        }
        function getEdge(p1, p2) {
            var p1Hash = hash(p1);
            var p1Edges = edgesMap.get(p1Hash);
            if (p1Edges) {
                var p2Hash = hash(p2);
                return p1Edges.get(p2Hash);
            }
        }
        function takeOne(from, to) {
            for (var iter = from.entries(), next = iter.next(); !next.done; next = iter.next()) {
                if (!next.value) {
                    continue;
                }
                var p1Edges = next.value[1];
                for (var iter_1 = p1Edges.entries(), next_1 = iter_1.next(); !next_1.done; next_1 = iter_1.next()) {
                    if (!next_1.value) {
                        continue;
                    }
                    p1Edges.delete(next_1.value[0]);
                    var edge = next_1.value[1];
                    if (to) {
                        var p1 = hash(edge.edge[0]);
                        var p2 = hash(edge.edge[1]);
                        var toP1Edges = to.get(p1);
                        if (!toP1Edges) {
                            toP1Edges = new Map();
                            to.set(p1, toP1Edges);
                        }
                        toP1Edges.set(p2, edge);
                    }
                    return edge;
                }
            }
        }
        function mergePolygons(target, merged) {
            var targetEdges = polyEdgesMap.get(target);
            var mergedEdges = polyEdgesMap.get(merged);
            if (mergedEdges) {
                mergedEdges.forEach(function (edge) { return edge.polygon = target; });
                if (targetEdges) {
                    targetEdges.push.apply(targetEdges, mergedEdges);
                }
                polyEdgesMap.delete(merged);
            }
        }
        // init
        for (var polyIndex = 0, polyNum = this.polygons.length; polyIndex < polyNum; ++polyIndex) {
            var poly = this.polygons[polyIndex];
            for (var i = 0, len = poly.length; i < len; ++i) {
                var edge = {
                    edge: poly[i],
                    polygon: polyIndex
                };
                addEdge(edge);
            }
        }
        // remove shared edges
        var visitedMap = new Map();
        for (var edge = takeOne(edgesMap, visitedMap); edge; edge = takeOne(edgesMap, visitedMap)) {
            var reverse = getEdge(edge.edge[1], edge.edge[0]);
            if (reverse) {
                removeEdge(edge);
                removeEdge(reverse);
                if (edge.polygon !== reverse.polygon) {
                    mergePolygons(edge.polygon, reverse.polygon);
                }
                removeEdgeFromMap(visitedMap, edge);
                removeEdgeFromMap(visitedMap, reverse);
            }
        }
        // merge collinear edges
        edgesMap = visitedMap;
        visitedMap = new Map();
        var _loop_1 = function (edge) {
            if (edge.polygon < 0) {
                return "continue";
            }
            var p1 = hash(edge.edge[1]);
            var nextEdge = undefined;
            var nextEdgesMap = undefined;
            var count = 0;
            [edgesMap, visitedMap].forEach(function (map) {
                nextEdgesMap = map.get(p1);
                if (nextEdgesMap) {
                    var iter = nextEdgesMap.values();
                    for (var next = iter.next(); !next.done; next = iter.next()) {
                        nextEdge = next.value;
                        count += 1;
                    }
                }
            });
            if (!nextEdge || count > 1) {
                return "continue";
            }
            if (area(edge.edge[0], edge.edge[1], nextEdge.edge[1]) === 0) {
                removeEdge(edge);
                removeEdge(nextEdge);
                if (edge.polygon !== nextEdge.polygon) {
                    throw new Error('Found invalid edge');
                }
                addEdge({
                    edge: [edge.edge[0], nextEdge.edge[1]],
                    polygon: edge.polygon
                });
                removeEdgeFromMap(visitedMap, edge);
                removeEdgeFromMap(visitedMap, nextEdge);
            }
        };
        for (var edge = takeOne(edgesMap, visitedMap); edge; edge = takeOne(edgesMap, visitedMap)) {
            _loop_1(edge);
        }
        // merge into rings
        edgesMap = visitedMap;
        var polygons = new Map();
        var holes = new Map();
        var _loop_2 = function (curr) {
            var contour = [];
            var start = curr;
            var polyId = curr.polygon;
            var angleSum = 0;
            contour.push(curr.edge[0]);
            for (;;) {
                var nextEdgesMap = edgesMap.get(hash(curr.edge[1]));
                if (!nextEdgesMap) {
                    throw new Error('Failed to find closed ring');
                }
                var candidates = Array.from(nextEdgesMap.values()).filter(function (edge) { return edge.polygon === polyId; });
                if (!candidates.length) {
                    throw new Error('Failed to find closed ring');
                }
                var next = candidates[0];
                var minAngle = Infinity;
                for (var i = 0, len = candidates.length; i < len; ++i) {
                    var candidate = candidates[i];
                    var angle = vectorsAngle(next.edge[1].x - next.edge[0].x, next.edge[1].y - next.edge[0].y, curr.edge[0].x - curr.edge[1].x, curr.edge[0].y - curr.edge[1].y);
                    if (angle < minAngle) {
                        next = candidate;
                        minAngle = angle;
                    }
                }
                contour.push(next.edge[0]);
                curr = next;
                angleSum += minAngle;
                removeEdgeFromMap(edgesMap, next);
                if (equals(next.edge[1], start.edge[0])) {
                    break;
                }
            }
            var isHole = (angleSum - (contour.length - 2) * Math.PI) > Math.PI * 1e-4;
            if (isHole) {
                var polyHoles = holes.get(polyId);
                if (!polyHoles) {
                    polyHoles = [];
                    holes.set(polyId, polyHoles);
                }
                polyHoles.push(contour);
            }
            else {
                if (polygons.has(polyId)) {
                    throw new Error('Polygon ID is duplicated');
                }
                var poly = [contour];
                polygons.set(polyId, poly);
            }
            out_curr_1 = curr;
        };
        var out_curr_1;
        for (var curr = takeOne(edgesMap); curr; curr = takeOne(edgesMap)) {
            _loop_2(curr);
            curr = out_curr_1;
        }
        for (var iter = holes.entries(), next = iter.next(); !next.done; next = iter.next()) {
            var polyId = next.value[0];
            var polyHoles = next.value[1];
            var poly = polygons.get(polyId);
            if (!poly) {
                throw new Error('Failed to find outer contour for holes');
            }
            poly.push.apply(poly, polyHoles);
        }
        return Array.from(polygons.values());
    };
    MergePolygons.prototype.getConvexes = function () {
        var polygons = this.getMergedPolygons();
        var ret = [];
        polygons.forEach(function (polygon) {
            var merged = poly_partition_1.removeHoles(polygon[0], polygon.slice(1));
            var convexes = poly_partition_1.convexPartition(merged);
            ret.push.apply(ret, convexes);
        });
        return ret;
    };
    return MergePolygons;
}());
exports.default = MergePolygons;
