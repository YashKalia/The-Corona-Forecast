import Person from './person';
import { getRandom } from './util';
import {
  getInitialNumSymptomatic,
  getInitialNumSusceptable,
} from './DOM/domValues';
import {
  PERSON_RADIUS,
  POPULATION_SPEED,
  INFECTION_RADIUS,
  TIME_UNTIL_IMMUNE,
  TIME_UNTIL_SYMPTOMS,
  MORTALITY_RATE,
  TYPES,
  ASYMPTOMATIC_PROB,
  COLORS,
} from './CONSTANTS';

export default class Model {
  constructor(
    context,
    webglchart,
    width,
    height,
    numSusceptible,
    numSymptomatic,
    numAsymptomatic,
    numDead,
    numImmune,
    chart
  ) {
    // REMOVE THIS (This should be handled differently)
    this.chart = chart;
    this._chartInterval = null;
    this.webglchart = webglchart;
    this._updatePopulationFunction = null;
    this._animationFrame = null;
    this.context = context;
    this.width = width;
    this.height = height;
    this.population = [];
    this.numSusceptible = numSusceptible;
    this.numSymptomatic = numSymptomatic;
    this.numImmune = numImmune;
    this.numDead = numDead;
    this.numAsymptomatic = numAsymptomatic;
    this.asymptomaticProb = ASYMPTOMATIC_PROB;
    this.timeUntilSymptoms = TIME_UNTIL_SYMPTOMS;
    this.timeUntilImmune = TIME_UNTIL_IMMUNE;
    this.infectionRadius = INFECTION_RADIUS;
    this.personRadius = PERSON_RADIUS;
    this.totalPopulation =
      numSusceptible + numSymptomatic + numDead + numImmune + numAsymptomatic;
  }

  set setAsymptomaticProb(newValue) {
    this.asymptomaticProb = newValue;
  }

  set setTimeUntilSymptoms(newValue) {
    this.timeUntilSymptoms = newValue;
  }

  set setTimeUntilImmune(newValue) {
    this.timeUntilImmune = newValue;
  }

  set setInfectionRadius(newValue) {
    this.infectionRadius = newValue;
    this.updateInfectionRadius(newValue);
  }

  set setPersonRadius(newValue) {
    this.personRadius = newValue;
    this.updateRadius(newValue);
  }

  updateRadius(newValue) {
    for (let i = 0; i < this.totalPopulation; i++) {
      this.population[i].radius = newValue;
    }
  }

  updateInfectionRadius(newValue) {
    for (let i = 0; i < this.totalPopulation; i++) {
      this.population[i].infectionRadius = newValue;
    }
  }

  populateCanvas() {
    this.populateCanvasWithType(TYPES.SUSCEPTIBLE, this.numSusceptible);
    this.populateCanvasWithType(TYPES.SYMPTOMATIC, this.numSymptomatic);
    this.populateCanvasWithType(TYPES.DEAD, this.numDead);
    this.populateCanvasWithType(TYPES.IMMUNE, this.numImmune);
    this.populateCanvasWithType(TYPES.ASYMPTOMATIC, this.numAsymptomatic);
  }

  populateCanvasWithType(type, count) {
    for (let i = 0; i < count; i++) {
      const x = getRandom(this.personRadius, this.width - this.personRadius);
      const y = getRandom(this.personRadius, this.height - this.personRadius);
      this.population.push(new Person(type, x, y, this.context));
    }
  }

  drawPopulation() {
    let count = 0;
    for (let i = 0; i < this.totalPopulation; i++) {
      if (!this.population[i].dead) {
        this.population[i].draw();
        count++;
      }
    }
    let drawInfo = this.getDrawInfo();

    this.webglchart.draw(drawInfo.pos, drawInfo.col, count);
    //this.webglchart.draw([1.0,1.0, -1.0, -1.0], 2);
  }

  getDrawInfo() {
    let positions = [];
    let colors = [];
    for (let i = 0; i < this.totalPopulation; i++) {
      if (!this.population[i].dead) {
        positions.push(this.population[i].x);
        positions.push(this.population[i].y);
        colors.push(parseInt(this.population[i].color.slice(1,3), 16)/ 255.0);
        colors.push(parseInt(this.population[i].color.slice(3,5), 16)/ 255.0);
        colors.push(parseInt(this.population[i].color.slice(5,7), 16)/ 255.0);
        colors.push(1);
      }
    }
    return { 
      pos : positions,
      col : colors,
    };
  }

  updatePopulation() {
    for (let i = 0; i < this.totalPopulation; i += 1) {
      if (!this.population[i].dead) {
        this.population[i].maxSpeed = POPULATION_SPEED;
        this.population[i].move(this.width, this.height);
      }
    }
  }

  interactPopulation() {
    for (let i = 0; i < this.totalPopulation; i += 1) {
      for (let j = 0; j < this.totalPopulation; j += 1) {
        if (i !== j) {
          if (
            this.population[i].metWith(this.population[j], this.infectionRadius)
          ) {
            if (this.population[i].canInfect(this.population[j])) {
              this.population[i].hasSymptomaticCount += 1;
              this.infect(this.population[j]);
            }
          }
        }
      }
    }
  }

  infect(person) {
    if (Math.random() < this.asymptomaticProb) {
      person.type = TYPES.ASYMPTOMATIC;
      person.color = COLORS.ASYMPTOMATIC;
      this.numAsymptomatic += 1;
      this.numSusceptible -= 1;
    } else {
      person.type = TYPES.SYMPTOMATIC;
      person.color = COLORS.SYMPTOMATIC;
      this.numSymptomatic += 1;
      this.numSusceptible -= 1;
    }
  }

  setup() {
    const intervalFunc = () => {
      for (let i = 0; i < this.totalPopulation; i++) {
        if (!this.population[i].dead) {
          this.update(this.population[i]);
        }
      }
    };

    // Bind this so that it can access this instace variables
    this._updatePopulationFunction = setInterval(intervalFunc.bind(this), 2000);

    this._chartInterval = setInterval(
      () =>
        this.chart.updateValues(
          this.numSusceptible,
          this.numAsymptomatic,
          this.numSymptomatic,
          this.numImmune,
          this.numDead
        ),

      500
    );
  }

  // Decided to implement this in model, but could move to person
  update(person) {
    if (person.type === TYPES.ASYMPTOMATIC) {
      person.asymptomaticTime += 1;
      if (person.asymptomaticTime === this.timeUntilSymptoms) {
        person.developSymptoms();
        this.numAsymptomatic -= 1;
        this.numSymptomatic += 1;
      }
    }
    if (person.type === TYPES.SYMPTOMATIC) {
      // TODO: this is where we will split removed into dead and recovered + immune
      if (Math.random() < MORTALITY_RATE) {
        person.dead = true;
        person.color = COLORS.DEAD;
        this.numSymptomatic -= 1;
        this.numDead += 1;
      } else {
        person.symptomaticTime += 1;
        if (person.symptomaticTime === this.timeUntilImmune) {
          person.type = TYPES.IMMUNE;
          person.color = COLORS.IMMUNE;
          this.numSymptomatic -= 1;
          this.numImmune += 1;
        }
      }
    }
  }

  loop() {
    this._animationFrame = requestAnimationFrame(this.loop.bind(this));
    this.context.clearRect(0, 0, this.width, this.height);

    // applyForces();
    this.updatePopulation();
    this.interactPopulation();
    this.drawPopulation();
  }

  resetModel() {
    // Get values for new run
    const newInitSusceptable = getInitialNumSusceptable();
    const newInitSymptomatic = getInitialNumSymptomatic();

    // clear the current running interval
    clearInterval(this._updatePopulationFunction);
    clearInterval(this._chartInterval);
    cancelAnimationFrame(this._animationFrame);

    // reset chart
    this.chart.resetChart(newInitSusceptable, newInitSymptomatic);

    // Set new values and reset to init
    this.population = [];
    this.numSusceptible = newInitSusceptable;
    this.numSymptomatic = newInitSymptomatic;
    this.numImmune = 0;
    this.numAsymptomatic = 0;
    this.totalPopulation = newInitSusceptable + newInitSymptomatic;

    // clear the canvas
    this.context.clearRect(0, 0, this.width, this.height);

    // start the loop again
    this.populateCanvas();
    this.updateInfectionRadius(this.infectionRadius);
    this.updateRadius(this.personRadius);
    this.drawPopulation();

    this.setup();
    this.loop();
  }
}
