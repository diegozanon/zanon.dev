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

export interface ChartParams {
    title: string;
    data1: number[];
    data2: number[];
    labelText1: string;
    labelText2: string;
    tension1: number;
    tension2: number;
    stepped1: boolean;
    stepped2: boolean;
    xTitle: string;
    yTitle: string;
}

const font = {
    family: "'Roboto', 'Helvetica Neue', Helvetica, sans-serif",
    size: 14
}

const buildConfig = (params: ChartParams): Chart.ChartConfiguration => {
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

const buildChart = (canva: string, config: Chart.ChartConfiguration): Chart => {
    return new Chart(canva, config);
}

const setColors = (charts: Chart[]): void => {
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

    for (let i = 0; i < charts.length; i++) {
        changeColors(charts[i]);
        charts[i].update();
    }
}

const setEvent = (charts: Chart[]): void => {
    setColors(charts);
    const switcher = document.getElementById('theme-switcher');
    switcher.addEventListener('themeSwitched', (): void => {
        setColors(charts);
    });
}

// export to a global variable
globalThis.Chartjs = {
    buildConfig: buildConfig,
    buildChart: buildChart,
    setEvent: setEvent
}

const event = new CustomEvent('chartjsLoaded');
document.dispatchEvent(event);