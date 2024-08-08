const { ChartJSNodeCanvas } = require("chartjs-node-canvas");

module.exports = async function (data, title, dimensions, colour) {
    const canvasRenderService = new ChartJSNodeCanvas({
        width: dimensions[0] || 1390,
        height: dimensions[1] || 397,
    });

    const configuration = {
        type: "line",
        data: {
            labels: data.map((_, index) => index + 1),
            datasets: [
                {
                    label: title,
                    data: data,
                    fill: false,
                    borderColor: colour,
                    tension: 0.1,
                    borderWidth: 2,
                    pointRadius: 0,
                },
            ],
        },
        options: {
            plugins: {
                title: {
                    display: false,
                },
                legend: {
                    labels: {
                        color: "#FFFFFF",
                        font: {
                            size: 16,
                        },
                    },
                },
            },
            scales: {
                x: {
                    display: false,
                    ticks: {
                        color: "#FFFFFF",
                        font: {
                            size: 25,
                        },
                    },
                },
                y: {
                    display: true,
                    ticks: {
                        color: "#FFFFFF",
                        font: {
                            size: 25,
                        },
                    },
                },
            },
        },
    };

    const image = await canvasRenderService.renderToBuffer(configuration);
    return image;
}