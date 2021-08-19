import {
    Chart,
    PointElement,
    LineElement,
    LineController,
    CategoryScale,
    LinearScale,
    Legend,
    Title,
    Tooltip
} from './chart.js@3.5.1/chart.esm.js';

Chart.register(
    PointElement,
    LineElement,
    LineController,
    CategoryScale,
    LinearScale,
    Legend,
    Title,
    Tooltip);

const font = {
    family: "'Roboto', 'Helvetica Neue', Helvetica, sans-serif",
    size: 14
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const getConfig = (params: any): any => {
    return {
        type: 'line',
        data: {
            labels: [...Array(10).keys()],
            datasets: [
                {
                    label: params.labelText1,
                    data: params.data1,
                    tension: params.tension1,
                    stepped: params.stepped1,
                    borderColor: 'rgb(54, 162, 235)',
                    backgroundColor: 'rgba(54, 162, 235, 0.5)'
                },
                {
                    label: params.labelText2,
                    data: params.data2,
                    tension: params.tension2,
                    stepped: params.stepped2,
                    borderColor: 'rgb(255, 99, 132)',
                    backgroundColor: 'rgba(255, 99, 132, 0.5)'
                }
            ]
        },
        options: {
            responsive: true,
            aspectRatio: 1,
            plugins: {
                title: {
                    display: true,
                    text: params.title,
                    font: font
                },
                legend: {
                    position: 'bottom',
                    labels: {
                        font: font
                    }
                },
                tooltip: {
                    enabled: false
                }
            },
            scales: {
                x: {
                    ticks: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: params.xTitle,
                        font: font,
                        align: 'end'
                    }
                },
                y: {
                    ticks: {
                        display: false
                    },
                    title: {
                        display: true,
                        text: params.yTitle,
                        font: font,
                        align: 'end'
                    }
                }
            }
        }
    }
}

const scalabilityText = {
    labelText1: 'Available Capacity',
    labelText2: 'Actual Usage',
    xTitle: 'Time',
    yTitle: 'Capacity'
}

const configScalabilityLeft = getConfig({
    data1: [2, 2, 3, 3, 4, 4, 3, 3, 6, 6],
    data2: [0, 0.8, 2.7, 3.1, 3.5, 2.7, 2.5, 4.5, 5.4, 7.1],
    tension1: 0,
    tension2: 0.3,
    stepped1: true,
    stepped2: false,
    title: 'IaaS',
    ...scalabilityText
});

const configScalabilityRight = getConfig({
    data1: [0, 1.1, 2.9, 3.5, 3.9, 3.1, 2.9, 4.7, 5.7, 7.3],
    data2: [0, 0.8, 2.7, 3.1, 3.5, 2.7, 2.5, 4.5, 5.4, 7.1],
    tension1: 0.2,
    tension2: 0.3,
    stepped1: false,
    stepped2: false,
    title: 'Serverless',
    ...scalabilityText
});

const costText = {
    labelText1: 'Income',
    labelText2: 'Costs',
    xTitle: 'Users',
    yTitle: 'Money'
}

const configCostLeft = getConfig({
    data1: [...Array(10).keys()],
    data2: [2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
    tension1: 0,
    tension2: 0,
    stepped1: false,
    stepped2: true,
    title: 'IaaS',
    ...costText
});

const degrees = 35;
const configCostRight = getConfig({
    data1: [...Array(10).keys()],
    data2: Array.from({ length: 10 }, (_, i) => i * Math.sin(degrees * Math.PI / 180)),
    tension1: 0,
    tension2: 0,
    stepped1: false,
    stepped2: false,
    title: 'Serverless',
    ...costText
});

const chartScalabilityLeft = new Chart('chart-scalability-left', configScalabilityLeft);
const chartScalabilityRight = new Chart('chart-scalability-right', configScalabilityRight);
const chartCostLeft = new Chart('chart-cost-left', configCostLeft);
const chartCostRight = new Chart('chart-cost-right', configCostRight);

const setColors = (): void => {
    const h1 = document.querySelector('article h1');
    const style = getComputedStyle(h1);
    const textColor = style.getPropertyValue('color');

    const isLightTheme = [...document.body.classList].some(c => c.includes('light'));
    const gridColor = isLightTheme ? '#DDD' : '#111';

    const changeColors = (elm): void => {
        elm.options.plugins.legend.labels.color = textColor;
        elm.options.plugins.title.color = textColor;
        elm.options.scales.x.title.color = textColor;
        elm.options.scales.y.title.color = textColor;
        elm.options.scales.x.grid.color = gridColor;
        elm.options.scales.y.grid.color = gridColor;
    }

    changeColors(chartScalabilityLeft);
    changeColors(chartScalabilityRight);
    changeColors(chartCostLeft);
    changeColors(chartCostRight);

    chartScalabilityLeft.update(configScalabilityLeft);
    chartScalabilityRight.update(configScalabilityRight);
    chartCostLeft.update(configCostLeft);
    chartCostRight.update(configCostRight);
}

setColors();

const switcher = document.getElementById('theme-switcher');
switcher.addEventListener('themeSwitched', setColors);