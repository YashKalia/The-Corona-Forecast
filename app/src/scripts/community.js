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

import Person from './person';
import { getRandom, gaussianRand } from './util';
import { assignDemographic } from './demographic';
import presetsManager from './presetsManager';
import Stats from './data/stats';
import BoundingBoxStructure from './boundingBox';
import Coordinate from './data/coordinate';
import { TYPES, COLORS } from './CONSTANTS';

/** @class Community describing a single community within the model. */
export default class Community {
  /**
   * Instatiates a Community.
   *
   * @constructor
   * @param {number} id The ID which can be used to refer to the community.
   * @param {Bounds} bounds An object representing the bounds of the community.
   * @param {Stats} stats The stats object for the community.
   * @param {function} registerRelocation A function to call when a person is relocating.
   */
  constructor(id, bounds, stats, registerRelocation) {
    this.registerRelocation = registerRelocation;

    // Intervals
    this._updatePopulationInterval = null;

    // this._animationFrame = null; TODO you removed this!
    this.lastTimestamp = null;

    // state methods from main
    this.id = id;
    this.spareRandom = null;

    this.startX = bounds.startX;
    this.endX = bounds.endX;
    this.startY = bounds.startY;
    this.endY = bounds.endY;

    this.population = [];
    this.numSusceptible = stats.susceptible;
    this.numInfectious = stats.infectious;
    this.numNonInfectious = stats.noninfectious;
    this.numImmune = stats.immune;
    this.numDead = stats.dead;
    this.icuCount = stats.icu;

    this.nonInfectiousToImmuneProb = presetsManager.loadPreset().NONIN_TO_IMMUNE_PROB;
    this.infectionRadius = presetsManager.loadPreset().INFECTION_RADIUS;
    this.personRadius = presetsManager.loadPreset().PERSON_RADIUS;
    this.transmissionProb = presetsManager.loadPreset().TRANSMISSION_PROB;
    this.repulsionForce = presetsManager.loadPreset().REPULSION_FORCE;
    this.attractionToCenter = presetsManager.loadPreset().ATTRACTION_FORCE;

    this.minIncubationTime = presetsManager.loadPreset().MIN_INCUBATION_TIME;
    this.maxIncubationTime = presetsManager.loadPreset().MAX_INCUBATION_TIME;

    this.minInfectiousTime = presetsManager.loadPreset().MIN_INFECTIOUS_TIME;
    this.maxInfectiousTime = presetsManager.loadPreset().MAX_INFECTIOUS_TIME;

    this.minTimeUntilDead = presetsManager.loadPreset().MIN_TIME_UNTIL_DEAD;
    this.maxTimeUntilDead = presetsManager.loadPreset().MAX_TIME_UNTIL_DEAD;

    this.maxSpeed = presetsManager.loadPreset().POPULATION_SPEED;
    this.daysPerSecond = presetsManager.loadPreset().DAYS_PER_SECOND;
    this.relocationProbability = presetsManager.loadPreset().RELOCATION_PROBABILITY;

    this.testedPositiveProbability = presetsManager.loadPreset().TESTED_POSITIVE_PROBABILITY;
    this.infectionRadiusReductionFactor = presetsManager.loadPreset().INFECTION_RADIUS_REDUCTION_FACTOR;
    this.icuProbability = presetsManager.loadPreset().ICU_PROBABILITY;
    this.icuCapacity = presetsManager.loadPreset().ICU_CAPACITY;

    this.totalPopulation =
      this.numSusceptible +
      this.numInfectious +
      this.numDead +
      this.numImmune +
      this.numNonInfectious;

    this.boundingBoxStruct = new BoundingBoxStructure(
      this.startX,
      this.endX,
      this.startY,
      this.endY,
      presetsManager.loadPreset().INFECTION_RADIUS
    );
    // this._drawBorderLines();
  }

  /**
   * A function to draw the borders of the community on the screen.
   * 
   * @param {Object} borderCtx The context of the canvas on which the borders are drawn.
   */
  _drawBorderLines(borderCtx) {
    // These lines are drawm from the edge coordinates of the model and make up the boundary of the
    // communities which are drawn on a canvas other than the agent canvas and can be drawn
    // automatically regardless of how many models there are.
    borderCtx.strokeStyle = 'white';
    borderCtx.strokeRect(
      this.startX,
      this.startY,
      this.endX - this.startX,
      this.endY - this.startY
    );
  }

  /**
   * A function to reload the given preset.
   */
  reloadPreset() {
    this.personRadius = presetsManager.loadPreset().PERSON_RADIUS;
    this.nonInfectiousToImmuneProb = presetsManager.loadPreset().NONIN_TO_IMMUNE_PROB;
    this.infectionRadius = presetsManager.loadPreset().INFECTION_RADIUS;
    this.transmissionProb = presetsManager.loadPreset().TRANSMISSION_PROB;
    this.repulsionForce = presetsManager.loadPreset().REPULSION_FORCE;
    this.attractionToCenter = presetsManager.loadPreset().ATTRACTION_FORCE;
    this.minIncubationTime = presetsManager.loadPreset().MIN_INCUBATION_TIME;
    this.maxIncubationTime = presetsManager.loadPreset().MAX_INCUBATION_TIME;
    this.minInfectiousTime = presetsManager.loadPreset().MIN_INFECTIOUS_TIME;
    this.maxInfectiousTime = presetsManager.loadPreset().MAX_INFECTIOUS_TIME;
    this.minTimeUntilDead = presetsManager.loadPreset().MIN_TIME_UNTIL_DEAD;
    this.maxTimeUntilDead = presetsManager.loadPreset().MAX_TIME_UNTIL_DEAD;
    this.maxSpeed = presetsManager.loadPreset().POPULATION_SPEED;
    this.daysPerSecond = presetsManager.loadPreset().DAYS_PER_SECOND;
    this.relocationProbability = presetsManager.loadPreset().RELOCATION_PROBABILITY;
  }

  /**
   * A function setting the attraction to the center.
   *
   * @param {number} newValue The new attraction to the center in the community.
   */
  setAttractionToCenter(newValue) {
    this.attractionToCenter = newValue;
  }

  /**
   * A function setting the force with which people repel each other.
   *
   * @param {number} newValue The new Repulsion force.
   */
  setRepulsionForce(newValue) {
    this.repulsionForce = newValue;
    this.updateRepulsionForce(newValue);
  }

  /**
   * A function to handle a person relocating to another community.
   *
   * @param {Person} person The person leaving the community.
   */
  handlePersonLeaving(person) {
    this.totalPopulation--;

    this.population = this.population.filter((p) => p !== person);

    this.boundingBoxStruct.remove(person);

    if (person.inIcu) {
      this.icuCount--;
    }

    switch (person.type) {
      case TYPES.SUSCEPTIBLE:
        if (this.numSusceptible < 0) {
          throw Error('Why?');
        }
        this.numSusceptible--;
        break;
      case TYPES.NONINFECTIOUS:
        this.numNonInfectious--;
        break;
      case TYPES.INFECTIOUS:
        this.numInfectious--;
        break;
      case TYPES.IMMUNE:
        this.numImmune--;
        break;
      case TYPES.DEAD:
        this.numDead--;
        break;
      default:
        throw new Error('Person of unknown type was encountered');
    }
  }

  /**
   * A function to handle a person relocating to this Community.
   *
   * @param {Person} person The person joining this community.
   */
  handlePersonJoining(person) {
    this.totalPopulation++;

    if (this.population.includes(person)) {
      throw Error('But im already here');
    }

    person._handleXOutOfBounds(this.startX, this.endX);
    person._handleYOutOfBounds(this.startY, this.endY);

    this.boundingBoxStruct.insert(person);

    this.population.push(person);

    if (person.inIcu) {
      this.icuCount++;
    }

    switch (person.type) {
      case TYPES.SUSCEPTIBLE:
        this.numSusceptible++;
        break;
      case TYPES.NONINFECTIOUS:
        this.numNonInfectious++;
        break;
      case TYPES.INFECTIOUS:
        this.numInfectious++;
        break;
      case TYPES.IMMUNE:
        this.numImmune++;
        break;
      case TYPES.DEAD:
        this.numDead++;
        break;
      default:
        throw new Error('Person of unknown type was encountered');
    }
  }

  /**
   * A function to set the probability of transmission between people.
   *
   * @param {number} newValue The new probability of transmission.
   */
  setTransmissionProb(newValue) {
    this.transmissionProb = newValue;
  }

  /**
   * A function to set the probability for a person to move from the Non-Infectious state to the Immune state.
   *
   * @param {number} newValue The new probability for this state transition.
   */
  setNonInToImmuneProb(newValue) {
    this.nonInfectiousToImmuneProb = newValue;
  }

  /**
   * A function to set the minimum time to move from the Non-Infectious state to the Infectious state in this community.
   *
   * @param {number} newValue The new minimum incubation time.
   */
  setMinIncubationTime(newValue) {
    this.minIncubationTime = newValue;
  }

  /**
   * A function to set the maximum time to move from the Non-Infectious state to the Infectious state in this community.
   *
   * @param {number} newValue The new maximum incubation time.
   */
  setMaxIncubationTime(newValue) {
    this.maxIncubationTime = newValue;
  }

  /**
   * A function to set the minimum time to move from the Infectious state to the Immune state in this community.
   *
   * @param {number} newValue The new minimum infectious period.
   */
  setMinInfectiousTime(newValue) {
    this.minInfectiousTime = newValue;
  }

  /**
   * A function to set the maximum time to move from the Infectious state to the Immune state in this community.
   *
   * @param {number} newValue The new maximum infectious period.
   */
  setMaxInfectiousTime(newValue) {
    this.maxInfectiousTime = newValue;
  }

  /**
   * A function to set the minimum time to move from the Infectious state to the Dead state in this community.
   *
   * @param {number} newValue The new minimum time to death.
   */
  setMinTimeUntilDead(newValue) {
    this.minTimeUntilDead = newValue;
  }

  /**
   * A function to set the maximum time to move from the Infectious state to the Dead state in this community.
   *
   * @param {*} newValue The new maximum time to death.
   */
  setMaxTimeUntilDead(newValue) {
    this.maxTimeUntilDead = newValue;
  }

  /**
   * A function to set the infection radius in this community.
   *
   * @param {number} newValue The new Infection radius.
   */
  setInfectionRadius(newValue) {
    this.infectionRadius = newValue;
    this.updateInfectionRadius(newValue);
  }

  /**
   * A function to set the person radius in this community.
   *
   * @param {number} newValue The new radius of the people.
   */
  setPersonRadius(newValue) {
    this.personRadius = newValue;
    this.updateRadius(newValue);
  }

  /**
   * A function to set the probability an Infectious person tests positive in this community.
   *
   * @param {number} newValue The new probability for testing positive.
   */
  setTestedPositiveProbability(newValue) {
    this.testedPositiveProbability = newValue;
  }

  /**
   * A function to set the factor by which the infection radius of a tested person is reduced.
   *
   * @param {number} newValue The new reduction factor.
   */
  setInfectionRadiusReductionFactor(newValue) {
    this.infectionRadiusReductionFactor = newValue;
  }

  /**
   * A function to set the probabilty a tested person moves to the ICU.
   *
   * @param {number} newValue The new probability of a person moving to the ICU.
   */
  setIcuProbability(newValue) {
    this.icuProbability = newValue;
  }

  /**
   * A function to set the capacity of the ICU for this community.
   *
   * @param {number} newValue The new capacity of the ICU.
   */
  setIcuCapacity(newValue) {
    this.icuCapacity = newValue;
  }

  /**
   * Method used to update the stats in main
   */
  exportStats() {
    const stats = new Stats(
      this.numSusceptible,
      this.numNonInfectious,
      this.numInfectious,
      this.numDead,
      this.numImmune,
      this.icuCount
    );
    return stats;
  }

  /**
   * Update the radius of people in this community.
   *
   * @param {number} newValue The new radius.
   */
  updateRadius(newValue) {
    for (const person of this.population) {
      person.radius = newValue;
    }
  }

  /**
   * Update the infection radius of people in this community.
   *
   * @param {number} newValue The new infection radius.
   */
  updateInfectionRadius(newValue) {
    this.boundingBoxStruct = new BoundingBoxStructure(
      this.startX,
      this.endX,
      this.startY,
      this.endY,
      newValue
    );
    for (const person of this.population) {
      person.infectionRadius = newValue;
      this.boundingBoxStruct.insert(person);
    }
  }

  /**
   * Update the repulsion force of the people in this community.
   *
   * @param {number} newValue The new repulsion force.
   */
  updateRepulsionForce(newValue) {
    for (const person of this.population) {
      person.repulsionForce = newValue;
    }
  }

  /**
   * A function to create a population
   */
  populateCanvas() {
    this.populateCanvasWithType(TYPES.SUSCEPTIBLE, this.numSusceptible);
    this.populateCanvasWithType(TYPES.INFECTIOUS, this.numInfectious);
    this.populateCanvasWithType(TYPES.DEAD, this.numDead);
    this.populateCanvasWithType(TYPES.IMMUNE, this.numImmune);
    this.populateCanvasWithType(TYPES.NONINFECTIOUS, this.numNonInfectious);
  }

  /**
   * A function to create the part of the population which consists of one type
   *
   * @param {TYPES} type The initial state of this part of the population.
   * @param {number} count The amount of people in this part of the population.
   */
  populateCanvasWithType(type, count) {
    for (let i = 0; i < count; i++) {
      const x = getRandom(
        this.startX + this.personRadius,
        this.endX - this.personRadius
      );
      const y = getRandom(
        this.startY + this.personRadius,
        this.endY - this.personRadius
      );
      const newPerson = new Person(type, x, y, this.id);
      assignDemographic(newPerson);
      this.population.push(newPerson);
      this.boundingBoxStruct.insert(newPerson);
    }
  }

  /**
   * A function to get the info required to render this community.
   *
   * @returns {Object} An object containing all necessary information for rendering this community.
   */
  getDrawInfo() {
    const positions = [];
    const colors = [];
    let count = 0;
    for (const person of this.population) {
      if (!(person.type === TYPES.DEAD)) {
        positions.push(person.x);
        positions.push(person.y);
        colors.push(parseInt(person.color.slice(1, 3), 16) / 255.0);
        colors.push(parseInt(person.color.slice(3, 5), 16) / 255.0);
        colors.push(parseInt(person.color.slice(5, 7), 16) / 255.0);
        colors.push(1);
        count++;
      }
    }
    return {
      positions: positions,
      colors: colors,
      size: this.personRadius,
      count: count,
    };
  }

  /**
   * A function to handle all necessary actions to advance this community in time.
   *
   * @param {number} dt The timestep over which to update the population.
   */
  updatePopulation(dt) {
    for (let i = 0; i < this.totalPopulation; i += 1) {
      const currentPerson = this.population[i];
      this.update(currentPerson, dt);

      if (
        getRandom() < presetsManager.loadPreset().RELOCATION_PROBABILITY &&
        !currentPerson.relocating
      ) {
        if (currentPerson.type !== TYPES.DEAD) {
          this.registerRelocation(currentPerson);
          currentPerson.relocating = true;
        }
      } else if (!currentPerson.relocating) {
        this.boundingBoxStruct.remove(currentPerson);
        currentPerson.maxSpeed = this.maxSpeed;
        this.attractToCenter(currentPerson);
        currentPerson.move(
          this.startX,
          this.endX,
          this.startY,
          this.endY,
          dt * presetsManager.loadPreset().MOVEMENT_TIME_SCALAR
        );
        this.boundingBoxStruct.insert(currentPerson);
      }
    }
  }

  /**
   * A function returning a random point in this community.
   *
   * @returns {Coordinate} A random coordinate within this model and the margin of error for relocation
   */
  getRandomPoint() {
    const { RELOCATION_ERROR_MARGIN } = presetsManager.loadPreset();
    return new Coordinate(
      getRandom(
        this.startX + RELOCATION_ERROR_MARGIN,
        this.endX - RELOCATION_ERROR_MARGIN
      ),
      getRandom(
        this.startY + RELOCATION_ERROR_MARGIN,
        this.endY - RELOCATION_ERROR_MARGIN
      )
    );
  }

  /**
   * A function handling the interactions between the people of the population
   *
   * @param {number} dt The timestep over which the interactions take place.
   */
  interactPopulation(dt) {
    for (let i = 0; i < this.totalPopulation; i += 1) {
      const met = this.boundingBoxStruct.query(
        this.population[i],
        presetsManager.loadPreset().INTERACTION_RANGE
      );
      for (let j = 0; j < met.length; j += 1) {
        // Social distancing
        // if (this.population[i].type !== TYPES.DEAD && met[j] !== TYPES.DEAD) {
        this.population[i].repel(met[j]);
        // }

        // Infection-once an agent is infected there is a chance they will be tested positive.
        if (
          this.population[i].canInfect(met[j]) &&
          getRandom() <= this.transmissionProb * dt
        ) {
          met[j].startIncubation();
          met[j].setIncubationPeriod(
            gaussianRand(this.minIncubationTime, this.maxIncubationTime)
          );
          this.numNonInfectious += 1;
          this.numSusceptible -= 1;
        }
      }
    }
  }

  // Decided to implement this in model, but could move to person
  /**
   * A function handling the updates for a person.
   *
   * @param {Person} person The person for which the update is to be done.
   * @param {number} dt The timestep over which the update is to be calculated.
   */
  update(person, dt) {
    if (person.type === TYPES.NONINFECTIOUS) {
      person.incubationTime += dt;
      if (person.incubationTime >= person.incubationPeriod) {
        if (getRandom() < this.nonInfectiousToImmuneProb) {
          person.becomesImmune();
          this.numNonInfectious -= 1;
          this.numImmune += 1;
        } else {
          person.becomesInfectious();
          this.numNonInfectious -= 1;
          this.numInfectious += 1;
        }
      }
    } else if (person.type === TYPES.INFECTIOUS) {
      if (!person.destinyDead && !person.destinyImmune) {
        if (person.mortalityRate > 0 && getRandom() <= person.mortalityRate) {
          person.destinyDead = true;
          person.setInfectiousPeriod(
            gaussianRand(this.minTimeUntilDead, this.maxTimeUntilDead)
          );
        } else {
          person.destinyImmune = true;
          person.setInfectiousPeriod(
            gaussianRand(this.minInfectiousTime, this.maxInfectiousTime)
          );
        }

        // testing
        if (getRandom() <= this.testedPositiveProbability) {
          person.testedPositive = true;
          person.infectionRadius /= this.infectionRadiusReductionFactor;
        }
        // ICU
        if (getRandom() <= this.icuProbability && person.mortalityRate > 0) {
          person.inIcu = true;
          if (this.icuCount >= this.icuCapacity) {
            person.type = TYPES.DEAD;
            person.color = COLORS.DEAD;
            this.numInfectious -= 1;
            this.numDead += 1;
          } else {
            this.icuCount += 1;
          }
        }
      } else if (person.destinyImmune) {
        person.infectiousTime += dt;
        if (person.infectiousTime >= person.infectiousPeriod) {
          person.type = TYPES.IMMUNE;
          person.color = COLORS.IMMUNE;
          this.numInfectious -= 1;
          this.numImmune += 1;
          if (person.inIcu) {
            this.icuCount -= 1;
          }
        }
      } else {
        person.infectiousTime += dt;
        if (person.infectiousTime >= person.infectiousPeriod) {
          // person.dead = true;
          person.type = TYPES.DEAD;
          person.color = COLORS.DEAD;
          this.numInfectious -= 1;
          this.numDead += 1;
          if (person.inIcu) {
            this.icuCount -= 1;
          }
        }
      }
    }
  }

  /**
   * A function to step through the community with a timestep.
   *
   * @param {number} dt The timestep for which to step.
   */
  step(dt) {
    if (dt < 0) {
      throw Error("Can't go back in time");
    }
    const daysPassed = dt;
    this.updatePopulation(daysPassed);
    this.interactPopulation(daysPassed);
  }

  /**
   * A function to pause execution of the community.
   */

  pauseExecution() {
    clearInterval(this._updatePopulationInterval);
    this._updatePopulationInterval = null;
  }

  /**
   * A function to resume execution of the community.
   */
  resumeExecution() {
    this.step(0); // TODO what is the value of timestamp parameter
  }

  /**
   * A function to attract a person in the community to its center
   * @param {Person} person The person to be attracted to the center of the community.
   */
  attractToCenter(person) {
    // get vector to center
    let forceX = (this.startX + this.endX) / 2.0 - person.x;
    let forceY = (this.startY + this.endY) / 2.0 - person.y;
    // normalize vector to center
    const maxDistance = Math.sqrt(
      ((this.startX + this.endX) / 2) ** 2 +
        ((this.startY + this.endY) / 2) ** 2
    );
    forceX /= maxDistance;
    forceY /= maxDistance;

    person.applyForce(
      (this.attractionToCenter * forceX) / 100,
      (this.attractionToCenter * forceY) / 100
    );
  }

  /**
   * A function to reset the community.
   *
   * @param {Stats} stats the new Initial stats for the Community.
   */
  resetCommunity(stats) {
    // Set new values and reset to init
    this.population = [];
    this.numSusceptible = stats.susceptible;
    this.numInfectious = stats.infectious;
    this.numImmune = stats.immune;
    this.numNonInfectious = stats.noninfectious;
    this.icuCount = stats.icu;
    this.numDead = stats.dead;
    this.totalPopulation = stats.susceptible + stats.infectious;

    // clear the canvas

    // start the loop again
    this.populateCanvas();
    this.updateInfectionRadius(this.infectionRadius);
    this.updateRadius(this.personRadius);
    // this._drawBorderLines();
  }
}
