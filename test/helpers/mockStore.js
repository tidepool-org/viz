export const mockStore = (state = {}) => ({
  getState: () => state,
  dispatch: jest.fn(),
  subscribe: jest.fn(() => jest.fn()),
});

export default mockStore;
