// dimensions.
const width = $(window).width();
const height = $(window).height() - 100;

console.log("body");
$(function() {
console.log("function");

    var container = $("#placeholder");
    container.width(width);
    container.height(height);

    // Determine how many data points to keep based on the placeholder's initial size;
    // this gives us a nice high-res plot while avoiding more than one point per pixel.

    $.ajax({url: container.attr("json")})
        .done(function (series) {

            var plot = $.plot(container, series, {
                grid: {
                    borderWidth: 1,
                    minBorderMargin: 20,
                    labelMargin: 10,
                    backgroundColor: {
                        colors: ["#fff", "#e4f4f4"]
                    },
                    margin: {
                        top: 8,
                        bottom: 20,
                        left: 20
                    },
                    clickable: true,
                    autoHighlight: false,
                },
                xaxis: {
                    ticks: 10,
                    datamin: 180,
                },
                yaxis: {
                    //min: 0,
                    //max: 110
                },
                legend: {
                    show: true,
                    position: "sw",
                    hideable: true,
                    sorted: "ascending",
                },
            });

            $(container).bind("plotclick", function (event, pos, item) {
                // axis coordinates for other axes, if present, are in pos.x2, pos.x3, ...
                // if you need global screen coordinates, they are pos.pageX, pos.pageY

                if (item) {
                    alpha = 0.3;
                    if (item.series.selected) {
                        item.series.selected = false;
                        alpha = 1;
                    } else {
                        item.series.selected = true;
                    }

                    $.each(plot.getData(), function () {
                        if (this.label != item.series.label) {
                            c = $.color.parse(this.color);
                            c.a = alpha;
                            this.color = c.toString();
                        }
                    });
                    plot.draw();
                }
            });
        });

});

