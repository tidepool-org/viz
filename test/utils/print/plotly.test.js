import * as plotlyUtils from '../../../src/utils/print/plotly';
import { agpData as data } from '../../../data/print/fixtures';

describe('generateAGPSVGDataURLS', () => {
  it('generate agp svg image figures for each section', async () => {
    const images = await plotlyUtils.generateAGPSVGDataURLS(data);
    expect(images.timeInRanges).to.be.an('object');
    expect(images.timeInRanges).to.have.property('data');
    expect(images.timeInRanges).to.have.property('layout');
    expect(images.ambulatoryGlucoseProfile).to.be.an('object');
    expect(images.ambulatoryGlucoseProfile).to.have.property('data');
    expect(images.ambulatoryGlucoseProfile).to.have.property('layout');
    expect(images.dailyGlucoseProfiles).to.be.an('array').and.have.lengthOf(2);
    expect(images.dailyGlucoseProfiles[0]).to.be.an('object');
    expect(images.dailyGlucoseProfiles[0]).to.have.property('data');
    expect(images.dailyGlucoseProfiles[0]).to.have.property('layout');
    expect(images.dailyGlucoseProfiles[1]).to.be.an('object');
    expect(images.dailyGlucoseProfiles[1]).to.have.property('data');
    expect(images.dailyGlucoseProfiles[1]).to.have.property('layout');
  });
});
