import * as plotlyUtils from '../../../src/utils/print/plotly';
import { createAGPData } from '../../../data/print/fixtures';
import { BGM_DATA_KEY, CGM_DATA_KEY } from '../../../src/utils/constants';

describe('generateAGPFigureDefinitions', () => {
  it('generate agp svg image figures for each section for cbg data', async () => {
    const images = await plotlyUtils.generateAGPFigureDefinitions(createAGPData(CGM_DATA_KEY));
    expect(images.percentInRanges).to.be.an('object');
    expect(images.percentInRanges).to.have.property('data');
    expect(images.percentInRanges).to.have.property('layout');
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

  it('generate agp svg image figures for each section for smbg data', async () => {
    const images = await plotlyUtils.generateAGPFigureDefinitions(createAGPData(BGM_DATA_KEY));
    expect(images.percentInRanges).to.be.an('object');
    expect(images.percentInRanges).to.have.property('data');
    expect(images.percentInRanges).to.have.property('layout');
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
