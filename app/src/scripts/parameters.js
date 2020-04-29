import {
  TIME_UNTIL_SYMPTOMS,
  TIME_UNTIL_DETECTION,
  INFECTION_RADIUS,
  ASYMPTOMATIC_PROB,
  PERSON_RADIUS,
  INITIAL_SUSCEPTABLE,
  INITIAL_INFECTED,
} from './CONSTANTS';

export function wireSlidersToHandlers(model) {
  // TimeToSymptoms
  const timeUntilSymptomsHTML = document.getElementById('timeToSymptoms');
  const timeUntilSymptomsOutputHTML = document.getElementById(
    'timeToSymptomsOut'
  );
  timeUntilSymptomsHTML.value = TIME_UNTIL_SYMPTOMS;
  timeUntilSymptomsOutputHTML.value = `${TIME_UNTIL_SYMPTOMS} days`;
  timeUntilSymptomsHTML.addEventListener('change', (e) => {
    const newVal = e.target.value;
    model.setTimeUntilSymptoms = newVal;
    timeUntilSymptomsOutputHTML.value = `${newVal} days`;
  });

  // timeUntilDetection
  const timeUntilDetectionHTML = document.getElementById('timeUntilDetection');
  const timeUntilDetectionOutputHTML = document.getElementById(
    'timeUntilDetectionOut'
  );
  timeUntilDetectionHTML.value = TIME_UNTIL_DETECTION;
  timeUntilDetectionOutputHTML.value = `${TIME_UNTIL_DETECTION} days`;
  timeUntilDetectionHTML.addEventListener('change', (e) => {
    const newVal = e.target.value;
    model.setTimeUntilDetection = newVal;
    timeUntilDetectionOutputHTML.value = `${newVal} days`;
  });

  // infectionCircleRadius
  const infectionCircleRadiusHTML = document.getElementById(
    'infectionCircleRadius'
  );
  const infectionRadiusOutoputHTML = document.getElementById(
    'infectionRadiusOut'
  );
  infectionCircleRadiusHTML.value = INFECTION_RADIUS;
  infectionRadiusOutoputHTML.value = `${INFECTION_RADIUS} people`;

  infectionCircleRadiusHTML.addEventListener('change', (e) => {
    const newVal = e.target.value;
    model.setInfectionRadius = newVal;
    infectionRadiusOutoputHTML.value = newVal;
  });

  // asymptomaticProbability
  const asymptomaticProbabilityHTML = document.getElementById(
    'asymptomaticProbability'
  );
  const asymptomaticProbabilityOutputHTML = document.getElementById(
    'asymptomaticProbabilityOut'
  );
  asymptomaticProbabilityHTML.value = ASYMPTOMATIC_PROB;
  asymptomaticProbabilityOutputHTML.value = `${ASYMPTOMATIC_PROB * 100}%`;
  asymptomaticProbabilityHTML.addEventListener('change', (e) => {
    const newVal = e.target.value;
    model.setAsymptomaticProb = newVal;
    asymptomaticProbabilityOutputHTML.value = `${newVal * 100}%`;
  });

  // agentRadius
  const agentRadiusHTML = document.getElementById('agentRadius');
  const agentRadiusOutHTML = document.getElementById('agentRadiusOut');
  agentRadiusHTML.value = PERSON_RADIUS;
  agentRadiusOutHTML.value = PERSON_RADIUS;
  agentRadiusHTML.addEventListener('change', (e) => {
    const newVal = e.target.value;
    model.setPersonRadius = newVal;
    agentRadiusOutHTML.value = newVal;
  });

  // initial number of susceptibles
  const initSusceptibleHTML = document.getElementById('initSusceptable');
  const initSusceptibleOutputHTML = document.getElementById(
    'initSusceptableCount'
  );
  initSusceptibleHTML.value = INITIAL_SUSCEPTABLE;
  initSusceptibleOutputHTML.value = INITIAL_SUSCEPTABLE;
  initSusceptibleHTML.addEventListener('change', (e) => {
    const newVal = e.target.value;
    model.setInitialSusceptable = newVal;
    initSusceptibleOutputHTML.value = newVal;
  });

  // initial number of infected
  const initInfectedHTML = document.getElementById('initInfected');
  const initInfectedOutputHTML = document.getElementById('initInfectedCount');
  initInfectedHTML.value = INITIAL_INFECTED;
  initInfectedOutputHTML.value = INITIAL_INFECTED;
  initInfectedHTML.addEventListener('change', (e) => {
    const newVal = e.target.value;
    model.setInitialInfected = newVal;
    initInfectedOutputHTML.value = newVal;
  });

  // Reset button
  document
    .getElementById('reload')
    .addEventListener('click', () => model.resetModel());
}

export function getInitialNumSusceptable() {
  return parseInt(document.getElementById('initSusceptableCount').value, 10);
}

export function getInitialNumInfected() {
  return parseInt(document.getElementById('initInfectedCount').value, 10);
}
