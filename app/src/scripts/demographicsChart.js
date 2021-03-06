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

import Chart from 'chart.js';
import presetsManager from './presetsManager';
import { COLORS, TYPES, GENDERS } from './CONSTANTS';

/**
 * A function to retrieve the age from the preset.
 *
 * @returns {number} The age.
 */
function getAge() {
  return presetsManager.loadPreset().AGE;
}

/** @class DemographicsChart describing the chart displaying the different demographics. */
export default class DemographicsChart {
  /**
   * Constructor for the demograpgics chart
   * @param {Context} ctx the context of the canvas where the chart will be drawn
   */
  constructor(ctx) {
    this.demographicChart = null;
    this.ctx = ctx;
    this.labels = getAge().map((val) => this._formatLabel(val.min, val.max));

    // DEBUG
    window.demographic = this;
  }

  /**
   * A function to update the chart.
   *
   * @param {Person[]} population An array representing the population.
   */
  receiveUpdate(population) {
    // Do logic
    // num dead per age per gender
    let index = 0;
    this.labels.forEach((label) => {
      const [min, max] = this._getMinMaxFromLabel(label);

      const susceptiblePeopleInAgeRange = population
        .filter((p) => p.type === TYPES.SUSCEPTIBLE)
        .filter((p) => min <= p.age && p.age <= max);

      const nonInfectiousPeopleInAgeRange = population
        .filter((p) => p.type === TYPES.NONINFECTIOUS)
        .filter((p) => min <= p.age && p.age <= max);

      const infectiousPeopleInAgeRange = population
        .filter((p) => p.type === TYPES.INFECTIOUS)
        .filter((p) => min <= p.age && p.age <= max);

      const immunePeopleInAgeRange = population
        .filter((p) => p.type === TYPES.IMMUNE)
        .filter((p) => min <= p.age && p.age <= max);

      const deadPeopleInAgeRange = population
        .filter((p) => p.type === TYPES.DEAD)
        .filter((p) => min <= p.age && p.age <= max);

      this.demographicChart.data.datasets[0].data[index] = -this._getMaleCount(
        susceptiblePeopleInAgeRange
      );
      this.demographicChart.data.datasets[1].data[index] = this._getFemaleCount(
        susceptiblePeopleInAgeRange
      );
      this.demographicChart.data.datasets[2].data[index] = -this._getMaleCount(
        nonInfectiousPeopleInAgeRange
      );
      this.demographicChart.data.datasets[3].data[index] = this._getFemaleCount(
        nonInfectiousPeopleInAgeRange
      );
      this.demographicChart.data.datasets[4].data[index] = -this._getMaleCount(
        infectiousPeopleInAgeRange
      );
      this.demographicChart.data.datasets[5].data[index] = this._getFemaleCount(
        infectiousPeopleInAgeRange
      );
      this.demographicChart.data.datasets[6].data[index] = -this._getMaleCount(
        immunePeopleInAgeRange
      );
      this.demographicChart.data.datasets[7].data[index] = this._getFemaleCount(
        immunePeopleInAgeRange
      );
      this.demographicChart.data.datasets[8].data[index] = -this._getMaleCount(
        deadPeopleInAgeRange
      );
      this.demographicChart.data.datasets[9].data[index] = this._getFemaleCount(
        deadPeopleInAgeRange
      );

      index++;
    });
    this.demographicChart.update();
  }

  /**
   * A function to get the amount of males in a population.
   *
   * @param {Person[]} population An array representing the population.
   */
  _getMaleCount(population) {
    let maleCount = 0;
    for (let i = 0; i < population.length; i++) {
      if (population[i].gender === GENDERS.MALE) {
        maleCount++;
      }
    }
    return maleCount;
  }

  /**
   * A function to get the amount of females in a population.
   *
   * @param {Person[]} population An array representing the population.
   */
  _getFemaleCount(population) {
    let femaleCount = 0;
    for (let i = 0; i < population.length; i++) {
      if (population[i].gender === GENDERS.FEMALE) {
        femaleCount++;
      }
    }
    return femaleCount;
  }

  /**
   * Formates an age range label like: <min - max>
   * @param {Number} min min age
   * @param {Number} max max age
   * @returns formatted label
   */
  _formatLabel(min, max) {
    return `${min} - ${max}`;
  }

  /**
   * Gets the ranges from a formatted age range label
   * @param {Number} label age range label
   * @returns [min, max] two item array containing the min and max of that age range label
   */
  _getMinMaxFromLabel(label) {
    return label.split(' - ').map((item) => parseInt(item, 10));
  }

  /**
   * A function to reset the chart.
   *
   * @param {number} populationSize The size of the population.
   */
  resetChart(populationSize) {
    this.demographicChart.destroy();
    this.labels = getAge().map((val) => this._formatLabel(val.min, val.max));
    this.drawChart(populationSize);
  }

  /**
   * A function that draws the demographics chart given the population of the model
   * @param {Array.<Person>} population the population of all communities combined
   */
  drawChart(populationSize) {
    const onePercent = Math.ceil(populationSize / (20 * 10)) * 10;
    this.demographicChart = new Chart(this.ctx, {
      type: 'horizontalBar',
      data: {
        labels: this.labels,
        datasets: [
          {
            label: 'Male Susceptible',
            backgroundColor: COLORS.SUSCEPTIBLE,
            borderColor: COLORS.SUSCEPTIBLE,
            stack: 'a',
          },

          {
            label: 'Female Susceptible',
            backgroundColor: COLORS.SUSCEPTIBLE,
            borderColor: COLORS.SUSCEPTIBLE,
            stack: 'a',
          },

          {
            label: 'Male Non-Infectious',
            backgroundColor: COLORS.NONINFECTIOUS,
            borderColor: COLORS.NONINFECTIOUS,
            stack: 'a',
          },

          {
            label: 'Female Non-Infectious',
            backgroundColor: COLORS.NONINFECTIOUS,
            borderColor: COLORS.NONINFECTIOUS,
            stack: 'a',
          },

          {
            label: 'Male Infectious',
            backgroundColor: COLORS.INFECTIOUS,
            borderColor: COLORS.INFECTIOUS,
            stack: 'a',
          },

          {
            label: 'Female Infectious',
            backgroundColor: COLORS.INFECTIOUS,
            borderColor: COLORS.INFECTIOUS,
            stack: 'a',
          },

          {
            label: 'Male Immune',
            backgroundColor: COLORS.IMMUNE,
            borderColor: COLORS.IMMUNE,
            stack: 'a',
          },

          {
            label: 'Female Immune',
            backgroundColor: COLORS.IMMUNE,
            borderColor: COLORS.IMMUNE,
            stack: 'a',
          },

          {
            label: 'Male Dead',
            backgroundColor: COLORS.DEAD,
            borderColor: COLORS.DEAD,
            stack: 'a',
          },

          {
            label: 'Female Dead',
            backgroundColor: COLORS.DEAD,
            borderColor: COLORS.DEAD,
            stack: 'a',
          },
        ],
      },

      // Configuration options go here
      options: {
        legend: {
          display: false,
        },
        title: {
          display: false,
        },
        responsive: false,
        tooltips: { enabled: false },
        hover: { mode: null },
        scales: {
          xAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: 'Number of people',
              },
              stacked: true,
              ticks: {
                beginAtZero: true,
                stepValue: 5,
                max: onePercent,
                min: -onePercent,
                callback: (value) => Math.abs(value),
              },
            },
          ],
          yAxes: [
            {
              scaleLabel: {
                display: true,
                labelString: 'Age category',
              },
              stacked: true,
              ticks: {
                callback: (value) => (value < 0 ? -value : value),
              },
            },
          ],
        },
      },
    });
  }
}
