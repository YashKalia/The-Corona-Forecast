import {
  INITIAL_SUSCEPTABLE,
  INITIAL_SYMPTOMATIC,
  INITAL_ASYMPTOMATIC,
  INITIAL_IMMUNE,
  INITIAL_DEAD,
} from './scripts/CONSTANTS';
import wireSlidersToHandlers from './scripts/DOM/parameters';
import Main from './scripts/main';

window.onload = function () {
  const glCanvas = document.getElementById('glCanvas');
  const context = glCanvas.getContext("webgl");
  const chartCtx = document.getElementById('chart-canvas').getContext('2d');
  
  if(context === null) {
    this.alert("Please enable webGl support");
    return;
  }

  

  const main = new Main(
    context,
    chartCtx,
    glCanvas.width,
    glCanvas.height,
    INITIAL_SUSCEPTABLE,
    INITIAL_SYMPTOMATIC,
    INITAL_ASYMPTOMATIC,
    INITIAL_DEAD,
    INITIAL_IMMUNE
  );

  main.run();
};
