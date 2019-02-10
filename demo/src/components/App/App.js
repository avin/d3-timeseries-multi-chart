import React, { Component } from 'react';
import styles from './styles.module.scss';
import Chart1 from '../Chart1/Chart1';
import Chart2 from '../Chart2/Chart2';
import Chart3 from '../Chart3/Chart3';
import Chart4 from '../Chart4/Chart4';
import GitHubLink from './GitHubLink/GitHubLink';

class App extends Component {
    render() {
        return (
            <div className={styles.root}>
                <div className={styles.title}>
                    <h1>
                        <a href="https://github.com/avin/d3-timeseries-multi-chart">d3-timeseries-multi-chart</a>
                    </h1>
                </div>
                <div className={styles.row}>
                    <Chart1 />
                    <Chart2 />
                </div>
                <div className={styles.row}>
                    <Chart3 />
                    <Chart4 />
                </div>
                <div className={styles.footer}>
                    <GitHubLink />
                </div>
            </div>
        );
    }
}

export default App;
