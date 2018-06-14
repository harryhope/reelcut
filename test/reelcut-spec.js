const {expect} = require('chai')
const reelcut = require('../index')

describe('reelcut', () => {
  it('should cut a video into hilights', async () => {
    try {
      const cuts = await reelcut().cut('./test/sample.mp4', {
        outputPath: './test/'
      })
      expect(cuts).to.be.an('array')
      const pastes = await reelcut().paste(cuts, './test/final.mp4')
      expect(pastes).to.be.a('string')
    } catch (err) {
      throw err
    }
  })
})
