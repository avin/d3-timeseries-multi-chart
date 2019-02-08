import React, { Component } from 'react';
import TimeseriesMultiChart from '@avinlab/d3-timeseries-multi-chart';

const generateData = seed => {
    const data = [];
    for (let i = 0; i < 1000; i += 1) {
        data.push([+new Date() + i * 100000, Math.cos(i / 10 + seed) + Math.cos(i / 4 + Math.random())]);
    }
    return data;
};

class App extends Component {
    static defaultProps = {
        width: 600,
        height: 400,
    };
    componentDidMount() {
        const { width, height } = this.props;

        this.chart = new TimeseriesMultiChart({
            target: this.chartContainerRef,
            chartDuration: 3600 * 2000,
            width,
            height,
        });
        this.chart.render([
            {
                label: 'Data 1',
                color: '#F5498B',
                data: generateData(0),
                showAxis: true,
                strokeWidth: 2,
            },
            {
                label: 'Data 2',
                color: '#43BF4D',
                data: generateData(Math.PI / 2),
                showAxis: true,
            },
            {
                label: 'Data 3',
                color: '#9179F2',
                data: generateData(Math.PI),
                showAxis: true,
            },
        ]);
    }
    render() {
        const { width, height } = this.props;

        return (
            <div className="App">
                <div
                    className="chartContainer"
                    style={{
                        width,
                        height,
                    }}
                    ref={i => {
                        this.chartContainerRef = i;
                    }}
                />
            </div>
        );
    }
}

export default App;
