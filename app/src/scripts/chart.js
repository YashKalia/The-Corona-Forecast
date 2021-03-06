/*
Licensed to the Apache Software Foundation (ASF) under one
or more contributor license agreements.  See the NOTICE file
distributed with this work for additional information
regarding copyright ownership.  The ASF licenses this file
to you under the Apache License, Version 2.0 (the
"License"); you may not use this file except in compliance
with the License.  You may obtain a copy of the License at

  http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing,
software distributed under the License is distributed on an
"AS IS" BASIS, WITHOUT WARRANTIES OR CONDITIONS OF ANY
KIND, either express or implied.  See the License for the
specific language governing permissions and limitations
under the License.
*/

import ChartJS from 'chart.js';
import { COLORS } from './CONSTANTS';

/** @class Chart describing the line chart used to represent our data. */
export default class Chart {
  /**
   * Instantiates a Chart.
   *
   * @constructor
   * @param {Object} ctx The context in which the chart is displayed.
   * @param {function} getStats A function allowing us to retrieve a stats object which we want to graph.
   */
  constructor(ctx, getStats) {
    this.ctx = ctx;
    this.getStats = getStats;

    this.x = 1; // TODO use a timescale instead at some point
    this.chart = null;
    this.susceptible = [];
    this.noninfectious = [];
    this.infectious = [];
    this.immune = [];
    this.dead = [];
    this.xValues = [];
  }

  /**
   * A function to retrieve all the data represented in the chart.
   * 
   * @returns {Object} An object containing all data in the chart.
   */
  getAllDataPoints() {
    const data = {};
    for (let i = 0; i < this.xValues.length; i++) {
      data[this.xValues[i]] = {
        susceptible: this.susceptible[i],
        infectious: this.infectious[i],
        noninfectious: this.noninfectious[i],
        immune: this.immune[i],
        dead: this.dead[i],
      };
    }
    return data;
  }

  /**
   * A function getting the size of the total population represented in the chart.
   *
   * @returns {number} The size of the total population.
   */
  getTotalPopulation() {
    return this.getStats().sum();
  }

  /**
   * A function allowing us to reset the chart to a new starting state.
   *
   * @param {number} newInitSusceptible The initial amount of susceptible people.
   * @param {number} newInitInfectious The initial amount of infectious people.
   */
  resetChart(newInitSusceptible, newInitInfectious) {
    this.x = 1;
    this.susceptible = [newInitSusceptible];
    this.noninfectious = [];
    this.infectious = [newInitInfectious];
    this.immune = [];
    this.dead = [];
    this.xValues = [];
    this.chart.update();
    this.chart.destroy();
    this.drawChart();
  }

  /**
   * A function updating the values in the chart.
   *
   * @param {Stats} stats a stats object holding the new values.
   */
  updateValues(stats, timestamp) {
    const time = timestamp.toFixed(0);
    this.chart.data.datasets[0].data.push(stats.infectious);
    this.chart.data.datasets[1].data.push(stats.noninfectious);
    this.chart.data.datasets[2].data.push(stats.susceptible);
    this.chart.data.datasets[3].data.push(stats.immune);
    this.chart.data.datasets[4].data.push(stats.dead);

    this.noninfectious.push(stats.noninfectious);
    this.infectious.push(stats.infectious);
    this.susceptible.push(stats.susceptible);
    this.immune.push(stats.immune);
    this.dead.push(stats.dead);

    // What is x?
    this.chart.data.labels.push(time);
    this.xValues.push(time);
    this.chart.update();
  }

  /**
   * A function to initially draw the chart on the screen.
   */
  drawChart() {
    this.chart = new ChartJS(this.ctx, {
      type: 'line',
      data: {
        labels: this.xValues,
        datasets: [
          {
            label: 'Infectious',
            fill: true,
            backgroundColor: COLORS.INFECTIOUS,
            pointBackgroundColor: COLORS.INFECTIOUS,
            pointHighlightStroke: COLORS.INFECTIOUS,
            borderCapStyle: 'butt',
            lineCap: 'butt',
            pointStyle: 'line',
            data: this.infectious,
            lineTension: 0.1,
            borderColor: 'rgba(0, 0, 0, 0.0)',
            pointRadius: 0.0,
          },
          {
            label: 'Non-Infectious',
            fill: true,
            backgroundColor: COLORS.NONINFECTIOUS,
            pointBackgroundColor: COLORS.NONINFECTIOUS,
            pointHighlightStroke: COLORS.NONINFECTIOUS,
            borderCapStyle: 'butt',
            lineCap: 'butt',
            pointStyle: 'line',
            data: this.noninfectious,
            lineTension: 0.1,
            borderColor: 'rgba(0, 0, 0, 0.0)',
            pointRadius: 0.0,
          },
          {
            label: 'Susceptible',
            fill: true,
            backgroundColor: COLORS.SUSCEPTIBLE,
            pointBackgroundColor: COLORS.SUSCEPTIBLE,
            pointHighlightStroke: COLORS.SUSCEPTIBLE,
            borderCapStyle: 'butt',
            lineCap: 'butt',
            data: this.susceptible,
            pointStyle: 'line',
            lineTension: 0.1,
            borderColor: 'rgba(0, 0, 0, 0.0)',
            pointRadius: 0.0,
          },
          {
            label: 'Immune',
            fill: true,
            backgroundColor: COLORS.IMMUNE,
            pointBackgroundColor: COLORS.IMMUNE,
            pointHighlightStroke: COLORS.IMMUNE,
            borderCapStyle: 'butt',
            lineCap: 'butt',
            pointStyle: 'line',
            lineTension: 0.1,
            borderColor: 'rgba(0, 0, 0, 0.0)',
            pointRadius: 0.0,
            data: this.immune,
          },
          {
            label: 'Dead',
            fill: true,
            backgroundColor: COLORS.DEAD,
            pointBackgroundColor: COLORS.DEAD,
            pointHighlightStroke: COLORS.DEAD,
            borderCapStyle: 'butt',
            lineCap: 'butt',
            pointRadius: 0.0,
            pointStyle: 'line',
            data: this.dead,
            lineTension: 0.1,
            borderColor: 'rgba(0, 0, 0, 0.0)',
          },
        ],
      },
      options: {
        responsive: false,
        tooltips: { enabled: false },
        hover: { mode: null },
        // Can't just just `stacked: true` like the docs say
        scales: {
          yAxes: [
            {
              display: true,
              ticks: {
                beginAtZero: true,
                steps: this.getTotalPopulation() / 10, // Check if this is still nice
                stepValue: 5,
                // Get the grand total so that the chart is accurate
                // Round to the closest 50 so that the chart is elegant
                max: Math.round(this.getTotalPopulation() / 50) * 50,
              },
              stacked: true,
            },
          ],
        },
        animation: {
          duration: 0,
          easing: 'linear',
        },
      },
    });
  }
}
