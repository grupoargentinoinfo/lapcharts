// Dimensions.
const DIMENSIONS = getWindowDimensions();
const WIDTH = DIMENSIONS.width;
const HEIGHT = DIMENSIONS.height - 100;

// Insets.
const INSETS = {'left': 150, 'right': 150, 'top': 30, 'bottom': 50};

// Padding.
const PADDING = {'left': 15, 'right': 15, 'top': 8, 'bottom': 8};

// Tick-mark length.
const TICK_MARK_LENGTH = 8;

// Marker radius.
const MARKER_RADIUS = 10;

// Scales.
const SCALES = {};

// Opacity of dimmed objects.
var DIMMED_OPACITY = 0.2;
var HIGHLIGHT_OPACITY = 1.0;


// Visualize when document has loaded.
//
window.onload = function() {

    // Load data.
    d3.json("2010au.json", function(data) {

        // Check integrity.
        integrityCheck(data);

        // Sort on finishing order.
        data.laps.sort(function(a, b) {

            var aLaps = a.placing.length;
            var bLaps = b.placing.length;
            return aLaps == bLaps ? a.placing[aLaps - 1] - b.placing[bLaps - 1] : bLaps - aLaps;
        });

        // Process lap markers..
        data.pitstops = processLapMarkers(data, "pitstops");
        data.mechanical = processLapMarkers(data, "mechanical");
        data.accident = processLapMarkers(data, "accident");

        // Visualize the data.
        visualize(data);
    });
};

// Process lap markers.
//
// data: lap data.
// key: marker key.
//
function processLapMarkers(data, key) {

    var markers = [];
    var p = 0;
    for (var i = 0;
         i < data.laps.length;
         i++) {

        var lapData = data.laps[i];
        var laps = lapData[key];
        if (laps != undefined) {
            for (var j = 0;
                 j < laps.length;
                 j++) {

                var lap = laps[j];
                var marker = {};
                marker.start = lapData.placing[0];
                marker.lap = lap;
                marker.placing = lapData.placing[lap];
                marker.name = lapData.name;

                markers[p++] = marker;
            }
        }
    }
    return markers;
}

// Check data.
//
function integrityCheck(data) {

    var laps = data.laps;
    var lapCount = data.lapCount;

    for (var j = 0;
         j < laps.length;
         j++) {

        // Has name?
        var name = laps[j].name;
        if (name == undefined || name.length == 0) {

            alert("Warning: invalid name for element " + j);
        }

        // Has placings?
        var places = laps[j].placing;
        if (places == undefined) {

            alert("Warning: missing placings for element " + j + " (" + name + ")");
        }
        else if (places.length == 0 || places.length > lapCount + 1) {

            alert("Warning: invalid number of placings (" + places.length + ") for element " + j +
                " (" + name + ") - expected between 1 and " + (lapCount - 1));
        }

        // Check markers.
        var maxLaps = places.length;
        checkMarker(laps[j].pitstops, "pitstop", maxLaps, j, name);
        checkMarker(laps[j].mechanical, "mechanical", maxLaps, j, name);
        checkMarker(laps[j].accident, "accident", maxLaps, j, name);
    }

    // Check for consistent placings.
    for (i = 0;
         i < lapCount;
         i++) {

        var positions = [];
        for (j = 0;
             j < laps.length;
             j++) {

            places = laps[j].placing;
            if (places.length > i) {

                // Valid placing?
                var placing = places[i];
                if (isNaN(placing) || placing < 1 || placing % 1 != 0) {

                    alert("Warning: invalid placing '" + placing + "' for " + laps[j].name)
                }
                else {

                    var count = positions[placing];
                    positions[placing] = isNaN(count) ? 1 : count + 1
                }
            }
        }

        // Check for duplicate/missing positions.
        for (j = 1;
             j < positions.length;
             j++) {

            count = positions[j];
            if (count != 1) {

                alert("Warning: data inconsistent: lap " + i + ", position " + j + ", count " + count);
            }
        }
    }

    // Check lapped data.
    var lapped = data.lapped;
    if (lapped != undefined) {

        if (lapped.length != data.lapCount) {

            alert("Lapped array length (" + lapped.length + ") incorrect - expected length " + data.lapCount);
        }

        for (j = 1;
             j < lapped.length;
             j++) {

            if (data.lapped[j] > data.laps.length) {

                alert("Lapped data incorrect: element " + j + " (" + data.lapped[j]
                    + ") is greater than max placing (" + data.laps.length + ")");
            }
        }
    }
}

// Check integrity of marker data.
//
// marker: marker data.
// name: driver name.
// type: text description of marker.
// max: maximum allowed lap value of marker.
// index: index of driver in list.
//
function checkMarker(marker, type, max, index, name) {

    if (marker != undefined) {

        // Check marker.
        for (var i = 0;
             i < marker.length;
             i++) {

            var stop = marker[i];
            if (isNaN(stop) || stop < 0 || stop >= max || stop % 1 != 0) {

                alert("Warning: invalid " + type + " (" + stop + ") for element " + index + " (" + name + ")");
            }
        }
    }
}

// Create the visualization.
//
// data the lap data object.
//
function visualize(data) {

    SCALES.x = d3.scale.linear()
        .domain([0, data.lapCount])
        .range([INSETS.left, WIDTH - INSETS.right]);

    SCALES.y = d3.scale.linear()
        .domain([0, data.laps.length - 1])
        .range([INSETS.top, HEIGHT - INSETS.bottom]);

    SCALES.clr = d3.scale.category20();

    // Root panel.
    var vis = d3.select('#chart')
        .append('svg:svg')
        .attr('width', WIDTH)
        .attr('height', HEIGHT);

    // Add lapped poly-lines.
    if (data.lapped != undefined) {

        vis.selectAll('rect.lapped')
            .data(data.lapped)
            .enter()
            .append('svg:rect')
            .attr('class', 'lapped')
            .attr('x', function(d, i) {

                return SCALES.x(i);
            })
            .attr('y', function(d) {

                return SCALES.y(d > 0 ? d - 1.5 : 0);
            })
            .attr('height', function(d) {

                return d > 0 ? SCALES.y.range()[1] - SCALES.y(d - 1.5) : 0;
            })
            .attr('width', function(d) {

                return d > 0 ? SCALES.x(1) - SCALES.x(0) : 0;
            });
    }

    // Lap tick-lines.
    vis.selectAll('line')
        .data(SCALES.x.ticks(data.lapCount))
        .enter().append('svg:line')
        .attr('class', 'tickLine')
        .attr('x1', function(d) {

            return SCALES.x(d);
        })
        .attr('x2', function(d) {

            return SCALES.x(d);
        })
        .attr('y1', SCALES.y.range()[0] - TICK_MARK_LENGTH)
        .attr('y2', SCALES.y.range()[1] + TICK_MARK_LENGTH)
        .attr('visibility', function(d) {

            return d > 0 && d < data.lapCount ? 'visible' : 'hidden'
        });

    // Lap labels.
    addLapLabels(vis, data.lapCount, SCALES.y.range()[0] - PADDING.bottom, '0.0em', 'top');
    addLapLabels(vis, data.lapCount, SCALES.y.range()[1] + PADDING.top, '0.35em', 'bottom');

    // Add lap poly-lines.
    vis.selectAll('polyline.placing')
        .data(data.laps)
        .enter()
        .append('svg:polyline')
        .attr('class', 'placing')
        .attr('points', function(d) {

            var points = [];
            for (var i = 0;
                 i < d.placing.length;
                 i++) {

                points[i] = SCALES.x(i) + ',' + SCALES.y(d.placing[i] - 1);
            }

            return points.join(' ');
        })
        .style('stroke', function(d) {

            return SCALES.clr(d.placing[0]);
        })
        .on('mouseover', function(d) {

            highlight(vis, d.name);
        })
        .on('mouseout', function() {

            unhighlight(vis);
        });

    // Add name labels.
    vis.selectAll('text.label.start')
        .data(data.laps)
        .enter()
        .append('svg:text')
        .attr('class', 'label start')
        .attr('x', INSETS.left - PADDING.right)
        .attr('y', function (d) {

            return SCALES.y(d.placing[0] - 1);
        })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'end')
        .text(function(d) {

            return d.name;
        })
        .style('fill', function(d) {

            return SCALES.clr(d.placing[0]);
        })
        .on('mouseover', function(d) {

            highlight(vis, d.name);
        })
        .on('mouseout', function() {

            unhighlight(vis);
        });

    vis.selectAll('text.label.finish')
        .data(data.laps)
        .enter()
        .append('svg:text')
        .attr('class', 'label finish')
        .attr('x', WIDTH - INSETS.right + PADDING.left)
        .attr('y', function (d, i) {

            return SCALES.y(i);
        })
        .attr('dy', '0.35em')
        .attr('text-anchor', 'start')
        .text(function(d) {

            return d.name;
        })
        .style('fill', function(d) {

            return SCALES.clr(d.placing[0]);
        })
        .on('mouseover', function(d) {

            highlight(vis, d.name);
        })
        .on('mouseout', function() {

            unhighlight(vis);
        });

    // Add markers.
    addMarkers(vis, data.pitstops, "pitstop", "P");
    addMarkers(vis, data.mechanical, "mechanical", "M");
    addMarkers(vis, data.accident, "accident", "X");
}

// Highlight driver.
//
// vis: the data visualization root.
// index: index of driver to highlight.
//
function highlight(vis, name) {

    // Dim others.
    vis.selectAll('polyline')
        .style('opacity', function(d) {

            return d.name == name ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
        });

    vis.selectAll('circle')
        .style('opacity', function(d) {

            return d.name == name ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
        });

    vis.selectAll('text.label')
        .style('opacity', function(d) {

            return d.name == name ? HIGHLIGHT_OPACITY : DIMMED_OPACITY;
        });
}

// Remove highlights.
//
// vis: the data visualization root.
//
function unhighlight(vis) {

    // Reset opacity.
    vis.selectAll('polyline')
        .style('opacity', HIGHLIGHT_OPACITY);
    vis.selectAll('circle')
        .style('opacity', HIGHLIGHT_OPACITY);
    vis.selectAll('text.label')
        .style('opacity', HIGHLIGHT_OPACITY);
}

// Add lap labels.
//
// vis: the data visualization root.
//
function addLapLabels(vis, data, y, dy, cssClass) {

    vis.selectAll('text.lap.' + cssClass)
        .data(SCALES.x.ticks(data))
        .enter().append('svg:text')
        .attr('class', 'lap ' + cssClass)
        .attr('x', function(d) {

            return SCALES.x(d - 0.5);
        })
        .attr('y', y)
        .attr('dy', dy)
        .attr('text-anchor', 'middle')
        .text(function(d, i) {

            return i > 0 ? i : '';
        });
}

// Add markers.
//
// vis: the visualization root.
// data: marker data.
// class: marker sub-class.
// label: marker label.
//
function addMarkers(vis, data, cssClass, label) {
    label = label || "P";

    // Place circle glyph.
    vis.selectAll("circle.marker." + cssClass)
        .data(data)
        .enter()
        .append("svg:circle")
        .attr("class", "marker " + cssClass)
        .attr("cx", function(d) {

            return SCALES.x(d.lap);
        })
        .attr("cy", function(d) {

            return SCALES.y(d.placing - 1);
        })
        .attr("r", MARKER_RADIUS)
        .style("fill", function(d) {

            return SCALES.clr(d.start);
        })
        .on('mouseover', function(d) {

            highlight(vis, d.name);
        })
        .on('mouseout', function() {

            unhighlight(vis);
        });

    // Place text.
    vis.selectAll("text.label.marker" + cssClass)
        .data(data)
        .enter()
        .append("svg:text")
        .attr("class", "label marker" + cssClass)
        .attr("x", function(d) {

            return SCALES.x(d.lap);
        })
        .attr("y", function(d) {

            return SCALES.y(d.placing - 1);
        })
        .attr("dy", "0.35em")
        .attr("text-anchor", "middle")
        .text(label)
        .on('mouseover', function(d) {

            highlight(vis, d.name);
        })
        .on('mouseout', function() {

            unhighlight(vis);
        });
}

// Gets the window dimensions.
//
function getWindowDimensions() {

    var width = 630;
    var height = 460;
    if (document.body && document.body.offsetWidth) {

        width = document.body.offsetWidth;
        height = document.body.offsetHeight;
    }

    if (document.compatMode == 'CSS1Compat' && document.documentElement && document.documentElement.offsetWidth) {

        width = document.documentElement.offsetWidth;
        height = document.documentElement.offsetHeight;
    }

    if (window.innerWidth && window.innerHeight) {

        width = window.innerWidth;
        height = window.innerHeight;
    }

    return {'width': width, 'height': height};
}

