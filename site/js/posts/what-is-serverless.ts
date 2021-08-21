document.addEventListener('DOMContentLoaded', () => {
    const scalabilityText = {
        labelText1: 'Available Capacity',
        labelText2: 'Actual Usage',
        xTitle: 'Time',
        yTitle: 'Capacity'
    }

    const configScalabilityLeft = globalThis.Chartjs.buildConfig({
        data1: [2, 2, 3, 3, 4, 4, 3, 3, 6, 6],
        data2: [0, 0.8, 2.7, 3.1, 3.5, 2.7, 2.5, 4.5, 5.4, 7.1],
        tension1: 0,
        tension2: 0.3,
        stepped1: true,
        stepped2: false,
        title: 'IaaS',
        ...scalabilityText
    });

    const configScalabilityRight = globalThis.Chartjs.buildConfig({
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

    const configCostLeft = globalThis.Chartjs.buildConfig({
        data1: [...Array(10).keys()],
        data2: [2, 2, 3, 3, 4, 4, 5, 5, 6, 6],
        tension1: 0,
        tension2: 0,
        stepped1: false,
        stepped2: true,
        title: 'IaaS',
        ...costText
    });

    const configCostRight = globalThis.Chartjs.buildConfig({
        data1: [...Array(10).keys()],
        data2: Array.from({ length: 10 }, (_, i) => i * Math.sin(35 * Math.PI / 180)),
        tension1: 0,
        tension2: 0,
        stepped1: false,
        stepped2: false,
        title: 'Serverless',
        ...costText
    });

    const charts = [];
    charts.push(globalThis.Chartjs.buildChart('chart-scalability-left', configScalabilityLeft));
    charts.push(globalThis.Chartjs.buildChart('chart-scalability-right', configScalabilityRight));
    charts.push(globalThis.Chartjs.buildChart('chart-cost-left', configCostLeft));
    charts.push(globalThis.Chartjs.buildChart('chart-cost-right', configCostRight));

    globalThis.Chartjs.setEvent(charts);
});