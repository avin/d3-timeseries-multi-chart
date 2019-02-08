import React, { Component } from 'react';
import TimeseriesMultiChart from '@avinlab/d3-timeseries-multi-chart';

const generateData = seed => {
    const data = [];
    for (let i = 0; i < 1000; i += 1) {
        data.push([+new Date() + i * 10000, Math.cos(i / 10 + seed)]);
    }
    return data;
};

class App extends Component {
    static defaultProps = {
        width: 500,
        height: 400,
    };
    componentDidMount() {
        const { width, height } = this.props;

        this.chart = new TimeseriesMultiChart({
            target: this.chartContainerRef,
            width,
            height,
        });
        this.chart.render([
            {
                label: 'Data 1',
                color: '#F00',
                data: generateData(0),
                showAxis: true,
            },
            {
                label: 'Data 2',
                color: '#F0F',
                data: generateData(1.5),
                showAxis: true,
            },
            {
                label: 'Data 3',
                color: '#06F',
                data: generateData(20),
                showAxis: true,
            },
        ]);
    }
    render() {
        const { width, height } = this.props;

        return (
            <div className="App">
                <div
                    style={{
                        width,
                        height,
                        border: '1px solid #666',
                        borderRadius: '3px',
                        margin: 10
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
