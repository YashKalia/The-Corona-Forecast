import Model from '../src/scripts/model';
import RelocationUtil from '../src/scripts/relocationUtil';
import AgentChart from '../src/scripts/agentChart';
import Stats from '../src/scripts/data/stats';

jest.mock('../src/scripts/agentChart');

// const borderCtxMock = jest.createMockFromModule('./canvasContextMock.js')
//   .default;

describe('Community test', () => {
  let community;
  let relocationUtil;
  const width = 100;
  const height = 100;
  const agentChart = new AgentChart(null);
  const stats = new Stats(1, 1, 1, 1, 1);

  beforeEach(() => {
    const borderCtxMock = {
      clearRect: jest.fn(() => {}),
      strokeRect: jest.fn(() => {}),
      canvas: {
        getBoundingClientRect: jest.fn(() => ({
          width,
          height,
        })),
      },
    };
    community = new Model(
      4,
      agentChart,
      width,
      height,
      stats,
      () => {},
      () => {},
      borderCtxMock
    );
    relocationUtil = new RelocationUtil(community);
    community.relocationUtil = relocationUtil;

    community.setupCommunity();
    community.populateCommunities();
  });

  test('_animationFunction should make new dt if both timestamp and lasttimestamp exist', () => {
    const oldLastTimeStamp = 1;
    const thisTimeStamp = 2;
    community.lastTimestamp = oldLastTimeStamp;
    community._animationFunction(thisTimeStamp);
    expect(community.lastTimestamp).toBe(thisTimeStamp);
  });

  test('_animationFunction should not make new dt if either timestamp and lasttimestamp do not exist', () => {
    const thisTimeStamp = 2;
    community.lastTimestamp = null;
    community._animationFunction(thisTimeStamp);
    expect(community.lastTimestamp).toBe(thisTimeStamp);
  });
});
