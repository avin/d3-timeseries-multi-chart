import React, { Component } from 'react';
import styles from './styles.module.scss';
import Chart1 from '../Chart1/Chart1';
import Chart2 from '../Chart2/Chart2';
import Chart3 from '../Chart3/Chart3';
import Chart4 from '../Chart4/Chart4';
import GitHubLink from './GitHubLink/GitHubLink';
import Chart5 from '../Chart5/Chart5';

class App extends Component {
    render() {
        const chartWidth = 500;
        const chartHeight = 250;
        const chartCommonProps = {
            width: chartWidth,
            height: chartHeight,
        };
        return (
            <div className={styles.root}>
                <div className={styles.title}>
                    <h1>
                        <a href="https://github.com/avin/d3-timeseries-multi-chart">d3-timeseries-multi-chart</a>
                    </h1>
                </div>
                <div className={styles.row}>
                    <Chart1 {...chartCommonProps} />
                    <Chart2 {...chartCommonProps} />
                </div>
                <div className={styles.row}>
                    <Chart3 {...chartCommonProps} />
                    <Chart4 {...chartCommonProps} />
                </div>
                <div className={styles.row}>
                    <Chart5 {...chartCommonProps} />
                </div>
                <div className={styles.footer}>
                    <GitHubLink />
                </div>
            </div>
        );
    }
}

export default App;
