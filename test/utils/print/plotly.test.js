import * as plotlyUtils from '../../../src/utils/print/plotly';
import { agpData as data } from '../../../data/print/fixtures';

describe('generateAGPSVGDataURLS', () => {
  it('generate agp svg image urls for each section', async () => {
    const images = await plotlyUtils.generateAGPSVGDataURLS(data);
    expect(images.timeInRanges).contains('data:image/svg+xml,');
    expect(images.ambulatoryGlucoseProfile).contains('data:image/svg+xml,');
    expect(images.dailyGlucoseProfiles).to.be.an('array').and.have.lengthOf(2);
    expect(images.dailyGlucoseProfiles[0]).contains('data:image/svg+xml,');
    expect(images.dailyGlucoseProfiles[1]).contains('data:image/svg+xml,');
  });
});
