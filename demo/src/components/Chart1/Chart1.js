import React from 'react';
import TimeseriesMultiChart from '@avinlab/d3-timeseries-multi-chart';
import styles from './styles.module.scss';
import cn from 'clsx';

export default class Chart1 extends React.Component {
    static defaultProps = {
        width: 600,
        height: 400,
    };

    data1 = [];
    data2 = [];
    counter = 0;

    fillData = (slice = false) => {
        this.counter += 1;
        if (slice) {
            this.data1 = this.data1.slice(1);
            this.data2 = this.data2.slice(1);
        }

        this.data1.push([+new Date() + this.counter * 100000, Math.cos(this.counter / 10 + Math.PI) * 20]);
        this.data2.push([+new Date() + this.counter * 100000, Math.cos(this.counter / 10 + Math.PI / 2)]);
    };

    componentDidMount() {
        const { width, height } = this.props;

        for (let i = 0; i < 100; i += 1) {
            this.fillData();
        }

        const dataStream1 = {
            label: 'Data 1',
            color: '#F5498B',
            data: this.data1,
            showAxis: true,
            strokeWidth: 2,
            showDots: true,
        };

        const dataStream2 = {
            label: 'Data 2',
            color: '#43BF4D',
            data: this.data2,
            showAxis: true,
            showDots: true,
        };

        this.chart = new TimeseriesMultiChart({
            target: this.chartContainerRef,
            chartDuration: 3600 * 2000,
            width,
            height,
            showTimeAxis: false,
            draggable: false,
            maxZoomTime: 3600 * 8000,
            minZoomTime: 60*10 * 1000,
        });
        this.chart.render([dataStream1, dataStream2]);

        setInterval(() => {
            this.fillData(true);
            dataStream1.data = this.data1;
            dataStream2.data = this.data2;
            this.chart.lastChartTime = +new Date() + (this.counter + 5) * 100000;
            this.chart.update([dataStream1, dataStream2]);
        }, 200);
    }
    render() {
        const { width, height } = this.props;

        return (
            <div
                className={cn('chartContainer', styles.chart)}
                style={{
                    width,
                    height,
                }}
                ref={i => {
                    this.chartContainerRef = i;
                }}
            />
        );
    }
}
