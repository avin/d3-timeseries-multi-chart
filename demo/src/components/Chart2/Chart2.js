import React from 'react';
import TimeseriesMultiChart from '@avinlab/d3-timeseries-multi-chart';
import { generateData } from '../../utils/data';
import styles from './styles.module.scss';
import cn from 'clsx';

export default class Chart2 extends React.Component {
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
            showTimeAxis: false,
            maxZoomTime: 3600 * 8000,
            minZoomTime: 60*10 * 1000,
        });
        this.chart.render([
            {
                label: 'Data 1',
                color: '#F5498B',
                colorGradient: ['#F5498B', '#FFC940'],
                data: generateData(0),
                showAxis: true,
                strokeWidth: 2,
                scaleVisible: true,
            },
            {
                label: 'Data 2',
                color: '#669EFF',
                colorGradient: ['#669EFF','#DB2C6F'],
                data: generateData(Math.PI / 2),
                showAxis: true,
                showDots: true,
                scaleVisible: true,
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
